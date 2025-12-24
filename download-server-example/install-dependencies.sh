#!/bin/bash
# Install Python, FFmpeg, and yt-dlp dependencies for Render

set -e

echo "🔧 Installing system dependencies..."

# Update package list (if apt-get is available)
if command -v apt-get &> /dev/null; then
  sudo apt-get update -qq
  sudo apt-get install -y -qq python3 python3-pip ffmpeg
  echo "✅ Installed Python3, pip, and FFmpeg via apt-get"
elif command -v yum &> /dev/null; then
  sudo yum install -y -q python3 python3-pip ffmpeg
  echo "✅ Installed Python3, pip, and FFmpeg via yum"
elif command -v brew &> /dev/null; then
  brew install python3 ffmpeg
  echo "✅ Installed Python3 and FFmpeg via Homebrew"
else
  echo "⚠️  Could not detect package manager. Assuming dependencies are pre-installed."
fi

# Verify installations
echo "📦 Verifying installations..."
python3 --version || echo "⚠️  Python3 not found"
ffmpeg -version | head -1 || echo "⚠️  FFmpeg not found"

echo "✅ Dependency installation complete"

