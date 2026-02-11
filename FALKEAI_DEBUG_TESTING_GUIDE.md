# FalkeAI Debug & Testing Guide

## Quick Reference

### Testing the Upload Button Visibility
```bash
# Frontend test (Cypress/Playwright example)
cy.get('[data-testid="upload-book-button"]').should('be.visible')
cy.get('[data-testid="upload-book-button"]').should('have.class', 'bg-gradient-to-r')
```

### Testing Empty State Upload
```bash
# When library has no books
cy.get('[data-testid="empty-state-upload-button"]').should('be.visible')
cy.get('[data-testid="empty-state-upload-button"]').click()
```

### Testing Upload Modal
```bash
# Click upload button and verify modal opens
cy.get('[data-testid="upload-book-button"]').click()
cy.get('[data-testid="upload-book-modal"]').should('be.visible')

# Test file upload
cy.get('[data-testid="file-input"]').selectFile('path/to/file.pdf')
cy.get('[data-testid="book-title-input"]').type('My Book')
cy.get('[data-testid="submit-upload-button"]').click()

# Verify progress bar
cy.get('[data-testid="upload-progress-bar"]').should('be.visible')
```

### Testing Mock Fallback
```bash
# Stop backend service
# Navigate to /library
# Click upload button
# Fill form and submit
# Should use mock FalkeAI validation (2-second delay)
# Console should show: "[DEBUG] Backend FalkeAI unavailable, using mock fallback"
```

### Testing Backend Logging
```bash
# Check backend logs for validation flow
# grep for [DEBUG] in backend logs:

# Example successful flow:
grep -E "🔍.*DEBUG.*validateRequest" server.log
grep -E "✅.*DEBUG.*ENHANCEMENT_SUCCESS" server.log
grep -E "📨.*OpenRouter.*ENHANCED" server.log
grep -E "✅.*DEBUG.*AI_RESPONSE_SUCCESS" server.log

# Example failure:
grep -E "❌.*DEBUG.*Validation FAILED" server.log
grep -E "❌.*DEBUG.*All AI providers failed" server.log
```

---

## Backend Debug Logging Map

### PromptEnhancerService.ts

#### validateRequest() Logs
```
Message: 🔍 [DEBUG] validateRequest() - Incoming request payload:
Contains: receivedType, isNull, isUndefined, rawLength, validationRules

Error Cases:
- MISSING_REQUEST: "User request is required"
  Contains: code, field, receivedValue, receivedType
- INVALID_TYPE: "User request must be a string"
  Contains: code, field, receivedType, expectedType
- EMPTY_REQUEST: "User request cannot be empty"
  Contains: code, field, originalLength, trimmedLength, minRequired
- REQUEST_TOO_LONG: "User request exceeds maximum length..."
  Contains: code, field, length, maxLength, excess

Success:
- ✅ [DEBUG] Request validation PASSED
  Contains: length
```

#### validateAndSanitizeContext() Logs
```
Message: 🔍 [DEBUG] validateAndSanitizeContext() - Incoming context payload:
Contains: hasContext, contextType, contextValue substring

Error Cases:
- ⚠️ [DEBUG] Error validating user context, using defaults
  Contains: error, errorStack

Success:
- ✅ [DEBUG] Context validation PASSED, sanitized context:
  Contains: hasUserId, learningStyle, knowledgeLevel, preferredPace, arrays counts
```

#### safeEnhancePrompt() Logs
```
Message: 🔍 [DEBUG] safeEnhancePrompt() - Entry point:
Contains: step=INCOMING_REQUEST, userRequestType, userRequestLength, requestType

Success:
- ✅ [DEBUG] safeEnhancePrompt() - Success:
  Contains: step=ENHANCEMENT_COMPLETE, finalRequestType, complexity, enhancedRequestLength

Error:
- ❌ [DEBUG] safeEnhancePrompt() - Validation FAILED:
  Contains: step=VALIDATION_FAILED, error, code, field, debugInfo
  debugInfo Contains: rejectedValue (type/length only), validationRules, errorCode
```

---

### AIService.ts

#### executeEnhancedRequestWithRetry() Logs

**STEP 1: Incoming Request**
```json
{
  "step": "INCOMING_REQUEST",
  "messageType": "string",
  "messageLength": 245,
  "requestType": "teach",
  "hasUserLearningContext": true,
  "page": "library"
}
```

