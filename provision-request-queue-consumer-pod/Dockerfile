FROM --platform=linux/amd64 node:20

WORKDIR /usr/src/app

COPY package.json yarn.lock ./

RUN yarn install
RUN yarn global add ts-node

COPY . .

ENV NODE_ENV=production

CMD ["ts-node", "src/consumer.ts"]
