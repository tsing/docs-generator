FROM node:8-alpine

WORKDIR /app

ADD package.json /app/
ADD yarn.lock /app/
RUN yarn install
ADD . /app/

ONBUILD ADD . /docs/
ONBUILD RUN ./main.js /docs /output
