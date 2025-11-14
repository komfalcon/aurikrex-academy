#!/bin/bash

# Production Environment Setup Script
# This script helps configure environment variables for production deployment

set -e

echo "================================================"
echo "Firebase Authentication Production Setup"
echo "================================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Project configuration
PROJECT_ID="aurikrex-academy1"
FIREBASE_REGION="us-central1"

echo -e "${YELLOW}This script will help you configure production environment variables.${NC}"
echo ""

# Function to prompt for input with default
prompt_with_default() {
    local prompt="$1"
    local default="$2"
    local var_name="$3"
    
    read -p "$prompt [$default]: " value
    value="${value:-$default}"
    eval "$var_name='$value'"
}

# Check if running in repository root
if [ ! -f "firebase.json" ]; then
    echo -e "${RED}Error: This script must be run from the repository root${NC}"
    exit 1
fi

echo "Step 1: Frontend Environment Variables"
echo "======================================="
echo ""

# Frontend configuration
FRONTEND_ENV_FILE="aurikrex-frontend/.env"

echo -e "${YELLOW}Configuring frontend environment...${NC}"
echo ""
echo "You can find these values in Firebase Console:"
echo "https://console.firebase.google.com/project/${PROJECT_ID}/settings/general"
echo ""

prompt_with_default "Firebase API Key" "your-api-key" FIREBASE_API_KEY
prompt_with_default "Firebase Auth Domain" "${PROJECT_ID}.firebaseapp.com" FIREBASE_AUTH_DOMAIN
prompt_with_default "Firebase Project ID" "${PROJECT_ID}" FIREBASE_PROJECT_ID
prompt_with_default "Firebase Storage Bucket" "${PROJECT_ID}.appspot.com" FIREBASE_STORAGE_BUCKET
prompt_with_default "Firebase Messaging Sender ID" "your-sender-id" FIREBASE_MESSAGING_SENDER_ID
prompt_with_default "Firebase App ID" "your-app-id" FIREBASE_APP_ID

echo ""
echo -e "${YELLOW}For production deployment, which API URL do you want to use?${NC}"
echo "1. Relative URL (recommended - works on all domains): /api"
echo "2. Direct Cloud Function URL: https://${FIREBASE_REGION}-${PROJECT_ID}.cloudfunctions.net/api"
echo ""
read -p "Select option (1 or 2) [1]: " api_option
api_option="${api_option:-1}"

if [ "$api_option" = "1" ]; then
    API_URL="/api"
else
    API_URL="https://${FIREBASE_REGION}-${PROJECT_ID}.cloudfunctions.net/api"
fi

# Create frontend .env file
cat > "$FRONTEND_ENV_FILE" << EOF
# Firebase Configuration
VITE_FIREBASE_API_KEY=${FIREBASE_API_KEY}
VITE_FIREBASE_AUTH_DOMAIN=${FIREBASE_AUTH_DOMAIN}
VITE_FIREBASE_PROJECT_ID=${FIREBASE_PROJECT_ID}
VITE_FIREBASE_STORAGE_BUCKET=${FIREBASE_STORAGE_BUCKET}
VITE_FIREBASE_MESSAGING_SENDER_ID=${FIREBASE_MESSAGING_SENDER_ID}
VITE_FIREBASE_APP_ID=${FIREBASE_APP_ID}

# Backend API URL
VITE_API_URL=${API_URL}
EOF

echo ""
echo -e "${GREEN}✓ Frontend .env file created at: ${FRONTEND_ENV_FILE}${NC}"
echo ""

# Cloud Functions configuration
echo ""
echo "Step 2: Cloud Functions Environment Configuration"
echo "=================================================="
echo ""

echo -e "${YELLOW}Do you want to set Cloud Functions production config? (y/n)${NC}"
read -p "This will configure allowed origins and email settings [y]: " setup_functions
setup_functions="${setup_functions:-y}"

