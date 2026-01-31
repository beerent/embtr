#!/bin/bash

# Database Setup Script
# This script sets up a database environment based on DATABASE_URL and DIRECT_URL
# It's idempotent - can be run multiple times safely

set -e  # Exit on error

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# Function to parse PostgreSQL connection string
parse_db_url() {
    local url=$1

    # Extract components using regex
    if [[ $url =~ postgresql://([^:@]+)(:([^@]+))?@([^:/]+):?([0-9]+)?/([^?]+)(\?(.+))? ]]; then
        DB_USER="${BASH_REMATCH[1]}"
        DB_PASS="${BASH_REMATCH[3]}"
        DB_HOST="${BASH_REMATCH[4]}"
        DB_PORT="${BASH_REMATCH[5]:-5432}"
        DB_NAME="${BASH_REMATCH[6]}"
        DB_PARAMS="${BASH_REMATCH[8]}"

        # Extract schema from parameters
        if [[ $DB_PARAMS =~ schema=([^&]+) ]]; then
            DB_SCHEMA="${BASH_REMATCH[1]}"
        else
            DB_SCHEMA="public"
        fi

        # Check if this is Supabase
        if [[ $DB_HOST == *"supabase.com"* ]] || [[ $DB_HOST == *"supabase.co"* ]]; then
            IS_SUPABASE=true
        else
            IS_SUPABASE=false
        fi
    else
        error "Failed to parse DATABASE_URL: $url"
        exit 1
    fi
}

# Function to check if database exists
database_exists() {
    local db_name=$1
    local connect_db=${2:-postgres}

    if [ "$IS_SUPABASE" = true ]; then
        # For Supabase, the database always exists, check schema instead
        return 0
    else
        # For local PostgreSQL
        PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$connect_db" \
            -tAc "SELECT 1 FROM pg_database WHERE datname='$db_name'" 2>/dev/null | grep -q 1
    fi
}

# Function to check if schema exists
schema_exists() {
    local schema_name=$1

    PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
        -tAc "SELECT 1 FROM information_schema.schemata WHERE schema_name='$schema_name'" 2>/dev/null | grep -q 1
}

# Function to check if user exists
user_exists() {
    local username=$1

    if [ "$IS_SUPABASE" = true ]; then
        # For Supabase, we can't manage users
        return 0
    else
        PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "postgres" \
            -tAc "SELECT 1 FROM pg_roles WHERE rolname='$username'" 2>/dev/null | grep -q 1
    fi
}

# Function to create database
create_database() {
    local db_name=$1

    if [ "$IS_SUPABASE" = true ]; then
        log "Supabase database already exists, skipping database creation"
        return 0
    fi

    log "Creating database: $db_name"
    PGPASSWORD="$DB_PASS" createdb -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$db_name" || {
        warn "Database creation failed or database already exists"
    }
}

# Function to create schema
create_schema() {
    local schema_name=$1

    log "Creating schema: $schema_name"
    PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
        -c "CREATE SCHEMA IF NOT EXISTS \"$schema_name\";" || {
        error "Failed to create schema: $schema_name"
        return 1
    }
}

# Function to create Supabase compatibility roles for local development
create_supabase_roles() {
    if [ "$IS_SUPABASE" = true ]; then
        log "Running on Supabase, roles already exist"
        return 0
    fi

    log "Creating Supabase compatibility roles for local development..."

    # Create roles that exist in Supabase but not in local PostgreSQL
    PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "
        -- Create authenticated role if it doesn't exist
        DO \$\$
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
                CREATE ROLE authenticated;
                GRANT USAGE ON SCHEMA public TO authenticated;
                GRANT USAGE ON SCHEMA \"$DB_SCHEMA\" TO authenticated;
                GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
                GRANT SELECT ON ALL TABLES IN SCHEMA \"$DB_SCHEMA\" TO authenticated;
            END IF;
        END\$\$;

        -- Create anon role if it doesn't exist
        DO \$\$
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
                CREATE ROLE anon;
                GRANT USAGE ON SCHEMA public TO anon;
                GRANT USAGE ON SCHEMA \"$DB_SCHEMA\" TO anon;
            END IF;
        END\$\$;

        -- Create service_role if it doesn't exist
        DO \$\$
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
                CREATE ROLE service_role;
                GRANT ALL ON SCHEMA public TO service_role;
                GRANT ALL ON SCHEMA \"$DB_SCHEMA\" TO service_role;
                GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
                GRANT ALL ON ALL TABLES IN SCHEMA \"$DB_SCHEMA\" TO service_role;
            END IF;
        END\$\$;
    " || {
        warn "Supabase role creation failed (may be normal for some configurations)"
    }

    success "Supabase compatibility roles created"
}

