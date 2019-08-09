#!/usr/bin/env bash

failed=false
CEPH_ROOT=$PWD
DASHBOARD=$CEPH_ROOT/src/pybind/mgr/dashboard
setupVirtualenv=$CEPH_ROOT/src/tools/setup-virtualenv.sh

echo "Setup virtualenv"
cd $DASHBOARD
#mkdir -p $CEPH_ROOT/build
#$setupVirtualenv $CEPH_ROOT/build/mgr-dashboard-virtualenv

echo "Run backend unit tests"
tox -e py3 || failed=true
#WITH_PYTHON2=OFF ../../../script/run_tox.sh --tox-env py3 || failed=true

if [ "$failed" = "true" ]; then
  echo "Backend unit tests have failed!"
  exit 1
fi

echo "Run frontend unit tests"
cd $DASHBOARD/frontend
npm install
cp src/environments/environment.tpl.ts src/environments/environment.prod.ts
cp src/environments/environment.tpl.ts src/environments/environment.ts
npm run test:ci || failed=true

if [ "$failed" = "true" ]; then
  echo "Frontend unit tests have failed!"
  exit 1
fi

echo "Send coverage reports to codecov"
bash <(curl -s https://codecov.io/bash) -X fix -s "$DASHBOARD" -F dashboard
echo "Everything clear - good job :)"
