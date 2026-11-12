# -*- coding: utf-8 -*-
"""eda.py — AI Command Engine 指令发送助手
用法：
    from eda import cmd, connections
    current_connections = connections()  # 每次先查 GET /connections，再选定本次要操作的窗口
    target = 'INSTANCE_ID_FROM_CURRENT_CONNECTIONS_RESPONSE'
    print(cmd('project.getInfo', instance_id=target))
    print(cmd('schematic.placeDevice', {'lcscId': 'C25744', 'x': 300, 'y': 300}, instance_id=target))
也可命令行：python eda.py --instance-id INSTANCE_ID project.getInfo '{"x":1}'
"""
import argparse
import json
import os
import urllib.request

PORT_START = 49720
PORT_END = 49729
EXPLICIT_BASE = os.environ.get('AI_COMMAND_PROXY_URL', '').rstrip('/')


def _read_json(url, timeout=10, request=None):
    with urllib.request.urlopen(request or url, timeout=timeout) as resp:
        return json.loads(resp.read().decode('utf-8'))


def _find_proxy():
    """Find one healthy local proxy endpoint. Never resends a command to another port."""
    bases = [EXPLICIT_BASE] if EXPLICIT_BASE else [f'http://localhost:{port}' for port in range(PORT_START, PORT_END + 1)]
    failures = []
    for base in bases:
        try:
            info = _read_json(base + '/health', timeout=0.5)
        except Exception as error:
            failures.append(f'{base}: {error}')
            continue
        if isinstance(info, dict) and info.get('ok') is True and info.get('service') == 'ai-command-proxy' and info.get('lifecycleProtocol') == 1 and info.get('moduleLibraryProtocol') == 1:
            return base, info
        failures.append(f'{base}: incompatible health response')
    message = 'No compatible AI Command Proxy was found.'
    if failures:
        message += ' ' + '; '.join(failures)
    raise ConnectionError(message)


def health():
    """代理与扩展在线状态；extension 字段是当前选中的 EDA 窗口实例。"""
    return _find_proxy()[1]


def connections():
    """所有已连接的 EDA 窗口实例（多开窗口时排查用）。"""
    base, _ = _find_proxy()
    return _read_json(base + '/connections')


def select(instance_id):
    """切换代理的全局所选实例；不能替代每条请求的 instance_id 路由。"""
    base, _ = _find_proxy()
    req = urllib.request.Request(
        base + '/select',
        data=json.dumps({'instanceId': instance_id}).encode('utf-8'),
        headers={'Content-Type': 'application/json'},
    )
    return _read_json(req)


def _require_instance_id(instance_id):
    if not isinstance(instance_id, str) or not instance_id.strip():
        raise ValueError('instance_id must be a non-empty string; call connections() and choose a connected instance')


def cmd(name, params=None, timeout=120, *, instance_id):
    """发送一条指令，返回 {ok, cmd, data|error, durationMs}。失败时抛出带 message 的异常。"""
    _require_instance_id(instance_id)
    base, _ = _find_proxy()
    req = urllib.request.Request(
        base + '/command',
        data=json.dumps({'instanceId': instance_id, 'cmd': name, 'params': params or {}}).encode('utf-8'),
        headers={'Content-Type': 'application/json'},
    )
    result = _read_json(req, timeout=timeout)
    if not result.get('ok'):
        raise RuntimeError(json.dumps(result.get('error'), ensure_ascii=False))
    return result


def macro(steps, stop_on_error=False, timeout=300, *, instance_id):
    """发送宏指令。steps: [{'id'?, 'cmd', 'params'?}, ...]；返回各步结果列表。"""
    _require_instance_id(instance_id)
    base, _ = _find_proxy()
    req = urllib.request.Request(
        base + '/command',
        data=json.dumps({'instanceId': instance_id, 'cmd': 'macro', 'params': {'stopOnError': stop_on_error, 'steps': steps}}).encode('utf-8'),
        headers={'Content-Type': 'application/json'},
    )
    result = _read_json(req, timeout=timeout)
    if not result.get('ok'):
        raise RuntimeError(json.dumps(result.get('error'), ensure_ascii=False))
    return result.get('data', {}).get('steps', [])


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Send an AI Command Engine request to a specific connected EDA instance.')
    parser.add_argument('--instance-id', required=True, help='Target ID from GET /connections')
    parser.add_argument('name', nargs='?', default='project.getInfo', help='Command name (default: project.getInfo)')
    parser.add_argument('params', nargs='?', help='Command parameters as JSON')
    args = parser.parse_args()
    params = json.loads(args.params) if args.params is not None else None
    print(json.dumps(cmd(args.name, params, instance_id=args.instance_id), ensure_ascii=False, indent=2))
