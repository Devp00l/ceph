#!/usr/bin/env bash

failed=false
DASHBOARD=$PWD/src/pybind/mgr/dashboard

echo "Run backend unit tests"
cd $DASHBOARD
pip3.7 install --user -r requirements.txt
tox `readlink -f tox.ini` -e "py3-cov" || failed=true


echo "Run frontend unit tests"
cd $DASHBOARD/frontend
npm install
cp src/environments/environment.tpl.ts src/environments/environment.prod.ts
cp src/environments/environment.tpl.ts src/environments/environment.ts
npm run test:ci || failed=true

echo "Send coverage reports to codecov"
bash <(curl -s https://codecov.io/bash) -X fix -s "$DASHBOARD" -F dashboard

if [ "$failed" = "true" ]; then
  exit 1
fi
