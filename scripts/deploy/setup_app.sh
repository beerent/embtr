#!/bin/bash

# ============================================================================
# Embtr Application Deployment
# Sets up: PostgreSQL database/user, .env, migrations, build, PM2, Nginx, SSL
# Run as root or with sudo from the project root directory
# ============================================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log()     { echo -e "${BLUE}[INFO]${NC} $1"; }
warn()    { echo -e "${YELLOW}[WARN]${NC} $1"; }
error()   { echo -e "${RED}[ERROR]${NC} $1"; }
success() { echo -e "${GREEN}[OK]${NC} $1"; }

# Must run as root
if [ "$EUID" -ne 0 ]; then
    error "Please run as root:  sudo bash scripts/deploy/setup_app.sh"
    exit 1
fi

# Change to project root
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$PROJECT_DIR"
log "Project directory: $PROJECT_DIR"

# ============================================================================
# Gather configuration
# ============================================================================

log "============================================"
log " Embtr Application Setup"
log "============================================"
echo ""

# Domain
read -p "Enter your domain name (e.g. embtr.com): " DOMAIN
if [ -z "$DOMAIN" ]; then
    error "Domain is required"
    exit 1
fi

# Email for SSL
read -p "Enter email for SSL certificate notifications: " SSL_EMAIL
if [ -z "$SSL_EMAIL" ]; then
    error "Email is required for Let's Encrypt"
    exit 1
fi

# Database password
read -sp "Enter a password for the 'embtr_user' PostgreSQL user: " DB_PASSWORD
echo ""
if [ -z "$DB_PASSWORD" ]; then
    error "Database password is required"
    exit 1
fi

# Session secret
SESSION_SECRET=$(openssl rand -hex 32)
log "Generated session secret"

# Port (Next.js)
APP_PORT=3000

echo ""
log "Configuration:"
log "  Domain     : $DOMAIN"
log "  SSL Email  : $SSL_EMAIL"
log "  DB User    : embtr_user"
log "  DB Name    : embtr"
log "  DB Schema  : embtr"
log "  App Port   : $APP_PORT"
echo ""
read -p "Continue? (y/n): " CONFIRM
if [ "$CONFIRM" != "y" ]; then
    log "Aborted."
    exit 0
fi

# ============================================================================
# 1. PostgreSQL: Create user and database
# ============================================================================
log "Setting up PostgreSQL..."

# Create the database user if it doesn't exist
sudo -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='embtr_user'" | grep -q 1 || {
    log "Creating PostgreSQL user: embtr_user"
    sudo -u postgres psql -c "CREATE USER embtr_user WITH PASSWORD '$DB_PASSWORD';"
}
success "PostgreSQL user 'embtr_user' ready"

# Create the database if it doesn't exist
sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='embtr'" | grep -q 1 || {
    log "Creating database: embtr"
    sudo -u postgres createdb -O embtr_user embtr
}
success "Database 'embtr' ready"

# Create the schema and grant permissions
sudo -u postgres psql -d embtr -c "
    CREATE SCHEMA IF NOT EXISTS embtr AUTHORIZATION embtr_user;
    GRANT ALL PRIVILEGES ON DATABASE embtr TO embtr_user;
    GRANT ALL PRIVILEGES ON SCHEMA embtr TO embtr_user;
    GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA embtr TO embtr_user;
    GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA embtr TO embtr_user;
    ALTER DEFAULT PRIVILEGES IN SCHEMA embtr GRANT ALL PRIVILEGES ON TABLES TO embtr_user;
    ALTER DEFAULT PRIVILEGES IN SCHEMA embtr GRANT ALL PRIVILEGES ON SEQUENCES TO embtr_user;
" || warn "Some permission grants may have failed (usually OK)"
success "Schema 'embtr' and permissions configured"

# ============================================================================
# 2. Generate .env file
# ============================================================================
log "Creating .env file..."

cat > "$PROJECT_DIR/.env" <<EOF
DATABASE_URL="postgresql://embtr_user:${DB_PASSWORD}@localhost:5432/embtr?schema=embtr&pgbouncer=true"
DIRECT_URL="postgresql://embtr_user:${DB_PASSWORD}@localhost:5432/embtr?schema=embtr"
SESSION_SECRET="${SESSION_SECRET}"
NEXT_PUBLIC_BASE_URL=https://${DOMAIN}

# Twitch OAuth (optional - register at https://dev.twitch.tv/console)
TWITCH_CLIENT_ID=
TWITCH_CLIENT_SECRET=
TWITCH_REDIRECT_URI=https://${DOMAIN}/auth/twitch/callback
TWITCH_BROADCASTER_ID=
EOF

