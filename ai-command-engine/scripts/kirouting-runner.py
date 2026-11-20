"""Target-bound KiRouting job adapter. No SDK calls or automatic installation."""
from __future__ import annotations

import argparse
from collections import Counter, defaultdict
import hashlib
import json
import math
import os
from pathlib import Path
import re
import sys
import time

MIL_MM = 0.0254
SUPPORTED_MODES = ['single', 'differential', 'length-match', 'fanout']


def number(value, name, minimum=None):
    if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value):
        raise ValueError(f'{name}: finite number required')
    if minimum is not None and value < minimum:
        raise ValueError(f'{name}: must be >= {minimum}')
    return float(value)


def mm(value, name='dimension'):
    return number(value, name) * MIL_MM


def fmt(value):
    return format(number(value, 'serialized coordinate'), '.15g')


def fmt_offset(value):
    """The locked parser's offset token accepts decimal coordinates, not exponent notation."""
    return format(number(value, 'serialized offset'), '.15f').rstrip('0').rstrip('.') or '0'


def quote(value):
    return json.dumps(str(value), ensure_ascii=False)


def atomic_json(filename, value):
    temporary = filename.with_suffix(filename.suffix + '.tmp')
    temporary.write_text(json.dumps(value, ensure_ascii=False, indent=2, allow_nan=False), encoding='utf-8')
    temporary.replace(filename)


def sexpr(text):
    """Parse KiCad output without regex block matching or executing source text."""
    root, stack = [], []
    current = root
    for token in re.findall(r'"(?:\\.|[^"\\])*"|[()]|[^\s()]+', text):
        if token == '(':
            item = []
            current.append(item)
            stack.append(current)
            current = item
        elif token == ')':
            if not stack:
                raise ValueError('Unbalanced KiCad output')
            current = stack.pop()
        else:
            current.append(json.loads(token) if token.startswith('"') else token)
    if stack or len(root) != 1 or root[0][0] != 'kicad_pcb':
        raise ValueError('Invalid KiCad PCB document')
    return root[0]


def child(node, name, default=None):
    return next((v for v in node if isinstance(v, list) and v and v[0] == name), default)


def children(node, name):
    return [v for v in node if isinstance(v, list) and v and v[0] == name]


def polygon_points(path):
    """Only exact straight polygons are admitted; curved/hole paths are explicit errors."""
    if not isinstance(path, list) or not path:
        raise ValueError('Copper polygon is empty')
    if len(path) == 1 and isinstance(path[0], list):
        return polygon_points(path[0])
    if path[0] == 'R' and len(path) == 7:
        _, x, y, w, h, rotation, radius = path
        if radius != 0 or rotation != 0:
            raise ValueError('Rounded or rotated copper rectangle requires an exact polygon adapter')
        return [(x, y), (x + w, y), (x + w, y - h), (x, y - h)]
    if isinstance(path[0], list):
        raise ValueError('Compound copper polygons/holes require explicit topology conversion')
    if path[0] in ('L', 'M'):
        values = path[1:]
        if values and values[-1] == 'Z':
            values = values[:-1]
        if len(values) < 6 or len(values) % 2 or any(not isinstance(v, (int, float)) for v in values):
            raise ValueError('Copper polygon contains unsupported curved path commands')
        return list(zip(values[::2], values[1::2]))
    if len(path) >= 6 and len(path) % 2 == 0 and all(isinstance(v, (int, float)) for v in path):
        return list(zip(path[::2], path[1::2]))
    raise ValueError('Unsupported copper polygon representation')


def _mil_ring_points(ring, name):
    if not isinstance(ring, list) or len(ring) < 3:
        raise ValueError(f'{name}: at least three points are required')
    points = []
    for index, point in enumerate(ring):
        if not isinstance(point, dict) or 'x' not in point or 'y' not in point:
            raise ValueError(f'{name}[{index}]: expected global-mil x/y point')
        points.append((number(point['x'], f'{name}[{index}].x'),
                       number(point['y'], f'{name}[{index}].y')))
    if points[0] == points[-1]:
        points.pop()
    if len(points) < 3 or len(set(points)) < 3:
        raise ValueError(f'{name}: at least three distinct vertices are required')
    return points


def _polygons_from_rings(rings, name):
    """Build valid shells, holes, and nested islands from canonical global-mil rings."""
    try:
        from shapely.geometry import Polygon
    except ImportError as error:
        raise ValueError('Shapely is required to preserve copper obstacle topology') from error
    if not isinstance(rings, list) or not rings:
        raise ValueError(f'{name}: polygon rings are missing')
    ring_polygons = []
    for index, ring in enumerate(rings):
        points = _mil_ring_points(ring, f'{name}.rings[{index}]')
        polygon = Polygon(points)
        if not polygon.is_valid or polygon.is_empty or polygon.area <= 0:
            raise ValueError(f'{name}.rings[{index}]: invalid or zero-area ring')
        ring_polygons.append(polygon)

    parents = [None] * len(ring_polygons)
    for first_index, first_polygon in enumerate(ring_polygons):
        for second_index in range(first_index + 1, len(ring_polygons)):
            second_polygon = ring_polygons[second_index]
            if first_polygon.boundary.intersects(second_polygon.boundary):
                raise ValueError(f'{name}: rings {first_index} and {second_index} touch')
            if first_polygon.intersects(second_polygon) and not (
                    first_polygon.contains(second_polygon) or second_polygon.contains(first_polygon)):
                raise ValueError(f'{name}: rings {first_index} and {second_index} overlap without containment')
    for child_index, child_polygon in enumerate(ring_polygons):
        candidates = [(parent_polygon.area, parent_index)
                      for parent_index, parent_polygon in enumerate(ring_polygons)
                      if parent_index != child_index and parent_polygon.contains(child_polygon)]
        if candidates:
            parents[child_index] = min(candidates)[1]

    depths = []
    for index in range(len(ring_polygons)):
        depth, parent = 0, parents[index]
        seen = {index}
        while parent is not None:
            if parent in seen:
                raise ValueError(f'{name}: ring containment cycle')
            seen.add(parent)
            depth += 1
            parent = parents[parent]
        depths.append(depth)

    result = []
    for index, depth in enumerate(depths):
        if depth % 2:
            continue
        holes = [list(ring_polygons[child].exterior.coords)[:-1]
                 for child, parent in enumerate(parents)
                 if parent == index and depths[child] == depth + 1]
        polygon = Polygon(ring_polygons[index].exterior.coords, holes)
        if not polygon.is_valid or polygon.is_empty or polygon.area <= 0:
            raise ValueError(f'{name}: ring containment produced invalid copper topology')
        result.append(polygon)
    return result


