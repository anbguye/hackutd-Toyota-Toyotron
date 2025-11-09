# Guardrails for Nemotron API

This module implements comprehensive guardrails to prevent sensitive data from being sent to or received from the Nemotron AI model.

## Features

### Input Sanitization
- **Automatic Detection**: Scans user input for sensitive patterns before sending to AI
- **Pattern Matching**: Detects emails, phone numbers, credit cards, SSNs, API keys, passwords, JWTs, AWS keys, private keys, IP addresses, and database connection strings
- **Redaction**: Automatically replaces sensitive data with placeholders like `[EMAIL_REDACTED]`
- **Logging**: Logs all sanitization activities for monitoring and auditing

### Output Sanitization
- **Response Filtering**: Scans AI responses before returning to users
- **System Information Protection**: Prevents exposure of environment variables, config settings, and system information
- **Fallback Safety**: If sensitive data is detected after sanitization, replaces response with a safe message

### Model-Level Guardrails
- **System Prompt Instructions**: Explicit instructions in the system prompt telling the model to:
  - Never request, store, or repeat sensitive information
  - Decline and redirect if users share sensitive data
  - Never expose system information or internal configuration
  - Only discuss Toyota vehicles and car-related topics

## Protected Data Types

The guardrails protect against:

1. **Personal Identifiable Information (PII)**
   - Email addresses
   - Phone numbers
   - Social Security Numbers (SSN)
   - Physical addresses

2. **Financial Information**
   - Credit card numbers
   - Bank account numbers
   - Routing numbers

3. **Authentication Credentials**
   - Passwords
   - API keys
   - Access tokens
   - JWT tokens
   - AWS keys
   - Private keys

4. **System Information**
   - Environment variables
   - Database connection strings
   - Internal IP addresses
   - Configuration settings

## Usage

The guardrails are automatically applied in the chat API route (`/api/agent/chat`):

```typescript
// Input sanitization (automatic)
const inputSanitization = sanitizeInput(userMessage)
userMessage = inputSanitization.sanitized

// Output sanitization (automatic)
const outputSanitization = sanitizeOutput(aiResponse)
responseMessage = outputSanitization.sanitized
```

## Monitoring

All sanitization activities are logged with:
- Type of sensitive data detected
- Count of removed items
- Warnings for potential issues

Check server logs for `[GUARDRAILS]` entries to monitor protection effectiveness.

## Configuration

To add new sensitive patterns, edit `web/lib/guardrails/sanitizer.ts`:

```typescript
const SENSITIVE_PATTERNS = {
  // Add your custom pattern here
  customPattern: /your-regex-pattern/g,
}
```

## Security Best Practices

1. **Never disable guardrails** - They are critical for data protection
2. **Monitor logs** - Regularly check for sanitization warnings
3. **Update patterns** - Keep sensitive data patterns up to date
4. **Test regularly** - Verify guardrails catch new attack vectors
5. **Review system prompts** - Ensure model instructions are clear and up to date