**STEP 2: Prompt Enhancement**
```json
{
  "step": "ENHANCEMENT_SUCCESS",
  "requestType": "teach",
  "detectedIntent": "teach",
  "complexity": "medium",
  "originalLength": 245,
  "enhancedLength": 412,
  "systemPromptLength": 256
}
```

**STEP 2 FAILED: Enhancement Error**
```json
{
  "step": "ENHANCEMENT_FAILED",
  "error": "User request must be a string",
  "messageType": "object",
  "messageLength": "N/A",
  "debugInfo": { /* Full debug info */ }
}
```

**STEP 3: AI Model Request**
```json
{
  "step": "AI_MODEL_REQUEST",
  "provider": "openrouter",
  "model": "NVIDIA Nemotron Nano 12B (Smart)",
  "modelId": "nvidia/llama-3.1-nemotron-nano-12b-v1:free",
  "modelType": "smart",
  "enhancedRequestLength": 412,
  "systemPromptLength": 256
}
```

**STEP 3a: OpenRouter Attempt**
```json
{
  "step": "AI_RESPONSE_SUCCESS",
  "provider": "openrouter",
  "model": "NVIDIA Nemotron Nano 12B (Smart)",
  "latency": 2341,
  "responseLength": 1243
}
```

**STEP 3a FAILED: OpenRouter Error**
```json
{
  "step": "OPENROUTER_FAILED",
  "error": "OpenRouter error: Invalid API key",
  "willTryGroq": true
}
```

**STEP 3b: Groq Fallback**
```json
{
  "step": "AI_RESPONSE_SUCCESS",
  "provider": "groq",
  "latency": 3102,
  "responseLength": 987
}
```

**STEP 4: Response Refinement**
```json
{
  "step": "REFINEMENT_SUCCESS",
  "refinedLength": 945,
  "sectionsCount": 3
}
```

**ALL_PROVIDERS_FAILED**
```json
{
  "step": "ALL_PROVIDERS_FAILED",
  "openrouterError": "OpenRouter error: Rate limited",
  "groqError": "No Groq key configured",
  "totalAttemptTime": 8234
}
```

---

## Common Debug Scenarios

### Scenario 1: User submits empty request
```
Frontend → Backend
POST /api/ai/validate-book
{
  "title": "",
  "author": "",
  ...
}

Backend Logs:
[1] 🔍 [DEBUG] validateRequest() - Incoming request payload: { length: 0 }
[2] ❌ [DEBUG] Validation FAILED: empty request { code: EMPTY_REQUEST, ... }
[3] 🔍 [DEBUG] safeEnhancePrompt() - Entry point: { userRequestLength: 0 }
[4] ❌ [DEBUG] safeEnhancePrompt() - Validation FAILED: { debugInfo: { ... } }

Response to Frontend:
{
  "success": false,
  "error": "User request cannot be empty",
  "fallbackMessage": "I'm having trouble thinking right now — try again."
}

Frontend:
→ Show error toast
→ Display error in modal: "Please fill in the book title"
```

### Scenario 2: Backend unavailable, use mock
```
Frontend:
[1] [DEBUG] Starting FalkeAI validation...
[2] [DEBUG] Attempting backend FalkeAI validation call...
[3] [DEBUG] Backend FalkeAI unavailable, using mock fallback: Error: fetch failed

Modal:
→ Progress: 25% "🤖 Validating content with FalkeAI..."
→ Wait 2 seconds (mock delay)
→ Progress: 50% "📤 Uploading file..."
→ Progress: 75% "💾 Processing metadata..."
→ Progress: 100% "✅ Validation passed! Quality: HIGH"

Backend Logs:
(No logs - backend not called)

Frontend Toast:
✅ "Upload successful! Your book has been submitted for FalkeAI validation and approval."
```