def _stroke_polygon(stroke, name):
    try:
        from shapely.geometry import LineString
    except ImportError as error:
        raise ValueError('Shapely is required to preserve copper stroke geometry') from error
    if not isinstance(stroke, dict) or stroke.get('coordinateSpace') != 'global-mil':
        raise ValueError(f'{name}: stroke coordinates must declare global-mil')
    width = number(stroke.get('widthMil'), f'{name}.widthMil', 0)
    if width <= 0 or stroke.get('cap') != 'round':
        raise ValueError(f'{name}: a positive width and verified round cap are required')
    paths = stroke.get('paths')
    if not isinstance(paths, list) or not paths:
        raise ValueError(f'{name}: stroke paths are missing')
    # A 32-segment circular buffer is expanded by its secant so the polygonal
    # approximation encloses the requested round stroke instead of cutting it.
    quadrant_segments = 32
    radius = (width / 2) / math.cos(math.pi / (4 * quadrant_segments))
    result = []
    for path_index, path in enumerate(paths):
        points = _mil_ring_points(path, f'{name}.paths[{path_index}]') if len(path) > 2 and path[0] == path[-1] else None
        if points is None:
            if not isinstance(path, list) or len(path) < 2:
                raise ValueError(f'{name}.paths[{path_index}]: at least two points are required')
            points = []
            for point_index, point in enumerate(path):
                if not isinstance(point, dict) or 'x' not in point or 'y' not in point:
                    raise ValueError(f'{name}.paths[{path_index}][{point_index}]: expected global-mil x/y point')
                points.append((number(point['x'], f'{name}.path.x'), number(point['y'], f'{name}.path.y')))
            if len(set(points)) < 2:
                raise ValueError(f'{name}.paths[{path_index}]: zero-length stroke')
        line = LineString(points)
        if line.is_empty or not line.is_simple or line.length <= 0:
            raise ValueError(f'{name}.paths[{path_index}]: empty, self-crossing, or zero-length stroke')
        polygon = line.buffer(radius, quad_segs=quadrant_segments, cap_style='round', join_style='round')
        if polygon.is_empty or not polygon.is_valid:
            raise ValueError(f'{name}.paths[{path_index}]: invalid round-stroke geometry')
        result.append(polygon)
    return result


def _keepout_area_polygons(polygons, name):
    """Validate polygon shells and holes supported by the pinned keepout parser."""
    try:
        from shapely.geometry import Polygon
    except ImportError as error:
        raise ValueError('Shapely is required to preserve copper keepout topology') from error
    for polygon_index, polygon in enumerate(polygons):
        if polygon.is_empty or not polygon.is_valid or polygon.area <= 0:
            raise ValueError(f'{name}[{polygon_index}]: invalid obstacle geometry')
        if not isinstance(polygon, Polygon):
            raise ValueError(f'{name}[{polygon_index}]: obstacle is not a polygon')
    return polygons


def _normalized_obstacle_polygons(obstacle):
    normalization = obstacle.get('geometryNormalization')
    if not isinstance(normalization, dict) or normalization.get('status') != 'normalized':
        raise ValueError(f"Copper obstacle {obstacle.get('id', '(unknown)')}: source geometry is not normalized")
    name = f"Copper obstacle {obstacle.get('id', '(unknown)')}"
    if obstacle.get('fill') is True:
        polygon = obstacle.get('polygon')
        if not isinstance(polygon, dict) or polygon.get('coordinateSpace') != 'global-mil':
            raise ValueError(f'{name}: filled copper must declare global-mil rings')
        chord_error = number(normalization.get('arcChordToleranceMil', 0), f'{name}.arcChordToleranceMil', 0)
        buffer_error = number(normalization.get('runnerBufferMil', 0), f'{name}.runnerBufferMil', 0)
        serialization_error = number(normalization.get('serializationToleranceMil', 0), f'{name}.serializationToleranceMil', 0)
        declared_error = number(normalization.get('totalMaxErrorMil', 0), f'{name}.totalMaxErrorMil', 0)
        if buffer_error < chord_error or declared_error + 1e-12 < chord_error + buffer_error + serialization_error:
            raise ValueError(f'{name}: conservative polygon error budget is incomplete')
        polygons = _polygons_from_rings(polygon.get('rings'), name)
        # The canonical ARC path is flattened on its chord. Expand the obstacle
        # by the declared chord error so the routed copper cannot enter the
        # original curved outline. The budget is checked above and carried in
        # the input evidence.
        conservative = []
        for source_polygon in polygons:
            buffered = source_polygon.buffer(buffer_error, quad_segs=32, join_style='round') if buffer_error else source_polygon
            if buffered.is_empty or not buffered.is_valid:
                raise ValueError(f'{name}: conservative arc compensation is invalid')
            conservative.extend(list(buffered.geoms) if buffered.geom_type == 'MultiPolygon' else [buffered])
        return conservative
    if obstacle.get('fill') is False:
        stroke = obstacle.get('stroke')
        if not isinstance(stroke, dict):
            raise ValueError(f'{name}: unfilled copper needs a verified width and cap')
        return _stroke_polygon(stroke, name)
    raise ValueError(f'{name}: fill state is not a verified boolean')


def _zone_polygon_text(polygon):
    coordinates = list(polygon.exterior.coords)
    return _zone_ring_text(coordinates)


def _zone_ring_text(coordinates):
    coordinates = list(coordinates)
    if len(coordinates) > 1 and coordinates[0] == coordinates[-1]:
        coordinates.pop()
    if len(coordinates) < 3:
        raise ValueError('Copper keep-out decomposition produced fewer than three vertices')
    return ' '.join(f'(xy {fmt(mm(x))} {fmt(mm(y))})' for x, y in coordinates)


def _keepout_zone_lines(polygons, layer_name):
    pieces = _keepout_area_polygons(polygons, f'copper layer {layer_name}')
    result = []
    for polygon in pieces:
        polygons_text = [f' (polygon (pts {_zone_ring_text(ring.coords)}))'
                         for ring in [polygon.exterior, *polygon.interiors]]
        result.append(f'\t(zone (net 0) (net_name "") (layers {quote(layer_name)}) (keepout (tracks not_allowed) (vias not_allowed) (pads allowed) (copperpour allowed)){"".join(polygons_text)})')
    return result


