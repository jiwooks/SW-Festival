#!/usr/bin/bash
#SBATCH -J soul-setup
#SBATCH -p batch_ugrad
#SBATCH --gres=gpu:1
#SBATCH --cpus-per-gpu=8
#SBATCH --mem-per-gpu=32G
#SBATCH -t 0-02:00:00
#SBATCH -o soul-setup-%j.log
# SOUL 준비: llama.cpp(CUDA) 빌드 + Qwen GGUF 다운로드·검증. 다시 제출하면 끝난 단계는 건너뛴다.
# 마스터 노드에서는 빌드·python 실행이 금지이므로 반드시 sbatch로 GPU 노드에서 돌린다.
#   cd /data/$USER/soul-seraph-src && sbatch setup.sbatch 4b 35b      (다른 파티션: sbatch -p <이름> ...)
set -euo pipefail
export PIP_NO_CACHE_DIR=1

SOUL_HOME="${SOUL_HOME:-/data/$USER/soul-seraph}"                       # NAS: 실행 파일·모델만 (/home 금지)
# 제출한 쉘에서 활성화된 conda를 그대로 쓴다(sbatch는 환경변수를 상속). 없으면 /data/$USER/anaconda3.
if [ -z "${CONDA_SH:-}" ] && [ -n "${CONDA_EXE:-}" ]; then CONDA_SH="$(dirname "$(dirname "$CONDA_EXE")")/etc/profile.d/conda.sh"; fi
CONDA_SH="${CONDA_SH:-/data/$USER/anaconda3/etc/profile.d/conda.sh}"
# 공용 conda를 쓰더라도 패키지 캐시가 /home(~/.conda)이나 공용 폴더에 쌓이지 않게 한다.
export CONDA_PKGS_DIRS="${CONDA_PKGS_DIRS:-/data/$USER/conda-pkgs}"
ENV_DIR="${ENV_DIR:-/data/$USER/envs/soul-llama}"
LLAMA_CPP_TAG="${LLAMA_CPP_TAG:-b11146}"                                # 로컬 검증 버전(7fe450e19)과 동일
CUDA_ARCH="${CUDA_ARCH:-86}"                                            # RTX 3090 / A5000 / A6000 = sm_86
keys=("$@"); [ ${#keys[@]} -gt 0 ] || keys=(4b)

# 키 → 저장소, 고정 리비전, 파일, 크기, SHA256 (2026-11-06 Hugging Face에서 확인)
model_info() { case "$1" in
  4b)  echo "unsloth/Qwen3.5-4B-GGUF e87f176479d0855a907a41277aca2f8ee7a09523 Qwen3.5-4B-Q4_K_M.gguf 2740937888 00fe7986ff5f6b463e62455821146049db6f9313603938a70800d1fb69ef11a4" ;;
  9b)  echo "unsloth/Qwen3.5-9B-GGUF 3885219b6810b007914f3a7950a8d1b469d598a5 Qwen3.5-9B-Q4_K_M.gguf 5680522464 03b74727a860a56338e042c4420bb3f04b2fec5734175f4cb9fa853daf52b7e8" ;;
  35b) echo "unsloth/Qwen3.6-35B-A3B-GGUF a483e9e6cbd595906af30beda3187c2663a1118c Qwen3.6-35B-A3B-UD-Q4_K_M.gguf 22134528992 ac0e2c1189e055faa36eff361580e79c5bd6f8e76bffb4ce547f167d53e31a61" ;;
  *) echo "알 수 없는 모델 키: $1 (4b|9b|35b)" >&2; return 1 ;;
esac; }
for k in "${keys[@]}"; do model_info "$k" >/dev/null; done

mkdir -p "$SOUL_HOME/bin" "$SOUL_HOME/models" "$SOUL_HOME/src"
echo "job=$SLURM_JOB_ID node=$(hostname -s) SOUL_HOME=$SOUL_HOME"
nvidia-smi --query-gpu=name,driver_version --format=csv,noheader

# 1) 빌드 도구 conda 환경 (NAS). 노드에 nvcc가 없으면 드라이버에 맞는 CUDA 툴킷과 gcc 12를 같이 넣는다.
[ -f "$CONDA_SH" ] || { echo "conda를 찾지 못했습니다: $CONDA_SH (CONDA_SH=경로 로 지정)" >&2; exit 1; }
sys_nvcc="$(command -v nvcc || true)"
if [ -z "$sys_nvcc" ]; then
  for d in /usr/local/cuda/bin /usr/local/cuda-*/bin; do
    if [ -x "$d/nvcc" ]; then sys_nvcc="$d/nvcc"; break; fi
  done
