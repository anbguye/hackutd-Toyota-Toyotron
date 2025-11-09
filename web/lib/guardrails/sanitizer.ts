/**
 * Guardrails for Nemotron API
 * Prevents sensitive data from being sent to or received from the AI model
 */

export interface SanitizationResult {
  sanitized: string
  removed: string[]
  warnings: string[]
}

/**
 * Patterns for detecting sensitive information
 */
const SENSITIVE_PATTERNS = {
  // Email addresses
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  
  // Phone numbers (US format and international)
  phone: /\b(?:\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}\b/g,
  
  // Credit card numbers (16 digits, with or without spaces/dashes)
  creditCard: /\b(?:\d{4}[-\s]?){3}\d{4}\b/g,
  
  // SSN (Social Security Number)
  ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
  
  // API keys (common patterns)
  apiKey: /\b(?:api[_-]?key|apikey|access[_-]?token|secret[_-]?key)\s*[:=]\s*['"]?([a-zA-Z0-9_\-]{20,})['"]?/gi,
  
  // Passwords (common patterns)
  password: /\b(?:password|passwd|pwd)\s*[:=]\s*['"]?([^\s'"]{6,})['"]?/gi,
  
  // JWT tokens
  jwt: /\beyJ[A-Za-z0-9-_=]+\.eyJ[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*\b/g,
  
  // AWS keys
  awsKey: /\bAKIA[0-9A-Z]{16}\b/g,
  
  // Private keys (RSA, EC, etc.)
  privateKey: /-----BEGIN\s+(?:RSA\s+)?(?:PRIVATE\s+)?KEY-----[\s\S]*?-----END\s+(?:RSA\s+)?(?:PRIVATE\s+)?KEY-----/gi,
  
  // IP addresses (private ranges)
  privateIP: /\b(?:10\.|172\.(?:1[6-9]|2[0-9]|3[01])\.|192\.168\.)\d{1,3}\.\d{1,3}\b/g,
  
  // Database connection strings
  dbConnection: /\b(?:postgres|mysql|mongodb|redis):\/\/[^\s]+/gi,
  
  // Authorization headers
  authHeader: /\b(?:authorization|bearer|token)\s*[:=]\s*['"]?([^\s'"]{20,})['"]?/gi,
}

/**
 * Sensitive keywords that should trigger warnings
 */
const SENSITIVE_KEYWORDS = [
  'password',
  'secret',
  'private key',
  'api key',
  'access token',
  'credit card',
  'ssn',
  'social security',
  'bank account',
  'routing number',
  'pin',
  'passcode',
]

/**
 * Sanitize user input before sending to AI model
 */
export function sanitizeInput(text: string): SanitizationResult {
  let sanitized = text
  const removed: string[] = []
  const warnings: string[] = []

  // Check for sensitive patterns
  for (const [type, pattern] of Object.entries(SENSITIVE_PATTERNS)) {
    const matches = sanitized.match(pattern)
    if (matches) {
      matches.forEach((match) => {
        removed.push(`${type}: ${match.substring(0, 20)}...`)
        // Replace with placeholder
        sanitized = sanitized.replace(match, `[${type.toUpperCase()}_REDACTED]`)
      })
      warnings.push(`Detected and removed ${matches.length} ${type} pattern(s)`)
    }
  }

  // Check for sensitive keywords (case-insensitive)
  const lowerText = sanitized.toLowerCase()
  for (const keyword of SENSITIVE_KEYWORDS) {
    if (lowerText.includes(keyword.toLowerCase())) {
      warnings.push(`Warning: Message contains sensitive keyword "${keyword}"`)
    }
  }

  return {
    sanitized,
    removed,
    warnings,
  }
}

/**
 * Sanitize AI model output before returning to user
 */
export function sanitizeOutput(text: string): SanitizationResult {
  let sanitized = text
  const removed: string[] = []
  const warnings: string[] = []

  // Remove any sensitive patterns from output
  for (const [type, pattern] of Object.entries(SENSITIVE_PATTERNS)) {
    const matches = sanitized.match(pattern)
    if (matches) {
      matches.forEach((match) => {
        removed.push(`${type}: ${match.substring(0, 20)}...`)
        sanitized = sanitized.replace(match, `[${type.toUpperCase()}_REDACTED]`)
      })
      warnings.push(`Removed ${matches.length} ${type} pattern(s) from AI response`)
    }
  }

  // Check for attempts to expose system information
  const systemInfoPatterns = [
    /\b(?:system|env|environment|config|setting)\s*[:=]\s*['"]?([^\s'"]{10,})['"]?/gi,
    /\bprocess\.env\.[A-Z_]+/g,
    /\bNEXT_PUBLIC_[A-Z_]+/g,
  ]

  for (const pattern of systemInfoPatterns) {
    const matches = sanitized.match(pattern)
    if (matches) {
      matches.forEach((match) => {
        removed.push(`system_info: ${match}`)
        sanitized = sanitized.replace(match, '[SYSTEM_INFO_REDACTED]')
      })
      warnings.push('Removed system information from AI response')
    }
  }

  return {
    sanitized,
    removed,
    warnings,
  }
}

/**
 * Check if text contains sensitive information
 */
export function containsSensitiveData(text: string): boolean {
  // Check for any sensitive patterns
  for (const pattern of Object.values(SENSITIVE_PATTERNS)) {
    if (pattern.test(text)) {
      return true
    }
  }

  // Check for sensitive keywords
  const lowerText = text.toLowerCase()
  return SENSITIVE_KEYWORDS.some((keyword) => lowerText.includes(keyword.toLowerCase()))
}

/**
 * Log sanitization activity (for monitoring/auditing)
 */
export function logSanitization(
  type: 'input' | 'output',
  original: string,
  result: SanitizationResult
): void {
  if (result.removed.length > 0 || result.warnings.length > 0) {
    console.warn(`[GUARDRAILS] ${type.toUpperCase()} sanitization:`, {
      removedCount: result.removed.length,
      warnings: result.warnings,
      originalLength: original.length,
      sanitizedLength: result.sanitized.length,
      // Don't log the actual removed content for security
    })
  }
}

