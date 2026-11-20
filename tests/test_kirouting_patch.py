import hashlib
import importlib.util
import json
import ast
import dataclasses
from pathlib import Path
import tempfile
import unittest

SCRIPT = Path(__file__).resolve().parents[1] / 'ai-command-engine/scripts/patch-kirouting.py'
SPEC = importlib.util.spec_from_file_location('kirouting_patch', SCRIPT)
patcher = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(patcher)

PATCH_MANIFEST = SCRIPT.with_name('kirouting-runtime-patches.json')


def precision_patch_fixture():
    declared = json.loads(PATCH_MANIFEST.read_text(encoding='utf-8'))
    length_patch = declared['patches'][0]
    precision_patch = declared['patches'][1]
    length_source = (length_patch['old'] + '\n').encode()
    length_output = (length_patch['new'] + '\n').encode()
    module_source = '''def refit_candidates(rec, floors):
    cands = [rec]
    for f in floors:
        pair = (round(f['via_diameter'], 3), round(f['via_drill'], 3))
        if pair[0] < rec[0] - 1e-9 and pair not in cands:
            cands.append(pair)
    return cands

def place_candidates(config, candidates):
    via_pairs, seen_dia, escalated_pair = [], set(), set()
    for vd, dr, is_esc in candidates:
        vd, dr = round(vd, 3), round(dr, 3)
        if dr < vd <= config.via_size + 1e-9 and vd not in seen_dia:
            seen_dia.add(vd)
            via_pairs.append((vd, dr))
            if is_esc:
                escalated_pair.add((vd, dr))
    return via_pairs

def _emit_via_size(pcb_data, gx, gy, config, refit):
    rec = pcb_data.get((gx, gy), (config.via_size, config.via_drill))
    fitted = refit(rec)
    return fitted if fitted is not None else rec
'''
    module_source_bytes = module_source.encode()
    for replacement in precision_patch['replacements']:
        old = replacement['old']
        if module_source.count(old) != 1:
            raise AssertionError('synthetic precision fixture must contain each reviewed replacement once')
        module_source = module_source.replace(old, replacement['new'], 1)
    module_output = module_source.encode()
    spec = {
        'revision': 'self-contained-fixture',
        'patches': [
            {
                'file': 'length_matching.py',
                'sourceSha256': hashlib.sha256(length_source).hexdigest(),
                'patchedSha256': hashlib.sha256(length_output).hexdigest(),
                'old': length_patch['old'],
                'new': length_patch['new'],
            },
            {
                'file': 'single_ended_routing.py',
                'sourceSha256': hashlib.sha256(module_source_bytes).hexdigest(),
                'patchedSha256': hashlib.sha256(module_output).hexdigest(),
                'replacements': precision_patch['replacements'],
            },
        ],
    }
    return spec, length_source, module_source_bytes


