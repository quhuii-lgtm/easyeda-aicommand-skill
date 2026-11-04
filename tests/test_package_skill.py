import importlib.util
import tempfile
import unittest
import zipfile
from pathlib import Path


MODULE_PATH = Path(__file__).resolve().parents[1] / 'tools' / 'package-skill.py'
SPEC = importlib.util.spec_from_file_location('package_skill', MODULE_PATH)
PACKAGE_SKILL = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(PACKAGE_SKILL)


class PackageSkillTests(unittest.TestCase):
    def test_runtime_files_are_kept_and_local_state_is_excluded(self):
        with tempfile.TemporaryDirectory(dir=MODULE_PATH.parents[1]) as temp_dir:
            skill = Path(temp_dir) / 'ai-command-engine'
            (skill / 'scripts').mkdir(parents=True)
            (skill / 'references').mkdir()
            (skill / 'node_modules' / 'ws').mkdir(parents=True)
            (skill / 'backups' / 'Board').mkdir(parents=True)
            (skill / 'tests').mkdir()
            retained = [
                skill / 'SKILL.md',
                skill / 'package.json',
                skill / 'package-lock.json',
                skill / 'scripts' / 'command-proxy.mjs',
                skill / 'scripts' / 'start-proxy.ps1',
                skill / 'references' / 'setup.md',
            ]
            excluded = [
                skill / 'node_modules' / 'ws' / 'index.js',
                skill / 'backups' / 'Board' / 'source.epro',
                skill / 'tests' / 'test_proxy.py',
                skill / 'scripts' / 'jlc-credentials.json',
                skill / 'scripts' / 'lane-log-2026-11-03.jsonl',
                skill / 'scripts' / 'proxy-stderr.log',
            ]
            for path in retained + excluded:
                path.write_text('fixture', encoding='utf-8')

            selected = {p.relative_to(skill).as_posix() for p in skill.rglob('*') if PACKAGE_SKILL.include_skill_file(p, skill)}
            self.assertEqual(selected, {p.relative_to(skill).as_posix() for p in retained})

    def test_clean_zip_contains_runtime_and_package_lock_only(self):
        with tempfile.TemporaryDirectory(dir=MODULE_PATH.parents[1]) as temp_dir:
            skill = Path(temp_dir) / 'ai-command-engine'
            (skill / 'scripts').mkdir(parents=True)
            (skill / 'node_modules' / 'ws').mkdir(parents=True)
            (skill / 'backups').mkdir()
            (skill / 'VERSION').write_text('test', encoding='utf-8')
            (skill / 'scripts' / 'command-proxy.mjs').write_text('runtime', encoding='utf-8')
            (skill / 'package-lock.json').write_text('{}', encoding='utf-8')
            (skill / 'node_modules' / 'ws' / 'index.js').write_text('dependency', encoding='utf-8')
            (skill / 'backups' / 'local.epro').write_text('project', encoding='utf-8')
            names = []
            archive = Path(temp_dir) / 'clean.zip'
            files = [p for p in skill.rglob('*') if PACKAGE_SKILL.include_skill_file(p, skill)]
            with zipfile.ZipFile(archive, 'w') as package:
                for path in files:
                    name = 'ai-command-engine/' + path.relative_to(skill).as_posix()
                    package.write(path, name)
                    names.append(name)
            self.assertIn('ai-command-engine/scripts/command-proxy.mjs', names)
            self.assertIn('ai-command-engine/package-lock.json', names)
            self.assertFalse(any('node_modules' in name or 'backups/' in name for name in names))


if __name__ == '__main__':
    unittest.main()
