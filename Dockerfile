ARG BUILD_FROM
FROM $BUILD_FROM

WORKDIR /http-server
COPY http-server .
RUN npm install

# Copy data for add-on
COPY run.sh /
RUN chmod a+x /run.sh

CMD [ "/bin/sh" ]
EXPOSE 8081/tcp