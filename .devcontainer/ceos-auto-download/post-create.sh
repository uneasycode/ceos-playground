#!/bin/bash
set -e

echo "🔧 Updating system..."
sudo apt-get update

# Preseed Wireshark to suppress interactive prompt
echo "wireshark-common wireshark-common/install-setuid boolean true" | sudo debconf-set-selections

echo "📦 Installing system dependencies..."
sudo apt-get install -y --no-install-recommends \
    git gnupg lsb-release curl unzip iproute2 iputils-ping \
    software-properties-common jq tshark xz-utils

# Create and activate Python virtual environment
VENV_PATH="$HOME/.venv"
echo "🐍 Creating Python virtual environment at $VENV_PATH..."
python3 -m venv "$VENV_PATH"
source "$VENV_PATH/bin/activate"

echo "📦 Installing Python packages..."
pip install --upgrade pip
pip install virtualenv ansible eos-downloader

echo "📦 Installing Arista AVD collection via Ansible Galaxy..."
ansible-galaxy collection install arista.avd

echo "🐳 Installing Containerlab..."
bash -c "$(curl -sL https://get.containerlab.dev)"

echo "🦈 Deploying Edgeshark..."
curl -sL https://github.com/siemens/edgeshark/raw/main/deployments/wget/docker-compose.yaml \
| DOCKER_DEFAULT_PLATFORM= docker compose -f - up -d

# Detect system architecture first
echo "🖥️ Detecting system architecture..."
ARCH=$(uname -m)
echo "Architecture: $ARCH"

if [[ -n "$ARISTA_TOKEN" ]]; then
  echo "📥 ARISTA_TOKEN detected. Downloading correct cEOS-lab image for platform..."

  if [[ "$ARCH" == "aarch64" || "$ARCH" == "arm64" ]]; then
    echo "💪 Downloading cEOS-lab for ARM..."
    ardl --token "$ARISTA_TOKEN" get eos --format cEOSarm --latest

    FILE=$(ls cEOSarm-lab-*.tar.xz 2>/dev/null | head -n 1)
    if [[ -n "$FILE" ]]; then
      echo "🗜️ Decompressing $FILE..."
      unxz -k "$FILE"
      TARFILE="${FILE%.xz}"
      docker import "$TARFILE" ceos:latest
      echo "✅ ARM image imported into Docker."
    else
      echo "⚠️  No ARM tarball found!"
    fi

  else
    echo "🧠 Downloading cEOS-lab for x86..."
    ardl --token "$ARISTA_TOKEN" get eos --format cEOS --latest

    FILE=$(ls cEOS-lab-*.tar.xz 2>/dev/null | head -n 1)
    if [[ -n "$FILE" ]]; then
      echo "🗜️ Decompressing $FILE..."
      unxz -k "$FILE"
      TARFILE="${FILE%.xz}"
      docker import "$TARFILE" ceos:latest
      echo "✅ x86 image imported into Docker."
    else
      echo "⚠️  No x86 tarball found!"
    fi
  fi

else
  echo "⚠️  ARISTA_TOKEN not set. Skipping cEOS image download and import."
fi

# Auto-activate virtualenv on terminal startup
echo "source $VENV_PATH/bin/activate" >> "$HOME/.bashrc"

echo "✅ Full setup complete! You can now run 'docker images' to verify."
