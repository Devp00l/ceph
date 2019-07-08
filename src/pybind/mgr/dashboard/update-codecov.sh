#!/usr/bin/env bash
bash <(curl -s https://codecov.io/bash) -c -F dashboard -y src/pybind/mgr/dashboard/codecov.yml -s src/pybind/mgr/dashboard -t 70e39e58-fa7d-40bf-a428-0925eb779c33
