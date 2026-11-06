#!/usr/bin/bash
#SBATCH -J soul-llm
#SBATCH -p batch_ugrad
#SBATCH --gres=gpu:1
#SBATCH --cpus-per-gpu=4
#SBATCH --mem-per-gpu=32G
#SBATCH -t 0-04:00:00
#SBATCH -o soul-llm-%j.log
# GPU 노드에서 Qwen llama-server를 띄운다. 노트북은 scripts/seraph_tunnel.ps1로 붙는다.
#   cd /data/$USER/soul-seraph-src && sbatch serve.sbatch [4b|9b|35b]   (다른 파티션: sbatch -p <이름> ...)
# 다 쓰면 scancel <작업번호>로 GPU를 반납한다.
# 환경변수: CTX(기본 8192), BIND_HOST(기본 127.0.0.1. 계산 노드 SSH가 막혔을 때만 0.0.0.0 + LLAMA_API_KEY),
#           KEEP_LOCAL=1(끝나도 /local_datasets 모델 복사본 유지)
set -euo pipefail

SOUL_HOME="${SOUL_HOME:-/data/$USER/soul-seraph}"
ENV_DIR="${ENV_DIR:-/data/$USER/envs/soul-llama}"
key="${1:-4b}"
model_nas="$(cat "$SOUL_HOME/models/$key.path")"
server="$SOUL_HOME/bin/llama-server"
bind="${BIND_HOST:-127.0.0.1}"
ctx="${CTX:-8192}"
info="$SOUL_HOME/server.info"
[ -d "$ENV_DIR/lib" ] && export LD_LIBRARY_PATH="$ENV_DIR/lib${LD_LIBRARY_PATH:+:$LD_LIBRARY_PATH}"
py="$ENV_DIR/bin/python"; [ -x "$py" ] || py=python3

# 같은 노드의 다른 사용자와 겹치지 않도록 빈 포트를 고른다.
port="${PORT:-$("$py" -c 'import socket;s=socket.socket();s.bind(("127.0.0.1",0));print(s.getsockname()[1])')}"

pid=""; local_copy=""
cleanup() {
  [ -n "$pid" ] && kill "$pid" 2>/dev/null || true
  # Only remove server.info if it is ours; a newer job may already have replaced it.
  if grep -qx "JOB=$SLURM_JOB_ID" "$info" 2>/dev/null; then rm -f "$info"; fi
  if [ -n "$local_copy" ] && [ "${KEEP_LOCAL:-0}" != 1 ]; then rm -f "$local_copy" "$local_copy.part"; fi
}
trap cleanup EXIT
trap 'exit 143' TERM INT

extra=()
if [ "$bind" != 127.0.0.1 ]; then
  # 클러스터의 다른 사용자도 이 포트에 닿을 수 있으므로 키를 강제한다.
  [ -n "${LLAMA_API_KEY:-}" ] || { echo 'BIND_HOST를 바꾸면 LLAMA_API_KEY가 필요합니다.' >&2; exit 1; }
  ( umask 077; printf '%s' "$LLAMA_API_KEY" > "$SOUL_HOME/api.key" )
  extra+=(--api-key-file "$SOUL_HOME/api.key")
fi

echo "job=$SLURM_JOB_ID node=$(hostname -s) key=$key port=$port bind=$bind ctx=$ctx"
nvidia-smi --query-gpu=name,memory.total,memory.used --format=csv,noheader || true
rm -f "$info"

# NAS를 계속 읽지 않도록 모델을 노드 로컬 디스크에 한 번 복사해서 쓴다. 공간이 모자라면 NAS에서 한 번만 읽는다.
model="$model_nas"
size="$(stat -c %s "$model_nas")"
local_dir="/local_datasets/$USER/soul-models"
if mkdir -p "$local_dir" 2>/dev/null; then
  avail="$(df --output=avail -B1 "$local_dir" | tail -1 | tr -d ' ')"
  echo "/local_datasets 여유: $((avail / 1024 / 1024 / 1024))GiB, 모델: $((size / 1024 / 1024 / 1024))GiB"
  if [ "$avail" -gt $((size + 2 * 1024 * 1024 * 1024)) ]; then
    local_copy="$local_dir/$(basename "$model_nas")"
    if [ "$(stat -c %s "$local_copy" 2>/dev/null || echo 0)" != "$size" ]; then
      echo "모델 복사 중 → $local_copy"
      t0=$SECONDS
      cp "$model_nas" "$local_copy.part" && mv "$local_copy.part" "$local_copy"
      echo "복사 완료: $((SECONDS - t0))초"
    fi
    model="$local_copy"
  else
    echo "경고: /local_datasets 여유 공간 부족. NAS에서 직접 로딩합니다."
  fi
fi

# 로컬 실행기와 같은 alias·추론 설정. 배치 크기는 서버 GPU이므로 llama.cpp 기본값을 쓴다.
"$server" -m "$model" --alias persona-qwen --host "$bind" --port "$port" -c "$ctx" -np 1 -ngl 99 \
  -t "${SLURM_CPUS_PER_GPU:-4}" --jinja --reasoning off --chat-template-kwargs '{"enable_thinking":false}' \
  ${extra[@]+"${extra[@]}"} &
pid=$!

ready=false
for _ in $(seq 1 900); do
  kill -0 "$pid" 2>/dev/null || { echo 'llama-server가 종료됐습니다. 위 로그를 확인하세요 (CUDA out of memory면 작은 모델이나 CTX=4096).' >&2; exit 1; }
  if curl -sf "http://127.0.0.1:$port/health" >/dev/null; then ready=true; break; fi
  sleep 1 & wait $!
done
$ready || { echo '모델 로딩 시간 초과' >&2; exit 1; }

printf 'NODE=%s\nPORT=%s\nBIND=%s\nMODEL=%s\nJOB=%s\n' "$(hostname -s)" "$port" "$bind" "$(basename "$model")" "$SLURM_JOB_ID" > "$info"
echo "READY"; cat "$info"
nvidia-smi --query-gpu=memory.used,memory.total --format=csv,noheader || true
wait "$pid"