### Scenario 3: OpenRouter rate limited, fallback to Groq
```
Backend Logs:
[1] 🔍 [DEBUG] executeEnhancedRequestWithRetry() - STEP 1: Incoming request
[2] ✅ [DEBUG] executeEnhancedRequestWithRetry() - STEP 2 SUCCESS: Prompt enhanced
[3] 📨 [DEBUG] STEP 3a: Trying OpenRouter with ENHANCED prompt (PRIMARY)...
[4] ⚠️ [DEBUG] STEP 3a FAILED: OpenRouter failed { error: "Rate limited" }
[5] 📨 [DEBUG] STEP 3b: Trying Groq with ENHANCED prompt (FALLBACK)...
[6] ✅ [DEBUG] STEP 3b SUCCESS: Groq response received { latency: 3102 }
[7] ✅ [DEBUG] STEP 4 SUCCESS: Response refined

Frontend:
→ Still shows: "🤖 Validating content with FalkeAI..."
→ Backend automatically tried Groq fallback
→ No user-facing indication of which model was used
→ Success toast appears normally
```

### Scenario 4: Validation passes, shows quality
```
Frontend Modal Success State:
- Icon: CheckCircle2 (green)
- Title: "✅ Upload Successful!"
- Message: "Your book has been validated and submitted."
- Validation Info: "✅ Validation passed! Quality: HIGH"

After 2 seconds:
- Modal closes
- Library page refreshes
- Toast appears with validation quality

Backend Response:
{
  "validated": true,
  "quality": "high",
  "feedback": "Content appears well-structured and educational",
  "aiModel": "nvidia/llama-3.1-nemotron-nano-12b-v1:free"
}
```

---

## Environment Variables for Testing

### Disable Backend Validation (Test Mock)
```bash
# Don't set OPENROUTER_API_KEY
# Service will fallback to mock
BACKEND_URL=http://localhost:5000
```

### Enable Verbose Logging
```bash
# Backend
LOG_LEVEL=debug
NODE_ENV=development

# Frontend
VITE_DEBUG=true
```

### Test with Different Providers
```bash
# OpenRouter only
OPENROUTER_API_KEY=sk-or-v1-...

# Groq only
GROQ_API_KEY=gsk_...

# Both (primary + fallback)
OPENROUTER_API_KEY=sk-or-v1-...
GROQ_API_KEY=gsk_...
```

---

## Troubleshooting

### Upload button not visible
- Check: `data-testid="upload-book-button"` in DOM
- Check: CSS classes include `bg-gradient-to-r` and `shadow-2xl`
- Check: Button is not conditional or hidden in parent
- Check: Page renders without errors in console

### Mock validation not working
- Check: `OPENROUTER_API_KEY` is NOT set
- Check: `GROQ_API_KEY` is NOT set
- Check: Browser console shows fallback message
- Check: Progress bar reaches 50% then continues

### Backend validation not being called
- Check: Backend URL is correct in frontend env
- Check: `/api/ai/validate-book` endpoint exists
- Check: Backend logs show incoming request
- Check: CORS is configured correctly
- Check: Token is valid if authentication required

### Progress bar stuck at 25%
- Check: Backend validation endpoint is responding
- Check: No network errors in browser console
- Check: Backend logs show validation attempt
- Check: No timeout errors in backend logs

### Toast notifications not showing
- Check: `useToast` hook imported correctly
- Check: Toast component is in page layout
- Check: Console has no errors related to toast
- Check: CSS classes for toast are loaded

---

## File Locations for Reference

**Backend Debug Logs:**
- `logs/server.log` - Main server logs
- Search for: `[DEBUG]`, `❌`, `✅`, `🔍`, `📨`

**Frontend Test Files:**
- Data attributes: See `FALKEAI_IMPLEMENTATION_COMPLETE.md`
- Mock function: `Library.tsx` line ~45
- Upload modal: `UploadBookModal.tsx`

**Source Files:**
- Backend Services: `aurikrex-backend/src/services/`
  - `PromptEnhancerService.ts`
  - `AIService.ts`
- Frontend Pages: `aurikrex-frontend/src/pages/`
  - `Library.tsx`
- Frontend Components: `aurikrex-frontend/src/components/`
  - `library/UploadBookModal.tsx`

---

## Performance Baseline

Average timings for reference:
- Validation (OpenRouter): 2-3 seconds
- Validation (Groq fallback): 3-4 seconds
- Mock validation: 2 seconds
- File upload: 1-2 seconds (depends on size)
- Total flow: 3-8 seconds

If times are significantly longer, check:
- Network latency (ping provider API)
- File size (check upload size)
- Backend load (check server logs)
- AI provider quotas (check provider dashboards)
