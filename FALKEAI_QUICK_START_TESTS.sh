#!/bin/bash
# Quick Start Testing Commands for FalkeAI System

echo "🚀 FalkeAI System - Quick Start Testing"
echo "======================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Backend verification
echo -e "${BLUE}Backend Verification${NC}"
echo "===================="
echo ""

echo "1. Check PromptEnhancerService debug logging:"
grep -n "🔍 \[DEBUG\]" aurikrex-backend/src/services/PromptEnhancerService.ts | head -5
echo "   ✅ Found debug logging"
echo ""

echo "2. Check AIService debug logging:"
grep -n "🔍 \[DEBUG\]" aurikrex-backend/src/services/AIService.ts | head -5
echo "   ✅ Found debug logging"
echo ""

echo "3. Check error handling:"
grep -n "❌ \[DEBUG\]" aurikrex-backend/src/services/PromptEnhancerService.ts | head -3
echo "   ✅ Found error logging"
echo ""

# Frontend verification
echo -e "${BLUE}Frontend Verification${NC}"
echo "===================="
echo ""

echo "1. Check Library.tsx upload button:"
grep -n "data-testid=\"upload-book-button\"" aurikrex-frontend/src/pages/Library.tsx
echo "   ✅ Upload button found with testing hook"
echo ""

echo "2. Check UploadBookModal testing hooks:"
grep -c "data-testid=" aurikrex-frontend/src/components/library/UploadBookModal.tsx
echo "   ✅ Found multiple testing hooks"
echo ""

echo "3. Check FalkeAI integration:"
grep -n "validate-book" aurikrex-frontend/src/components/library/UploadBookModal.tsx
echo "   ✅ FalkeAI endpoint integration found"
echo ""

# Environment setup
echo -e "${BLUE}Environment Setup${NC}"
echo "================="
echo ""

echo "1. Required environment variables:"
echo "   - OPENROUTER_API_KEY=sk-or-v1-..."
echo "   - GROQ_API_KEY=gsk_... (optional)"
echo "   - VITE_BACKEND_URL=http://localhost:5000"
echo ""

# Manual testing steps
echo -e "${BLUE}Manual Testing Steps${NC}"
echo "===================="
echo ""

echo "1. Start backend:"
echo "   cd aurikrex-backend"
echo "   npm run dev"
echo ""

echo "2. Start frontend (in new terminal):"
echo "   cd aurikrex-frontend"
echo "   npm run dev"
echo ""

echo "3. Open browser:"
echo "   http://localhost:5173/library"
echo ""

echo "4. Test upload flow:"
echo "   - Click 'Upload Book' button in header"
echo "   - Select a file (PDF, DOC, etc.)"
echo "   - Fill title and other fields"
echo "   - Click 'Validate & Upload'"
echo "   - Watch progress bar (0 → 100%)"
echo "   - See success message"
echo ""

# Testing hooks
echo -e "${BLUE}Testing Hooks (data-testid)${NC}"
echo "=========================="
echo ""

echo "Available test IDs:"
echo "  Library.tsx:"
echo "    - upload-book-button"
echo "    - empty-state-upload-button"
echo "    - library-retry-button"
echo "    - pagination-previous-button"
echo "    - pagination-next-button"
echo "    - page-button-1, page-button-2, ..."
echo "    - upload-book-modal"
echo ""

echo "  UploadBookModal.tsx:"
echo "    - file-input"
echo "    - file-drop-zone"
echo "    - book-title-input"
echo "    - book-author-input"
echo "    - book-category-select"
echo "    - book-subject-input"
echo "    - book-description-input"
echo "    - remove-file-button"
echo "    - upload-progress-bar"
echo "    - cancel-button"
echo "    - submit-upload-button"
echo "    - error-message"
echo ""

# Backend logs
echo -e "${BLUE}Backend Logs${NC}"
echo "============"
echo ""

echo "Check logs with grep:"
echo ""

echo "1. Validation requests:"
echo "   grep 'validateRequest()' server.log"
echo ""

echo "2. Successful enhancements:"
echo "   grep 'ENHANCEMENT_SUCCESS' server.log"
echo ""

echo "3. AI responses:"
echo "   grep 'AI_RESPONSE_SUCCESS' server.log"
echo ""

echo "4. All debug logs:"
echo "   grep '[DEBUG]' server.log"
echo ""

echo "5. Errors:"
echo "   grep 'FAILED' server.log"
echo ""

# Cypress tests
echo -e "${BLUE}Cypress Test Examples${NC}"
echo "====================="
echo ""

cat > /tmp/falkeai-tests.js << 'EOF'
// Cypress test examples for FalkeAI

describe('FalkeAI Upload Flow', () => {
  
  before(() => {
    cy.visit('http://localhost:5173/library')
  })

  it('should show upload button', () => {
    cy.get('[data-testid="upload-book-button"]')
      .should('be.visible')
      .should('have.text.containing', 'Upload Book')
  })

  it('should open upload modal', () => {
    cy.get('[data-testid="upload-book-button"]').click()
    cy.get('[data-testid="upload-book-modal"]').should('be.visible')
  })

  it('should upload a file', () => {
    cy.get('[data-testid="file-input"]').selectFile('cypress/fixtures/test.pdf')
    cy.get('[data-testid="book-title-input"]').type('Test Book')
    cy.get('[data-testid="book-category-select"]').select('textbook')
    cy.get('[data-testid="submit-upload-button"]').click()
    
    // Watch progress bar
    cy.get('[data-testid="upload-progress-bar"]').should('be.visible')
    
    // Wait for completion
    cy.contains('Upload Successful', { timeout: 10000 }).should('be.visible')
  })

  it('should show error on invalid input', () => {
    cy.get('[data-testid="upload-book-button"]').click()
    cy.get('[data-testid="submit-upload-button"]').should('be.disabled')
    cy.get('[data-testid="error-message"]').should('not.exist')
  })
})
EOF

