# 세라프 GPU로 SOUL 실행하기

모델(Qwen, llama.cpp)만 세라프 GPU 노드에서 돌리고 화면(Next.js :8000)과 백엔드(FastAPI :8001)는 노트북에서 돌린다. 노트북과 세라프는 SSH 터널로 연결한다. 백엔드는 LLM 주소로 `127.0.0.1`만 허용하고 llama.cpp 전용 API(`/props`, `/tokenize`, `/apply-template`, JSON 문법 제약)를 쓴다. 그래서 세라프에서도 vLLM·Ollama가 아니라 llama-server를 쓴다.

```
노트북 브라우저 → Next.js :8000 → FastAPI :8001 → 127.0.0.1:8080
   ══SSH(마스터 aurora 경유)══▶ GPU 노드 127.0.0.1:<빈 포트> llama-server
```

## 세라프 규칙과 이 스크립트

| 규칙 | 스크립트에서 |
|---|---|
| 마스터에서 빌드·python·재귀 탐색·AI 에이전트 금지 | 빌드·다운로드·검증은 전부 `setup.sbatch`가 GPU 노드에서 한다. 마스터에서는 `sbatch`, `squeue`, `tail`, `scancel`만 직접 친다 |
| `/home` 금지, NAS는 `/data/$USER` | 모든 파일은 `/data/$USER/soul-seraph`, conda 환경은 `/data/$USER/envs/soul-llama` |
| NAS 직접 I/O 금지 | llama.cpp 소스·빌드 중간 파일은 `/local_datasets`에서 만들고 NAS에는 실행 파일 2개만 둔다. 모델은 작업 시작 시 `/local_datasets`로 복사해서 쓴다 |
| GPU당 CPU 8 이하, 메모리 32G 수준 | setup: CPU 8 / serve: CPU 4, 둘 다 `--mem-per-gpu=32G` |
| 공용 노드의 서버는 빈 포트 + 127.0.0.1 | serve가 빈 포트를 골라 노드 localhost에만 연다 |
| 쓰고 나면 정리 | 작업이 끝나면 빌드 폴더와 로컬 모델 복사본을 지운다 |

## 모델

aurora 노드는 RTX 3090(24GB)이다.

| 키 | 파일 | 크기 | 비고 |
|---|---|---|---|
| `4b` | Qwen3.5-4B-Q4_K_M | 2.7GB | 이 코드로 전체 흐름까지 검증된 모델. 먼저 이걸로 연결을 확인한다 |
| `9b` | Qwen3.5-9B-Q4_K_M | 5.7GB | |
| `35b` | Qwen3.6-35B-A3B-UD-Q4_K_M | 20.6GiB | 실측 GPU 21,328 / 24,576 MiB. 메모리 부족이면 `CTX=4096` |

모델은 Hugging Face의 고정 리비전에서 받고 크기와 SHA256을 확인한다. `4b` 외의 모델은 `scripts/soul_smoke.py`를 통과한 뒤 시연에 쓴다.

2026-11-06 같은 합성 아이디어·질문으로 잰 값(추천 → 3인 카드 → 질문 1개 대화):

| | 4b | 35b |
|---|---|---|
| 합계 | 37초 | 58초 |
| 서버 시작(로컬 복사 + 로딩) | 수 초 | 68초 + 16초 |
| 대화 | 세 명이 서로의 문장을 되풀이 | 역할마다 다른 걱정을 말하고 이유를 들어 반박 |

## 1. 준비 (한 번만)

노트북 PowerShell에서 스크립트를 NAS로 올린다.

```powershell
scp -r seraph aurora:/data/jwook2480/soul-seraph-src
# 스크립트를 고친 뒤 다시 올릴 때 (폴더가 이미 있으면 위 명령은 안쪽에 seraph/를 하나 더 만든다)
scp seraph/* aurora:/data/jwook2480/soul-seraph-src/
```

마스터(`ssh aurora`)에서 준비 작업을 제출한다. 파티션은 스크립트에 `batch_ugrad`(aurora 학부생)로 들어 있다. 다른 계정은 `sbatch -p <이름>`으로 바꾼다.

```bash
cd /data/$USER/soul-seraph-src
sbatch setup.sbatch 4b 35b
squeue -u $USER
tail -f soul-setup-<작업번호>.log        # 끝에 SETUP DONE이 나오면 완료. Ctrl+C로 tail만 종료
```

