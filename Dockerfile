FROM node:20

WORKDIR /app

# copiar solo package.json del backend
COPY backend/package*.json ./

RUN npm install

# copiar código backend
COPY backend .

EXPOSE 3000

CMD ["node", "src/server.js"]