class AdapterPatchTests(unittest.TestCase):
    def test_patch_preserves_line_endings_is_idempotent_and_records_hash(self):
        for newline in ('\n', '\r\n'):
            with self.subTest(newline=repr(newline)), tempfile.TemporaryDirectory() as directory:
                root = Path(directory)
                old = 'if trial_bumps > 0 and trial_metric >= best_metric:\n    new_segments = trial_segments'
                new = 'if trial_bumps > 0 and abs(trial_metric - target_metric) < abs(best_metric - target_metric):\n    new_segments = trial_segments'
                source = (old + '\n').replace('\n', newline).encode()
                expected = (new + '\n').replace('\n', newline).encode()
                (root / 'length_matching.py').write_bytes(source)
                spec = {'revision': 'test', 'patches': [{'file': 'length_matching.py', 'sourceSha256': hashlib.sha256(source).hexdigest(), 'patchedSha256': hashlib.sha256(expected).hexdigest(), 'old': old, 'new': new}]}
                manifest = root / 'spec.json'
                manifest.write_text(json.dumps(spec), encoding='utf-8')
                result = patcher.apply_patches(root, manifest)
                self.assertEqual((root / 'length_matching.py').read_bytes(), expected)
                self.assertEqual(result['patches'][0]['status'], 'applied')
                self.assertEqual(patcher.apply_patches(root, manifest)['patches'][0]['status'], 'already-applied')
                self.assertEqual(json.loads((root / 'ace-adapter-patches.json').read_text())['revision'], 'test')

    def test_unreviewed_source_is_left_untouched(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            source = b'user-modified source\n'
            target = root / 'length_matching.py'
            target.write_bytes(source)
            manifest = root / 'spec.json'
            manifest.write_text(json.dumps({'revision': 'test', 'patches': [{'file': target.name, 'sourceSha256': '0' * 64, 'patchedSha256': '1' * 64, 'old': 'a', 'new': 'b'}]}), encoding='utf-8')
            with self.assertRaisesRegex(ValueError, 'differs from the reviewed release'):
                patcher.apply_patches(root, manifest)
            self.assertEqual(target.read_bytes(), source)
            self.assertFalse((root / 'ace-adapter-patches.json').exists())

    def test_manifest_applies_length_and_precision_patches_idempotently(self):
        spec, length_source, module_source = precision_patch_fixture()
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / 'length_matching.py').write_bytes(length_source)
            (root / 'single_ended_routing.py').write_bytes(module_source)
            manifest_path = root / 'spec.json'
            manifest_path.write_text(json.dumps(spec), encoding='utf-8')
            result = patcher.apply_patches(root, manifest_path)
            self.assertEqual([item['status'] for item in result['patches']], ['applied', 'applied'])
            for patch in spec['patches']:
                content = (root / patch['file']).read_bytes()
                self.assertEqual(hashlib.sha256(content).hexdigest(), patch['patchedSha256'])
            length_text = (root / 'length_matching.py').read_text(encoding='utf-8')
            self.assertIn('abs(trial_metric - target_metric) < abs(best_metric - target_metric)', length_text)
            self.assertEqual(patcher.apply_patches(root, manifest_path)['patches'][0]['status'], 'already-applied')

    def test_current_manifest_upgrades_existing_runtime_without_reapplying_old_patches(self):
        declared = json.loads(PATCH_MANIFEST.read_text(encoding='utf-8'))
        _old_spec, length_source, single_source = precision_patch_fixture()
        length_patch, single_patch, diff_patch = declared['patches']
        length_output = (length_patch['new'] + '\n').encode()
        single_output = single_source.decode()
        for replacement in single_patch['replacements']:
            if single_output.count(replacement['old']) != 1:
                raise AssertionError('single-ended fixture must contain each patch location exactly once')
            single_output = single_output.replace(replacement['old'], replacement['new'], 1)
        single_output = single_output.encode()

        # Each reviewed diff-pair patch location is represented once in a
        # synthetic module so this test exercises installer upgrade behavior
        # without depending on a full KiRouting runtime checkout.
        diff_source = '\n\n# next reviewed patch location\n\n'.join(
            replacement['old'] for replacement in diff_patch['replacements'])
        diff_output = diff_source
        for replacement in diff_patch['replacements']:
            if diff_output.count(replacement['old']) != 1:
                raise AssertionError('diff-pair fixture must contain each patch location exactly once')
            diff_output = diff_output.replace(replacement['old'], replacement['new'], 1)
        diff_source_bytes = diff_source.encode()
        diff_output_bytes = diff_output.encode()

        spec = {'revision': declared['revision'], 'patches': []}
        for patch, source, output in (
            (length_patch, length_source, length_output),
            (single_patch, single_source, single_output),
            (diff_patch, diff_source_bytes, diff_output_bytes),
        ):
            item = dict(patch)
            item['sourceSha256'] = hashlib.sha256(source).hexdigest()
            item['patchedSha256'] = hashlib.sha256(output).hexdigest()
            spec['patches'].append(item)

        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            # Simulate a previous release where length and via precision were
            # already patched and the new differential adapter is not yet applied.
            (root / 'length_matching.py').write_bytes(length_output)
            (root / 'single_ended_routing.py').write_bytes(single_output)
            (root / 'diff_pair_routing.py').write_bytes(diff_source_bytes)
            manifest_path = root / 'spec.json'
            manifest_path.write_text(json.dumps(spec), encoding='utf-8')

            result = patcher.apply_patches(root, manifest_path)
            self.assertEqual([item['status'] for item in result['patches']],
                             ['already-applied', 'already-applied', 'applied'])
            self.assertEqual((root / 'diff_pair_routing.py').read_bytes(), diff_output_bytes)
            self.assertEqual([item['status'] for item in patcher.apply_patches(root, manifest_path)['patches']],
                             ['already-applied', 'already-applied', 'already-applied'])

    def test_later_corrupt_source_is_rejected_before_any_file_is_written(self):
        spec, length_source, _module_source = precision_patch_fixture()
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / 'length_matching.py').write_bytes(length_source)
            (root / 'single_ended_routing.py').write_text('damaged source\n', encoding='utf-8')
            manifest_path = root / 'spec.json'
            manifest_path.write_text(json.dumps(spec), encoding='utf-8')
            with self.assertRaisesRegex(ValueError, 'differs from the reviewed release'):
                patcher.apply_patches(root, manifest_path)
            self.assertEqual((root / 'length_matching.py').read_bytes(), length_source)
            self.assertFalse((root / 'ace-adapter-patches.json').exists())

    def test_precision_patch_candidate_order_and_emit_fixture_preserve_exact_sizes(self):
        spec, length_source, module_source = precision_patch_fixture()
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / 'length_matching.py').write_bytes(length_source)
            (root / 'single_ended_routing.py').write_bytes(module_source)
            manifest_path = root / 'spec.json'
            manifest_path.write_text(json.dumps(spec), encoding='utf-8')
            patcher.apply_patches(root, manifest_path)
            source = (root / 'single_ended_routing.py').read_text(encoding='utf-8')
            tree = ast.parse(source)
            names = {'refit_candidates', '_emit_via_size', 'place_candidates'}
            functions = [node for node in tree.body if isinstance(node, ast.FunctionDef) and node.name in names]
            self.assertEqual({node.name for node in functions}, names)
            namespace = {}
            exec(compile(ast.Module(body=functions, type_ignores=[]), '<via-precision-fixture>', 'exec'), namespace)

            @dataclasses.dataclass
            class Config:
                via_size: float = 0.6000242
                via_drill: float = 0.3000248

            floors = [
                {'via_diameter': 0.6000242, 'via_drill': 0.3000248},
                {'via_diameter': 0.5500000005, 'via_drill': 0.2500000005},
                {'via_diameter': 0.55, 'via_drill': 0.25},
                {'via_diameter': 0.5, 'via_drill': 0.2},
            ]
            expected_rec = (0.6000242, 0.3000248)
            refit_candidates = namespace['refit_candidates'](expected_rec, floors)
            self.assertEqual(refit_candidates, [expected_rec, (0.5500000005, 0.2500000005), (0.5, 0.2)])
            place_candidates = namespace['place_candidates']
            candidates = [(0.6000242, 0.3000248, False), (0.6000242005, 0.3000248005, True), (0.55, 0.25, False), (0.5500000005, 0.27, True)]
            self.assertEqual(place_candidates(Config(), candidates), [expected_rec, (0.55, 0.25)])
            self.assertEqual(namespace['_emit_via_size']({(7, 8): expected_rec}, 7, 8, Config(), lambda rec: rec), expected_rec)
            self.assertEqual(namespace['_emit_via_size']({(7, 8): expected_rec}, 7, 8, Config(), lambda _rec: None), expected_rec)


if __name__ == '__main__':
    unittest.main()
