import importlib.util
import json
import math
from pathlib import Path
import sys
import tempfile
from types import SimpleNamespace
import unittest
from unittest.mock import patch

SCRIPT = Path(__file__).resolve().parents[1] / 'ai-command-engine/scripts/kirouting-runner.py'
SPEC = importlib.util.spec_from_file_location('kirouting_runner', SCRIPT)
runner = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(runner)
LOCKED_PLUGIN_DIR = Path(__file__).resolve().parents[2] / 'evidence/kirouting-runtime/KiCadRoutingTools-0.18.0-official-release/plugins'
sys.path.insert(0, str(LOCKED_PLUGIN_DIR))
PARSER_SPEC = importlib.util.spec_from_file_location('locked_kicad_parser', LOCKED_PLUGIN_DIR / 'kicad_parser.py')
locked_parser = importlib.util.module_from_spec(PARSER_SPEC)
sys.modules[PARSER_SPEC.name] = locked_parser
PARSER_SPEC.loader.exec_module(locked_parser)


def fixture():
    def pad(name, x):
        return {'id': name, 'componentId': 'U1', 'padNumber': name, 'x': x,
                'y': -123.456789, 'rotation': 90, 'layer': 2,
                'shape': ['RECT', 11.23456789, 30.98765432, 0], 'hole': None, 'plated': False}
    return {
        'schemaVersion': 1, 'units': 'mil',
        'board': {'layers': [{'id': 1}, {'id': 2}], 'outline': []},
        'components': [{'id': 'U1', 'designator': 'U1', 'x': 50, 'y': 40, 'rotation': 90}],
        'nets': [{'name': 'signal A', 'pads': [pad('1', 100.123456789)]},
                 {'name': 'signal B', 'pads': [pad('2', 130.123456789)]}],
        'unconnected_pads': [{**pad('NC', 160), 'hole': ['ROUND', 8], 'plated': False}],
        'existing_tracks': [{'net': 'signal A', 'layer': 2, 'widthMil': 6, 'a': {'x': 0, 'y': 0}, 'b': {'x': 100, 'y': 0}}],
        'existing_vias': [{'net': 'signal A', 'x': 100, 'y': 0, 'diameterMil': 24, 'holeDiameterMil': 10},
                          {'net': 'signal B', 'x': 130, 'y': 0, 'diameterMil': 24, 'holeDiameterMil': 12}],
    }


