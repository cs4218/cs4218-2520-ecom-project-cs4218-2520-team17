# n8n Dockerfile
# Use the official n8n image
FROM n8nio/n8n:latest

# Expose the default n8n port
EXPOSE 5678


# BUILD:
# docker build -t n8n ./n8n
# 
# RUN:
# docker run -it --rm \
#   --name n8n-code-review \
#   -p 5678:5678 \
#   -e N8N_HOST=localhost \
#   -e N8N_PORT=5678 \
#   -e N8N_PROTOCOL=http \
#   -e WEBHOOK_URL=http://localhost:5678/ \
#   -e GENERIC_TIMEZONE=Asia/Singapore \
#   -e N8N_RESTRICT_FILE_ACCESS_TO="/home/node/.n8n-files;/workspace/repo" \
#   -e TZ=Asia/Singapore \
#   -v "$(pwd):/workspace/repo:ro" \
#   n8n
#
# LOCAL:
# http://localhost:5678