# Build stage
FROM node:18-alpine as build

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy source code
COPY . .

# Set build-time environment variables
ARG REACT_APP_API_URL=https://aoadmissionhub.com/api
ARG REACT_APP_BACKEND_URL=https://aoadmissionhub.com
ARG REACT_APP_WEBSOCKET_URL=wss://aoadmissionhub.com

# Set environment variables for build
ENV REACT_APP_API_URL=$REACT_APP_API_URL
ENV REACT_APP_BACKEND_URL=$REACT_APP_BACKEND_URL
ENV REACT_APP_WEBSOCKET_URL=$REACT_APP_WEBSOCKET_URL
ENV GENERATE_SOURCEMAP=false

# Build the app
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built app to nginx
COPY --from=build /app/build /usr/share/nginx/html

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Create volume mount point
VOLUME ["/usr/share/nginx/html"]

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"] 