# Function to setup database permissions
setup_permissions() {
    if [ "$IS_SUPABASE" = true ]; then
        log "Supabase manages permissions, skipping permission setup"
        return 0
    fi

    log "Setting up permissions for schema: $DB_SCHEMA"
    PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "
        GRANT USAGE ON SCHEMA \"$DB_SCHEMA\" TO \"$DB_USER\";
        GRANT CREATE ON SCHEMA \"$DB_SCHEMA\" TO \"$DB_USER\";
        GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA \"$DB_SCHEMA\" TO \"$DB_USER\";
        GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA \"$DB_SCHEMA\" TO \"$DB_USER\";
        GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA \"$DB_SCHEMA\" TO \"$DB_USER\";
        -- Set default privileges for future objects
        ALTER DEFAULT PRIVILEGES IN SCHEMA \"$DB_SCHEMA\" GRANT ALL PRIVILEGES ON TABLES TO \"$DB_USER\";
        ALTER DEFAULT PRIVILEGES IN SCHEMA \"$DB_SCHEMA\" GRANT ALL PRIVILEGES ON SEQUENCES TO \"$DB_USER\";
        ALTER DEFAULT PRIVILEGES IN SCHEMA \"$DB_SCHEMA\" GRANT ALL PRIVILEGES ON FUNCTIONS TO \"$DB_USER\";
    " || {
        warn "Permission setup failed (may be normal for some configurations)"
    }
}

# Main setup function
main() {
    log "Starting embtr database setup..."

    # Check if required environment variables exist
    if [ -z "$DATABASE_URL" ]; then
        error "DATABASE_URL is not set in .env file"
        exit 1
    fi

    if [ -z "$DIRECT_URL" ]; then
        error "DIRECT_URL is not set in .env file"
        exit 1
    fi

    # Parse database URL
    log "Parsing database configuration..."
    parse_db_url "$DATABASE_URL"

    log "Database configuration:"
    log "  Host: $DB_HOST"
    log "  Port: $DB_PORT"
    log "  Database: $DB_NAME"
    log "  User: $DB_USER"
    log "  Schema: $DB_SCHEMA"
    log "  Is Supabase: $IS_SUPABASE"

    # Step 1: Create database if it doesn't exist
    if database_exists "$DB_NAME"; then
        success "Database '$DB_NAME' already exists"
    else
        create_database "$DB_NAME"
        success "Database '$DB_NAME' created"
    fi

    # Step 2: Create schema if it doesn't exist
    if schema_exists "$DB_SCHEMA"; then
        success "Schema '$DB_SCHEMA' already exists"
    else
        create_schema "$DB_SCHEMA"
        success "Schema '$DB_SCHEMA' created"
    fi

    # Step 3: Create Supabase compatibility roles (local only)
    create_supabase_roles

    # Step 4: Setup permissions
    setup_permissions

    # Database is now ready for migrations
    log "Database setup complete. Ready for migrations."

    success "embtr database setup completed successfully!"

    log "Next steps:"
    log "  1. Run Prisma migrations: 'npx prisma migrate deploy'"
    log "  2. Regenerate schemas: './scripts/rebuild.sh'"
    log "  3. Start your application: 'npm run dev'"
}

# Check if we have required tools
check_dependencies() {
    local missing_deps=()

    if ! command -v psql &> /dev/null; then
        missing_deps+=("postgresql-client (psql)")
    fi

    if ! command -v npx &> /dev/null; then
        missing_deps+=("node.js (npx)")
    fi

    if [ ${#missing_deps[@]} -ne 0 ]; then
        error "Missing required dependencies:"
        for dep in "${missing_deps[@]}"; do
            echo "  - $dep"
        done
        error "Please install missing dependencies and try again"
        exit 1
    fi
}

# Run dependency check first
check_dependencies

# Change to the project root directory
cd "$(dirname "$0")/.."

# Run main setup
main

log "Setup script completed. Database is ready!"
