#!/bin/sh
set -eu
[ "$#" -eq 2 ] || exit 2
case "$1" in START|STOP) ;; *) echo 'Choose START or STOP' >&2; exit 2 ;; esac
case "$2" in digitalfactory-demo) ;; *) echo 'Only the demo container can be controlled' >&2; exit 2 ;; esac
docker container inspect --format '{{.Name}}' "$2" >/dev/null
if [ "$1" = STOP ]; then
    docker container stop "$2"
    expected=false
else
    docker container start "$2"
    expected=true
    sleep 5
fi
actual=$(docker container inspect --format '{{.State.Running}}' "$2")
[ "$actual" = "$expected" ] || { echo 'Unexpected container state' >&2; exit 1; }
echo "$2: running=$actual"
