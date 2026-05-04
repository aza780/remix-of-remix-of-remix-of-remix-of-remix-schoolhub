export function getInitials(email: string): string {
  const local = email.split('@')[0];
  return local.charAt(0).toUpperCase();
}
