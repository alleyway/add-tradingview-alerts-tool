# A minimal Docker image with Node and Puppeteer
# Take care that this is deployed publicly
# https://hub.docker.com/repository/docker/alleywayapps/atat-ci-image
# 20220209c
# Initially based upon:
# https://github.com/GoogleChrome/puppeteer/blob/master/docs/troubleshooting.md#running-puppeteer-in-docker
#
# can't use bullseye because it doesn't have libappindicator (unless installed manually)
FROM node:16.15.1-buster-slim

WORKDIR /usr/app

RUN apt-get update && apt-get install -y \
    fonts-liberation \
    gconf-service \
    libappindicator1 \
    libasound2 \
    libatk1.0-0 \
    libcairo2 \
    libcups2 \
    libfontconfig1 \
    libgbm-dev \
    libgdk-pixbuf2.0-0 \
    libgtk-3-0 \
    libicu-dev \
    libjpeg-dev \
    libnspr4 \
    libnss3 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libpng-dev \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxtst6 \
    xdg-utils \
    fonts-wqy-zenhei

RUN  npm install npm@8.13.0 -g \
     && apt-get install -y wget gnupg ca-certificates procps dumb-init \
     # We install Chrome to get all the OS level dependencies, but Chrome itself
     # is not actually used as it's packaged in the node puppeteer library.
     # Alternatively, we could could include the entire dep list ourselves
     # (https://github.com/puppeteer/puppeteer/blob/master/docs/troubleshooting.md#chrome-headless-doesnt-launch-on-unix)
     # but that seems too easy to get out of date. \
#     && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
#     && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
#     && apt-get update \
#     && apt-get install -y git \
#     && apt-get install -y google-chrome-stable=98.0.4758.80-1 \
#     && apt-get install -y traceroute \
#     && rm -rf /var/lib/apt/lists/* \
#     && wget --quiet https://raw.githubusercontent.com/vishnubob/wait-for-it/master/wait-for-it.sh -O /usr/sbin/wait-for-it.sh \
#     && chmod +x /usr/sbin/wait-for-it.sh \
# Install Puppeteer under /node_modules so it's available system-wide
     && npm install -g puppeteer@14.4.1 --unsafe-perm=true
# be sure that the version of puppeteer matches the version of google-chrome-stable, otherwise possible high CPU

ENTRYPOINT ["/usr/bin/dumb-init", "--"]