def custom_pad_local_polygon(pad):
    """Convert a canonical global-mil, already-rotated single ring to pad-local mils."""
    polygon = pad.get('polygon')
    if not isinstance(polygon, dict) or polygon.get('coordinateSpace') != 'global-mil':
        raise ValueError(f'Pad {pad.get("id")}: custom polygon must declare global-mil coordinates')
    source = polygon.get('points')
    if not isinstance(source, list) or any(not isinstance(point, dict) or not {'x', 'y'} <= set(point) for point in source):
        raise ValueError(f'Pad {pad.get("id")}: polygon points must be a single array of {"{x,y}"} points; holes/compound polygons are unsupported')
    points = [(number(point['x'], 'polygon.x'), number(point['y'], 'polygon.y')) for point in source]
    if len(points) > 1 and points[0] == points[-1]:
        points.pop()
    if len(points) < 3 or len(set(points)) < 3:
        raise ValueError(f'Pad {pad.get("id")}: polygon requires at least three distinct vertices')
    for index, point in enumerate(points):
        if point == points[(index + 1) % len(points)]:
            raise ValueError(f'Pad {pad.get("id")}: polygon contains a zero-length edge')

    def cross(a, b, c):
        return (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])

    def on_segment(a, b, p):
        eps = 1e-10
        return abs(cross(a, b, p)) <= eps and min(a[0], b[0]) - eps <= p[0] <= max(a[0], b[0]) + eps and min(a[1], b[1]) - eps <= p[1] <= max(a[1], b[1]) + eps

    def intersects(a, b, c, d):
        eps = 1e-10
        ab_c, ab_d, cd_a, cd_b = cross(a, b, c), cross(a, b, d), cross(c, d, a), cross(c, d, b)
        if ((ab_c > eps and ab_d < -eps) or (ab_c < -eps and ab_d > eps)) and ((cd_a > eps and cd_b < -eps) or (cd_a < -eps and cd_b > eps)):
            return True
        return ((abs(ab_c) <= eps and on_segment(a, b, c)) or (abs(ab_d) <= eps and on_segment(a, b, d)) or
                (abs(cd_a) <= eps and on_segment(c, d, a)) or (abs(cd_b) <= eps and on_segment(c, d, b)))

    area2 = sum(points[i][0] * points[(i + 1) % len(points)][1] - points[(i + 1) % len(points)][0] * points[i][1] for i in range(len(points)))
    if abs(area2) <= 1e-10:
        raise ValueError(f'Pad {pad.get("id")}: polygon has zero area')
    for i in range(len(points)):
        a, b = points[i], points[(i + 1) % len(points)]
        for j in range(i + 1, len(points)):
            # Consecutive edges, including the closing pair, share their endpoint by design.
            if j == i or j == (i + 1) % len(points) or (j + 1) % len(points) == i:
                continue
            c, d = points[j], points[(j + 1) % len(points)]
            if intersects(a, b, c, d):
                raise ValueError(f'Pad {pad.get("id")}: self-intersecting or self-touching polygon is unsupported')

    center_x = number(pad['x'], 'pad.x')
    center_y = number(pad['y'], 'pad.y')
    angle = math.radians(number(pad.get('rotation', 0), 'pad.rotation'))
    cosine, sine = math.cos(angle), math.sin(angle)
    # SDK polygon points already include pad rotation. KiCad's pad angle uses its
    # board-coordinate convention (local_to_global applies -angle), so invert that
    # transform once to obtain custom primitive coordinates in the pad-local frame.
    local = [((x - center_x) * cosine - (y - center_y) * sine,
              (x - center_x) * sine + (y - center_y) * cosine) for x, y in points]
    return local


