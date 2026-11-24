[CmdletBinding()]
param(
    [switch]$Install,
    [Parameter(Mandatory = $true)][string]$StateDirectory,
    [Parameter(Mandatory = $true)][string]$JobDirectory,
    [string]$PythonExe
)

$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
$ScriptDirectory = Split-Path -Parent $MyInvocation.MyCommand.Path
$LockFile = Join-Path $ScriptDirectory 'kirouting-runtime-lock.json'
$PatchManifestFile = Join-Path $ScriptDirectory 'kirouting-runtime-patches.json'
$PatchScriptFile = Join-Path $ScriptDirectory 'patch-kirouting.py'
$StateDirectory = [IO.Path]::GetFullPath($StateDirectory)
$JobDirectory = [IO.Path]::GetFullPath($JobDirectory)
$JobsRoot = [IO.Path]::GetFullPath((Join-Path $StateDirectory 'kirouting\jobs'))
if (-not $JobDirectory.StartsWith($JobsRoot + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)) {
    throw 'JobDirectory must be inside the service-owned kirouting jobs directory.'
}
if (-not (Test-Path -LiteralPath $JobDirectory -PathType Container)) {
    throw 'The service must create JobDirectory before starting the installer.'
}

$ResultFile = Join-Path $JobDirectory 'result.json'
$ProgressFile = Join-Path $JobDirectory 'progress.json'
$Lock = $null
$PatchManifest = $null
$PlatformLock = $null
$ToolsRoot = Join-Path $StateDirectory 'tools'
$FinalDirectory = Join-Path $ToolsRoot 'kirouting'
$TempDirectory = Join-Path $ToolsRoot ('.kirouting-install-' + [guid]::NewGuid().ToString('N'))

function Write-JsonAtomically([string]$Path, $Value) {
    $temporary = $Path + '.' + [guid]::NewGuid().ToString('N') + '.tmp'
    $json = $Value | ConvertTo-Json -Depth 8 -Compress
    [IO.File]::WriteAllText($temporary, $json + "`n", [Text.UTF8Encoding]::new($false))
    if (Test-Path -LiteralPath $Path -PathType Leaf) {
        $backup = $Path + '.' + [guid]::NewGuid().ToString('N') + '.bak'
        [IO.File]::Replace($temporary, $Path, $backup)
        if (Test-Path -LiteralPath $backup) { Remove-Item -LiteralPath $backup -Force }
    }
    else {
        [IO.File]::Move($temporary, $Path)
    }
}

function Set-Progress([string]$Step, [string]$Message) {
	$state = if ($Step -eq 'complete') { 'completed' } else { 'running' }
	Write-JsonAtomically $ProgressFile @{ state = $state; step = $Step; message = $Message; updatedAt = [DateTimeOffset]::UtcNow.ToString('o') }
}

function Complete-Result([string]$Status, [string]$Message, [int]$ExitCode, $Data = $null) {
    $result = @{ ok = ($Status -eq 'completed'); status = $Status; message = $Message }
    if ($null -ne $Data) { $result.data = $Data }
    Write-JsonAtomically $ResultFile $result
    Write-Output ($result | ConvertTo-Json -Depth 8 -Compress)
    exit $ExitCode
}

function Get-PythonVersion([string]$Path) {
    if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) { return $null }
    try { $output = & $Path --version 2>&1 }
    catch { return $null }
    if ($LASTEXITCODE -ne 0) { return $null }
    $match = [regex]::Match(($output -join ' '), 'Python\s+(\d+\.\d+\.\d+)')
    if (-not $match.Success) { return $null }
    return $match.Groups[1].Value
}

function Get-InstalledPythonCandidates {
    $candidates = @()
    $launcher = Get-Command 'py.exe' -CommandType Application -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($launcher) {
        $entries = & $launcher.Source -0p 2>$null
        foreach ($entry in $entries) {
            $match = [regex]::Match([string]$entry, '(?<path>[A-Za-z]:\\.*python(?:w)?\.exe)\s*$')
            if ($match.Success) { $candidates += $match.Groups['path'].Value }
        }
    }
    $python = Get-Command 'python.exe' -CommandType Application -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($python) { $candidates += $python.Source }
    $seen = @{}
    $result = @()
    foreach ($candidate in $candidates) {
        $full = [IO.Path]::GetFullPath($candidate)
        $key = $full.ToLowerInvariant()
        if ($seen.ContainsKey($key)) { continue }
        $seen[$key] = $true
        $version = Get-PythonVersion $full
        if ($version) { $result += @{ path = $full; version = $version } }
    }
    return ,$result
}

