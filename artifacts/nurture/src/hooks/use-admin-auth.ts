const ADMIN_KEY = "nurture_admin_authed";
const ADMIN_PASSWORD = "nurture2026";

export function isAdminAuthed(): boolean {
  return sessionStorage.getItem(ADMIN_KEY) === "true";
}

export function adminLogin(password: string): boolean {
  if (password === ADMIN_PASSWORD) {
    sessionStorage.setItem(ADMIN_KEY, "true");
    return true;
  }
  return false;
}

export function adminLogout(): void {
  sessionStorage.removeItem(ADMIN_KEY);
}
