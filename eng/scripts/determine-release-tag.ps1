# Read the package.json file
$packageJsonPath = "$PSScriptRoot/../../package.json"
$packageJson = Get-Content $packageJsonPath -Raw | ConvertFrom-Json

# Function to check if a version is non-GA
function Is-NonGA($version) {
    return $version -match "-(alpha|beta|rc|pre)"
}

$pkgVersion = $packageJson.version

if (Is-NonGA($pkgVersion)) {
    Write-Host "##vso[task.setvariable variable=Tag;]beta"
}
else {
    Write-Host "##vso[task.setvariable variable=Tag;]latest"
}

