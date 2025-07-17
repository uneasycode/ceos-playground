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

ARISTA_TOKEN=45a3e6194305ac2261e8da6d4d4b0d13

if [[ -n "$ARISTA_TOKEN" ]]; then

  echo "🧠 Downloading cEOS-lab for x86..."
  ardl --token "$ARISTA_TOKEN" get eos --format cEOS --version 4.34.1F

  FILE=$(ls cEOS-lab-*.tar.xz 2>/dev/null | head -n 1)
  if [[ -n "$FILE" ]]; then
    echo "🗜️ Decompressing $FILE..."
    unxz -k "$FILE"
    TARFILE="${FILE%.xz}"
    docker import "$TARFILE" ceos:4.34.1F
    echo "✅ x86 image imported into Docker."
  else
    echo "⚠️  No x86 tarball found!"
  fi

else
  echo "⚠️  ARISTA_TOKEN not set. Skipping cEOS image download and import."
fi

echo "✅ Full setup complete! You can now run 'docker images' to verify."
