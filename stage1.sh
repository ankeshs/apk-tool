#!/bin/bash
md5sum "$1/$2.apk" | awk '{ print $1 }' > "$1/$2.md5"
cp "$1/$2.apk" "$1/$2.zip"
unzip "$1/$2.zip" -d "$1/$2"
rm "$1/$2.zip"
aapt dump badging "$1/$2.apk" > "$1/$2.badge"