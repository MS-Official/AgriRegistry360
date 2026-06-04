FROM node:20-alpine

# Install curl for health check
RUN apk add --no-cache curl

WORKDIR /app

# Copy package configuration
COPY package*.json ./

# Install dependencies including dev dependencies needed for ng build/serve
RUN npm install

# Copy source code
COPY . .

EXPOSE 4200

CMD ["npm", "start"]
