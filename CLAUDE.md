# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is a production-ready Docker Compose boilerplate for a Node.js web application with MySQL database, Redis cache, and Traefik reverse proxy. Created by Anthony Burak DURSUN.

## Common Development Commands

```bash
# Navigate to boilerplate directory first
cd boilerplate/

# Start all services in development mode (with hot-reload)
docker-compose up -d

# Start services in production mode (without override file)
docker-compose -f docker-compose.yml up -d

# View logs for a specific service
docker-compose logs -f boilerplate-app
docker-compose logs -f boilerplate-mysql
docker-compose logs -f boilerplate-redis
docker-compose logs -f boilerplate-traefik

# Stop all services
docker-compose down

# Stop services and remove volumes (clean slate)
docker-compose down -v

# Rebuild application container after code changes
docker-compose build boilerplate-app

# Access container shells
docker-compose exec boilerplate-app sh
docker-compose exec boilerplate-mysql mysql -u root -p
docker-compose exec boilerplate-redis redis-cli

# Check service health status
docker-compose ps
```

## Architecture & Service Structure

### Core Services
- **boilerplate-app**: Node.js application on port 3000 (internal), exposed via Traefik
- **boilerplate-mysql**: MySQL 8.0 database with custom auth plugin
- **boilerplate-redis**: Redis 7 cache with AOF persistence
- **boilerplate-traefik**: Reverse proxy with automatic SSL via Let's Encrypt

### Network Architecture
- All services communicate via internal network `boilerplate_net`
- Only Traefik exposes ports 80/443 externally
- Database and cache are isolated from external access

### Volume Structure
- `boilerplate_mysql_data`: Database persistence
- `boilerplate_redis_data`: Cache persistence
- `boilerplate_public`: Public assets
- `boilerplate_uploads`: User uploads
- `boilerplate_letsencrypt`: SSL certificates

## Environment Configuration

Environment variables are managed through `.env` file (copy from `.env.example`):
- `APP_DOMAIN`: Your domain for Traefik routing
- `NODE_ENV`: Set to "development" or "production"
- `MYSQL_*`: Database credentials
- `REDIS_PASSWORD`: Redis authentication
- `TRAEFIK_ACME_EMAIL`: Email for SSL certificates

## Development vs Production

### Development Mode (default with docker-compose.override.yml)
- Hot-reload enabled via bind mounts
- NODE_ENV=development
- Application runs with `npm run dev` (nodemon)

### Production Mode
- Use only base docker-compose.yml: `docker-compose -f docker-compose.yml up -d`
- Multi-stage Docker build for minimal image size
- Resource limits enforced (0.5 CPU, 512MB memory)
- Health checks on 30-second intervals
- Log rotation configured

## Key Implementation Details

### Application Container
- Built using multi-stage Dockerfile in `./app`
- Runs as non-root user (`appuser`)
- Alpine Linux base for security
- Health check endpoint expected at `/health`

### Security Features
- Non-root execution in containers
- Network isolation for database/cache
- Resource limits to prevent DoS
- Automatic HTTPS with Traefik
- Password-protected Redis

### Customization Points
- Add MySQL configs in `./mysql/conf.d/`
- Modify Traefik labels in docker-compose.yml for routing rules
- Adjust resource limits in service definitions
- Configure health check endpoints as needed