#!/bin/bash

# ============================================================================
# Embtr VPS Server Setup
# Installs: Node.js 20, Nginx, PostgreSQL 16, PM2, Certbot
# Target OS: Ubuntu 22.04+ / Debian 12+
# Run as root or with sudo
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
    error "Please run as root:  sudo bash setup_server.sh"
    exit 1
fi

log "============================================"
log " Embtr VPS Server Setup"
log "============================================"

# --------------------------------------------------
# 1. System update
# --------------------------------------------------
log "Updating system packages..."
apt-get update && apt-get upgrade -y
success "System updated"

# --------------------------------------------------
# 2. Install common utilities
# --------------------------------------------------
log "Installing utilities..."
apt-get install -y curl wget gnupg2 lsb-release ca-certificates software-properties-common ufw git
success "Utilities installed"

# --------------------------------------------------
# 3. Node.js 20 LTS (NodeSource)
# --------------------------------------------------
if command -v node &> /dev/null; then
    NODE_VER=$(node -v)
    success "Node.js already installed: $NODE_VER"
else
    log "Installing Node.js 20 LTS..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
    success "Node.js $(node -v) installed"
fi

# --------------------------------------------------
# 4. PM2 (global)
# --------------------------------------------------
if command -v pm2 &> /dev/null; then
    success "PM2 already installed"
else
    log "Installing PM2..."
    npm install -g pm2
    success "PM2 installed"
fi

# Set PM2 to start on boot for the deploy user (will be configured later)
log "Configuring PM2 startup..."
pm2 startup systemd -u root --hp /root || true

# --------------------------------------------------
# 5. PostgreSQL 16
# --------------------------------------------------
if command -v psql &> /dev/null; then
    PG_VER=$(psql --version)
    success "PostgreSQL already installed: $PG_VER"
else
    log "Installing PostgreSQL 16..."
    sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
    wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | apt-key add -
    apt-get update
    apt-get install -y postgresql-16 postgresql-client-16
    success "PostgreSQL 16 installed"
fi

# Ensure PostgreSQL is running
systemctl enable postgresql
systemctl start postgresql
success "PostgreSQL is running"

# --------------------------------------------------
# 6. Nginx
# --------------------------------------------------
if command -v nginx &> /dev/null; then
    success "Nginx already installed"
else
    log "Installing Nginx..."
    apt-get install -y nginx
    success "Nginx installed"
fi

systemctl enable nginx
systemctl start nginx
success "Nginx is running"

# --------------------------------------------------
# 7. Certbot (Let's Encrypt SSL)
# --------------------------------------------------
if command -v certbot &> /dev/null; then
    success "Certbot already installed"
else
    log "Installing Certbot..."
    apt-get install -y certbot python3-certbot-nginx
    success "Certbot installed"
fi

# --------------------------------------------------
# 8. Firewall (UFW)
# --------------------------------------------------
log "Configuring firewall..."
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable
success "Firewall configured (SSH + HTTP + HTTPS)"

# --------------------------------------------------
# Summary
# --------------------------------------------------
echo ""
log "============================================"
success " Server setup complete!"
log "============================================"
echo ""
log "Installed:"
log "  Node.js  : $(node -v)"
log "  npm      : $(npm -v)"
log "  PM2      : $(pm2 -v)"
log "  PostgreSQL: $(psql --version | head -1)"
log "  Nginx    : $(nginx -v 2>&1)"
log "  Certbot  : $(certbot --version 2>&1)"
echo ""
log "Next step:"
log "  Run setup_app.sh to configure the application"
log "  Usage:  bash scripts/deploy/setup_app.sh"
