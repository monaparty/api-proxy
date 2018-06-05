FROM node:6.10.2-onbuild

EXPOSE 5000
CMD [ "node", "server.js" ]
