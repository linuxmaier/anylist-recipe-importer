# Use the official Node.js 18 image (stable and modern)
FROM node:18-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json (if it exists)
# We copy these FIRST to take advantage of Docker caching.
# If package.json hasn't changed, Docker won't re-install dependencies.
COPY package*.json ./

# Install dependencies defined in package.json
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose port 3001 (must match the port in server.js)
EXPOSE 3001

# Command to run the application
CMD ["node", "server.js"]
