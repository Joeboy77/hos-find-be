#!/bin/bash

# HosFind Email Verification Fields Setup Script
# This script adds email verification fields to the database

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to show usage
show_usage() {
    echo "HosFind Email Verification Fields Setup"
    echo "======================================="
    echo ""
    echo "Usage: $0 [environment]"
    echo ""
    echo "Environments:"
    echo "  local       Apply to local database (default)"
    echo "  production  Apply to production database"
    echo "  both        Apply to both local and production databases"
    echo ""
    echo "Environment Variables for Production:"
    echo "  PROD_DB_HOST      Production database host"
    echo "  PROD_DB_PORT      Production database port (default: 5432)"
    echo "  PROD_DB_NAME      Production database name"
    echo "  PROD_DB_USER      Production database user"
    echo "  PROD_DB_PASSWORD  Production database password"
    echo "  PROD_DB_SSL       Enable SSL for production (true/false)"
    echo ""
    echo "Examples:"
    echo "  $0 local"
    echo "  $0 production"
    echo "  $0 both"
    echo ""
    echo "Options:"
    echo "  -h, --help  Show this help message"
}

# Check if help is requested
if [[ "$1" == "-h" || "$1" == "--help" ]]; then
    show_usage
    exit 0
fi

# Get environment from argument or default to local
ENVIRONMENT=${1:-local}

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

print_status "Starting HosFind Email Verification Fields Setup..."
print_status "Environment: $ENVIRONMENT"
print_status "Project root: $PROJECT_ROOT"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if the script file exists
SCRIPT_FILE="$SCRIPT_DIR/add-email-verification-fields.js"
if [[ ! -f "$SCRIPT_FILE" ]]; then
    print_error "Script file not found: $SCRIPT_FILE"
    exit 1
fi

# Check if SQL file exists
SQL_FILE="$SCRIPT_DIR/add-email-verification-fields.sql"
if [[ ! -f "$SQL_FILE" ]]; then
    print_error "SQL file not found: $SQL_FILE"
    exit 1
fi

# Change to project root directory
cd "$PROJECT_ROOT"

# Check if package.json exists (to ensure we're in the right directory)
if [[ ! -f "package.json" ]]; then
    print_error "package.json not found. Are you in the correct project directory?"
    exit 1
fi

# Install pg dependency if not already installed
print_status "Checking for required dependencies..."
if ! npm list pg &> /dev/null; then
    print_status "Installing pg dependency..."
    npm install pg
fi

# Run the Node.js script
print_status "Running email verification fields setup..."
node "$SCRIPT_FILE" "$ENVIRONMENT"

if [[ $? -eq 0 ]]; then
    print_success "Email verification fields setup completed successfully!"
    echo ""
    print_status "Next steps:"
    echo "  1. Restart your backend server"
    echo "  2. Test the signup flow with email verification"
    echo "  3. Verify that emails are being sent correctly"
else
    print_error "Email verification fields setup failed!"
    exit 1
fi