if (-not $Install) {
    Complete-Result 'confirmationRequired' 'Run this optional installer only after an explicit user choice.' 21
}
if (-not (Test-Path -LiteralPath $LockFile -PathType Leaf) -or -not (Test-Path -LiteralPath $PatchManifestFile -PathType Leaf) -or -not (Test-Path -LiteralPath $PatchScriptFile -PathType Leaf)) {
    Complete-Result 'failed' 'The local KiRouting lock or versioned adapter patch files are missing.' 1
}
try {
    $Lock = Get-Content -LiteralPath $LockFile -Raw -Encoding UTF8 | ConvertFrom-Json
    $PatchManifest = Get-Content -LiteralPath $PatchManifestFile -Raw -Encoding UTF8 | ConvertFrom-Json
    $PlatformLock = $Lock.platforms.'win32-x64'
} catch {
    Complete-Result 'failed' 'The local KiRouting lock or adapter patch manifest is invalid JSON.' 1
}
if ($env:OS -ne 'Windows_NT' -or [Environment]::Is64BitOperatingSystem -ne $true) {
    Complete-Result 'unsupportedPlatform' 'The locked prebuilt router package is currently prepared for Windows x64.' 22
}
if (($PatchManifest.upstream.version -ne $Lock.version) -or (-not $PatchManifest.revision)) {
    Complete-Result 'failed' 'The versioned KiRouting runtime patch manifest or patch script is missing or does not match the pinned upstream version.' 1
}
if (Test-Path -LiteralPath $FinalDirectory) {
    $markerPath = Join-Path $FinalDirectory 'install-owner.json'
    $ownedPartial = $false
    if (Test-Path -LiteralPath $markerPath -PathType Leaf) {
        try {
            $marker = Get-Content -LiteralPath $markerPath -Raw -Encoding UTF8 | ConvertFrom-Json
            $markerJob = [IO.Path]::GetFullPath([string]$marker.jobDirectory)
            $ownedPartial = ($marker.releaseSha256 -eq $Lock.releaseSha256) -and $markerJob.StartsWith($JobsRoot + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)
        } catch { $ownedPartial = $false }
    }
    if (-not $ownedPartial) { Complete-Result 'failed' "The tool directory already exists and is not a recognized partial install; it was left untouched: $FinalDirectory" 1 }
    $resolvedFinal = [IO.Path]::GetFullPath((Resolve-Path -LiteralPath $FinalDirectory).Path)
    $resolvedTools = [IO.Path]::GetFullPath((Resolve-Path -LiteralPath $ToolsRoot).Path)
    if (-not $resolvedFinal.StartsWith($resolvedTools + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)) { Complete-Result 'failed' 'The recognized partial install resolved outside the tools directory.' 1 }
    Remove-Item -LiteralPath $resolvedFinal -Recurse -Force
}

$allPython = Get-InstalledPythonCandidates
$selectedPython = $null
if ($PythonExe) {
    $pythonFull = [IO.Path]::GetFullPath($PythonExe)
    $version = Get-PythonVersion $pythonFull
    if (-not $version) { Complete-Result 'needsPython' "The selected Python executable could not be run: $pythonFull" 23 @{ availableCandidates = $allPython; testedPython = $PlatformLock.python.version; minimumAbi = '3.9' } }
    if (-not $version.StartsWith('3.12.')) {
        Complete-Result 'needsPython' "The selected Python $version is outside the currently hash-locked installation set. The Rust extension uses abi3 from Python 3.9; this install bundle has verified dependency wheels for Python 3.12." 23 @{ selected = @{ path = $pythonFull; version = $version }; availableCandidates = $allPython; testedPython = $PlatformLock.python.version; minimumAbi = '3.9' }
    }
    $selectedPython = @{ path = $pythonFull; version = $version }
}
else {
    $matching = @($allPython | Where-Object { $_.version.StartsWith('3.12.') })
    if ($matching.Count -ne 1) {
        $reason = if ($allPython.Count -eq 0) { 'No runnable Python interpreter was found.' } elseif ($matching.Count -gt 1) { 'More than one Python 3.12 interpreter was found; select one with -PythonExe.' } else { 'A Python interpreter was found, but this locked dependency bundle has verified Windows wheels only for Python 3.12.' }
        Complete-Result 'needsPython' "$reason The Rust extension uses abi3 (Python 3.9+); the available hash-locked setup bundle is currently tested for Python 3.12." 23 @{ availableCandidates = $allPython; testedPython = $PlatformLock.python.version; minimumAbi = '3.9'; explicitPythonOption = '-PythonExe' }
    }
    $selectedPython = $matching[0]
}

