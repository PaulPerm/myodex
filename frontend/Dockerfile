# Use official Node image as base
FROM node:20-alpine

# Set working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json first
# (this lets Docker cache the npm install step)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the frontend code
COPY . .

# Expose the port Vite runs on
EXPOSE 5173

# Start the Vite dev server
# host flag makes it accessible outside the container
CMD ["npm", "run", "dev", "--", "--host"]