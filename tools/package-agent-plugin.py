"""Build the portable AI Command Engine plugin without changing the standalone skill."""
from hashlib import sha256
from pathlib import Path
import json
import re
from zipfile import ZIP_DEFLATED, ZipFile, ZipInfo

from importlib import import_module


PLUGIN_NAME = 'ai-command-engine-companion'
PLUGIN_VERSION = '0.1.0'
DESCRIPTION = 'JLCEDA schematic and PCB workflows, local checks, and portable collaboration rules.'
SKILL_PREFIX = 'skills/ai-command-engine/'
POLICY_REFERENCE = 'references/agent-workflow.md'
MANIFEST_SCHEMA = 'https://agent-plugins.org/schemas/1.0.0/plugin.schema.json'


def json_bytes(value: dict) -> bytes:
    return (json.dumps(value, indent=2, ensure_ascii=False) + '\n').encode('utf-8')


def build_entries(root: Path) -> dict[str, bytes]:
    include_skill_file = import_module('package-skill').include_skill_file
    source = root / 'portable-plugin'
    policy = (source / 'AGENTS.md').read_bytes()
    identity = {'name': PLUGIN_NAME, 'version': PLUGIN_VERSION, 'description': DESCRIPTION}
    entries = {
        name: (source / name).read_bytes() for name in ('AGENTS.md', 'README.md', 'README_ZH.md')
    }
    entries['plugin.json'] = json_bytes({
        '$schema': MANIFEST_SCHEMA, **identity,
        'extensions': {'com.openai': {'requires_local_executor': True}},
    })
    entries['.codex-plugin/plugin.json'] = json_bytes({
        **identity, 'skills': './skills/', 'requires_local_executor': True,
    })
    entries['.claude-plugin/plugin.json'] = json_bytes(identity)
    entries['skills/agent-workflow/SKILL.md'] = (
        '---\nname: agent-workflow\n'
        'description: Apply concise communication, scope control, verification, and optional subagent selection when a user requests this workflow or uses the bundled AI Command Engine policy.\n'
        '---\n\n'
    ).encode('utf-8') + policy

    skill = root / 'ai-command-engine'
    for path in skill.rglob('*'):
        if not include_skill_file(path, skill):
            continue
        relative = path.relative_to(skill)
        if path.is_symlink() or not path.resolve().is_relative_to(skill.resolve()):
            raise ValueError(f'Skill resource escapes its source directory: {relative}')
        if any(part.startswith('.') for part in relative.parts):
            continue
        entries[SKILL_PREFIX + relative.as_posix()] = path.read_bytes()

    entries[SKILL_PREFIX + POLICY_REFERENCE] = policy
    for entry, instruction in {
        'SKILL.md': 'Read and follow the [packaged collaboration rules](references/agent-workflow.md) when using this skill.',
        'SKILL_ZH.md': '使用本技能时，先读取并遵守[包内通用协作规则](references/agent-workflow.md)。',
    }.items():
        name = SKILL_PREFIX + entry
        text = entries[name].decode('utf-8').replace('\r\n', '\n')
        heading = '# AI Command Engine\n\n'
        if text.count(heading) != 1:
            raise ValueError(f'Unexpected skill entry structure: {entry}')
        entries[name] = text.replace(heading, heading + instruction + '\n\n', 1).encode('utf-8')
    return entries


def verify_entries(entries: dict[str, bytes]) -> None:
    required = (
        'SKILL.md', 'SKILL_ZH.md', 'VERSION', 'package-lock.json', 'scripts/start-proxy.ps1',
        'scripts/command-proxy.mjs', 'scripts/check-schematic.mjs', 'scripts/check-pcb-placement.mjs',
        'scripts/check-pcb-stage.mjs', 'references/pcb-06-verify-and-save.md',
        'references/zh/pcb-06-verify-and-save.md', POLICY_REFERENCE,
    )
    for name in required:
        if not entries.get(SKILL_PREFIX + name):
            raise ValueError(f'Missing required skill resource: {name}')

    refs = (
        'README.md', 'README_ZH.md', SKILL_PREFIX + 'SKILL.md', SKILL_PREFIX + 'SKILL_ZH.md',
    )
    for name in refs:
        directory = name.rpartition('/')[0]
        for destination in re.findall(r'\]\(([^)\n]+)\)', entries[name].decode('utf-8')):
            local = destination.split('#', 1)[0]
            if not local or '://' in local:
                continue
            key = '/'.join(part for part in (directory, local) if part)
            if key not in entries:
                raise ValueError(f'Missing linked resource from {name}: {destination}')

    if entries['AGENTS.md'] != entries[SKILL_PREFIX + POLICY_REFERENCE]:
        raise ValueError('The policy copies have diverged')
    for name in ('ai-command-engine', 'agent-workflow'):
        entry = entries[f'skills/{name}/SKILL.md'].decode('utf-8')
        if not entry.startswith(f'---\nname: {name}\ndescription: '):
            raise ValueError(f'Invalid skill frontmatter: {name}')


def build_package(root: Path | None = None) -> tuple[Path, int, str]:
    root = root or Path(__file__).resolve().parents[1]
    entries = build_entries(root)
    verify_entries(entries)
    dist = root / 'dist'
    dist.mkdir(exist_ok=True)
    archive = dist / f'{PLUGIN_NAME}_v{PLUGIN_VERSION}_portable.zip'
    with ZipFile(archive, 'x', ZIP_DEFLATED) as package:
        for name, data in sorted(entries.items()):
            package.writestr(ZipInfo(name), data, compress_type=ZIP_DEFLATED, compresslevel=9)
    with ZipFile(archive) as package:
        if package.testzip() is not None or any(package.read(name) != data for name, data in entries.items()):
            raise ValueError('ZIP readback differs from package inputs')
    digest = sha256(archive.read_bytes()).hexdigest()
    archive.with_suffix('.sha256.txt').write_text(f'{digest}  {archive.name}\n', encoding='utf-8')
    return archive, len(entries), digest


if __name__ == '__main__':
    archive, count, digest = build_package()
    print(f'{archive.name}: {count} files, SHA-256 {digest}')
