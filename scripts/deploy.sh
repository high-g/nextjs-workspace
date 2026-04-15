#!/bin/bash
set -e

cd /home/ec2-user/nextjs-workspace

docker-compose down
docker-compose up --build -d
