export const SPLASH_KEY = "maintenance-ai-splash-seen";

export function isDashboardPath(pathname: string) {
  return pathname === "/dashboard" || pathname === "/";
}

export function removeBootScreen() {
  document.documentElement.classList.remove("app-booting");
  document.getElementById("app-boot-screen")?.remove();
}
