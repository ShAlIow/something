param($server, $key, $tls)

if ($PSVersionTable.PSVersion.Major -lt 5) {
    Write-Host "Require PS >= 5, your PSVersion:" $PSVersionTable.PSVersion.Major -BackgroundColor DarkGreen -ForegroundColor White
    Write-Host "Refer to the community article and install manually! https://nyko.me/2020/12/13/nezha-windows-client.html" -BackgroundColor DarkRed -ForegroundColor Green
    exit
}

$agentrepo = "nezhahq/agent"
$agenttag = "v0.20.4"

if ([System.Environment]::Is64BitOperatingSystem) {
    if ($env:PROCESSOR_ARCHITECTURE -eq "ARM64") {
        $file = "nezha-agent_windows_arm64.zip"
    } else {
        $file = "nezha-agent_windows_amd64.zip"
    }
} else {
    $file = "nezha-agent_windows_386.zip"
}

# ... (Your existing code for checking and removing existing installation) ...

# Region determination (unchanged) ...

# Construct the download URL using string interpolation
if ($region -ne "CN") {
    $download = "https://github.com/$agentrepo/releases/download/$agenttag/$file"
    Write-Host "Location: $region, connect directly!" -BackgroundColor DarkRed -ForegroundColor Green
} else {
    $download = "https://gitee.com/naibahq/agent/releases/download/$agenttag/$file"
    Write-Host "Location: CN, use mirror address" -BackgroundColor DarkRed -ForegroundColor Green
}
Write-Host "Download URL: $download" # Added for debugging

# Download and install (unchanged, except using the correctly constructed $download)
Invoke-WebRequest $download -OutFile "C:\nezha.zip"
Expand-Archive "C:\nezha.zip" -DestinationPath "C:\temp" -Force
if (!(Test-Path "C:\nezha")) { New-Item -Path "C:\nezha" -Type Directory }
Move-Item -Path "C:\temp\nezha-agent.exe" -Destination "C:\nezha\nezha-agent.exe"
Remove-Item "C:\nezha.zip"
Remove-Item "C:\temp" -Recurse
C:\nezha\nezha-agent.exe service install -s $server -p $key $tls

Write-Host "Enjoy It!" -BackgroundColor DarkGreen -ForegroundColor Red
