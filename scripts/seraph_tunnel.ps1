param(
    [string]$Login='aurora',     # ~/.ssh/config의 Host 별칭 (HostName·Port·User가 들어 있어야 함)
    [string]$SoulHome,           # 기본 /data/<User>/soul-seraph
    [int]$LocalPort=8080
)
# 세라프 GPU 노드의 llama-server를 노트북 127.0.0.1:8080으로 연결한다.
# 마스터에서는 server.info를 읽는 cat과 포워딩만 한다. 이 창을 열어둔 동안만 연결된다.
# 다른 창에서: .\scripts\start_soul_windows.ps1 -Remote
$ErrorActionPreference='Stop'
if (Get-NetTCPConnection -LocalPort $LocalPort -State Listen -ErrorAction SilentlyContinue) {
    throw "Port $LocalPort is already in use. Stop the local Qwen server or the previous tunnel first."
}
$user=(ssh -G $Login | Where-Object { $_ -match '^user ' } | Select-Object -First 1) -replace '^user ',''
if (!$user) { throw "Cannot read the user for '$Login' from ~/.ssh/config." }
if (!$SoulHome) { $SoulHome="/data/$user/soul-seraph" }

# 연결이 끊기면(네트워크 리셋, 작업 재큐잉) server.info를 다시 읽고 자동으로 재연결한다. Ctrl+C로 종료.
$first=$true
while ($true) {
    $info=@{}
    foreach ($line in (ssh $Login "cat $SoulHome/server.info 2>/dev/null")) {
        if ($line -match '^(\w+)=(.*)$') { $info[$Matches[1]]=$Matches[2].Trim() }
    }
    if (!$info.NODE -or !$info.PORT) {
        if ($first) { throw 'server.info not found. On Seraph, check the job is RUNNING (squeue -u $USER) and its log shows READY.' }
        Write-Warning "$(Get-Date -Format HH:mm:ss) server.info not found (job ended or restarting). Retrying in 15s..."
        Start-Sleep -Seconds 15; continue
    }
    Write-Output "Seraph job $($info.JOB): $($info.MODEL) on $($info.NODE):$($info.PORT) -> 127.0.0.1:$LocalPort"
    $forward=@('-N','-o','ExitOnForwardFailure=yes','-o','ServerAliveInterval=15','-o','ServerAliveCountMax=3')
    if ($info.BIND -eq '127.0.0.1') {
        # 서버는 계산 노드의 localhost에만 열려 있으므로, 마스터를 거쳐(-J) 계산 노드에 들어가 포워딩한다.
        $forward+=@('-L',"127.0.0.1:${LocalPort}:127.0.0.1:$($info.PORT)",'-J',$Login,"$user@$($info.NODE)")
    } else {
        $forward+=@('-L',"127.0.0.1:${LocalPort}:$($info.NODE):$($info.PORT)",$Login)
        if (!$env:LLM_API_KEY) { Write-Warning 'The server requires an API key. Set $env:LLM_API_KEY in the window that runs start_soul_windows.ps1.' }
    }
    Write-Output 'Tunnel open. Keep this window running; Ctrl+C closes it. It reconnects automatically if dropped.'
    $first=$false
    & ssh @forward
    Write-Warning "$(Get-Date -Format HH:mm:ss) Tunnel closed (exit $LASTEXITCODE). Reconnecting in 3s... (Ctrl+C to stop)"
    Start-Sleep -Seconds 3
}
