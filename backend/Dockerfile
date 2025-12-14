FROM node:18-alpine

WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./
COPY prisma ./prisma/

# Installer les dépendances
RUN npm ci

# Générer Prisma Client
RUN npx prisma generate

# Copier le reste du code
COPY . .

# Build de l'application
RUN npm run build

EXPOSE 4000

CMD ["npm", "run", "start:prod"]





