FROM node:18-slim

# Install Python, FFmpeg, and dependencies required for yt-dlp
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    ffmpeg \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install Node dependencies
RUN npm install

# Copy application files
COPY . .

# Expose port (Render will set PORT env var)
EXPOSE 10000

# Start server
CMD ["node", "server.js"]

