FROM ghcr.io/puppeteer/puppeteer:latest

USER root

WORKDIR /usr/src/app

COPY package*.json ./
# Changed from npm ci to npm install to avoid the package-lock error
RUN npm install

COPY . .

EXPOSE 3000

CMD [ "node", "index.js" ]
