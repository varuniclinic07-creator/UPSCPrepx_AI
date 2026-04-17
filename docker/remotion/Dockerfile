FROM node:20-slim

RUN apt-get update && \
    apt-get install -y --no-install-recommends ffmpeg fonts-noto-cjk fonts-dejavu-core && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json /app/package.json
RUN npm install --production

COPY server.js /app/server.js
COPY compositions/ /app/compositions/

RUN mkdir -p /app/output /app/frames

EXPOSE 3001

CMD ["node", "server.js"]
