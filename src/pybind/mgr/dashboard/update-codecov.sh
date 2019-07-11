#!/usr/bin/env bash
# $1 = Pull request number in order to attach report

function codecov {
  bash <(curl -s https://codecov.io/bash) -s "$(dirname $0)" -F dashboard -t 70e39e58-fa7d-40bf-a428-0925eb779c33
}

if [ -n "$1" ]; then
  codecov -P $1
else
  codecov
fi