- conda는 제출한 쉘에서 활성화된 것(`$CONDA_EXE`, 예: `/data/$USER/miniconda3`)을 쓴다. `(base)`가 켜진 상태에서 제출하면 된다.
- 노드에 CUDA 컴파일러가 없으면 conda-forge에서 드라이버에 맞는 CUDA 툴킷을 받아 빌드한다. 빌드는 10~30분 걸린다.
- 실패해도 그대로 다시 제출하면 끝난 단계는 건너뛴다.

### 노드에서 인터넷이 안 될 때

로그에 curl 오류가 나면 노트북에서 받아 NAS로 올린 뒤 `setup.sbatch`를 다시 제출한다. 크기·해시 검증은 setup이 똑같이 한다. 업로드 속도는 약 10MB/s다(35b는 약 40분). 끊기면 `sftp aurora`에서 `reput`으로 이어 올린다.

```powershell
curl.exe -L -o llama.cpp-b11146.tar.gz https://github.com/ggml-org/llama.cpp/archive/refs/tags/b11146.tar.gz
curl.exe -L -C - -o Qwen3.5-4B-Q4_K_M.gguf https://huggingface.co/unsloth/Qwen3.5-4B-GGUF/resolve/e87f176479d0855a907a41277aca2f8ee7a09523/Qwen3.5-4B-Q4_K_M.gguf
scp llama.cpp-b11146.tar.gz aurora:/data/jwook2480/soul-seraph/src/
scp Qwen3.5-4B-Q4_K_M.gguf aurora:/data/jwook2480/soul-seraph/models/
```

conda 환경을 만들 때도 인터넷이 필요하다. 그것까지 막혀 있으면 Slack `users` 채널에 노드의 CUDA 툴킷 위치를 문의한다.

## 2. 쓸 때마다

마스터에서 GPU 작업을 띄운다.

```bash
cd /data/$USER/soul-seraph-src
sbatch serve.sbatch 4b        # 또는 35b. 시간은 --time=0-06:00:00 처럼 지정
tail -f soul-llm-<작업번호>.log                  # READY가 나오면 준비 끝
```

노트북 PowerShell 창 1(터널, 열어둔다):

```powershell
.\scripts\seraph_tunnel.ps1
```

노트북 PowerShell 창 2:

```powershell
.\scripts\start_soul_windows.ps1 -Remote
```

브라우저에서 http://127.0.0.1:8000 을 연다. 전체 흐름 점검은 창 3에서 실행한다.

```powershell
.\.venv\Scripts\python.exe -X utf8 scripts/soul_smoke.py --base-url http://127.0.0.1:8000
```

끝나면 터널 창을 Ctrl+C로 닫고 마스터에서 `scancel <작업번호>`로 GPU를 반납한다.

## 계산 노드로 SSH가 막혀 있을 때

터널은 마스터를 거쳐 계산 노드로 들어간다(`ssh -J aurora jwook2480@<노드>`). 이게 막혀 있으면 서버를 노드 네트워크에 열고 API 키를 건다.

```bash
LLAMA_API_KEY=<임의의 긴 문자열> BIND_HOST=0.0.0.0 sbatch serve.sbatch 4b
```

```powershell
$env:LLM_API_KEY='<같은 문자열>'
.\scripts\seraph_tunnel.ps1                 # 창 1
.\scripts\start_soul_windows.ps1 -Remote    # 창 2 (같은 $env:LLM_API_KEY 설정)
```

## 시연 전 확인

- `show-qos` / `show-assoc`로 최대 실행 시간(MaxWall)을 확인한다. 시연 전에 미리 띄워 두고 READY를 확인한다.
- 터널은 끊기면(네트워크 리셋, 선점·재큐잉으로 노드·포트 변경) `server.info`를 다시 읽어 자동으로 다시 연결한다. 비밀번호 인증이면 그때마다 비밀번호를 묻는다.
- 시연 장소 네트워크에서 `ssh aurora`가 되는지 확인한다. 학교 밖이면 VPN이 필요할 수 있다.
- 비밀번호를 여러 번 묻지 않도록 SSH 키를 등록해 둔다.
- 대비책: 리허설로 끝까지 돌린 세션을 노트북 `data/sessions.sqlite3`에 남겨 둔다. 앱이 켜진 뒤 연결이 끊기면 새 질문은 503 오류가 나지만, 저장된 세션의 대화·리포트 화면은 계속 열린다.
