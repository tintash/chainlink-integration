FROM node:12-buster

WORKDIR /event-obserber
COPY . .
RUN npm install

COPY ./configurations/event-observer/wait-for-it.sh ./
RUN chmod +x ./wait-for-it.sh

COPY ./configurations/event-observer/docker-entrypoint.sh ./
RUN chmod +x ./docker-entrypoint.sh

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["npm","run","start"]
