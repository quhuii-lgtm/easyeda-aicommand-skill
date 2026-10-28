"""Create the skill-only release ZIP. Requires only the Python standard library."""
from pathlib import Path
import hashlib
import zipfile

root = Path(__file__).resolve().parents[1]
skill = root / 'ai-command-engine'
version = (skill / 'VERSION').read_text(encoding='utf-8').strip()
output = root / 'dist'
archive = output / f'ai-command-engine-skill_v{version}_en-zh.zip'
assert version and (skill / 'SKILL.md').is_file() and (skill / 'SKILL_ZH.md').is_file()
assert not archive.exists(), archive
output.mkdir(exist_ok=True)
files = [p for p in skill.rglob('*') if p.is_file() and '__pycache__' not in p.parts and p.suffix != '.pyc']
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
print(f'{archive.name}: {len(files)} files, SHA256 {digest}')
