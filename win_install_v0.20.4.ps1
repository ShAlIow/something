# 获取服务器地址、密钥和 TLS 参数
param($server, $key, $tls)

# 确保 PowerShell 版本 >= 5
if ($PSVersionTable.PSVersion.Major -lt 5) {
    Write-Host "Require PS >= 5, your PSVersion:" $PSVersionTable.PSVersion.Major -BackgroundColor DarkGreen -ForegroundColor White
    Write-Host "Refer to the community article and install manually! https://nyko.me/2020/12/13/nezha-windows-client.html" -BackgroundColor DarkRed -ForegroundColor Green
    exit
}

# Nezha 监控 Agent 仓库
$agentrepo = "nezhahq/agent"

# 确保变量作用域正确
$global:agenttag = "v0.20.4"

# Debugging: 检查变量是否正确赋值
Write-Host "Debug: agenttag = $global:agenttag"

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

# 通过 Cloudflare API 查询 IP 位置
$ipapi = ""
$region = "Unknown"
foreach ($url in ("https://dash.cloudflare.com/cdn-cgi/trace"， "https://developers.cloudflare.com/cdn-cgi/trace"， "https://1.0.0.1/cdn-cgi/trace")) {
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

# 判断地区并选择下载源
if ($region -ne "CN") {
    $download = "https://github.com/$agentrepo/releases/download/$global:agenttag/$file"
    Write-Host "Location: $region, connect directly!" -BackgroundColor DarkRed -ForegroundColor Green
} else {
    $download = "https://gitee.com/naibahq/agent/releases/download/$global:agenttag/$file"
    Write-Host "Location: CN, use mirror address" -BackgroundColor DarkRed -ForegroundColor Green
}

# Debugging: 输出最终下载地址
Write-Host "Download URL: $download"

# 下载压缩包到 C:\nezha.zip
Invoke-WebRequest $download -OutFile "C:\nezha.zip"

# 解压到 C:\temp
Expand-Archive "C:\nezha.zip" -DestinationPath "C:\temp" -Force
if (!(Test-Path "C:\nezha")) { New-Item -Path "C:\nezha" -Type Directory }

# 移动文件到 C:\nezha
Move-Item -Path "C:\temp\nezha-agent.exe" -Destination "C:\nezha\nezha-agent.exe"

# 清理临时文件
Remove-Item "C:\nezha.zip"
Remove-Item "C:\temp" -Recurse

# 安装并启动 Nezha 监控 Agent
C:\nezha\nezha-agent.exe service install -s $server -p $key $tls

Write-Host "Enjoy It!" -BackgroundColor DarkGreen -ForegroundColor Red
