#!/bin/sh
git checkout master && git merge develop -m "merge from develop" && git push origin && git checkout develop

