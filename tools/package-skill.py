"""Create the skill-only release ZIP. Requires only the Python standard library."""
from pathlib import Path
import hashlib
import zipfile


EXCLUDED_DIRS = {
    '.git', '__pycache__', 'node_modules', 'backups', 'source-backups',
    'tests', 'test', '.pytest_cache', '.mypy_cache', '.ruff_cache',
}
EXCLUDED_SUFFIXES = {'.pyc', '.pyo', '.log', '.jsonl', '.epro'}
EXCLUDED_NAMES = {'jlc-credentials.json', 'lane-log-error.txt', 'proxy-stdout.log', 'proxy-stderr.log'}


def include_skill_file(path: Path, skill: Path) -> bool:
    relative = path.relative_to(skill)
    if any(part.lower() in EXCLUDED_DIRS for part in relative.parts[:-1]):
        return False
    if path.name.lower() in EXCLUDED_NAMES or path.suffix.lower() in EXCLUDED_SUFFIXES:
        return False
    if path.name.lower().startswith('lane-log-'):
        return False
    return path.is_file()

def build_package(root: Path | None = None) -> tuple[Path, int, str]:
    root = root or Path(__file__).resolve().parents[1]
    skill = root / 'ai-command-engine'
    version = (skill / 'VERSION').read_text(encoding='utf-8').strip()
    output = root / 'dist'
    archive = output / f'ai-command-engine-skill_v{version}_en-zh.zip'
    assert version and (skill / 'SKILL.md').is_file() and (skill / 'SKILL_ZH.md').is_file()
    assert not archive.exists(), archive
    output.mkdir(exist_ok=True)
    files = [p for p in skill.rglob('*') if include_skill_file(p, skill)]
    with zipfile.ZipFile(archive, 'w', zipfile.ZIP_DEFLATED, compresslevel=9) as z:
        for p in sorted(files):
            name = 'ai-command-engine/' + p.relative_to(skill).as_posix()
            info = zipfile.ZipInfo(name, date_time=(1980, 1, 1, 0, 0, 0))
            info.compress_type = zipfile.ZIP_DEFLATED
            z.writestr(info, p.read_bytes(), compresslevel=9)
    with zipfile.ZipFile(archive) as z:
        assert z.testzip() is None
        for p in files:
            assert z.read('ai-command-engine/' + p.relative_to(skill).as_posix()) == p.read_bytes()
    digest = hashlib.sha256(archive.read_bytes()).hexdigest()
    (output / 'SHA256SUMS.txt').write_text(f'{digest}  {archive.name}\n', encoding='utf-8')
    return archive, len(files), digest


if __name__ == '__main__':
    archive, file_count, digest = build_package()
    print(f'{archive.name}: {file_count} files, SHA256 {digest}')
