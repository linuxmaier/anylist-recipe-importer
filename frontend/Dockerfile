# Use Node.js for building the app
FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 5173

# Vite's dev server needs --host to be accessible from outside the container
CMD ["npm", "run", "dev", "--", "--host"]
