FROM node:22-alpine

WORKDIR /app

# Copy package.json and package-lock.json first for better caching
COPY package*.json ./

# Install dependencies (including devDependencies like Vite/Tailwind)
RUN npm install

# Copy application source
COPY . .

# Expose port 3000
EXPOSE 3000

# Start development server on all interfaces
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "3000"]