def convert_input(data, settings):
    """Keep global SDK pad coordinates and full dimensions; no snapping/round-to-0.01mm."""
    if data.get('schemaVersion') != 1 or data.get('units') != 'mil':
        raise ValueError('Expected canonical schemaVersion=1, units=mil')
    if data.get('existing_arcs'):
        raise ValueError('Existing ARC input requires a verified EasyEDA sweep-to-KiCad adapter; arcs were not discarded')
    enabled = [int(v['id']) for v in data['board']['layers'] if v.get('enabled', True)]
    if 12 in enabled:
        raise ValueError('MULTI12 describes objects across copper layers, not an additional physical copper layer')
    if len(set(enabled)) != len(enabled) or 1 not in enabled or 2 not in enabled:
        raise ValueError('Enabled copper layers must include unique top and bottom layers')
    inner = sorted(v for v in enabled if v not in (1, 2))
    layer_types = {int(v['id']): v.get('type', 'SIGNAL') for v in data['board']['layers']}
    layer_map = {1: 'F.Cu', 2: 'B.Cu', **{v: f'In{i + 1}.Cu' for i, v in enumerate(inner)}}
    def layer(value):
        if int(value) not in layer_map:
            raise ValueError(f'Unmapped copper layer {value}')
        return layer_map[int(value)]
    names = [net['name'] for net in data['nets']]
    for collection in ('existing_tracks', 'existing_vias', 'existing_copper_obstacles'):
        names.extend(v.get('net', '') for v in data.get(collection, []))
    names = sorted(set(names) - {''})
    net_ids = {'': 0, **{name: i + 1 for i, name in enumerate(names)}}
    aliases = {name: name for name in net_ids}
    pairs = settings.get('pairs', [])
    if settings['mode'] == 'differential':
        if not pairs:
            raise ValueError('Differential mode requires explicit pairs')
        used = set()
        for i, pair in enumerate(pairs):
            p, n = (pair.get('positiveNet'), pair.get('negativeNet')) if isinstance(pair, dict) else pair
            if p == n or p not in net_ids or n not in net_ids or p in used or n in used:
                raise ValueError('Differential pairs must identify distinct, existing, non-repeated nets')
            aliases[p], aliases[n] = f'__ACE_PAIR_{i}_P', f'__ACE_PAIR_{i}_N'
            used.update((p, n))
    lines = ['(kicad_pcb (version 20240108) (generator "ai-command-engine")', ' (general)', ' (layers']
    for lid, name in layer_map.items():
        index = 0 if lid == 1 else 31 if lid == 2 else inner.index(lid) + 1
        lines.append(f'  ({index} {quote(name)} {"power" if layer_types[lid] == "PLANE" else "signal"})')
    lines.extend(['  (44 "Edge.Cuts" user)', '  (37 "F.SilkS" user)', '  (36 "B.SilkS" user)', ' )'])
    lines.extend(f' (net {nid} {quote(aliases[name])})' for name, nid in net_ids.items())
    for segment in data['board']['outline']:
        a, b = segment['a'], segment['b']
        lines.append(f' (gr_line (start {fmt(mm(a["x"]))} {fmt(mm(a["y"]))}) (end {fmt(mm(b["x"]))} {fmt(mm(b["y"]))}) (stroke (width 0.01) (type default)) (layer "Edge.Cuts"))')
    components = {str(v['id']): v for v in data.get('components', [])}
    pads_by_component = defaultdict(list)
    for net in data['nets']:
        for pad in net['pads']:
            pads_by_component[str(pad.get('componentId') or f'independent:{pad["id"]}')].append({**pad, 'net': net['name']})
    for pad in data.get('unconnected_pads', []):
        pads_by_component[str(pad.get('componentId') or f'independent:{pad["id"]}')].append({**pad, 'net': ''})
    for cid, pads in pads_by_component.items():
        component = components.get(cid, {})
        # All positions/angles are global SDK values; footprint origin is zero.
        reference = component.get('designator') or cid
        mount_layer = layer(component.get('layer', pads[0]['layer'] if pads[0]['layer'] in (1, 2) else 1))
        reference_layer = 'F.SilkS' if mount_layer == 'F.Cu' else 'B.SilkS'
        lines.append(f' (footprint {quote("ACE:" + str(reference))} (layer {quote(mount_layer)}) (at 0 0) (property "Reference" {quote(reference)} (at 0 0) (layer {quote(reference_layer)}) (hide yes) (effects (font (size 1 1) (thickness 0.1))))')
        for pad in pads:
            shape = pad['shape']
            tag = shape[0]
            if tag == 'POLYGON':
                local_polygon = custom_pad_local_polygon(pad)
                # A custom pad's base anchor is copper too. Use KiCad's valid
                # zero-size custom anchor so only the exact polygon contributes
                # copper; a bbox anchor would silently add copper in concavities.
                width = height = 0.0
                kshape = 'custom'
                corner = ''
                primitive_points = ' '.join(f'(xy {fmt(mm(x))} {fmt(mm(y))})' for x, y in local_polygon)
                extra = ''
            elif tag not in ('ELLIPSE', 'OVAL', 'RECT'):
                raise ValueError(f'Pad {pad["id"]}: unsupported exact shape {tag}')
            else:
                width, height = mm(shape[1]), mm(shape[2])
                if min(width, height) <= 0:
                    raise ValueError(f'Pad {pad["id"]}: invalid size')
                if tag == 'ELLIPSE' and width != height:
                    raise ValueError(f'Pad {pad["id"]}: a true ellipse cannot be substituted by an oval')
                kshape = {'ELLIPSE': 'circle', 'OVAL': 'oval', 'RECT': 'rect'}[tag]
                extra = ''
                corner = ''
                primitive_points = None
                if tag == 'RECT':
                    raw_round = number(shape[3], f'pad {pad["id"]} RECT round-percent', minimum=0) if len(shape) > 3 else 0.0
                    has_radius = 'cornerRadiusMil' in pad or 'cornerRadiusSource' in pad
                    if raw_round > 0:
                        if 'cornerRadiusMil' not in pad or 'cornerRadiusSource' not in pad:
                            raise ValueError(f'Pad {pad["id"]}: nonzero RECT rounding requires canonical cornerRadiusMil/source; raw shape[3] is a percentage, not a length')
                        if pad.get('cornerRadiusSource') != 'sdk-rect-half-min-side-percent':
                            raise ValueError(f'Pad {pad["id"]}: cornerRadiusSource is invalid')
                        radius_mil = number(pad['cornerRadiusMil'], f'pad {pad["id"]} cornerRadiusMil', minimum=0)
                        min_dimension_mil = min(number(shape[1], 'pad width'), number(shape[2], 'pad height'))
                        expected_mil = min_dimension_mil * raw_round / 200.0
                        if abs(radius_mil - expected_mil) > max(1e-9, abs(expected_mil) * 1e-9):
                            raise ValueError(f'Pad {pad["id"]}: cornerRadiusMil does not match the SDK RECT half-min-side percentage')
                        if radius_mil > min_dimension_mil / 2.0:
                            raise ValueError(f'Pad {pad["id"]}: cornerRadiusMil exceeds half the smaller RECT side')
                        kshape = 'roundrect'
                        corner = f' (roundrect_rratio {fmt(radius_mil / min_dimension_mil)})'
                    elif has_radius:
                        if pad.get('cornerRadiusSource') != 'sdk-rect-half-min-side-percent':
                            raise ValueError(f'Pad {pad["id"]}: cornerRadiusSource is invalid')
                        if number(pad.get('cornerRadiusMil'), f'pad {pad["id"]} cornerRadiusMil', minimum=0) != 0:
                            raise ValueError(f'Pad {pad["id"]}: zero-rounded RECT must have cornerRadiusMil=0')
            hole = pad.get('hole')
            pad_at_x, pad_at_y = pad['x'], pad['y']
            if hole:
                if hole[0] == 'ROUND':
                    drill = fmt(mm(hole[1]))
                    if pad.get('holeCenterSource') == 'bound-footprint-source':
                        if pad.get('plated') is not True or pad.get('layer') != 12 or pad.get('holeOffsetSource') != 'bound-footprint-source':
                            raise ValueError(f'Pad {pad["id"]}: offset ROUND drill requires source-bound plated multilayer pad geometry')
                        if len(hole) < 3 or number(hole[2], f'pad {pad["id"]} round drill height', minimum=0) != number(hole[1], f'pad {pad["id"]} round drill width', minimum=0):
                            raise ValueError(f'Pad {pad["id"]}: source-bound offset drill must be a true round hole')
                        hole_x = number(pad.get('holeCenterX'), f'pad {pad["id"]} holeCenterX')
                        hole_y = number(pad.get('holeCenterY'), f'pad {pad["id"]} holeCenterY')
                        rotation = math.radians(number(pad['rotation'], f'pad {pad["id"]} rotation'))
                        source_dx = number(pad.get('holeOffsetX'), f'pad {pad["id"]} holeOffsetX')
                        source_dy = number(pad.get('holeOffsetY'), f'pad {pad["id"]} holeOffsetY')
                        copper_dx = number(pad['x'], f'pad {pad["id"]} x') - hole_x
                        copper_dy = number(pad['y'], f'pad {pad["id"]} y') - hole_y
                        expected_hole_dx = source_dx * math.cos(rotation) - source_dy * math.sin(rotation)
                        expected_hole_dy = source_dx * math.sin(rotation) + source_dy * math.cos(rotation)
                        if abs((hole_x - number(pad['x'], f'pad {pad["id"]} x')) - expected_hole_dx) > 1e-9 or abs((hole_y - number(pad['y'], f'pad {pad["id"]} y')) - expected_hole_dy) > 1e-9:
                            raise ValueError(f'Pad {pad["id"]}: hole center disagrees with source-local offset and pad rotation')
                        # The locked parser rotates (offset ...) by -pad_rotation
                        # to recover the copper center from this drill anchor.
                        offset_x = copper_dx * math.cos(rotation) - copper_dy * math.sin(rotation)
                        offset_y = copper_dx * math.sin(rotation) + copper_dy * math.cos(rotation)
                        if offset_x == 0 and offset_y == 0:
                            raise ValueError(f'Pad {pad["id"]}: source-bound offset metadata has no geometric offset')
                        pad_at_x, pad_at_y = hole_x, hole_y
                        extra = f' (drill {drill} (offset {fmt_offset(mm(offset_x))} {fmt_offset(mm(offset_y))}))'
                    elif any(key in pad for key in ('holeCenterX', 'holeCenterY', 'holeOffsetSource')):
                        raise ValueError(f'Pad {pad["id"]}: incomplete or unverified offset-hole source geometry')
                    else:
                        extra = f' (drill {drill})'
                elif hole[0] == 'SLOT':
                    extra = f' (drill oval {fmt(mm(hole[1]))} {fmt(mm(hole[2]))})'
                else:
                    raise ValueError(f'Pad {pad["id"]}: unsupported drill shape {hole[0]}')
                ptype = 'thru_hole' if pad.get('plated') else 'np_thru_hole'
                layers = '"*.Cu" "*.Mask"'
            else:
                ptype = 'connect' if pad['layer'] == 12 else 'smd'
                layers = '"*.Cu"' if pad['layer'] == 12 else quote(layer(pad['layer']))
            nid = net_ids[pad['net']]
            options = ' (options (clearance outline) (anchor rect))' if primitive_points is not None else ''
            primitives = f' (primitives (gr_poly (pts {primitive_points}) (width 0) (fill yes)))' if primitive_points is not None else ''
            lines.append(f'  (pad {quote(pad.get("padNumber") or pad["id"])} {ptype} {kshape} (at {fmt(mm(pad_at_x))} {fmt(mm(pad_at_y))} {fmt(pad["rotation"])}) (size {fmt(width)} {fmt(height)}){corner}{extra} (layers {layers}){options}{primitives} (net {nid} {quote(aliases[pad["net"]])}))')
        lines.append(' )')
    for track in data.get('existing_tracks', []):
        a, b = track['a'], track['b']
        lines.append(f' (segment (start {fmt(mm(a["x"]))} {fmt(mm(a["y"]))}) (end {fmt(mm(b["x"]))} {fmt(mm(b["y"]))}) (width {fmt(mm(track["widthMil"]))}) (layer {quote(layer(track["layer"]))}) (net {net_ids[track.get("net", "")]}))')
    for via in data.get('existing_vias', []):
        if via.get('viaType', 'through') not in ('through', 0) or via.get('startLayer', 1) != 1 or via.get('endLayer', 2) != 2:
            raise ValueError(f'Via {via.get("id")}: partial-layer vias are not supported by this pinned engine')
        lines.append(f' (via (at {fmt(mm(via["x"]))} {fmt(mm(via["y"]))}) (size {fmt(mm(via["diameterMil"]))}) (drill {fmt(mm(via["holeDiameterMil"]))}) (layers "F.Cu" "B.Cu") (net {net_ids[via.get("net", "")]}))')
    if settings['mode'] == 'differential':
        selected = [net for pair in pairs for net in ((pair.get('positiveNet'), pair.get('negativeNet')) if isinstance(pair, dict) else pair)]
    else:
        selected = settings.get('nets') or [v['name'] for v in data['nets'] if len(v['pads']) > 1]
    selected_nets = set(selected)
    for obstacle in data.get('existing_copper_obstacles', []):
        if obstacle.get('kind') == 'pour':
            raise ValueError('An unfilled pour border is not actual copper')
        name = obstacle.get('net', '')
        obstacle_layers = list(layer_map.values()) if obstacle['layer'] == 12 else [layer(obstacle['layer'])]
        if obstacle.get('geometryNormalization') is not None:
            polygons = _normalized_obstacle_polygons(obstacle)
            if name in selected_nets:
                raise ValueError(f'Copper obstacle {obstacle.get("id", "(unknown)")}: selected net {name} overlaps existing filled copper; routed copper access is not represented by the pinned engine')
            for lname in obstacle_layers:
                lines.extend(_keepout_zone_lines(polygons, lname))
            continue
        points = polygon_points(obstacle['polygon'])
        xy = ' '.join(f'(xy {fmt(mm(x))} {fmt(mm(y))})' for x, y in points)
        # Preserve the legacy canonical obstacle representation. New poured
        # copper uses explicit normalized keep-outs above, with holes retained.
        for lname in obstacle_layers:
            lines.append(f' (zone (net {net_ids[name]}) (net_name {quote(aliases[name])}) (layer {quote(lname)}) (hatch edge 0.5) (connect_pads (clearance 0)) (min_thickness 0.001) (fill yes) (polygon (pts {xy})) (filled_polygon (layer {quote(lname)}) (pts {xy})))')
    lines.append(')')
    return '\n'.join(lines), net_ids, aliases, layer_map