if ($selectedPython.version -notlike '3.12.*') {
    Complete-Result 'needsPython' "The selected Python version $($selectedPython.version) does not match the locked cp312 wheel set." 23 @{ selected = $selectedPython; testedPython = '3.12'; minimumAbi = '3.9' }
}

New-Item -ItemType Directory -Force -Path $ToolsRoot | Out-Null
New-Item -ItemType Directory -Force -Path $TempDirectory | Out-Null
try {
    Set-Progress 'download' 'Downloading the pinned KiRouting release.'
    $archivePath = Join-Path $TempDirectory 'KiCadRoutingTools-0.18.0.zip'
    Invoke-WebRequest -Uri $Lock.releaseUrl -OutFile $archivePath -UseBasicParsing
    $archiveHash = (Get-FileHash -LiteralPath $archivePath -Algorithm SHA256).Hash.ToLowerInvariant()
    if ($archiveHash -ne $Lock.releaseSha256) { throw "Router release checksum mismatch: $archiveHash" }

    Set-Progress 'verify-release' 'Checking release metadata and source version.'
    $releaseRoot = Join-Path $TempDirectory 'release'
    Expand-Archive -LiteralPath $archivePath -DestinationPath $releaseRoot -Force
    $plugins = Join-Path $releaseRoot 'plugins'
    $versionFile = Join-Path $plugins 'VERSION'
    if (-not (Test-Path -LiteralPath $versionFile -PathType Leaf)) { throw 'The pinned release did not contain plugins/VERSION.' }
    $versionText = (Get-Content -LiteralPath $versionFile -Raw -Encoding UTF8).Trim()
    if ($versionText -ne $Lock.version) { throw "Router source version mismatch: $versionText" }
    $upstreamLicense = Join-Path $plugins 'LICENSE'
    if (-not (Test-Path -LiteralPath $upstreamLicense -PathType Leaf)) { throw 'The upstream MIT license is missing from the release.' }

    Set-Progress 'download-dependencies' 'Downloading fixed Windows x64 wheels.'
    $wheelDirectory = Join-Path $TempDirectory 'wheels'
    New-Item -ItemType Directory -Force -Path $wheelDirectory | Out-Null
    $wheelPaths = @()
    foreach ($package in $PlatformLock.packages) {
        $wheel = Join-Path $wheelDirectory $package.filename
        Invoke-WebRequest -Uri $package.url -OutFile $wheel -UseBasicParsing
        $hash = (Get-FileHash -LiteralPath $wheel -Algorithm SHA256).Hash.ToLowerInvariant()
        if ($hash -ne $package.sha256) { throw "Wheel checksum mismatch for $($package.name): $hash" }
        $wheelPaths += $wheel
    }

    Set-Progress 'venv' 'Creating a project-local Python environment.'
    $stageDirectory = $FinalDirectory
    $stagePlugins = Join-Path $stageDirectory 'plugins'
    New-Item -ItemType Directory -Force -Path $stageDirectory | Out-Null
    Write-JsonAtomically (Join-Path $stageDirectory 'install-owner.json') @{ releaseSha256 = $Lock.releaseSha256; jobDirectory = $JobDirectory }
    Copy-Item -LiteralPath $plugins -Destination $stagePlugins -Recurse
    $sourceBinary = Join-Path $stagePlugins $PlatformLock.rustExtension.pathInRelease.Substring('plugins/'.Length).Replace('/', '\')
    $binaryHash = (Get-FileHash -LiteralPath $sourceBinary -Algorithm SHA256).Hash.ToLowerInvariant()
    if ($binaryHash -ne $PlatformLock.rustExtension.sha256) { throw "The embedded Rust extension checksum does not match the runtime lock: $binaryHash" }
    $importBinary = Join-Path (Split-Path -Parent $sourceBinary) 'grid_router.pyd'
    Copy-Item -LiteralPath $sourceBinary -Destination $importBinary

    $venvDirectory = Join-Path $stageDirectory '.venv'
    & $selectedPython.path -m venv $venvDirectory
    if ($LASTEXITCODE -ne 0) { throw 'Python failed to create the isolated venv.' }
    $venvPython = Join-Path $venvDirectory 'Scripts\python.exe'
    & $venvPython -m pip install --no-index --no-deps @wheelPaths
    if ($LASTEXITCODE -ne 0) { throw 'The fixed wheels could not be installed into the isolated venv.' }

    Set-Progress 'apply-adapters' 'Applying only the declared versioned adapter patch to the private runtime copy.'
    $patchOutput = & $venvPython $PatchScriptFile --tool-dir $stagePlugins 2>&1
    if ($LASTEXITCODE -ne 0) { throw "Versioned adapter patch failed: $($patchOutput -join ' ')" }
    try { $patchRecord = ($patchOutput -join "`n") | ConvertFrom-Json } catch { throw 'Versioned adapter patch did not return its integrity record.' }
    if ($patchRecord.revision -ne $PatchManifest.revision -or -not ($patchRecord.patches | Where-Object { $_.file -eq 'length_matching.py' -and $_.sha256 -eq $PatchManifest.patches[0].patchedSha256 })) {
        throw 'Versioned adapter patch record does not match the declared patched source checksum.'
    }

    Set-Progress 'verify-runtime' 'Verifying imports and the upstream ABI version.'
    $check = "import sys, numpy, scipy, shapely; sys.path.insert(0, r'$stagePlugins'); sys.path.insert(0, r'$(Join-Path $stagePlugins 'rust_router')'); import startup_checks; assert startup_checks.run_all_checks() == '$($Lock.platforms.'win32-x64'.rustExtensionVersion)'"
    & $venvPython -c $check
    if ($LASTEXITCODE -ne 0) { throw 'The isolated runtime failed its dependency or ABI check.' }

    Set-Progress 'install' 'Installing the verified runtime under user application data.'
    $runtime = @{
        schemaVersion = 1
        pythonExecutable = $venvPython
        toolDirectory = $stagePlugins
        version = $Lock.version
        rustExtensionVersion = $PlatformLock.rustExtensionVersion
        releaseSha256 = $Lock.releaseSha256
        binarySha256 = $PlatformLock.rustExtension.sha256
        pythonVersion = $selectedPython.version
        adapterPatchRevision = $patchRecord.revision
        patchManifestSha256 = (Get-FileHash -LiteralPath $PatchManifestFile -Algorithm SHA256).Hash.ToLowerInvariant()
        adapterPatches = $patchRecord.patches
    }
    $finalPlugins = $runtime.toolDirectory
    $finalRust = Join-Path $finalPlugins 'rust_router'
    $finalCheck = "import sys, numpy, scipy, shapely; sys.path.insert(0, r'$finalPlugins'); sys.path.insert(0, r'$finalRust'); import startup_checks; assert startup_checks.run_all_checks() == '$($Lock.platforms.'win32-x64'.rustExtensionVersion)'"
    & $runtime.pythonExecutable -c $finalCheck
    if ($LASTEXITCODE -ne 0) { throw 'The installed runtime failed verification at its final path.' }
    $finalPatchedHash = (Get-FileHash -LiteralPath (Join-Path $finalPlugins 'length_matching.py') -Algorithm SHA256).Hash.ToLowerInvariant()
    if ($finalPatchedHash -ne $PatchManifest.patches[0].patchedSha256) { throw 'The final runtime adapter source checksum changed after installation.' }
    Write-JsonAtomically (Join-Path $FinalDirectory 'runtime.json') $runtime
    Remove-Item -LiteralPath (Join-Path $FinalDirectory 'install-owner.json') -Force
    Set-Progress 'complete' 'The pinned optional routing runtime is ready.'
    Complete-Result 'completed' 'KiRouting was installed and verified in its isolated user environment.' 0 @{ runtimeFile = (Join-Path $FinalDirectory 'runtime.json'); pythonVersion = $selectedPython.version; routerVersion = $Lock.version; rustExtensionVersion = $PlatformLock.rustExtensionVersion; adapterPatchRevision = $patchRecord.revision; patchedSourceSha256 = $PatchManifest.patches[0].patchedSha256 }
}
catch {
    $message = $_.Exception.Message
    try { Complete-Result 'failed' $message 1 } catch { throw }
}
finally {
    if (Test-Path -LiteralPath $TempDirectory) {
        $resolvedTemp = [IO.Path]::GetFullPath((Resolve-Path -LiteralPath $TempDirectory).Path)
        $resolvedTools = [IO.Path]::GetFullPath((Resolve-Path -LiteralPath $ToolsRoot).Path)
        if ($resolvedTemp.StartsWith($resolvedTools + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)) {
            Remove-Item -LiteralPath $resolvedTemp -Recurse -Force -ErrorAction SilentlyContinue
        }
    }
}