class ConverterTests(unittest.TestCase):
    def test_round_plated_offset_holes_round_trip_through_locked_parser(self):
        expected = [
            ('J1', '1', 402.365, -1135, 402.362, -1135, 0, -0.003),
            ('J1', '2', 500.785, -1135, 500.787, -1135, 0, 0.002),
            ('J1', '3', 599.215, -1135, 599.212, -1135, 0, -0.003),
            ('J1', '4', 697.635, -1135, 697.637, -1135, 0, 0.002),
            ('J2', '2', 390.790, 265, 390.788, 265, 180, 0.002),
        ]
        pads = []
        nets = []
        for index, (reference, number, copper_x, copper_y, hole_x, hole_y, angle, offset_x) in enumerate(expected, 1):
            item = {'id': f'{reference}-PAD-{number}', 'componentId': reference,
                    'padNumber': number, 'x': copper_x, 'y': copper_y, 'rotation': angle,
                    'layer': 12, 'shape': ['ELLIPSE', 70.866, 70.866],
                    'hole': ['ROUND', 43.308, 43.308], 'plated': True,
                    'holeCenterX': hole_x, 'holeCenterY': hole_y,
                    'holeCenterSource': 'bound-footprint-source',
                    'holeOffsetSource': 'bound-footprint-source',
                    'holeOffsetX': offset_x, 'holeOffsetY': 0}
            pads.append(item)
            nets.append({'name': f'N{index}', 'pads': [item]})
        data = {
            'schemaVersion': 1, 'units': 'mil',
            'board': {'layers': [{'id': 1, 'enabled': True}, {'id': 2, 'enabled': True}], 'outline': []},
            'components': [
                {'id': 'e61', 'designator': 'J1', 'name': 'Connector', 'x': 550, 'y': -1135, 'rotation': 0, 'layer': 1, 'mirror': False},
                {'id': 'e65', 'designator': 'J2', 'name': 'Connector', 'x': 440, 'y': 265, 'rotation': 180, 'layer': 1, 'mirror': False},
            ],
            'nets': nets, 'unconnected_pads': [], 'existing_tracks': [], 'existing_vias': [],
            'existing_arcs': [], 'existing_copper_obstacles': [],
        }
        text, _, _, _ = runner.convert_input(data, {'mode': 'single'})
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / 'offset-round-holes.kicad_pcb'
            path.write_text(text, encoding='utf-8')
            parsed = locked_parser.parse_kicad_pcb(str(path))
        by_reference_and_number = {(fp.reference, pad.pad_number): pad for fp in parsed.footprints.values() for pad in fp.pads}
        self.assertEqual(len(by_reference_and_number), 5)
        for reference, number, copper_x, copper_y, hole_x, hole_y, _, _ in expected:
            parsed_pad = by_reference_and_number[(reference, number)]
            self.assertAlmostEqual(parsed_pad.global_x / runner.MIL_MM, copper_x, places=8)
            self.assertAlmostEqual(parsed_pad.global_y / runner.MIL_MM, copper_y, places=8)
            self.assertAlmostEqual(parsed_pad.hole_x / runner.MIL_MM, hole_x, places=8)
            self.assertAlmostEqual(parsed_pad.hole_y / runner.MIL_MM, hole_y, places=8)

    def test_unverified_offset_round_hole_is_rejected(self):
        data = fixture()
        pad = data['nets'][0]['pads'][0]
        pad.update({'hole': ['ROUND', 10, 10], 'plated': True, 'layer': 12,
                    'holeCenterX': 100.1, 'holeCenterY': pad['y'],
                    'holeCenterSource': 'sdk', 'holeOffsetX': 0.1, 'holeOffsetY': 0})
        with self.assertRaisesRegex(ValueError, 'unverified offset-hole source geometry'):
            runner.convert_input(data, {'mode': 'single'})

    def test_global_coordinates_precision_rotation_and_unnet_drill(self):
        text, _, _, _ = runner.convert_input(fixture(), {'mode': 'single'})
        doc = runner.sexpr(text)
        fp = runner.children(doc, 'footprint')[0]
        pads = runner.children(fp, 'pad')
        reference = next(prop for prop in runner.children(fp, 'property') if prop[1] == 'Reference')
        self.assertEqual(runner.child(reference, 'layer')[1], 'B.SilkS')
        self.assertEqual(runner.child(reference, 'hide')[1], 'yes')
        self.assertEqual(runner.child(fp, 'layer')[1], 'B.Cu')
        self.assertNotIn(runner.child(reference, 'layer')[1], ('F.Cu', 'B.Cu'))
        self.assertEqual(len(pads), 3)
        at = runner.child(pads[0], 'at')
        self.assertAlmostEqual(float(at[1]) / runner.MIL_MM, 100.123456789, places=9)
        self.assertEqual(float(at[3]), 90)
        self.assertAlmostEqual(float(runner.child(pads[0], 'size')[1]) / runner.MIL_MM, 11.23456789, places=9)
        self.assertEqual(pads[2][2], 'np_thru_hole')
        self.assertEqual(runner.child(pads[2], 'net')[1], '0')

    def test_live_complex_polygon_custom_pad_round_trip_global_to_local(self):
        sample_file = Path(__file__).resolve().parents[2] / 'evidence/kirouting-validation/host-complex-u10-pads.json'
        sample = json.loads(sample_file.read_text(encoding='utf-8'))
        raw_pads = sample['data']
        polygons = [pad for pad in raw_pads if pad['shape'][0] == 'POLYGON']
        self.assertEqual(len(polygons), 4)

        def canonical_pad(raw, net, layer):
            source = raw['shape'][1]
            self.assertEqual(source[2], 'L')
            coordinates = [value for value in source if isinstance(value, (int, float))]
            points = [{'x': coordinates[i], 'y': coordinates[i + 1]} for i in range(0, len(coordinates), 2)]
            if len(points) > 1 and points[0] == points[-1]:
                points.pop()
            return {
                'id': raw['padId'], 'componentId': 'U10', 'padNumber': raw['padNumber'],
                'x': raw['x'], 'y': raw['y'], 'rotation': raw['rotation'], 'layer': layer,
                'shape': raw['shape'], 'polygon': {'coordinateSpace': 'global-mil', 'points': points},
                'hole': None, 'plated': False, 'net': net,
            }

        canonical = [canonical_pad(raw, f'POLY_{index % 2}', 1 if index % 2 == 0 else 2) for index, raw in enumerate(polygons)]
        data = fixture()
        data['components'] = [{'id': 'U10', 'designator': 'U10', 'layer': 1}]
        data['nets'] = [{'name': 'POLY_0', 'pads': [canonical[0], canonical[2]]}, {'name': 'POLY_1', 'pads': [canonical[1], canonical[3]]}]
        data['unconnected_pads'] = []
        text, net_ids, _, layer_map = runner.convert_input(data, {'mode': 'single'})
        footprint = runner.children(runner.sexpr(text), 'footprint')[0]
        pads = runner.children(footprint, 'pad')
        self.assertEqual(len(pads), 4)
        for emitted, source in zip(pads, (canonical[0], canonical[2], canonical[1], canonical[3])):
            self.assertEqual(emitted[3], 'custom')
            self.assertEqual(runner.child(emitted, 'size')[1:], ['0', '0'])
            self.assertAlmostEqual(float(runner.child(emitted, 'at')[1]) / runner.MIL_MM, source['x'], places=8)
            self.assertAlmostEqual(float(runner.child(emitted, 'at')[2]) / runner.MIL_MM, source['y'], places=8)
            self.assertAlmostEqual(float(runner.child(emitted, 'at')[3]), source['rotation'], places=8)
            self.assertEqual(runner.child(emitted, 'layers')[1], 'F.Cu' if source['layer'] == 1 else 'B.Cu')
            expected_net = net_ids[source['net']]
            self.assertEqual(int(runner.child(emitted, 'net')[1]), expected_net)
            primitives = runner.child(emitted, 'primitives')
            gr_poly = runner.child(primitives, 'gr_poly')
            local = [(float(point[1]) / runner.MIL_MM, float(point[2]) / runner.MIL_MM) for point in runner.children(runner.child(gr_poly, 'pts'), 'xy')]
            angle = math.radians(source['rotation'])
            reconstructed = [(source['x'] + x * math.cos(angle) + y * math.sin(angle),
                              source['y'] - x * math.sin(angle) + y * math.cos(angle)) for x, y in local]
            expected = [(point['x'], point['y']) for point in source['polygon']['points']]
            if len(expected) > 1 and expected[0] == expected[-1]:
                expected.pop()
            self.assertEqual(len(reconstructed), len(expected))
            for actual_point, expected_point in zip(reconstructed, expected):
                self.assertAlmostEqual(actual_point[0], expected_point[0], places=8)
                self.assertAlmostEqual(actual_point[1], expected_point[1], places=8)
        preserved = runner.compare_output(text, text, net_ids, layer_map, {}, 'digest', {'mode': 'single'}, {})
        self.assertTrue(preserved['existingCopperPreserved'])
        with self.assertRaisesRegex(ValueError, 'changed input identity|removed or changed input copper/geometry'):
            runner.compare_output(text, text.replace('(fill yes)', '(fill no)', 1), net_ids, layer_map, {}, 'digest', {'mode': 'single'}, {})

    def test_custom_polygon_preserves_round_drill_and_rejects_unmapped_topology(self):
        data = fixture()
        pad = data['nets'][0]['pads'][0]
        pad['shape'] = ['POLYGON', []]
        pad['polygon'] = {'coordinateSpace': 'global-mil', 'points': [
            {'x': 90.0, 'y': -130.0}, {'x': 110.0, 'y': -130.0},
            {'x': 110.0, 'y': -110.0}, {'x': 90.0, 'y': -110.0},
        ]}
        pad['x'], pad['y'], pad['rotation'] = 100.0, -120.0, 0
        pad['hole'], pad['plated'] = ['ROUND', 6.0], True
        text, _, _, _ = runner.convert_input(data, {'mode': 'single'})
        emitted = runner.children(runner.children(runner.sexpr(text), 'footprint')[0], 'pad')[0]
        self.assertEqual(emitted[2], 'thru_hole')
        self.assertAlmostEqual(float(runner.child(emitted, 'drill')[1]) / runner.MIL_MM, 6.0, places=9)
        self.assertEqual(runner.child(emitted, 'layers')[1:], ['*.Cu', '*.Mask'])

        invalid = fixture()
        invalid['nets'][0]['pads'][0]['shape'] = ['POLYGON', [['L', 0, 0, 1, 0, 1, 1]]]
        with self.assertRaisesRegex(ValueError, 'global-mil'):
            runner.convert_input(invalid, {'mode': 'single'})
        for points in (
            [[{'x': 0, 'y': 0}, {'x': 1, 'y': 0}, {'x': 1, 'y': 1}]],
            [{'x': 0, 'y': 0}, {'x': 2, 'y': 3}, {'x': 1, 'y': 0}, {'x': 0, 'y': 2}, {'x': 3, 'y': 3}],
        ):
            invalid = fixture()
            invalid_pad = invalid['nets'][0]['pads'][0]
            invalid_pad['shape'] = ['POLYGON', []]
            invalid_pad['polygon'] = {'coordinateSpace': 'global-mil', 'points': points}
            with self.assertRaisesRegex(ValueError, 'single array|self-intersecting'):
                runner.convert_input(invalid, {'mode': 'single'})

    def test_same_diameter_different_drills_survive_complete_comparison(self):
        text, ids, _, layers = runner.convert_input(fixture(), {'mode': 'single'})
        vias = runner.copper(runner.sexpr(text))[1]
        self.assertEqual(len({via[3] for via in vias}), 2)
        result = runner.compare_output(text, text, ids, layers, {}, 'digest', {'mode': 'single'}, {})
        self.assertTrue(result['existingCopperPreserved'])
        self.assertEqual(result['lines'], [])
        self.assertEqual(result['vias'], [])

    def test_deleted_input_track_or_changed_pad_blocks_append(self):
        text, ids, _, layers = runner.convert_input(fixture(), {'mode': 'single'})
        changed = '\n'.join(line for line in text.splitlines() if '(segment ' not in line)
        with self.assertRaisesRegex(ValueError, 'removed or changed|changed input'):
            runner.compare_output(text, changed, ids, layers, {}, 'digest', {'mode': 'single'}, {})
        with self.assertRaisesRegex(ValueError, 'removed or changed|changed input'):
            runner.compare_output(text, text.replace('np_thru_hole', 'thru_hole'), ids, layers, {}, 'digest', {'mode': 'single'}, {})

    def test_ellipse_cannot_silently_become_capsule_and_arc_is_not_discarded(self):
        data = fixture()
        data['nets'][0]['pads'][0]['shape'] = ['ELLIPSE', 20, 40]
        with self.assertRaisesRegex(ValueError, 'true ellipse'):
            runner.convert_input(data, {'mode': 'single'})
        data = fixture()
        data['existing_arcs'] = [{'id': 'arc1'}]
        with self.assertRaisesRegex(ValueError, 'ARC'):
            runner.convert_input(data, {'mode': 'single'})

    def test_explicit_pair_aliases_do_not_change_net_ids(self):
        data = fixture()
        _, normal_ids, _, _ = runner.convert_input(data, {'mode': 'single'})
        text, pair_ids, aliases, _ = runner.convert_input(data, {'mode': 'differential', 'pairs': [['signal A', 'signal B']]})
        self.assertEqual(normal_ids, pair_ids)
        self.assertNotEqual(aliases['signal A'], aliases['signal B'])
        self.assertIn('__ACE_PAIR_0_P', text)
        self.assertIn('__ACE_PAIR_0_N', text)

    def test_known_crossing_is_rejected_even_if_engine_reports_success(self):
        text, ids, _, layers = runner.convert_input(fixture(), {'mode': 'single'})
        after = text.rstrip()[:-1] + ' (segment (start 1 -1) (end 1 1) (width 0.1524) (layer "B.Cu") (net 2)))'
        with self.assertRaisesRegex(ValueError, 'spacing violation|crosses foreign-net'):
            runner.compare_output(text, after, ids, layers, {}, 'digest', {'mode': 'single'}, {'engineSuccessful': 1})

    def test_roundrect_radius_remains_exact(self):
        data = fixture()
        data['nets'][0]['pads'][0]['shape'] = ['RECT', 20, 40, 40]
        data['nets'][0]['pads'][0]['cornerRadiusMil'] = 4
        data['nets'][0]['pads'][0]['cornerRadiusSource'] = 'sdk-rect-half-min-side-percent'
        text, _, _, _ = runner.convert_input(data, {'mode': 'single'})
        pad = runner.children(runner.children(runner.sexpr(text), 'footprint')[0], 'pad')[0]
        self.assertEqual(pad[3], 'roundrect')
        self.assertEqual(float(runner.child(pad, 'roundrect_rratio')[1]), 0.2)

    def test_sdk_rectangle_round_controls_use_explicit_physical_radius(self):
        spec_file = Path(__file__).resolve().parents[2] / 'evidence/kirouting-validation/host-round-control-spec.json'
        controls = json.loads(spec_file.read_text(encoding='utf-8'))['samples']
        self.assertEqual(len(controls), 5)
        for control in controls:
            with self.subTest(ref=control['ref']):
                data = fixture()
                data['components'][0]['designator'] = control['ref']
                data['components'][0]['layer'] = 1 if control['layer'] == 'F.Cu' else 2
                pad = data['nets'][0]['pads'][0]
                pad['layer'] = 1 if control['layer'] == 'F.Cu' else 2
                raw_percent = control['r'] * 200
                radius_mil = min(control['w'], control['h']) * raw_percent / 200
                pad['shape'] = ['RECT', control['w'], control['h'], raw_percent]
                pad['cornerRadiusMil'] = radius_mil
                pad['cornerRadiusSource'] = 'sdk-rect-half-min-side-percent'
                text, _, _, _ = runner.convert_input(data, {'mode': 'single'})
                footprint = runner.children(runner.sexpr(text), 'footprint')[0]
                outpad = runner.children(footprint, 'pad')[0]
                self.assertEqual(outpad[3], 'roundrect')
                self.assertAlmostEqual(float(runner.child(outpad, 'roundrect_rratio')[1]), control['r'], places=10)
                self.assertEqual(runner.child(outpad, 'layers')[1], control['layer'])

    def test_roundrect_requires_canonical_radius_and_rejects_invalid_values(self):
        data = fixture()
        pad = data['nets'][0]['pads'][0]
        pad['shape'] = ['RECT', 20, 40, 20]
        with self.assertRaisesRegex(ValueError, 'requires canonical cornerRadiusMil/source'):
            runner.convert_input(data, {'mode': 'single'})

        pad['cornerRadiusMil'] = 2
        pad['cornerRadiusSource'] = 'sdk-rect-half-min-side-percent'
        for radius, raw_percent, source, message in (
            (0, -1, 'sdk-rect-half-min-side-percent', 'must be >= 0'),
            (-1, 20, 'sdk-rect-half-min-side-percent', 'must be >= 0'),
            (20, 20, 'sdk-rect-half-min-side-percent', 'does not match'),
            (20, 200, 'sdk-rect-half-min-side-percent', 'exceeds half'),
            (2, 20, 'incorrect-source', 'cornerRadiusSource is invalid'),
        ):
            with self.subTest(radius=radius, raw_percent=raw_percent, source=source):
                pad['shape'] = ['RECT', 20, 40, raw_percent]
                pad['cornerRadiusMil'] = radius
                pad['cornerRadiusSource'] = source
                with self.assertRaisesRegex(ValueError, message):
                    runner.convert_input(data, {'mode': 'single'})

        pad['shape'] = ['RECT', 20, 40, 0]
        pad.pop('cornerRadiusMil')
        pad.pop('cornerRadiusSource')
        text, _, _, _ = runner.convert_input(data, {'mode': 'single'})
        outpad = runner.children(runner.children(runner.sexpr(text), 'footprint')[0], 'pad')[0]
        self.assertEqual(outpad[3], 'rect')
        self.assertIsNone(runner.child(outpad, 'roundrect_rratio'))

    def test_bottom_mount_layer_and_rounded_fill_are_not_lost(self):
        data = fixture()
        data['components'][0]['layer'] = 2
        text, _, _, _ = runner.convert_input(data, {'mode': 'single'})
        doc = runner.sexpr(text)
        fp = runner.children(doc, 'footprint')[0]
        self.assertEqual(runner.child(fp, 'layer')[1], 'B.Cu')
        reference = next(prop for prop in runner.children(fp, 'property') if prop[1] == 'Reference')
        self.assertEqual(runner.child(reference, 'layer')[1], 'B.SilkS')
        self.assertEqual(runner.child(reference, 'hide')[1], 'yes')
        self.assertNotIn(runner.child(reference, 'layer')[1], ('F.Cu', 'B.Cu'))
        board_layers = runner.child(doc, 'layers')
        self.assertIn(['37', 'F.SilkS', 'user'], board_layers)
        self.assertIn(['36', 'B.SilkS', 'user'], board_layers)
        self.assertEqual(runner.polygon_points(['R', 0, 0, 100, 50, 0, 0]), [(0, 0), (100, 0), (100, -50), (0, -50)])
        with self.assertRaisesRegex(ValueError, 'Rounded or rotated'):
            runner.polygon_points(['R', 0, 0, 100, 50, 0, 10])

    def test_new_unsupported_copper_cannot_be_silently_omitted(self):
        text, ids, _, layers = runner.convert_input(fixture(), {'mode': 'single'})
        after = text.rstrip()[:-1] + ' (arc (start 1 0) (mid 2 1) (end 3 0) (width 0.1) (layer "B.Cu") (net 1)))'
        with self.assertRaisesRegex(ValueError, 'added unsupported arc'):
            runner.compare_output(text, after, ids, layers, {}, 'digest', {'mode': 'single'}, {})

    def test_plane_and_multilayer_objects_do_not_invent_a_physical_layer(self):
        data = fixture()
        data['board']['layers'].append({'id': 15, 'type': 'PLANE'})
        data['nets'][0]['pads'][0]['layer'] = 12
        data['existing_copper_obstacles'] = [{'id': 'fill', 'kind': 'fill', 'layer': 12, 'net': '', 'polygon': [['L', 0, 0, 10, 0, 10, 10, 0, 10]]}]
        text, _, _, mapping = runner.convert_input(data, {'mode': 'single'})
        self.assertEqual(set(mapping), {1, 2, 15})
        doc = runner.sexpr(text)
        self.assertEqual(len(runner.children(doc, 'zone')), 3)
        physical = runner.child(doc, 'layers')
        self.assertIn(['1', 'In1.Cu', 'power'], physical)
        pad = runner.children(runner.children(doc, 'footprint')[0], 'pad')[0]
        self.assertEqual(runner.child(pad, 'layers')[1:], ['*.Cu'])

    def test_normalized_copper_rings_preserve_holes_and_nested_islands(self):
        from shapely.geometry import Point
        polygons = runner._polygons_from_rings([
            [{'x': 0, 'y': 0}, {'x': 100, 'y': 0}, {'x': 100, 'y': 100}, {'x': 0, 'y': 100}],
            [{'x': 20, 'y': 20}, {'x': 80, 'y': 20}, {'x': 80, 'y': 80}, {'x': 20, 'y': 80}],
            [{'x': 40, 'y': 40}, {'x': 60, 'y': 40}, {'x': 60, 'y': 60}, {'x': 40, 'y': 60}],
        ], 'test-copper')
        geometry = polygons[0].union(polygons[1])
        self.assertEqual(len(polygons), 2)
        self.assertTrue(geometry.covers(Point(10, 10)))
        self.assertFalse(geometry.covers(Point(30, 30)))
        self.assertTrue(geometry.covers(Point(50, 50)))

    def test_copper_hole_decomposition_matches_source_union(self):
        from shapely.geometry import Polygon
        from shapely.ops import unary_union
        source = Polygon([(0, 0), (100, 0), (100, 100), (0, 100)],
                         holes=[[(20, 20), (80, 20), (80, 80), (20, 80)]])
        pieces = runner._keepout_area_polygons([source], 'test-hole')
        self.assertGreater(len(pieces), 0)
        self.assertTrue(all(len(piece.interiors) == 1 for piece in pieces))
        self.assertLess(unary_union(pieces).symmetric_difference(source).area, 1e-8)

    def test_normalized_round_stroke_keeps_full_width_and_caps(self):
        from shapely.geometry import Point
        polygons = runner._stroke_polygon({
            'coordinateSpace': 'global-mil', 'paths': [[{'x': 0, 'y': 0}, {'x': 100, 'y': 0}]],
            'widthMil': 10, 'cap': 'round',
        }, 'test-stroke')
        geometry = polygons[0]
        self.assertGreaterEqual(geometry.bounds[0], -5.002)
        self.assertLessEqual(geometry.bounds[0], -5)
        self.assertLessEqual(geometry.bounds[2], 105.002)
        self.assertGreaterEqual(geometry.bounds[2], 105)
        self.assertGreaterEqual(geometry.bounds[1], -5.002)
        self.assertLessEqual(geometry.bounds[1], -5)
        self.assertLessEqual(geometry.bounds[3], 5.002)
        self.assertGreaterEqual(geometry.bounds[3], 5)
        self.assertTrue(geometry.covers(Point(-4.9, 0)))
        self.assertFalse(geometry.covers(Point(-5.1, 0)))

    def test_normalized_copper_is_a_layer_keepout_to_locked_parser(self):
        data = fixture()
        data['existing_copper_obstacles'] = [{
            'id': 'poured-round', 'kind': 'poured-fill', 'layer': 1, 'net': 'ground', 'fill': True,
            'geometryNormalization': {'status': 'normalized', 'arcChordToleranceMil': .01,
                                      'runnerBufferMil': .01, 'serializationToleranceMil': .001,
                                      'totalMaxErrorMil': .021},
            'polygon': {'coordinateSpace': 'global-mil', 'rings': [[
                {'x': 0, 'y': 0}, {'x': 100, 'y': 0}, {'x': 100, 'y': 100}, {'x': 0, 'y': 100},
            ], [
                {'x': 20, 'y': 20}, {'x': 80, 'y': 20}, {'x': 80, 'y': 80}, {'x': 20, 'y': 80},
            ]]},
        }]
        text, _, _, _ = runner.convert_input(data, {'mode': 'single', 'nets': ['signal A']})
        keepouts = locked_parser.extract_keepouts(text)
        self.assertEqual(len(keepouts), 1)
        self.assertEqual(keepouts[0]['layers'], {'F.Cu'})
        self.assertFalse(keepouts[0]['tracks_allowed'])
        self.assertFalse(keepouts[0]['vias_allowed'])
        self.assertEqual(len(keepouts[0]['holes']), 1)

    def test_selected_net_copper_obstacle_is_not_misrepresented_as_blocked(self):
        data = fixture()
        data['existing_copper_obstacles'] = [{
            'id': 'same-net', 'kind': 'poured-fill', 'layer': 1, 'net': 'signal A', 'fill': False,
            'geometryNormalization': {'status': 'normalized'},
            'stroke': {'coordinateSpace': 'global-mil', 'paths': [[{'x': 0, 'y': 0}, {'x': 100, 'y': 0}]],
                       'widthMil': 10, 'cap': 'round'},
        }]
        with self.assertRaisesRegex(ValueError, 'selected net signal A overlaps existing filled copper'):
            runner.convert_input(data, {'mode': 'single', 'nets': ['signal A']})

    def test_unsupported_canonical_copper_geometry_fails_closed(self):
        with self.assertRaisesRegex(ValueError, 'not normalized'):
            runner._normalized_obstacle_polygons({'id': 'unknown', 'fill': True,
                                                  'polygon': {'coordinateSpace': 'global-mil', 'rings': []}})

    def test_underpad_checks_mount_layer_even_when_continuation_uses_other_layer(self):
        data = fixture()
        data['components'][0]['layer'] = 1
        captured = []
        def generate(**kwargs):
            captured.append(kwargs['layer'])
            return [], [], []
        modules = {'kicad_parser': SimpleNamespace(parse_kicad_pcb=lambda _: SimpleNamespace(footprints={'U1': SimpleNamespace(pads=[SimpleNamespace(net_name='signal A', net_id=1)])})),
                   'qfn_fanout': SimpleNamespace(generate_qfn_fanout=generate)}
        settings = {'kind': 'qfn', 'componentIds': ['U1'], 'nets': ['signal A'], 'escapeMethod': 'underpad', 'escapeLayer': 2, 'layers': [2], 'extensionMil': 20, 'gridStepMil': 2}
        with tempfile.TemporaryDirectory() as directory, patch.dict('sys.modules', modules):
            input_file, output_file = Path(directory) / 'in.kicad_pcb', Path(directory) / 'out.kicad_pcb'
            text, _, aliases, layer_map = runner.convert_input(data, {'mode': 'single'})
            input_file.write_text(text, encoding='utf-8')
            runner.fanout_job(data, settings, layer_map, aliases, input_file, output_file, .15, .15, .6, .3, .25)
            self.assertEqual(captured, ['F.Cu'])
            settings['escapeMethod'] = 'stub'
            with self.assertRaisesRegex(ValueError, 'mounting layer'):
                runner.fanout_job(data, settings, layer_map, aliases, input_file, output_file, .15, .15, .6, .3, .25)

    def test_clearance_boundary_and_inherited_geometry(self):
        before = runner.sexpr('(kicad_pcb (net 0 "") (net 1 "A") (net 2 "B") (segment (start 0 0) (end 2 0) (width 0.15) (layer "F.Cu") (net 1)))')
        for y, passes in ((.5, False), (.525, True)):
            after = runner.sexpr(f'(kicad_pcb (net 0 "") (net 1 "A") (net 2 "B") (segment (start 0 0) (end 2 0) (width 0.15) (layer "F.Cu") (net 1)) (via (at 1 {y}) (size 0.6) (drill 0.3) (layers "F.Cu" "B.Cu") (net 2)))')
            if passes:
                runner.check_new_copper_spacing(before, after, {'clearanceMil': .15 / runner.MIL_MM})
            else:
                with self.assertRaisesRegex(ValueError, 'spacing violation'):
                    runner.check_new_copper_spacing(before, after, {'clearanceMil': .15 / runner.MIL_MM})
                # Existing violations alone are not reclassified as a new write.
                runner.check_new_copper_spacing(after, after, {'clearanceMil': .15 / runner.MIL_MM})

    def test_fanout_rejects_whole_later_net_without_changing_first(self):
        data = fixture()
        data['components'][0]['layer'] = 1
        data['existing_tracks'], data['existing_vias'] = [], []
        def generate(**kwargs):
            return ([{'start': (0, 0), 'end': (1, 0), 'width': .15, 'layer': 'F.Cu', 'net_id': 1},
                     {'start': (0, .5), 'end': (1, .5), 'width': .15, 'layer': 'F.Cu', 'net_id': 2}],
                    [{'x': 1, 'y': y, 'size': .6, 'drill': .3, 'layers': ['F.Cu', 'B.Cu'], 'net_id': nid} for y, nid in ((0, 1), (.5, 2))], [])
        fp = SimpleNamespace(pads=[SimpleNamespace(net_name='signal A', net_id=1), SimpleNamespace(net_name='signal B', net_id=2)])
        modules = {'kicad_parser': SimpleNamespace(parse_kicad_pcb=lambda _: SimpleNamespace(footprints={'U1': fp})), 'qfn_fanout': SimpleNamespace(generate_qfn_fanout=generate)}
        settings = {'kind': 'qfn', 'mode': 'fanout', 'componentIds': ['U1'], 'nets': ['signal A', 'signal B'], 'escapeMethod': 'underpad', 'escapeLayer': 2, 'layers': [2], 'extensionMil': 20, 'gridStepMil': 2, 'clearanceMil': .15 / runner.MIL_MM}
        with tempfile.TemporaryDirectory() as directory, patch.dict('sys.modules', modules):
            input_file, output_file = Path(directory) / 'in.kicad_pcb', Path(directory) / 'out.kicad_pcb'
            text, _, aliases, layers = runner.convert_input(data, {'mode': 'single'})
            input_file.write_text(text, encoding='utf-8')
            stats, metrics = runner.fanout_job(data, settings, layers, aliases, input_file, output_file, .15, .15, .6, .3, .25)
            self.assertEqual(stats[:2], (1, 1))
            lines, vias = runner.copper(runner.sexpr(output_file.read_text(encoding='utf-8')))
            self.assertEqual(lines, [(1, 'F.Cu', .15, (0.0, 0.0), (1.0, 0.0))])
            self.assertEqual([v[0] for v in vias], [1])
            self.assertEqual(metrics[0]['failedNets'], ['signal B'])
            self.assertEqual(metrics[0]['candidateRejections'][0]['net'], 'signal B')


if __name__ == '__main__':
    unittest.main()