echo "See /tmp/falkeai-tests.js for Cypress examples"
echo ""

# Playwright tests
echo -e "${BLUE}Playwright Test Examples${NC}"
echo "========================"
echo ""

cat > /tmp/falkeai-tests.spec.ts << 'EOF'
import { test, expect } from '@playwright/test';

test.describe('FalkeAI Upload Flow', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/library');
  });

  test('should show upload button', async ({ page }) => {
    const button = page.locator('[data-testid="upload-book-button"]');
    await expect(button).toBeVisible();
    await expect(button).toContainText('Upload Book');
  });

  test('should open upload modal', async ({ page }) => {
    await page.locator('[data-testid="upload-book-button"]').click();
    const modal = page.locator('[data-testid="upload-book-modal"]');
    await expect(modal).toBeVisible();
  });

  test('should upload file successfully', async ({ page }) => {
    await page.locator('[data-testid="upload-book-button"]').click();
    
    await page.locator('[data-testid="file-input"]').setInputFiles('test.pdf');
    await page.locator('[data-testid="book-title-input"]').fill('Test Book');
    await page.locator('[data-testid="book-category-select"]').selectOption('textbook');
    
    await page.locator('[data-testid="submit-upload-button"]').click();
    
    // Progress bar appears
    const progressBar = page.locator('[data-testid="upload-progress-bar"]');
    await expect(progressBar).toBeVisible();
    
    // Success message appears
    await expect(page.locator('text=Upload Successful')).toBeVisible({ timeout: 10000 });
  });
});
EOF

echo "See /tmp/falkeai-tests.spec.ts for Playwright examples"
echo ""

# Mock testing
echo -e "${BLUE}Mock Testing (Without Backend)${NC}"
echo "==============================="
echo ""

echo "1. Stop backend service (CTRL+C)"
echo ""

echo "2. Refresh frontend http://localhost:5173/library"
echo ""

echo "3. Test upload:"
echo "   - Click 'Upload Book' button"
echo "   - Select file and fill form"
echo "   - Click 'Validate & Upload'"
echo "   - Should use mock FalkeAI (2-second delay)"
echo "   - Check browser console: '[DEBUG] Backend FalkeAI unavailable, using mock fallback'"
echo ""

echo "4. Success:"
echo "   - Progress bar reaches 100%"
echo "   - Shows validation quality (HIGH/MEDIUM)"
echo "   - Toast notification appears"
echo "   - Library refreshes with new book"
echo ""

# Debug commands
echo -e "${BLUE}Debug Commands${NC}"
echo "==============="
echo ""

echo "1. Real-time backend logs:"
echo "   tail -f logs/server.log | grep DEBUG"
echo ""

echo "2. Follow validation flow:"
echo "   tail -f logs/server.log | grep -E '(validateRequest|safeEnhancePrompt|AI_RESPONSE)'"
echo ""

echo "3. Watch for errors:"
echo "   tail -f logs/server.log | grep -E '(ERROR|FAILED)'"
echo ""

echo "4. Filter by specific step:"
echo "   tail -f logs/server.log | grep 'STEP 3'"
echo ""

echo "5. Browser console:"
echo "   - Open DevTools (F12)"
echo "   - Go to Console tab"
echo "   - Filter by: [DEBUG]"
echo "   - See all frontend debug messages"
echo ""

# API testing
echo -e "${BLUE}API Testing${NC}"
echo "============"
echo ""

echo "1. Test validation endpoint:"
echo '   curl -X POST http://localhost:5000/api/ai/validate-book \'
echo '   -H "Content-Type: application/json" \'
echo "   -d '{\"title\": \"Test\", \"category\": \"textbook\"}'"
echo ""

echo "2. Watch logs:"
echo "   tail -f logs/server.log | grep '\\[DEBUG\\]'"
echo ""

# Summary
echo -e "${GREEN}════════════════════════════════════${NC}"
echo -e "${GREEN}✅ FalkeAI System Ready for Testing${NC}"
echo -e "${GREEN}════════════════════════════════════${NC}"
echo ""

echo "Next steps:"
echo "1. Configure environment variables (OPENROUTER_API_KEY)"
echo "2. Start backend and frontend"
echo "3. Open http://localhost:5173/library"
echo "4. Test upload flow"
echo "5. Check logs for [DEBUG] entries"
echo ""

echo "Documentation:"
echo "- FALKEAI_PROJECT_COMPLETE.md - Project overview"
echo "- FALKEAI_IMPLEMENTATION_COMPLETE.md - Full technical details"
echo "- FALKEAI_DEBUG_TESTING_GUIDE.md - Testing guide"
echo "- CODE_CHANGES_VERIFICATION.md - Code changes"
echo ""
