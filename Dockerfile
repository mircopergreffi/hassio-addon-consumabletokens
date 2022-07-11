ARG BUILD_FROM
FROM $BUILD_FROM

# Python 3 HTTP Server serves the current working dir
# So let's set it to our add-on persistent data directory
WORKDIR /data

COPY http-server /
RUN cd /http-server & npm install

# Copy data for add-on
COPY run.sh /
RUN chmod a+x /run.sh

CMD [ "/run.sh" ]