def copper(document):
    """Canonical complete copper in file units; preserves same-diameter/different-drill vias."""
    segments, vias = [], []
    for v in children(document, 'segment'):
        segments.append((int(child(v, 'net')[1]), child(v, 'layer')[1], float(child(v, 'width')[1]), tuple(map(float, child(v, 'start')[1:3])), tuple(map(float, child(v, 'end')[1:3]))))
    for v in children(document, 'via'):
        if any(tag in v for tag in ('blind', 'micro')):
            raise ValueError('Engine produced a non-through via')
        vias.append((int(child(v, 'net')[1]), tuple(child(v, 'layers')[1:]), float(child(v, 'size')[1]), float(child(v, 'drill')[1]), tuple(map(float, child(v, 'at')[1:3]))))
    return segments, vias


def geometry_key(value):
    if isinstance(value, float):
        return round(value, 10)  # Comparison only; source/output coordinates are never quantized.
    if isinstance(value, (list, tuple)):
        return tuple(geometry_key(v) for v in value)
    return value


def segment_key(value):
    net, layer, width, a, b = value
    return geometry_key((net, layer, width, *sorted((a, b))))


def intersect_segments(a, b, c, d):
    def cross(p, q, r):
        return (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0])
    def on(p, q, r):
        return cross(p, q, r) == 0 and min(p[0], q[0]) <= r[0] <= max(p[0], q[0]) and min(p[1], q[1]) <= r[1] <= max(p[1], q[1])
    abc, abd, cda, cdb = cross(a, b, c), cross(a, b, d), cross(c, d, a), cross(c, d, b)
    return ((abc < 0 < abd or abd < 0 < abc) and (cda < 0 < cdb or cdb < 0 < cda)) or on(a, b, c) or on(a, b, d) or on(c, d, a) or on(c, d, b)


def point_segment_distance(point, a, b):
    dx, dy = b[0] - a[0], b[1] - a[1]
    size = dx * dx + dy * dy
    t = max(0.0, min(1.0, ((point[0] - a[0]) * dx + (point[1] - a[1]) * dy) / size)) if size else 0.0
    return math.hypot(point[0] - a[0] - t * dx, point[1] - a[1] - t * dy)


def segment_distance(a, b, c, d):
    return 0.0 if intersect_segments(a, b, c, d) else min(point_segment_distance(a, c, d), point_segment_distance(b, c, d), point_segment_distance(c, a, b), point_segment_distance(d, a, b))


def check_new_copper_spacing(before, after, settings, net_ids=None):
    """Exact straight-track/disc distances, including queued track-via pairs."""
    old_lines, old_vias = copper(before)
    lines, vias = copper(after)
    delta_lines = Counter(map(segment_key, lines)) - Counter(map(segment_key, old_lines))
    delta_vias = Counter(map(geometry_key, vias)) - Counter(map(geometry_key, old_vias))
    clearance = mm(settings.get('clearanceMil', 0))
    names = {int(row[1]): row[2] for row in children(after, 'net')}
    pair_sets = []
    if settings.get('mode') == 'differential':
        for pair in settings.get('pairs', []):
            pair_names = (pair['positiveNet'], pair['negativeNet']) if isinstance(pair, dict) else pair
            pair_sets.append({net_ids[name] for name in pair_names} if net_ids else set(pair_names))
    def require_gap(gap, required, first, second):
        # This is only a floating-point serialization bound, not a manufacturing allowance.
        if gap + 1e-9 < required:
            raise ValueError(f'New copper spacing violation: {first} / {second}; edge gap {gap:.9g} mm < {required:.9g} mm')
    for line in lines:
        if not delta_lines[segment_key(line)]:
            continue
        net, layer, width, a, b = line
        for other in lines:
            if net == other[0] or layer != other[1]:
                continue
            required = clearance
            if pair_sets and ({net, other[0]} if net_ids else {names.get(net), names.get(other[0])}) in pair_sets:
                required = mm(settings['diffPairGapMil'])
            require_gap(segment_distance(a, b, other[3], other[4]) - (width + other[2]) / 2, required, f'track {names.get(net)}', f'track {names.get(other[0])}')
        for via in vias:
            if net != via[0]:
                require_gap(point_segment_distance(via[4], a, b) - width / 2 - via[2] / 2, clearance, f'track {names.get(net)}', f'via {names.get(via[0])}')
    for via in vias:
        if not delta_vias[geometry_key(via)]:
            continue
        net, _, size, _, at = via
        for line in lines:
            if net != line[0]:
                require_gap(point_segment_distance(at, line[3], line[4]) - size / 2 - line[2] / 2, clearance, f'via {names.get(net)}', f'track {names.get(line[0])}')
        for other in vias:
            if net != other[0]:
                require_gap(math.dist(at, other[4]) - (size + other[2]) / 2, clearance, f'via {names.get(net)}', f'via {names.get(other[0])}')


