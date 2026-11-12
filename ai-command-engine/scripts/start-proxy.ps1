[CmdletBinding()]
param([int]$Port = 0, [string]$DataDirectory)

$ErrorActionPreference = 'Stop'
$PortStart = 49720
$PortEnd = 49729
$ExplicitPort = $PSBoundParameters.ContainsKey('Port')
$RequestedPort = if ($ExplicitPort) { $Port } else { $null }
$script:BindingErrors = @()
trap {
    $result = @{ ok = $false; status = 'error'; port = $RequestedPort; error = $_.Exception.Message }
    if ($script:BindingErrors.Count -gt 0) {
        $result.bindingErrors = $script:BindingErrors
        if ($script:BindingErrors.Count -eq 1) {
            $result.code = $script:BindingErrors[0].code
            $result.errno = $script:BindingErrors[0].errno
            $result.syscall = $script:BindingErrors[0].syscall
            $result.message = $script:BindingErrors[0].message
        }
    }
    $result | ConvertTo-Json -Compress -Depth 4
    exit 1
}

if ($ExplicitPort -and ($Port -lt 1 -or $Port -gt 65535)) { throw 'Port must be between 1 and 65535.' }
if ([string]::IsNullOrWhiteSpace($DataDirectory)) { $stateDir = Join-Path ([Environment]::GetFolderPath('LocalApplicationData')) 'ai-command-engine' }
else { $stateDir = [System.IO.Path]::GetFullPath($DataDirectory) }
$skillDir = Split-Path -Parent $PSScriptRoot
$proxyPath = Join-Path $PSScriptRoot 'command-proxy.mjs'
$nodeModules = Join-Path $skillDir 'node_modules'
$ErrorLog = Join-Path $stateDir 'proxy-stderr.log'
$OutputLog = Join-Path $stateDir 'proxy-stdout.log'

