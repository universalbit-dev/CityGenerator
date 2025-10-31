#!/usr/bin/env bash
# install.sh - installer/builder for cpuminer (minerd)
#
# This simplified version ONLY installs build dependencies, installs Node (nvm or system
# LTS), and builds minerd from the repository. It deliberately removes any runtime
# behavior: no cpulimit, no automatic launching of minerd.
#
# Usage:
#   sudo ./install.sh                # install system packages and build (may use sudo for package installs)
#   ./install.sh --use-nvm           # ensure nvm + Node LTS for current user, then build
#   ./install.sh --node-lts          # install Node LTS system-wide (Debian-based via NodeSource)
#   ./install.sh --help              # show help
#
# Notes:
# - The script will not launch or manage minerd; it only prepares and builds the project.

set -euo pipefail
IFS=$'\n\t'

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Defaults
USE_NVM=true
NODE_LTS_SYSTEM=false

print_usage() {
  cat <<EOF
Usage: $0 [--use-nvm | --node-lts] [--help]
Options:
  --use-nvm       Install nvm + Node LTS for current user (default).
  --node-lts      Install Node LTS system-wide via NodeSource (Debian-based only).
  -h, --help      Show this help
EOF
}

# parse args
while [[ $# -gt 0 ]]; do
  case "$1" in
    --use-nvm) USE_NVM=true; NODE_LTS_SYSTEM=false; shift ;;
    --node-lts) NODE_LTS_SYSTEM=true; USE_NVM=false; shift ;;
    -h|--help) print_usage; exit 0 ;;
    *) echo "Unknown arg: $1"; print_usage; exit 2 ;;
  esac
done

detect_distro() {
  if command -v apt-get >/dev/null 2>&1; then
    echo "debian"
  elif command -v dnf >/dev/null 2>&1; then
    echo "fedora"
  elif command -v yum >/dev/null 2>&1; then
    echo "centos"
  elif command -v brew >/dev/null 2>&1; then
    echo "macos"
  else
    echo "unknown"
  fi
}

install_packages_debian() {
  apt-get update
  apt-get install -y build-essential pkg-config automake autoconf libtool libssl-dev libcurl4-openssl-dev \
    libjansson-dev gawk help2man ca-certificates curl git
}

install_packages_fedora() {
  dnf groupinstall -y "Development Tools"
  dnf install -y pkgconfig automake autoconf libtool openssl-devel libcurl-devel jansson-devel gawk help2man git curl
}

install_packages_centos() {
  yum groupinstall -y "Development Tools"
  yum install -y epel-release
  yum install -y pkgconfig automake autoconf libtool openssl-devel libcurl-devel jansson-devel gawk help2man git curl
}

install_packages_macos() {
  brew update
  brew install automake autoconf libtool openssl pkg-config jansson gawk help2man git curl
}

install_deps() {
  DISTRO=$(detect_distro)
  echo "Detected platform: $DISTRO"
  case "$DISTRO" in
    debian) install_packages_debian ;;
    fedora) install_packages_fedora ;;
    centos) install_packages_centos ;;
    macos) install_packages_macos ;;
    *)
      echo "Unsupported/unknown platform. Please install build deps manually:"
      echo "  build-essential autoconf automake libtool pkg-config libssl-dev libcurl4-openssl-dev libjansson-dev help2man git curl"
      ;;
  esac
}

install_node_system_lts() {
  echo "Installing Node.js LTS system-wide via NodeSource (Debian-based)..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
}

install_nvm_and_node() {
  echo "Installing nvm and Node.js LTS for current user..."
  if [ -d "$HOME/.nvm" ] && command -v nvm >/dev/null 2>&1; then
    echo "nvm already installed"
  else
    curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.6/install.sh | bash
    export NVM_DIR="$HOME/.nvm"
    # shellcheck disable=SC1091
    [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
  fi
  nvm install --lts
  nvm use --lts
}

build_minerd() {
  echo "Building minerd from repository root..."
  pushd "$REPO_ROOT" >/dev/null

  # run autogen/configure if needed
  if [[ -x ./autogen.sh ]]; then
    ./autogen.sh || true
  elif [[ -f configure.ac || -f configure.in ]]; then
    if command -v autoreconf >/dev/null 2>&1; then
      autoreconf -i || true
    fi
  fi

  # try to ensure help2man exists; if not, create a placeholder manpage to avoid build failure
  if ! command -v help2man >/dev/null 2>&1 && [[ ! -f minerd.1 ]]; then
    echo "help2man not found; creating placeholder minerd.1 to allow build to proceed."
    cat > minerd.1 <<'EOF'
.TH minerd 1 "placeholder"
.SH NAME
minerd \- cpu miner (placeholder manpage)
.SH SYNOPSIS
.B minerd
[\-t threads] ...
EOF
    touch minerd.1
  fi

  if [[ -x ./configure ]]; then
    ./configure || true
  fi

  JOBS=1
  if command -v nproc >/dev/null 2>&1; then
    JOBS=$(nproc)
  elif command -v sysctl >/dev/null 2>&1; then
    JOBS=$(sysctl -n hw.ncpu 2>/dev/null || echo 1)
  fi

  make -j"$JOBS" || {
    echo "make failed; trying single-threaded make to show clearer errors"
    make || {
      echo "make failed. Check output above."
      popd >/dev/null
      return 1
    }
  }

  # locate minerd binary
  if [[ -x "$REPO_ROOT/minerd" ]]; then
    echo "Built minerd at $REPO_ROOT/minerd"
  else
    local BIN
    BIN="$(command -v minerd || true)"
    if [[ -n "$BIN" ]]; then
      echo "minerd available at: $BIN"
    else
      echo "minerd binary not found after build. Inspect make output."
      popd >/dev/null
      return 1
    fi
  fi

  popd >/dev/null
}

# Main
if [[ $EUID -ne 0 ]]; then
  echo "Note: installing system packages may require sudo privileges."
fi

install_deps

if $NODE_LTS_SYSTEM; then
  if [[ "$(detect_distro)" == "debian" ]]; then
    install_node_system_lts
  else
    echo "System Node LTS install implemented for Debian-based systems only. Use --use-nvm or install Node manually."
  fi
elif $USE_NVM; then
  install_nvm_and_node
fi

build_minerd

echo "All done. Dependencies installed and minerd built (if build succeeded)."
echo "This script does NOT start or control the miner. Use your preferred launcher to run minerd."
