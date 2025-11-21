# Use Node.js 18 Alpine as the base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy server files
COPY . .

# Expose port 5000
EXPOSE 5000

# Start the server
CMD ["node", "index.js"]