chmod 600 "$PROJECT_DIR/.env"
success ".env created (permissions: 600)"

# ============================================================================
# 3. Install dependencies
# ============================================================================
log "Installing Node.js dependencies..."
npm ci --production=false
success "Dependencies installed"

# ============================================================================
# 4. Run database setup and migrations
# ============================================================================
log "Running database schema setup..."
bash scripts/setup_database.sh
success "Database schema setup complete"

log "Generating Prisma client..."
npx prisma generate
success "Prisma client generated"

log "Running migrations..."
npm run migrate:deploy
success "Migrations applied"

# ============================================================================
# 5. Build the application
# ============================================================================
log "Building Next.js application..."
npm run build
success "Application built"

# ============================================================================
# 6. PM2 setup
# ============================================================================
log "Setting up PM2..."

# Create ecosystem config if it doesn't exist
if [ ! -f "$PROJECT_DIR/ecosystem.config.js" ]; then
    warn "ecosystem.config.js not found, it should already exist in the repo"
fi

# Stop existing instance if running
pm2 delete embtr 2>/dev/null || true

# Start with ecosystem config
pm2 start ecosystem.config.js
pm2 save
success "PM2 is running embtr"

# ============================================================================
# 7. Nginx configuration
# ============================================================================
log "Configuring Nginx..."

# Generate Nginx config from template
NGINX_CONF="/etc/nginx/sites-available/embtr"

cat > "$NGINX_CONF" <<'NGINX_EOF'
server {
    listen 80;
    listen [::]:80;
    server_name DOMAIN_PLACEHOLDER;

    # Redirect all HTTP to HTTPS (certbot will handle this after cert issuance)
    location / {
        proxy_pass http://127.0.0.1:APP_PORT_PLACEHOLDER;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Static assets with long cache
    location /_next/static/ {
        proxy_pass http://127.0.0.1:APP_PORT_PLACEHOLDER;
        proxy_cache_bypass $http_upgrade;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    # Next.js image optimization
    location /_next/image {
        proxy_pass http://127.0.0.1:APP_PORT_PLACEHOLDER;
        proxy_cache_bypass $http_upgrade;
    }

    client_max_body_size 10M;
}
NGINX_EOF

# Replace placeholders
sed -i "s/DOMAIN_PLACEHOLDER/$DOMAIN/g" "$NGINX_CONF"
sed -i "s/APP_PORT_PLACEHOLDER/$APP_PORT/g" "$NGINX_CONF"

# Enable the site
ln -sf "$NGINX_CONF" /etc/nginx/sites-enabled/embtr

# Remove default site if it exists
rm -f /etc/nginx/sites-enabled/default

# Test and reload
nginx -t
systemctl reload nginx
success "Nginx configured and running"

# ============================================================================
# 8. SSL certificate (Let's Encrypt)
# ============================================================================
log "Obtaining SSL certificate..."
log "Make sure DNS for '$DOMAIN' points to this server's IP before continuing."
echo ""
read -p "Is DNS configured and propagated? (y/n): " DNS_READY
if [ "$DNS_READY" = "y" ]; then
    certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos --email "$SSL_EMAIL" --redirect
    success "SSL certificate installed"

    # Auto-renewal is set up by certbot automatically
    # Verify the timer exists
    systemctl list-timers | grep certbot && success "Auto-renewal timer active" || warn "Set up certbot renewal cron manually"
else
    warn "Skipping SSL. Run this manually when DNS is ready:"
    warn "  sudo certbot --nginx -d $DOMAIN --agree-tos --email $SSL_EMAIL --redirect"
fi

# ============================================================================
# Done
# ============================================================================
echo ""
log "============================================"
success " Embtr deployment complete!"
log "============================================"
echo ""
log "Application:"
log "  URL        : https://$DOMAIN"
log "  PM2 status : pm2 status"
log "  PM2 logs   : pm2 logs embtr"
log "  Restart    : pm2 restart embtr"
echo ""
log "Database:"
log "  User       : embtr_user"
log "  Database   : embtr"
log "  Schema     : embtr"
log "  Connect    : psql -U embtr_user -d embtr"
echo ""
log "Useful commands:"
log "  Rebuild    : npm run build && pm2 restart embtr"
log "  Migrations : npm run migrate:deploy && pm2 restart embtr"
log "  Nginx logs : tail -f /var/log/nginx/error.log"
log "  SSL renew  : sudo certbot renew --dry-run"
