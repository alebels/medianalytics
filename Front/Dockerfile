FROM node:22.12.0-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* /app/
RUN npm ci --prefer-offline --no-audit

FROM node:22.12.0-alpine

WORKDIR /app

ENV PATH=/app/node_modules/.bin:$PATH

RUN npm install -g @angular/cli@19.0.6

COPY --from=builder /app/node_modules /app/node_modules
COPY package.json package-lock.json* /app/

COPY . /app

EXPOSE 4200

CMD ["ng","serve","--watch","--host","0.0.0.0","--port","4200","--verbose","--poll"]
