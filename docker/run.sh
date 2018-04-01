#!/bin/bash

docker run -d --name mdb-db \
  --restart unless-stopped \
  -e MYSQL_ROOT_PASSWORD=password \
  mysql

docker run --name mdb-admin -d \
  --restart unless-stopped \
  --link mdb-db:db \
  -p 3872:80 \
  phpmyadmin/phpmyadmin

docker run -d --name mdb-server \
  --restart unless-stopped \
  -p 3011:80 \
  --link mdb-db:db \
  -v $(pwd)/../:/source \
  munchkin-server