function Get-ProxyHealth([int]$TargetPort) {
    $request = [System.Net.HttpWebRequest]::Create("http://127.0.0.1:$TargetPort/health")
    $request.Proxy = $null
    $request.Timeout = 400
    $request.ReadWriteTimeout = 400
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

function Get-CompatibleProxy {
    $ports = if ($ExplicitPort) { @($Port) } else { $PortStart..$PortEnd }
    foreach ($candidate in $ports) {
        $health = Get-ProxyHealth $candidate
        if ($health -and $health.ok -eq $true -and $health.service -eq 'ai-command-proxy' -and $health.lifecycleProtocol -eq 1 -and $health.moduleLibraryProtocol -eq 1 -and ($null -eq $health.port -or $health.port -eq $candidate)) {
            return @{ port = $candidate; health = $health }
        }
        if ($ExplicitPort -and $health) {
            throw "Port $candidate is occupied by an incompatible service. No process was changed."
        }
    }
    return $null
}

function Write-Reused($Proxy) {
    $result = @{ ok = $true; status = 'reused'; port = $Proxy.port; baseUrl = "http://127.0.0.1:$($Proxy.port)" }
    if ($Proxy.health.pid) { $result.pid = $Proxy.health.pid }
    $result | ConvertTo-Json -Compress
}

# Reuse needs no local Node installation or runtime files. Repeat this scan under
# the mutex below before starting to close the concurrent-cold-start race.
$existing = Get-CompatibleProxy
if ($existing) { Write-Reused $existing; return }

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

# Starts on any port in the discovered range share a lock. An explicit port outside
# that range has its own lock, preserving callers that deliberately pin a service.
$mutexName = if (-not $ExplicitPort -or ($Port -ge $PortStart -and $Port -le $PortEnd)) { 'Local\AICommandProxyStartRange' } else { "Local\AICommandProxyStart$Port" }
$mutex = New-Object System.Threading.Mutex($false, $mutexName)
$locked = $false
$process = $null
$oldPort = [Environment]::GetEnvironmentVariable('PORT', 'Process')
$oldDataDir = [Environment]::GetEnvironmentVariable('AI_COMMAND_PROXY_DATA_DIR', 'Process')
try {
    try { $locked = $mutex.WaitOne(7000) } catch [System.Threading.AbandonedMutexException] { $locked = $true }
    if (-not $locked) { throw 'Another proxy startup is still in progress. Check the health endpoints and try again.' }

    $existing = Get-CompatibleProxy
    if ($existing) { Write-Reused $existing; return }

    if ($ExplicitPort) { [Environment]::SetEnvironmentVariable('PORT', [string]$Port, 'Process') }
    else { [Environment]::SetEnvironmentVariable('PORT', $null, 'Process') }
    [Environment]::SetEnvironmentVariable('AI_COMMAND_PROXY_DATA_DIR', $stateDir, 'Process')
    $bootstrap = Join-Path $PSScriptRoot 'bootstrap-proxy.mjs'
    $process = Start-Process -FilePath $node.Source -ArgumentList ('"{0}"' -f $bootstrap) -WorkingDirectory $skillDir -WindowStyle Hidden -PassThru

    $ports = if ($ExplicitPort) { @($Port) } else { $PortStart..$PortEnd }
    for ($i = 0; $i -lt 32; $i++) {
        Start-Sleep -Milliseconds 250
        foreach ($candidate in $ports) {
            $health = Get-ProxyHealth $candidate
            if ($health -and $health.ok -eq $true -and $health.service -eq 'ai-command-proxy' -and $health.lifecycleProtocol -eq 1 -and $health.moduleLibraryProtocol -eq 1 -and ($null -eq $health.port -or $health.port -eq $candidate)) {
                if ($health.pid -eq $process.Id -and -not $process.HasExited) {
                    @{ ok = $true; status = 'started'; pid = $process.Id; port = $candidate; baseUrl = "http://127.0.0.1:$candidate"; dataDirectory = $stateDir } | ConvertTo-Json -Compress
                    exit 0
                }
                if ($health.pid -and -not $process.HasExited) { Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue }
                Write-Reused @{ port = $candidate; health = $health }
                return
            }
        }
        if ($process.HasExited) { break }
    }

    $detail = if (Test-Path -LiteralPath $ErrorLog) { (Get-Content -LiteralPath $ErrorLog -Tail 12 -ErrorAction SilentlyContinue) -join ' ' } else { '' }
    if (-not $detail -and (Test-Path -LiteralPath $OutputLog)) { $detail = (Get-Content -LiteralPath $OutputLog -Tail 12 -ErrorAction SilentlyContinue) -join ' ' }
    foreach ($match in [regex]::Matches($detail, 'port=(?<port>\d+) code=(?<code>\S+) errno=(?<errno>\S+) syscall=(?<syscall>\S+) message=(?<message>[^;\r\n]+?)(?:\s{2,}at |;|\r?\n|$)')) {
        $script:BindingErrors += @{
            port = [int]$match.Groups['port'].Value
            code = $match.Groups['code'].Value
            errno = $match.Groups['errno'].Value
            syscall = $match.Groups['syscall'].Value
            message = $match.Groups['message'].Value
        }
    }
    $failurePort = if ($ExplicitPort) { $Port } else { $null }
    $portMessage = if ($null -ne $failurePort) { " on port $failurePort" } else { '' }
    if ($process -and -not $process.HasExited) { Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue }
    throw "AI Command Proxy did not become healthy$portMessage; its own new process was stopped after the startup check ended. $detail"
}
finally {
    [Environment]::SetEnvironmentVariable('PORT', $oldPort, 'Process')
    [Environment]::SetEnvironmentVariable('AI_COMMAND_PROXY_DATA_DIR', $oldDataDir, 'Process')
    if ($locked) { $mutex.ReleaseMutex() }
    $mutex.Dispose()
}
