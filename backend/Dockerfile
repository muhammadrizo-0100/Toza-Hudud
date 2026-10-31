FROM node:22-alpine AS builder

WORKDIR /usr/src/app

COPY package.json ./
RUN npm install

COPY . ./
RUN npm run build

FROM node:22-alpine AS runner

WORKDIR /usr/src/app

ENV NODE_ENV=production

COPY package.json ./
RUN npm install --omit=dev

COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/seed-demo.js ./seed-demo.js

RUN mkdir -p /usr/src/app/uploads

EXPOSE 4001

CMD ["node", "dist/main.js"]