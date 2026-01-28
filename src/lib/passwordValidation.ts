// Common weak passwords that should be blocked
const COMMON_PASSWORDS = new Set([
  'password', 'password1', 'password123', '123456', '12345678', '123456789',
  'qwerty', 'abc123', 'monkey', 'master', 'dragon', 'letmein', 'login',
  'welcome', 'admin', 'passw0rd', 'football', 'iloveyou', 'sunshine',
  'princess', 'shadow', 'superman', 'michael', 'ninja', 'mustang',
  'password1!', 'qwerty123', 'admin123', 'root', 'toor', 'pass', 'test',
  '1234567890', '0987654321', 'abcdefgh', 'asdfghjk', 'zxcvbnm',
  'qwertyuiop', 'asdfghjkl', 'zxcvbnm123', '1q2w3e4r', '1qaz2wsx',
  'baseball', 'trustno1', 'access', 'charlie', 'donald', 'batman',
  'starwars', 'whatever', 'freedom', 'nothing', 'secret', 'hunter',
  'hunter2', 'killer', 'pepper', 'joshua', 'maggie', 'jessica',
  'jennifer', 'amanda', 'ashley', 'nicole', 'biteme', 'access14',
  'tigger', 'buster', 'andrew', 'hockey', 'ranger', 'harley',
  'thomas', 'robert', 'soccer', 'jordan', 'george', 'flower',
]);

// Sequential patterns to check
const SEQUENTIAL_PATTERNS = [
  '012345', '123456', '234567', '345678', '456789', '567890',
  'abcdef', 'bcdefg', 'cdefgh', 'defghi', 'efghij',
  'qwerty', 'asdfgh', 'zxcvbn',
];

// Repeated character pattern
const REPEATED_CHAR_REGEX = /(.)\1{3,}/;

export interface PasswordValidationResult {
  isValid: boolean;
  score: number; // 0-4: 0=very weak, 4=strong
  errors: string[];
  suggestions: string[];
}

export function validatePassword(password: string, email?: string): PasswordValidationResult {
  const errors: string[] = [];
  const suggestions: string[] = [];
  let score = 0;

  // Minimum length check
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  } else {
    score += 1;
    if (password.length >= 12) score += 1;
  }

  // Check for common passwords
  if (COMMON_PASSWORDS.has(password.toLowerCase())) {
    errors.push('This password is too common and easily guessed');
  }

  // Check if password contains email username
  if (email) {
    const emailUsername = email.split('@')[0].toLowerCase();
    if (emailUsername.length > 2 && password.toLowerCase().includes(emailUsername)) {
      errors.push('Password should not contain your email address');
    }
  }

  // Check for sequential patterns
  const lowerPassword = password.toLowerCase();
  for (const pattern of SEQUENTIAL_PATTERNS) {
    if (lowerPassword.includes(pattern)) {
      errors.push('Password contains sequential characters (e.g., 123456, abcdef)');
      break;
    }
  }

  // Check for repeated characters
  if (REPEATED_CHAR_REGEX.test(password)) {
    errors.push('Password contains too many repeated characters');
  }

  // Complexity checks
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  if (!hasLower) suggestions.push('Add lowercase letters');
  if (!hasUpper) suggestions.push('Add uppercase letters');
  if (!hasNumber) suggestions.push('Add numbers');
  if (!hasSpecial) suggestions.push('Add special characters (!@#$%^&*)');

  // Add to score based on complexity
  const complexity = [hasLower, hasUpper, hasNumber, hasSpecial].filter(Boolean).length;
  if (complexity >= 3) score += 1;
  if (complexity === 4) score += 1;

  // Cap score at 4
  score = Math.min(score, 4);

  // Reduce score if there are errors
  if (errors.length > 0) {
    score = Math.max(0, score - errors.length);
  }

  return {
    isValid: errors.length === 0 && password.length >= 8,
    score,
    errors,
    suggestions: errors.length === 0 ? suggestions : [],
  };
}

export function getPasswordStrengthLabel(score: number): { label: string; color: string } {
  switch (score) {
    case 0:
      return { label: 'Very Weak', color: 'bg-destructive' };
    case 1:
      return { label: 'Weak', color: 'bg-orange-500' };
    case 2:
      return { label: 'Fair', color: 'bg-yellow-500' };
    case 3:
      return { label: 'Good', color: 'bg-lime-500' };
    case 4:
      return { label: 'Strong', color: 'bg-green-500' };
    default:
      return { label: 'Unknown', color: 'bg-muted' };
  }
}