fi
set +u; source "$CONDA_SH"; set -u
if [ ! -d "$ENV_DIR" ]; then
  pkgs=(python=3.11 cmake ninja)
  if [ -z "$sys_nvcc" ]; then
    cv="${CUDA_VERSION:-$(nvidia-smi | grep -oE 'CUDA Version: *[0-9]+\.[0-9]+' | grep -oE '[0-9]+\.[0-9]+$')}"
    pkgs+=("cuda-version=$cv" cuda-nvcc cuda-cudart-dev libcublas-dev "gcc_linux-64=12" "gxx_linux-64=12")
  fi
  conda create -y -p "$ENV_DIR" -c conda-forge --override-channels "${pkgs[@]}"
fi
set +u; conda activate "$ENV_DIR"; set -u     # conda 활성화 스크립트는 set -u와 충돌한다
nvcc_bin="${sys_nvcc:-$ENV_DIR/bin/nvcc}"
[ -x "$nvcc_bin" ] || { echo "nvcc가 없습니다. ENV_DIR($ENV_DIR)을 지우고 다시 제출하세요." >&2; exit 1; }
echo "nvcc: $("$nvcc_bin" --version | tail -1)"
[ -d "$ENV_DIR/lib" ] && export LD_LIBRARY_PATH="$ENV_DIR/lib${LD_LIBRARY_PATH:+:$LD_LIBRARY_PATH}"

# 2) llama.cpp 빌드: 소스·중간 파일은 노드 로컬 디스크에서 만들고 NAS에는 실행 파일 2개만 둔다.
server="$SOUL_HOME/bin/llama-server"
if [ ! -x "$server" ]; then
  tarball="$SOUL_HOME/src/llama.cpp-$LLAMA_CPP_TAG.tar.gz"
  [ -s "$tarball" ] || curl -fL --retry 3 -o "$tarball" \
    "https://github.com/ggml-org/llama.cpp/archive/refs/tags/$LLAMA_CPP_TAG.tar.gz"
  work="/local_datasets/$USER/soul-build-$SLURM_JOB_ID"
  trap 'rm -rf "$work"' EXIT
  mkdir -p "$work"
  tar -xzf "$tarball" -C "$work"
  src="$work/llama.cpp-$LLAMA_CPP_TAG"
  cuda_flags=(-DCMAKE_CUDA_COMPILER="$nvcc_bin")
  if [ -z "$sys_nvcc" ]; then cuda_flags+=(-DCUDAToolkit_ROOT="$ENV_DIR" -DCMAKE_CUDA_HOST_COMPILER="$CXX"); fi
  cmake -S "$src" -B "$src/build" -G Ninja -DCMAKE_BUILD_TYPE=Release \
    -DGGML_CUDA=ON -DCMAKE_CUDA_ARCHITECTURES="$CUDA_ARCH" -DBUILD_SHARED_LIBS=OFF \
    -DLLAMA_BUILD_TESTS=OFF "${cuda_flags[@]}"
  cmake --build "$src/build" -j "${SLURM_CPUS_ON_NODE:-8}" --target llama-server llama-bench
  cp "$src/build/bin/llama-server" "$src/build/bin/llama-bench" "$SOUL_HOME/bin/"
fi
"$server" --version 2>&1 | tail -2

# 3) 모델: 고정 리비전에서 받고 크기·SHA256을 확인한다. 노트북에서 scp로 올려 둔 파일도 같은 방식으로 검증한다.
for k in "${keys[@]}"; do
  read -r repo rev file size sha < <(model_info "$k")
  dest="$SOUL_HOME/models/$file"
  echo "== $k: $file"
  if [ -f "$SOUL_HOME/models/$k.path" ] && [ "$(stat -c %s "$dest" 2>/dev/null || echo 0)" = "$size" ]; then
    echo "이미 검증됨"; continue
  fi
  if [ "$(stat -c %s "$dest" 2>/dev/null || echo 0)" != "$size" ]; then
    curl -fL --retry 3 -C - -o "$dest" "https://huggingface.co/$repo/resolve/$rev/$file"
  fi
  actual="$(sha256sum "$dest" | cut -d' ' -f1)"
  if [ "$actual" != "$sha" ]; then
    echo "SHA256 불일치: $dest (기대 $sha, 실제 $actual). 파일을 지우고 다시 제출하세요." >&2; exit 1
  fi
  echo "$dest" > "$SOUL_HOME/models/$k.path"
  echo "OK $actual"
done

echo "SETUP DONE"
