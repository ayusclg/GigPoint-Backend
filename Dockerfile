FROM node:22-alpine

WORKDIR /app

COPY package*.json .

RUN npm install 
RUN npm install pm2 -g

COPY . .
RUN npm run build

RUN cp -r src/templates dist/templates

EXPOSE 3000

CMD ["pm2-runtime", "ecosystem.config."]