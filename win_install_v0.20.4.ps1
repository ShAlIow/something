# 获取服务器地址和密钥
param($server, $key, $tls)

if ($PSVersionTable.PSVersion.Major -lt 5) {
    Write-Host "Require PS >= 5, your PSVersion:" $PSVersionTable.PSVersion.Major -BackgroundColor DarkGreen -ForegroundColor White
    Write-Host "Refer to the community article and install manually! https://nyko.me/2020/12/13/nezha-windows-client.html" -BackgroundColor DarkRed -ForegroundColor Green
    exit
}

$agentrepo = "nezhahq/agent"
# 固定使用 v0.20.4 版本，不再获取最新版本
$agenttag = "v0.20.4"
# 选择对应的压缩包：x86, x64 或 arm64
if ([System.Environment]::Is64BitOperatingSystem) {
    if ($env:PROCESSOR_ARCHITECTURE -eq "ARM64") {
        $file = "nezha-agent_windows_arm64.zip"
    } else {
        $file = "nezha-agent_windows_amd64.zip"
    }
} else {
    $file = "nezha-agent_windows_386.zip"
}

# 如果你不想自动更新，则注释或删除下面这段代码
<#
if (Test-Path "C:\nezha\nezha-agent.exe") {
    Write-Host "Nezha monitoring already exists, delete and reinstall" -BackgroundColor DarkGreen -ForegroundColor White
    C:\nezha\nezha-agent.exe service uninstall
    Remove-Item "C:\nezha" -Recurse
}
#>

# Region 判断（根据 IP 查询所在区域，决定下载地址）
$ipapi = ""
$region = "Unknown"
foreach ($url in ("https://dash.cloudflare.com/cdn-cgi/trace", "https://developers.cloudflare.com/cdn-cgi/trace", "https://1.0.0.1/cdn-cgi/trace")) {
    try {
        $ipapi = Invoke-RestMethod -Uri $url -TimeoutSec 5 -UseBasicParsing
        if ($ipapi -match "loc=(\w+)") {
            $region = $Matches[1]
            break
        }
    }
    catch {
        Write-Host "Error occurred while querying $url : $_"
    }
}
echo $ipapi

if ($region -ne "CN") {
    $download = "https://github.com/$agentrepo/releases/download/$agenttag/$file"
    Write-Host "Location: $region, connect directly!" -BackgroundColor DarkRed -ForegroundColor Green
} else {
    $download = "https://gitee.com/naibahq/agent/releases/download/$agenttag/$file"
    Write-Host "Location: CN, use mirror address" -BackgroundColor DarkRed -ForegroundColor Green
}
echo $download

# 下载压缩包到 C:\nezha.zip
Invoke-WebRequest $download -OutFile "C:\nezha.zip"

# 解压
Expand-Archive "C:\nezha.zip" -DestinationPath "C:\temp" -Force
if (!(Test-Path "C:\nezha")) { New-Item -Path "C:\nezha" -Type Directory }

# 移动文件
Move-Item -Path "C:\temp\nezha-agent.exe" -Destination "C:\nezha\nezha-agent.exe"

# 清理临时文件
Remove-Item "C:\nezha.zip"
Remove-Item "C:\temp" -Recurse

# 安装服务
C:\nezha\nezha-agent.exe service install -s $server -p $key $tls

Write-Host "Enjoy It!" -BackgroundColor DarkGreen -ForegroundColor Red