def compare_output(before_text, after_text, net_ids, layer_map, target, input_digest, settings, stats, pad_counts=None):
    before, after = sexpr(before_text), sexpr(after_text)
    old_lines, old_vias = copper(before)
    all_lines, all_vias = copper(after)
    old_l = Counter(map(segment_key, old_lines))
    new_l = Counter(map(segment_key, all_lines))
    old_v = Counter(map(geometry_key, old_vias))
    new_v = Counter(map(geometry_key, all_vias))
    removed = list((old_l - new_l).elements()) + list((old_v - new_v).elements())
    # Input pads, filled copper, and board outline must remain untouched as well.
    for tag in ('net', 'layers', 'footprint', 'zone', 'gr_line', 'gr_arc', 'arc'):
        before_items = Counter(json.dumps(v, ensure_ascii=False) for v in children(before, tag))
        after_items = Counter(json.dumps(v, ensure_ascii=False) for v in children(after, tag))
        if before_items - after_items:
            removed.append({'type': tag, 'count': sum((before_items - after_items).values())})
        if after_items - before_items:
            raise ValueError(f'Engine added unsupported {tag} geometry or changed input identity; nothing was silently omitted')
    if removed:
        raise ValueError(f'Engine removed or changed input copper/geometry: {removed[:5]}')
    check_new_copper_spacing(before, after, settings, net_ids)
    original_names = {nid: name for name, nid in net_ids.items()}
    original_layers = {name: lid for lid, name in layer_map.items()}
    delta_l, delta_v = new_l - old_l, new_v - old_v
    for candidate in all_lines:
        if delta_l[segment_key(candidate)] <= 0:
            continue
        for other in all_lines:
            if candidate[0] != other[0] and candidate[1] == other[1] and intersect_segments(candidate[3], candidate[4], other[3], other[4]):
                raise ValueError(f'New track crosses foreign-net track on {candidate[1]}: {original_names.get(candidate[0])} / {original_names.get(other[0])}; engine success was not accepted')
    lines, vias = [], []
    for value in all_lines:
        key = segment_key(value)
        if delta_l[key] <= 0:
            continue
        delta_l[key] -= 1
        nid, layer, width, a, b = value
        if nid not in original_names or layer not in original_layers:
            raise ValueError('Result contains an unmapped net or layer')
        lines.append({'net': original_names[nid], 'layer': original_layers[layer], 'widthMil': width / MIL_MM, 'a': {'x': a[0] / MIL_MM, 'y': a[1] / MIL_MM}, 'b': {'x': b[0] / MIL_MM, 'y': b[1] / MIL_MM}})
    for value in all_vias:
        key = geometry_key(value)
        if delta_v[key] <= 0:
            continue
        delta_v[key] -= 1
        nid, layers, diameter, drill, at = value
        if set(layers) != {'F.Cu', 'B.Cu'} or nid not in original_names:
            raise ValueError('Result via has an unmapped net or non-through layer span')
        vias.append({'net': original_names[nid], 'x': at[0] / MIL_MM, 'y': at[1] / MIL_MM, 'diameterMil': diameter / MIL_MM, 'holeDiameterMil': drill / MIL_MM, 'viaType': 'through', 'startLayer': 1, 'endLayer': 2})
    lengths = defaultdict(float)
    for line in lines:
        lengths[line['net']] += math.hypot(line['a']['x'] - line['b']['x'], line['a']['y'] - line['b']['y'])
    groups = settings.get('groups', [])
    old_copper_nets = {original_names[value[0]] for value in old_lines + old_vias}
    metrics = {'newRouteLengthMilByNet': dict(lengths), 'lengthScope': 'new planar track geometry; via vertical length excluded', 'groupSkew': [],
               'newCopperSpacingVerification': {'status': 'passed', 'scope': 'new tracks/vias against foreign-net tracks/vias using declared global and explicit pair gaps', 'padClearanceVerified': False, 'boardEdgeVerified': False, 'nativeDrcVerified': False}}
    for group in groups:
        nets = group.get('nets') if isinstance(group, dict) else group
        measured = {net: lengths.get(net) for net in nets}
        complete = all(value is not None for value in measured.values())
        skew = max(measured.values()) - min(measured.values()) if complete else None
        unknown = []
        if any(net in old_copper_nets for net in nets):
            unknown.append('Group contains input copper; new-copper totals alone do not measure the complete endpoint route')
        if pad_counts is not None and any(pad_counts.get(net) != 2 for net in nets):
            unknown.append('Group contains a net without exactly two physical pads; endpoint path length is not resolved')
        metrics['groupSkew'].append({'nets': nets, 'lengthMil': measured, 'skewMil': skew, 'toleranceMil': settings.get('toleranceMil'), 'withinTolerance': None if unknown else complete and skew <= settings['toleranceMil'], 'measurementUnknowns': unknown, 'endpointConnectivityVerified': False})
    return {'schemaVersion': 1, 'units': 'mil', 'target': target, 'inputDigest': input_digest, 'lines': lines, 'vias': vias, 'statistics': {**stats, 'newLines': len(lines), 'newVias': len(vias), 'nativeDrcVerified': False, 'completeBoardAccepted': False}, 'modeMetrics': metrics, 'effectiveSettings': settings, 'coverage': {'complete': True, 'unsupported': [], 'routingConstraintsComplete': False, 'nativeElectricalConnectivityVerified': False}, 'existingCopperPreserved': True, 'removedInputCopper': []}


def append_fanout(text, tracks, vias):
    additions = []
    for track in tracks:
        a, b = track['start'], track['end']
        additions.append(f' (segment (start {fmt(a[0])} {fmt(a[1])}) (end {fmt(b[0])} {fmt(b[1])}) (width {fmt(track["width"])}) (layer {quote(track["layer"])}) (net {int(track["net_id"])}))')
    for via in vias:
        if set(via['layers']) != {'F.Cu', 'B.Cu'}:
            raise ValueError('Fanout generated a partial-layer via')
        additions.append(f' (via (at {fmt(via["x"])} {fmt(via["y"])}) (size {fmt(via["size"])}) (drill {fmt(via["drill"])}) (layers "F.Cu" "B.Cu") (net {int(via["net_id"])}))')
    return text.rstrip()[:-1] + '\n' + '\n'.join(additions) + '\n)\n'


