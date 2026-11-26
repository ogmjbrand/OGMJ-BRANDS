/** Returns an error message for an invalid new password, or null if it's acceptable. */
export function validateNewPassword(password: string, confirm: string): string | null {
  if (password.length < 8) return 'Password must be at least 8 characters'
  if (password.length > 72) return 'Password must be 72 characters or fewer'
  if (!/[a-zA-Z]/.test(password) || !/\d/.test(password)) return 'Password must include at least one letter and one number'
  if (password !== confirm) return 'Passwords do not match'
  return null
}
