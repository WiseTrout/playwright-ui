ARG INSTALL_CHROME="1"
FROM mcr.microsoft.com/playwright:v1.57.0-noble
WORKDIR /app

RUN apt-get update && apt-get install -y gosu && rm -rf /var/lib/apt/lists/*

# Copy and give execution rights to the entrypoint script
COPY ./entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

# Copy library to a backup location
COPY . /app/
RUN rm /app/entrypoint.sh
COPY ./ui-lib /app/ui-lib-backup

RUN npx playwright install --with-deps
RUN if [ "$INSTALL_CHROME" = "1" ] ; then npx playwright install chrome ; fi

ENTRYPOINT ["entrypoint.sh"]

EXPOSE 3000 9323
CMD ["node", "app.js"]