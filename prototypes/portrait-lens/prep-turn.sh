#!/bin/sh
# Prepare a generated clip for Lens study 02 (the turn).
# Re-encodes it so it scrubs smoothly with the scroll (a keyframe every 4 frames, no B-frames, no audio),
# then saves its last frame as the poster that reduced-motion visitors see.
#
# Usage: sh prep-turn.sh path/to/higgsfield-download.mp4
set -eu
in="$1"
here="$(cd "$(dirname "$0")" && pwd)"

ffmpeg -v error -y -i "$in" -an \
  -vf "scale=1600:-2:flags=lanczos,fps=24,format=yuv420p" \
  -c:v libx264 -preset slow -crf 24 -g 4 -bf 0 -movflags +faststart \
  "$here/turn.mp4"
ffmpeg -v error -y -sseof -0.25 -i "$here/turn.mp4" -update 1 -q:v 3 "$here/turn-poster.jpg"

ls -la "$here/turn.mp4" "$here/turn-poster.jpg"
