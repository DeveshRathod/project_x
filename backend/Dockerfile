# Backend Dockerfile
# Using Node.js 18 Alpine as the base image for the backend
FROM node:18-alpine

# Declare build-time arguments
ARG DB_NAME
ARG DB_USER
ARG DB_PASS
ARG DB_HOST
ARG JWT_SECRET
ARG STRIPE_KEY

# Set environment variables from build args (for runtime usage)
ENV DB_NAME=$DB_NAME \
    DB_USER=$DB_USER \
    DB_PASS=$DB_PASS \
    DB_HOST=$DB_HOST \
    JWT_SECRET=$JWT_SECRET \
    STRIPE_KEY=$STRIPE_KEY

# Setting the working directory to /app for the backend application
WORKDIR /app

# Copying backend package.json and package-lock.json to install dependencies
COPY package*.json ./

# Installing backend dependencies
RUN npm install

# Copying the rest of the backend code into the container
COPY . .

# Exposing port 4000 to access the backend API
EXPOSE 4000

# Setting the command to run the backend server when the container starts
CMD ["node", "index.js"]
