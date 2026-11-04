[CmdletBinding()]
param([int]$Port = 49720, [string]$DataDirectory)

$ErrorActionPreference = 'Stop'
trap {
    @{ ok = $false; status = 'error'; port = $Port; error = $_.Exception.Message } | ConvertTo-Json -Compress
    exit 1
}
if ([string]::IsNullOrWhiteSpace($DataDirectory)) { $stateDir = Join-Path ([Environment]::GetFolderPath('LocalApplicationData')) 'ai-command-engine' }
else { $stateDir = [System.IO.Path]::GetFullPath($DataDirectory) }
$skillDir = Split-Path -Parent $PSScriptRoot
$proxyPath = Join-Path $PSScriptRoot 'command-proxy.mjs'
$nodeModules = Join-Path $skillDir 'node_modules'
$ErrorLog = Join-Path $stateDir 'proxy-stderr.log'
$OutputLog = Join-Path $stateDir 'proxy-stdout.log'

if ($Port -lt 1 -or $Port -gt 65535) { throw 'Port must be between 1 and 65535.' }
function Get-ProxyHealth {
    $request = [System.Net.HttpWebRequest]::Create("http://127.0.0.1:$Port/health")
    $request.Proxy = $null
    $request.Timeout = 1500
    $request.ReadWriteTimeout = 1500
    try {
        $response = $request.GetResponse()
        try {
            $reader = New-Object System.IO.StreamReader($response.GetResponseStream())
            try { return ($reader.ReadToEnd() | ConvertFrom-Json) }
            finally { $reader.Dispose() }
        }
        finally { $response.Dispose() }
    }
    catch { return $null }
}

function Test-PortListening {
    $probe = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, $Port)
    try { $probe.Start(); return $false }
    catch { return $true }
    finally { $probe.Stop() }
}

$health = Get-ProxyHealth
if ($null -ne $health) {
    if ($health.ok -eq $true -and $health.service -eq 'ai-command-proxy' -and $health.lifecycleProtocol -eq 1) {
        @{ ok = $true; status = 'reused'; port = $Port } | ConvertTo-Json -Compress
        exit 0
    }
    throw "Port $Port is occupied by an incompatible service. No process was changed."
}
if (Test-PortListening) { throw "Port $Port is listening but did not provide a valid AI Command Proxy health response. No process was changed." }

$node = Get-Command node.exe -CommandType Application -ErrorAction SilentlyContinue | Select-Object -First 1
if (-not $node) { throw 'Node.js is missing. Install Node.js 20.17.0 or newer, then try again.' }
$nodeVersion = (& $node.Source --version).TrimStart('v')
$versionParts = $nodeVersion.Split('.')
if ([int]$versionParts[0] -lt 20 -or ([int]$versionParts[0] -eq 20 -and [int]$versionParts[1] -lt 17)) {
    throw 'Node.js 20.17.0 or newer is required.'
}
if (-not (Test-Path -LiteralPath (Join-Path $nodeModules 'ws\package.json') -PathType Leaf)) {
    throw 'Proxy dependencies are missing. In the skill folder, run npm ci once, then start the proxy again.'
}
if (-not (Test-Path -LiteralPath $proxyPath -PathType Leaf)) { throw 'Skill proxy file is missing.' }
New-Item -ItemType Directory -Force -Path $stateDir | Out-Null

$mutex = New-Object System.Threading.Mutex($false, "Local\AICommandProxyStart$Port")
$locked = $false
$process = $null
try {
    try { $locked = $mutex.WaitOne(0) } catch [System.Threading.AbandonedMutexException] { $locked = $true }
    if (-not $locked) {
        for ($i = 0; $i -lt 20; $i++) {
            Start-Sleep -Milliseconds 250
            $health = Get-ProxyHealth
            if ($health -and $health.ok -eq $true -and $health.service -eq 'ai-command-proxy' -and $health.lifecycleProtocol -eq 1) {
                @{ ok = $true; status = 'reused'; port = $Port } | ConvertTo-Json -Compress
                exit 0
            }
        }
        throw 'Another proxy startup is still in progress. Check the proxy health endpoint and retry if needed.'
    }

    $health = Get-ProxyHealth
    if ($health) {
        if ($health.ok -eq $true -and $health.service -eq 'ai-command-proxy' -and $health.lifecycleProtocol -eq 1) {
            @{ ok = $true; status = 'reused'; port = $Port } | ConvertTo-Json -Compress
            exit 0
        }
        throw "Port $Port is occupied by an incompatible service. No process was changed."
    }
    if (Test-PortListening) { throw "Port $Port is listening but did not provide a valid AI Command Proxy health response. No process was changed." }

    $oldPort = $env:PORT
    $oldDataDir = $env:AI_COMMAND_PROXY_DATA_DIR
    try {
        $env:PORT = [string]$Port
        $env:AI_COMMAND_PROXY_DATA_DIR = $stateDir
        $bootstrap = Join-Path $PSScriptRoot 'bootstrap-proxy.mjs'
        $process = Start-Process -FilePath $node.Source -ArgumentList ('"{0}"' -f $bootstrap) -WorkingDirectory $skillDir -WindowStyle Hidden -PassThru
    }
    finally {
        $env:PORT = $oldPort
        $env:AI_COMMAND_PROXY_DATA_DIR = $oldDataDir
    }

    for ($i = 0; $i -lt 24; $i++) {
        Start-Sleep -Milliseconds 250
        $health = Get-ProxyHealth
        if ($health -and $health.ok -eq $true -and $health.service -eq 'ai-command-proxy' -and $health.lifecycleProtocol -eq 1) {
            if ($health.pid -eq $process.Id -and -not $process.HasExited) {
                @{ ok = $true; status = 'started'; pid = $process.Id; port = $Port; dataDirectory = $stateDir } | ConvertTo-Json -Compress
            }
            else {
                if (-not $process.HasExited) { Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue }
                @{ ok = $true; status = 'reused'; port = $Port } | ConvertTo-Json -Compress
            }
            exit 0
        }
        if ($process.HasExited) { break }
    }

    if ($process -and -not $process.HasExited) {
        Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
    }
    $detail = if (Test-Path -LiteralPath $ErrorLog) { (Get-Content -LiteralPath $ErrorLog -Tail 12 -ErrorAction SilentlyContinue) -join ' ' } else { '' }
    if (-not $detail -and (Test-Path -LiteralPath $OutputLog)) { $detail = (Get-Content -LiteralPath $OutputLog -Tail 12 -ErrorAction SilentlyContinue) -join ' ' }
    throw "AI Command Proxy did not become healthy; its new process was stopped. $detail"
}
finally {
    if ($locked) { $mutex.ReleaseMutex() }
    $mutex.Dispose()
}

