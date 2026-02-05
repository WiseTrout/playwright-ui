ARG INSTALL_CHROME="1"
FROM mcr.microsoft.com/playwright:v1.57.0-noble
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npx playwright install --with-deps
RUN if [ "$INSTALL_CHROME" = "1" ] ; then npx playwright install chrome ; fi
EXPOSE 3000 9323
CMD ["node", "app.js"]
