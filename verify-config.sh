#!/bin/bash

# Verification Script for Firebase Authentication Configuration
# This script checks if the configuration is properly set up

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "================================================"
echo "Firebase Authentication Configuration Verifier"
echo "================================================"
echo ""

# Track status
ISSUES_FOUND=0

# Function to check file exists
check_file() {
    local file=$1
    local description=$2
    
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓${NC} $description: Found"
        return 0
    else
        echo -e "${RED}✗${NC} $description: Missing"
        ISSUES_FOUND=$((ISSUES_FOUND + 1))
        return 1
    fi
}

# Function to check file contains string
check_file_contains() {
    local file=$1
    local search=$2
    local description=$3
    
    if [ -f "$file" ] && grep -q "$search" "$file"; then
        echo -e "${GREEN}✓${NC} $description: Configured"
        return 0
    else
        echo -e "${RED}✗${NC} $description: Not found or not configured"
        ISSUES_FOUND=$((ISSUES_FOUND + 1))
        return 1
    fi
}

echo "Checking Configuration Files..."
echo "================================"
echo ""

# Check firebase.json
echo "1. Firebase Hosting Configuration"
check_file "firebase.json" "firebase.json"
check_file_contains "firebase.json" '"source": "/api/\*\*"' "API rewrite rule"
check_file_contains "firebase.json" '"function": "api"' "API function target"
echo ""

# Check frontend environment
echo "2. Frontend Environment Configuration"
if [ -f "aurikrex-frontend/.env" ]; then
    echo -e "${GREEN}✓${NC} Production .env file exists"
    
    # Check required variables
    if grep -q "VITE_FIREBASE_API_KEY" "aurikrex-frontend/.env" && ! grep -q "your-api-key" "aurikrex-frontend/.env"; then
        echo -e "${GREEN}✓${NC} VITE_FIREBASE_API_KEY: Set"
    else
        echo -e "${YELLOW}⚠${NC} VITE_FIREBASE_API_KEY: Not set or using placeholder"
        ISSUES_FOUND=$((ISSUES_FOUND + 1))
    fi
    
    if grep -q "VITE_API_URL" "aurikrex-frontend/.env"; then
        API_URL=$(grep "VITE_API_URL" "aurikrex-frontend/.env" | cut -d '=' -f2)
        if [ "$API_URL" = "/api" ]; then
            echo -e "${GREEN}✓${NC} VITE_API_URL: Using relative URL (recommended)"
        else
            echo -e "${YELLOW}ℹ${NC} VITE_API_URL: Using $API_URL (works but relative URL recommended)"
        fi
    else
        echo -e "${RED}✗${NC} VITE_API_URL: Not set"
        ISSUES_FOUND=$((ISSUES_FOUND + 1))
    fi
else
    echo -e "${YELLOW}⚠${NC} Production .env file not found (use .env.example as template)"
    echo -e "${BLUE}→${NC} Run: ./setup-production.sh"
fi
echo ""

# Check functions CORS configuration
echo "3. Cloud Functions CORS Configuration"
check_file_contains "functions/src/index.ts" "aurikrex-academy12.web.app" "Firebase web.app domain in CORS"
check_file_contains "functions/src/index.ts" "aurikrex-academy12.firebaseapp.com" "Firebase firebaseapp.com domain in CORS"
check_file_contains "functions/src/index.ts" "aurikrex.tech" "Custom domain in CORS"
echo ""

# Check builds
echo "4. Build Status"
if [ -d "aurikrex-frontend/dist" ]; then
    echo -e "${GREEN}✓${NC} Frontend build exists"
else
    echo -e "${YELLOW}⚠${NC} Frontend not built yet"
    echo -e "${BLUE}→${NC} Run: cd aurikrex-frontend && npm run build"
fi

if [ -d "functions/lib" ]; then
    echo -e "${GREEN}✓${NC} Functions build exists"
else
    echo -e "${YELLOW}⚠${NC} Functions not built yet"
    echo -e "${BLUE}→${NC} Run: cd functions && npm run build"
fi
echo ""

# Check documentation
echo "5. Documentation Files"
check_file "FIREBASE_AUTH_DEPLOYMENT_GUIDE.md" "Deployment guide"
check_file "FIREBASE_CONSOLE_CONFIG.md" "Console configuration guide"
check_file "DEPLOYMENT_CHECKLIST.md" "Deployment checklist"
check_file "setup-production.sh" "Setup script"
echo ""

# Firebase CLI check
echo "6. Firebase CLI"
if command -v firebase &> /dev/null; then
    FIREBASE_VERSION=$(firebase --version)
    echo -e "${GREEN}✓${NC} Firebase CLI installed: $FIREBASE_VERSION"
    
    # Check if logged in
    if firebase projects:list &> /dev/null; then
        echo -e "${GREEN}✓${NC} Firebase CLI authenticated"
        
        # Check project
        CURRENT_PROJECT=$(firebase use 2>&1 | grep -oP '(?<=Active Project: )\S+' || echo "none")
        if [ "$CURRENT_PROJECT" = "aurikrex-academy1" ]; then
            echo -e "${GREEN}✓${NC} Using correct project: $CURRENT_PROJECT"
        else
            echo -e "${YELLOW}⚠${NC} Current project: $CURRENT_PROJECT (expected: aurikrex-academy1)"
            echo -e "${BLUE}→${NC} Run: firebase use aurikrex-academy1"
        fi
    else
        echo -e "${YELLOW}⚠${NC} Firebase CLI not authenticated"
        echo -e "${BLUE}→${NC} Run: firebase login"
    fi
else
    echo -e "${RED}✗${NC} Firebase CLI not installed"
    echo -e "${BLUE}→${NC} Run: npm install -g firebase-tools"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
fi
echo ""

# Summary
echo "================================================"
echo "Summary"
echo "================================================"
echo ""

if [ $ISSUES_FOUND -eq 0 ]; then
    echo -e "${GREEN}✓ All checks passed!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Configure Firebase Console (see FIREBASE_CONSOLE_CONFIG.md)"
    echo "2. Build and deploy:"
    echo "   cd aurikrex-frontend && npm run build"
    echo "   cd ../functions && npm run build"
    echo "   cd .. && firebase deploy"
    echo "3. Test authentication on all domains"
else
    echo -e "${YELLOW}⚠ Found $ISSUES_FOUND issue(s)${NC}"
    echo ""
    echo "Please address the issues above before deploying."
    echo ""
    echo "Quick fixes:"
    echo "1. Missing .env? Run: ./setup-production.sh"
    echo "2. Not built? Run: cd aurikrex-frontend && npm run build"
    echo "3. Functions not built? Run: cd functions && npm run build"
fi

echo ""
echo "For detailed instructions, see:"
echo "- FIREBASE_AUTH_DEPLOYMENT_GUIDE.md"
echo "- FIREBASE_CONSOLE_CONFIG.md"
echo "- DEPLOYMENT_CHECKLIST.md"
echo ""

exit $ISSUES_FOUND
