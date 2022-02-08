# A minimal Docker image with Node and Puppeteer
# Take care that this is deployed publicly
# https://hub.docker.com/repository/docker/alleywayapps/atat-ci-image
# 20220209a
# Initially based upon:
# https://github.com/GoogleChrome/puppeteer/blob/master/docs/troubleshooting.md#running-puppeteer-in-docker
#
FROM node:16.13.1-buster-slim

WORKDIR /usr/app

RUN  apt-get update \
     && apt-get install -y wget gnupg ca-certificates procps libxss1 \
     # We install Chrome to get all the OS level dependencies, but Chrome itself
     # is not actually used as it's packaged in the node puppeteer library.
     # Alternatively, we could could include the entire dep list ourselves
     # (https://github.com/puppeteer/puppeteer/blob/master/docs/troubleshooting.md#chrome-headless-doesnt-launch-on-unix)
     # but that seems too easy to get out of date. \
     && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
     && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
     && apt-get update \
#     && apt-get install -y git \
     && apt-get install -y google-chrome-stable \
#     && apt-get install -y traceroute \
     && rm -rf /var/lib/apt/lists/* \
#     && wget --quiet https://raw.githubusercontent.com/vishnubob/wait-for-it/master/wait-for-it.sh -O /usr/sbin/wait-for-it.sh \
#     && chmod +x /usr/sbin/wait-for-it.sh \
     && npm install npm@8.4.1 -g
