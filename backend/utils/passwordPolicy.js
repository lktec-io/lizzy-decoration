// Min 8 chars, at least one uppercase, one lowercase, one number, one symbol.
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

export function isStrongPassword(password) {
  return typeof password === 'string' && PASSWORD_REGEX.test(password);
}

export const PASSWORD_POLICY_MESSAGE =
  'Password must be at least 8 characters and include an uppercase letter, a lowercase letter, a number and a symbol.';
