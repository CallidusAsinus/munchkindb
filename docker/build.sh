#!/bin/bash

docker image rm -f munchkin-server

cd ..
docker build -t munchkin-server .
cd -
