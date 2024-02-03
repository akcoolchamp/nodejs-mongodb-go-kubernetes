# Node 18 as base image
FROM node:18

# Setting up working directory
WORKDIR /usr/src/app

# Copying packagae.json and packag-lock.json
COPY package*.json ./

# Install packages
RUN npm install

# Copy the code
COPY . .

# Port to be used
EXPOSE 3000

# Command to run the app
CMD ["node", "index.js"]
