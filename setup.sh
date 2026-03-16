#!/bin/bash

# 1. Copy .env.example to .env only if .env does not exist
if [ ! -f .env ]; then
    echo "Creating .env from .env.example..."
    cp .env.example .env
fi

# 2. Build and start Docker containers
echo "Building and starting Docker containers..."
docker compose up -d --build

# 3. Wait until PostgreSQL is ready
echo "Waiting for PostgreSQL to be ready..."
until docker compose exec db pg_isready -U postgres > /dev/null 2>&1; do
  echo "PostgreSQL is unavailable - sleeping"
  sleep 2
done

echo "PostgreSQL is ready!"

# 4. Initialize Database
echo "Generating Prisma Client..."
docker compose exec app npx prisma generate

echo "Syncing database schema (prisma db push)..."
# Use db push to bypass the need for a migrations folder in a demo environment
docker compose exec app npx prisma db push --accept-data-loss

echo "Running Prisma seed..."
docker compose exec app npx prisma db seed

# 5. Print success message
echo ""
echo "Setup complete!"
echo "Open http://localhost:3000"