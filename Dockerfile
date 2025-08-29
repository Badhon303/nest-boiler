# 1. Base image
FROM node:20-alpine

# 2. Set working directory
WORKDIR /app

# 3. Copy package.json and package-lock.json
COPY package*.json ./

# 4. Install dependencies
RUN npm install

# 5. Copy the rest of the code
COPY . .

# 6. Build the NestJS project
RUN npm run build

# 7. Expose port (default NestJS port)
EXPOSE 5000

# 8. Start the app
CMD ["node", "dist/main"]
