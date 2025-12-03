FROM mongodb/mongodb-community-server:7.0.14-ubuntu2204-20250319T080543Z

WORKDIR /docker-entrypoint-initdb.d

COPY init.js /docker-entrypoint-initdb.d/
COPY dump/ /docker-entrypoint-initdb.d/dump/

EXPOSE 27017