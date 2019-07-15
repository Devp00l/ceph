#!/usr/bin/env bash

failed=false
DASHBOARD=$PWD/src/pybind/mgr/dashboard

# Run backend unit tests
cd $DASHBOARD
pip3.7 install --user -r requirements.txt
tox `readlink -f tox.ini` -e "py3-cov" || failed=true


# Run frontend unit tests
cd $DASHBOARD/frontend
npm install
npm run test:ci || failed=true

# Export coverage
bash <(curl -s https://codecov.io/bash) -X fix -s "$DASHBOARD" -F dashboard

if [ "$failed" = "true" ]; then
  exit 1
fi
