# Use the official Node.js image as the base image
FROM node:23.6-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy the rest of the application code to the working directory
COPY src /app/src

# Expose port 3000 to the outside world
EXPOSE 3000

# Command to run the application
CMD [ "npm", "start" ]