def fanout_job(data, settings, layer_map, aliases, input_file, output_file, width, clearance, via_size, via_drill, edge):
    from kicad_parser import parse_kicad_pcb
    ids = settings.get('componentIds')
    kind, escape = settings.get('kind'), settings.get('escapeMethod')
    if not isinstance(ids, list) or not ids or len(set(ids)) != len(ids):
        raise ValueError('Fanout requires explicit, unique componentIds')
    if kind not in ('qfn', 'bga'):
        raise ValueError('Fanout kind must explicitly select qfn or bga')
    if escape not in (('stub', 'underpad') if kind == 'qfn' else ('channel', 'underpad')):
        raise ValueError('Explicit supported escapeMethod required; auto fallback is not enabled')
    components = {str(v['id']): v for v in data['components']}
    text = input_file.read_text(encoding='utf-8')
    failures, component_results = [], []
    for cid in ids:
        if cid not in components:
            raise ValueError(f'Unknown fanout component {cid}')
        component = components[cid]
        if component.get('rotation', 0) % 90 != 0:
            raise ValueError(f'Fanout {cid}: non-orthogonal footprint frame conversion is not verified')
        output_file.write_text(text, encoding='utf-8')
        pcb = parse_kicad_pcb(str(output_file))
        reference = component.get('designator') or cid
        if reference not in pcb.footprints:
            raise ValueError(f'Fanout footprint {reference} was not preserved in conversion')
        filters = [aliases[n] for n in settings['nets']] if settings.get('nets') else None
        rejected = []
        if kind == 'qfn':
            from qfn_fanout import generate_qfn_fanout
            escape_layer = settings.get('escapeLayer')
            if escape_layer is None:
                if len(settings.get('layers', [])) != 1:
                    raise ValueError('QFN fanout requires one explicit escapeLayer')
                escape_layer = settings['layers'][0]
            mount_layer = layer_map[int(component['layer'])]
            if escape == 'stub' and layer_map[int(escape_layer)] != mount_layer:
                raise ValueError('QFN surface-stub escape must use the component mounting layer')
            # v0.18 checks its stub obstacle map on `layer`, while always
            # emitting the stub on footprint.layer. Keep both on the mounting
            # layer. The through-via provides the selected continuation layer;
            # passing that other layer here could miss mounting-side obstacles.
            if not filters:
                raise ValueError('QFN fanout requires explicitly selected nets')
            present = {pad.net_name for pad in pcb.footprints[reference].pads}
            targets = [name for name in filters if name in present]
            if not targets:
                raise ValueError(f'Component {cid} has no pad on the selected fanout nets')
            group_tracks, group_vias, group_failed = generate_qfn_fanout(
                footprint=pcb.footprints[reference], pcb_data=pcb, net_filter=targets,
                layer=mount_layer, track_width=width,
                extension=mm(settings['extensionMil']), clearance=clearance,
                grid_step=mm(settings['gridStepMil']), escape_method=escape,
                via_size=via_size, via_drill=via_drill, allow_via_in_pad=False,
                board_edge_clearance=edge)
            tracks, vias, failed, succeeded = [], [], list(group_failed), []
            # Upstream does not check queued stubs against queued foreign
            # vias. Accept whole per-net candidates in explicit target order;
            # reject a conflicting net without changing its dimensions.
            for target_net in targets:
                matching_ids = {pad.net_id for pad in pcb.footprints[reference].pads if pad.net_name == target_net}
                net_tracks = [track for track in group_tracks if track['net_id'] in matching_ids]
                net_vias = [via for via in group_vias if via['net_id'] in matching_ids]
                if not net_tracks and not net_vias:
                    failed.append(target_net)
                    continue
                candidate = append_fanout(text, net_tracks, net_vias)
                try:
                    check_new_copper_spacing(sexpr(text), sexpr(candidate), settings)
                except ValueError as error:
                    failed.append(target_net)
                    rejected.append({'net': target_net, 'reason': str(error)})
                    continue
                text = candidate
                tracks.extend(net_tracks)
                vias.extend(net_vias)
                if target_net not in group_failed:
                    succeeded.append(target_net)
        else:
            from bga_fanout import generate_bga_fanout
            tracks, vias, removed_vias, failed = generate_bga_fanout(
                footprint=pcb.footprints[reference], pcb_data=pcb, net_filter=filters,
                layers=[layer_map[int(v)] for v in settings['layers']],
                track_width=width, clearance=clearance,
                exit_margin=mm(settings['exitMarginMil']), escape_method=escape,
                grid_step=mm(settings['gridStepMil']), via_size=via_size, via_drill=via_drill,
                check_for_previous=True)
            if removed_vias:
                raise ValueError('Fanout requested removal of input vias; append result was rejected')
            succeeded = []  # This optional adapter is not advertised until independently verified.
        if kind != 'qfn':
            text = append_fanout(text, tracks, vias)
        sexpr(text)
        failures.extend(failed)
        component_results.append({'componentId': cid, 'reference': reference, 'kind': kind,
                                  'escapeMethod': escape, 'tracks': len(tracks), 'vias': len(vias),
                                  'requestedContinuationLayer': settings.get('escapeLayer'), 'actualStubLayer': component['layer'],
                                  'succeededNets': succeeded, 'failedNets': sorted(set(failed)), 'candidateRejections': rejected, 'padConnectivityVerified': False})
    output_file.write_text(text, encoding='utf-8')
    return (sum(len(item['succeededNets']) for item in component_results), len(set(failures)), 0), component_results


