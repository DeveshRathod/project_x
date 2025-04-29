# Frontend Dockerfile
# Using Node.js 18 Alpine as the base image for the frontend build
FROM node:18-alpine as build

# Accept a build-time argument for the Vite API base
ARG VITE_API_BASE
ENV VITE_API_BASE=$VITE_API_BASE

# Setting the working directory to /app for the frontend application
WORKDIR /app

# Copying frontend package.json and package-lock.json to install dependencies
COPY package*.json ./

# Installing frontend dependencies
RUN npm install

# Copying the rest of the frontend files into the container
COPY . .

# Show VITE_API_BASE to confirm during build
RUN echo "VITE_API_BASE=$VITE_API_BASE"

# Running the build process for the frontend application
RUN npm run build

# Using a smaller, more optimized base image for the final build
FROM nginx:alpine

# Copy the built frontend files from the build stage to nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Exposing port 80 to serve the frontend
EXPOSE 80

# Default command to run nginx
CMD ["nginx", "-g", "daemon off;"]
