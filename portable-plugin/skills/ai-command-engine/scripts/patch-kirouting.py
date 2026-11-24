"""Apply declared adapters to a private, hash-verified KiRouting installation."""
import argparse
import hashlib
import json
from pathlib import Path


def apply_patches(tool_dir, manifest_path=None):
    manifest_path = manifest_path or Path(__file__).with_name('kirouting-runtime-patches.json')
    spec = json.loads(manifest_path.read_text(encoding='utf-8'))
    tool_dir = tool_dir.resolve(strict=True)
    patches = spec.get('patches')
    if not isinstance(patches, list) or not patches:
        raise ValueError('Patch manifest must declare at least one file')
    results = []
    pending = []
    for patch in patches:
        target = (tool_dir / patch['file']).resolve(strict=True)
        if target.parent != tool_dir:
            raise ValueError('Patch target must be a declared file directly inside the private tool directory')
        content = target.read_bytes()
        before = hashlib.sha256(content).hexdigest()
        if before == patch['patchedSha256']:
            results.append({'file': patch['file'], 'status': 'already-applied', 'sha256': before})
            continue
        if before != patch['sourceSha256']:
            raise ValueError(f'{patch["file"]}: installed source differs from the reviewed release; no patch applied')
        newline = '\r\n' if b'\r\n' in content else '\n'
        replacements = patch.get('replacements')
        if replacements is None:
            replacements = [{'old': patch.get('old'), 'new': patch.get('new')}]
        if not isinstance(replacements, list) or not replacements:
            raise ValueError(f'{patch["file"]}: patch must contain at least one replacement')
        changed = content
        for replacement in replacements:
            if not isinstance(replacement, dict) or not isinstance(replacement.get('old'), str) or not isinstance(replacement.get('new'), str):
                raise ValueError(f'{patch["file"]}: replacement requires old/new strings')
            old = replacement['old'].replace('\n', newline).encode('utf-8')
            new = replacement['new'].replace('\n', newline).encode('utf-8')
            if not old or changed.count(old) != 1:
                raise ValueError(f'{patch["file"]}: expected one reviewed patch location')
            changed = changed.replace(old, new, 1)
        after = hashlib.sha256(changed).hexdigest()
        if after != patch['patchedSha256']:
            raise ValueError('Patched content does not match the declared adapter checksum')
        pending.append((target, changed))
        results.append({'file': patch['file'], 'status': 'applied', 'sourceSha256': before, 'sha256': after})
    temporaries = []
    try:
        for target, changed in pending:
            temporary = target.with_name(target.name + '.ace-patch-tmp')
            temporary.write_bytes(changed)
            temporaries.append((temporary, target))
        for temporary, target in temporaries:
            temporary.replace(target)
    except Exception:
        for temporary, _ in temporaries:
            temporary.unlink(missing_ok=True)
        raise
    record = {'schemaVersion': 1, 'revision': spec['revision'], 'patches': results}
    destination = tool_dir / 'ace-adapter-patches.json'
    temporary = destination.with_suffix('.tmp')
    temporary.write_text(json.dumps(record, indent=2) + '\n', encoding='utf-8')
    temporary.replace(destination)
    return record


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--tool-dir', type=Path, required=True)
    options = parser.parse_args()
    print(json.dumps(apply_patches(options.tool_dir), ensure_ascii=True))