def run_job(directory):
    request = json.loads((directory / 'input.json').read_text(encoding='utf-8-sig'))
    data, settings = request['input'], dict(request['settings'])
    if settings.get('mode') not in SUPPORTED_MODES or settings.get('keep_input_copper') is not True:
        raise ValueError('Explicit supported mode and keep_input_copper:true required')
    if any(settings.get(key) for key in ('rescue', 'netSwap', 'polaritySwap')):
        raise ValueError('Rescue, net swaps and polarity swaps are disabled')
    tool = Path(request['runtime']['toolDirectory']).resolve()
    sys.path[:0] = [str(tool), str(tool / 'rust_router')]
    os.environ['KICAD_NET_RESCUE'] = '0'
    import startup_checks
    abi = startup_checks.run_all_checks()
    if abi != request['runtime']['rustExtensionVersion']:
        raise ValueError('Runtime ABI differs from verified installation')
    text, net_ids, aliases, layer_map = convert_input(data, settings)
    sexpr(text)  # Validate our own complete file before invoking the engine.
    input_file, output_file = directory / 'input.kicad_pcb', directory / 'output.kicad_pcb'
    input_file.write_text(text, encoding='utf-8')
    selected = settings.get('nets') or [v['name'] for v in data['nets'] if len(v['pads']) > 1]
    if any(net not in net_ids or not net for net in selected):
        raise ValueError('Selected net is absent from the input')
    routeable = {int(v['id']) for v in data['board']['layers'] if v.get('enabled', True) and v.get('type', 'SIGNAL') == 'SIGNAL'}
    layers = [int(v) for v in (settings.get('layers') or sorted(routeable))]
    if not layers or any(v not in routeable for v in layers):
        raise ValueError('Routing layers must be explicitly available SIGNAL copper layers; PLANE copper remains an obstacle')
    route_layers = [layer_map[int(v)] for v in layers]
    width = mm(settings['trackWidthMil'])
    clearance = mm(settings['clearanceMil'])
    edge = mm(settings['boardEdgeClearanceMil'])
    if width <= 0 or min(clearance, edge) < 0:
        raise ValueError('Invalid physical routing settings')
    if (len(route_layers) > 1 or settings['mode'] == 'fanout') and ('viaSizeMil' not in settings or 'viaDrillMil' not in settings):
        raise ValueError('Multilayer routing requires explicit via copper and drill diameters')
    # For a single layer no via may be emitted; finite placeholders are unused.
    via_size, via_drill = mm(settings.get('viaSizeMil', settings['trackWidthMil'])), mm(settings.get('viaDrillMil', settings['trackWidthMil']))
    from fab_tiers import set_default_fab_tier
    # A non-empty exact override pins the floor and disables the upstream
    # standard->advanced escalation. These are this job's requested dimensions,
    # not a choice of manufacturing service or permission to shrink geometry.
    set_default_fab_tier('standard', {'track_width': width, 'clearance': clearance,
                                    'via_diameter': via_size, 'via_drill': via_drill})
    kwargs = dict(layers=route_layers, track_width=width, clearance=clearance, board_edge_clearance=edge,
                  via_size=via_size, via_drill=via_drill, keep_input_copper=True,
                  enable_layer_switch=len(route_layers) > 1, can_swap_to_top_layer=False,
                  swappable_net_patterns=None, routing_clearance_margin=1.0, add_teardrops=False)
    if settings.get('gridStepMil') is not None:
        kwargs['grid_step'] = mm(settings['gridStepMil'])
    if settings.get('maxIterations') is not None:
        kwargs['max_iterations'] = int(number(settings['maxIterations'], 'maxIterations', 1))
    atomic_json(directory / 'progress.json', {'state': 'running', 'step': 'route', 'mode': settings['mode']})
    started = time.monotonic()
    fanout_metrics = None
    if settings['mode'] in ('single', 'length-match'):
        from route import batch_route
        kwargs.update(power_tap_neckdown=False, mps_layer_swap=False)
        if settings['mode'] == 'length-match':
            groups = settings.get('groups')
            if not groups or number(settings.get('toleranceMil'), 'toleranceMil', 0) < 0:
                raise ValueError('Length matching requires explicit groups and tolerance')
            from length_matching import MIN_AMPLITUDE
            if mm(settings['meanderAmplitudeMil']) < MIN_AMPLITUDE:
                raise ValueError(f'Requested meander amplitude is below the engine minimum {MIN_AMPLITUDE} mm ({MIN_AMPLITUDE / MIL_MM:.6f} mil); no amplitude was increased automatically')
            kwargs.update(length_match_groups=[[aliases[n] for n in (g['nets'] if isinstance(g, dict) else g)] for g in groups], length_match_tolerance=mm(settings['toleranceMil']), meander_amplitude=mm(settings['meanderAmplitudeMil']))
        result = batch_route(str(input_file), str(output_file), [aliases[n] for n in selected], **kwargs)
    elif settings['mode'] == 'differential':
        from route_diff import batch_route_diff_pairs
        selected = [net for pair in settings['pairs'] for net in ((pair['positiveNet'], pair['negativeNet']) if isinstance(pair, dict) else pair)]
        kwargs.update(diff_pair_gap=mm(settings['diffPairGapMil']), polarity_swap_nets=None, mps_layer_swap=False, gnd_via_enabled=False)
        result = batch_route_diff_pairs(str(input_file), str(output_file), [aliases[n] for n in selected], **kwargs)
    else:
        result, fanout_metrics = fanout_job(data, settings, layer_map, aliases, input_file, output_file, width, clearance, via_size, via_drill, edge)
    if not output_file.is_file():
        raise ValueError('Engine returned without a complete output PCB file')
    stats = {'engineSuccessful': result[0], 'engineFailed': result[1], 'elapsedSeconds': time.monotonic() - started, 'selectedNets': selected, 'engineStatisticsAreAcceptance': False}
    canonical = compare_output(text, output_file.read_text(encoding='utf-8'), net_ids, layer_map, request['target'], request['inputDigest'], settings, stats, {net['name']: len(net['pads']) for net in data['nets']})
    if any(item['net'] not in selected for item in canonical['lines'] + canonical['vias']):
        raise ValueError('Engine generated copper for a net outside the explicitly selected scope')
    if any(not math.isclose(v['widthMil'], settings['trackWidthMil'], rel_tol=0, abs_tol=1e-6) for v in canonical['lines']):
        raise ValueError('Engine changed the requested track width; no reduced-width result was accepted')
    if any(not math.isclose(v['diameterMil'], settings['viaSizeMil'], rel_tol=0, abs_tol=1e-6)
           or not math.isclose(v['holeDiameterMil'], settings['viaDrillMil'], rel_tol=0, abs_tol=1e-6) for v in canonical['vias']):
        raise ValueError('Engine changed the requested via dimensions')
    allowed_layers = set(layers)
    if settings['mode'] == 'fanout':
        # Underpad escape includes the short pad-to-via stub on the pad layer.
        allowed_layers.update(int(p['layer']) for n in data['nets'] for p in n['pads'] if p.get('componentId') in settings['componentIds'])
    if any(v['layer'] not in allowed_layers for v in canonical['lines']) or (settings['mode'] != 'fanout' and len(route_layers) == 1 and canonical['vias']):
        raise ValueError('Engine output violates the selected routing layer scope')
    if fanout_metrics is not None:
        canonical['modeMetrics']['fanout'] = fanout_metrics
    canonical['runtime'] = request['runtime']
    canonical['conversion'] = {'units': 'mil-to-mm-and-back', 'axes': 'direct-xy', 'padPositions': 'SDK-global', 'coordinateSnapping': False, 'dimensionRounding': False, 'netAliases': aliases, 'inputSha256': hashlib.sha256(text.encode()).hexdigest(), 'outputSha256': hashlib.sha256(output_file.read_bytes()).hexdigest()}
    atomic_json(directory / 'result.json', {'ok': True, 'result': canonical})
    atomic_json(directory / 'progress.json', {'state': 'completed', 'step': 'output-verified', 'nativeDrcVerified': False})


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--job-dir', type=Path, required=True)
    args = parser.parse_args()
    directory = args.job_dir.resolve(strict=True)
    try:
        run_job(directory)
    except Exception as error:
        atomic_json(directory / 'result.json', {'ok': False, 'error': {'code': 'KIROUTING_RUNNER_FAILED', 'message': str(error), 'type': type(error).__name__}})
        import traceback
        traceback.print_exc()
        return 1
    return 0


if __name__ == '__main__':
    sys.exit(main())
