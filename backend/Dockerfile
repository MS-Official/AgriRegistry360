FROM node:20-alpine

# Install curl for health check
RUN apk add --no-cache curl

WORKDIR /app

# Copy package configuration
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

EXPOSE 5001

CMD ["npm", "start"]
