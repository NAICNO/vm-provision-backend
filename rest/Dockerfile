FROM --platform=linux/amd64 node:20

WORKDIR /usr/src/app

COPY package.json yarn.lock ./

RUN yarn install

COPY . .

RUN yarn build

EXPOSE 3000
#ENV NODE_ENV=production

CMD ["node", "dist/index.js"]
