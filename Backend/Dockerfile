FROM node:20-alpine

WORKDIR /app

# Copy package descriptors
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies and generate Prisma client
RUN npm ci --only=production
RUN npx prisma generate

# Copy source code
COPY . .

# Expose server port
EXPOSE 4000

ENV NODE_ENV=production

# Start production server
CMD ["node", "index.js"]
