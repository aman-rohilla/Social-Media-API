FROM node:16
WORKDIR /usr/src/app
COPY package.json ./
COPY package-lock.json ./

RUN npm install
# RUN npm ci --only=production

COPY . .
EXPOSE 5000
# 5000 port

# CMD ["node", "run.mjs"]
CMD ["/bin/bash", "-c", "npm test && npm start"]
