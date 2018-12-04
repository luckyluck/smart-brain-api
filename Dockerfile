FROM node:10.13.0

WORKDIR d:\\docker

COPY ./ ./

RUN npm install

CMD ["/bin/bash"]