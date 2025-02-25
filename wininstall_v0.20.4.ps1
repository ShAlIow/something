# 获取服务器地址、密钥和 TLS 参数
param($server, $key, $tls)

# 检查 PowerShell 版本
if ($PSVersionTable.PSVersion.Major -lt 5) {
    Write-Host "需要 PowerShell 版本 >= 5，当前版本：" $PSVersionTable.PSVersion.Major -BackgroundColor DarkGreen -ForegroundColor White
    Write-Host "请参考社区文章手动安装：https://nyko.me/2020/12/13/nezha-windows-client.html" -BackgroundColor DarkRed -ForegroundColor Green
    exit
}

# 设置 GitHub 仓库和版本
$agentrepo = "nezhahq/agent"
$agenttag = "v0.20.4"

# 根据系统架构选择对应的压缩包
if ([System.Environment]::Is64BitOperatingSystem) {
    if ($env:PROCESSOR_ARCHITECTURE -eq "ARM64") {
        $file = "nezha-agent_windows_arm64.zip"
    } else {
        $file = "nezha-agent_windows_amd64.zip"
    }
} else {
    $file = "nezha-agent_windows_386.zip"
}

# 检查是否已存在旧版本的 Nezha Agent
if (Test-Path "C:\nezha\nezha-agent.exe") {
    Write-Host "检测到已安装的 Nezha Agent，正在卸载旧版本..." -BackgroundColor DarkGreen -ForegroundColor White
    C:\nezha\nezha-agent.exe service uninstall
    Remove-Item "C:\nezha" -Recurse
}

# 设置下载地址
$download = "https://github.com/$agentrepo/releases/download/$agenttag/$file"
Write-Host "下载地址：$download" -BackgroundColor DarkGreen -ForegroundColor White

# 下载压缩包到 C:\nezha.zip
Invoke-WebRequest -Uri $download -OutFile "C:\nezha.zip"

# 解压缩
Expand-Archive -Path "C:\nezha.zip" -DestinationPath "C:\temp" -Force
if (!(Test-Path "C:\nezha")) {
    New-Item -Path "C:\nezha" -ItemType Directory
}

# 移动文件
Move-Item -Path "C:\temp\nezha-agent.exe" -Destination "C:\nezha\nezha-agent.exe"

# 清理临时文件
Remove-Item "C:\nezha.zip"
Remove-Item "C:\temp" -Recurse

# 安装并启动服务
C:\nezha\nezha-agent.exe service install -s $server -p $key $tls
C:\nezha\nezha-agent.exe service start

Write-Host "安装完成！" -BackgroundColor DarkGreen -ForegroundColor Red
