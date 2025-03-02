# Use an official Node.js runtime as a parent image
FROM node:20

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install app dependencies
RUN npm install

# Install PM2 globally
RUN npm install pm2 -g

# OPTIONAL: Set up PM2 public and secret keys for PM2.io monitoring
# Replace with your actual keys if needed
ENV PM2_PUBLIC_KEY umstlp2tf3o2633
ENV PM2_SECRET_KEY 3p1uhealoklonhx

# Bundle app source
COPY . .

# Expose the port your app runs on
EXPOSE 5500

# Use PM2 to run your app instead of 'node index.js'
CMD ["pm2-runtime", "index.js"]
