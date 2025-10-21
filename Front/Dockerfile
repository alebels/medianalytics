FROM node:22.12.0-alpine

WORKDIR /app

ENV PATH=/app/node_modules/.bin:$PATH

COPY package.json package-lock.json* /app/
RUN npm install -g @angular/cli@19.0.6 && npm ci

COPY . /app

EXPOSE 4200

CMD ["ng","serve","--watch","--host","0.0.0.0","--port","4200","--verbose","--poll"]
