FROM node:14-alpine

RUN npm install -g serverless

WORKDIR /app/

COPY . /app/

RUN npm install

EXPOSE 3000

CMD ["npm", "run", "dev"]