if [ "$setup_functions" = "y" ] || [ "$setup_functions" = "Y" ]; then
    echo ""
    echo "Setting up allowed origins..."
    
    # Check if Firebase CLI is installed
    if ! command -v firebase &> /dev/null; then
        echo -e "${RED}Error: Firebase CLI not found. Please install it first:${NC}"
        echo "npm install -g firebase-tools"
        exit 1
    fi
    
    # Default origins
    DEFAULT_ORIGINS="https://aurikrex-academy12.web.app,https://aurikrex-academy12.firebaseapp.com,https://aurikrex.tech"
    
    prompt_with_default "Allowed CORS Origins (comma-separated)" "$DEFAULT_ORIGINS" ALLOWED_ORIGINS
    
    echo ""
    echo -e "${YELLOW}Do you want to configure email settings? (y/n)${NC}"
    read -p "Required for email/password authentication with OTP [n]: " setup_email
    setup_email="${setup_email:-n}"
    
    if [ "$setup_email" = "y" ] || [ "$setup_email" = "Y" ]; then
        prompt_with_default "Email Host" "smtp.titan.email" EMAIL_HOST
        prompt_with_default "Email Port" "465" EMAIL_PORT
        prompt_with_default "Email User" "info@aurikrex.tech" EMAIL_USER
        read -sp "Email Password: " EMAIL_PASS
        echo ""
        
        # Set all configs
        echo ""
        echo "Setting Firebase Functions config..."
        firebase functions:config:set \
            app.allowed_origins="$ALLOWED_ORIGINS" \
            email.host="$EMAIL_HOST" \
            email.port="$EMAIL_PORT" \
            email.user="$EMAIL_USER" \
            email.pass="$EMAIL_PASS" \
            --project "$PROJECT_ID"
    else
        # Set only CORS config
        echo ""
        echo "Setting Firebase Functions config..."
        firebase functions:config:set \
            app.allowed_origins="$ALLOWED_ORIGINS" \
            --project "$PROJECT_ID"
    fi
    
    echo ""
    echo -e "${GREEN}✓ Cloud Functions config set successfully${NC}"
    echo ""
    echo "To view current config, run:"
    echo "  firebase functions:config:get --project $PROJECT_ID"
fi

echo ""
echo "Step 3: Build and Deploy"
echo "========================"
echo ""

echo -e "${YELLOW}Do you want to build the project now? (y/n)${NC}"
read -p "This will build both frontend and functions [y]: " do_build
do_build="${do_build:-y}"

if [ "$do_build" = "y" ] || [ "$do_build" = "Y" ]; then
    echo ""
    echo "Building frontend..."
    cd aurikrex-frontend
    npm run build
    cd ..
    
    echo ""
    echo "Building Cloud Functions..."
    cd functions
    npm run build
    cd ..
    
    echo ""
    echo -e "${GREEN}✓ Build completed successfully${NC}"
    
    echo ""
    echo -e "${YELLOW}Do you want to deploy to Firebase now? (y/n)${NC}"
    read -p "This will deploy hosting and functions [n]: " do_deploy
    do_deploy="${do_deploy:-n}"
    
    if [ "$do_deploy" = "y" ] || [ "$do_deploy" = "Y" ]; then
        echo ""
        echo "Deploying to Firebase..."
        firebase deploy --project "$PROJECT_ID"
        
        echo ""
        echo -e "${GREEN}✓ Deployment completed!${NC}"
    else
        echo ""
        echo "Build completed. To deploy later, run:"
        echo "  firebase deploy --project $PROJECT_ID"
    fi
else
    echo ""
    echo "Setup completed. To build and deploy later:"
    echo "  cd aurikrex-frontend && npm run build"
    echo "  cd ../functions && npm run build"
    echo "  cd .. && firebase deploy --project $PROJECT_ID"
fi

echo ""
echo "================================================"
echo -e "${GREEN}Setup Complete!${NC}"
echo "================================================"
echo ""
echo "Next steps:"
echo "1. Configure Firebase Console (see FIREBASE_CONSOLE_CONFIG.md)"
echo "   - Add authorized domains"
echo "   - Configure Google OAuth redirect URIs"
echo ""
echo "2. Test authentication on all domains:"
echo "   - https://aurikrex-academy12.web.app"
echo "   - https://aurikrex.tech"
echo ""
echo "3. Review the deployment checklist: DEPLOYMENT_CHECKLIST.md"
echo ""
echo "For detailed instructions, see: FIREBASE_AUTH_DEPLOYMENT_GUIDE.md"
echo ""
