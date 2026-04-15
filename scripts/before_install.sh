#!/bin/bash
set -e

cp /home/ec2-user/nextjs-workspace/.env /temp/.env.backup 2>dev/null || true
rm -rf /home/ec2-user/nextjs-workspace
mkdir -p /home/ec2-user/nextjs-workspace
cp /tmp/.env.backup /home/ec2-user/nextjs-workspace/.env 2>/dev/null || true
