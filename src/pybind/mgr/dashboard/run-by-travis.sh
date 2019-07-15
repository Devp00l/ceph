#!/usr/bin/env bash

DASHBOARD=$(dirname $0)

# Run backend unit tests
cd $DASHBOARD
pip3 install --user -r requirements.txt
tox `readlink -f tox.ini` -e "py3-cov"


# Run frontend unit tests
cd $DASHBOARD/frontend
npm install
npm run test:ci

# Export coverage
bash <(curl -s https://codecov.io/bash) -X fix -s "$DASHBOARD" -F dashboard
