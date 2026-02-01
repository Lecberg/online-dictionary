/**
 * Theme Manager
 * Robustly handles switching between Oceanic (Dark) and White Frosted (Light) themes
 */

const THEME_KEY = "lexicon-theme";
const SPRITE_PATH = "/src/assets/icons/sprite.svg";

// Apply class immediately to prevent flash of un-themed content
(function () {
  const savedTheme = localStorage.getItem(THEME_KEY) || "dark";
  if (savedTheme === "light") {
    document.documentElement.classList.add("light-mode");
    // Also apply to body if it exists, otherwise wait
    if (document.body) document.body.classList.add("light-mode");
  }
})();

function initTheme() {
  if (window.__themeInit) return;
  window.__themeInit = true;

  const savedTheme = localStorage.getItem(THEME_KEY) || "dark";
  applyTheme(savedTheme);

  // Use event delegation on document.body for robustness
  document.body.addEventListener("click", (e) => {
    const btn = e.target.closest(".theme-toggle-btn");
    if (btn) {
      const isLight = document.body.classList.contains("light-mode");
      const newTheme = isLight ? "dark" : "light";
      applyTheme(newTheme);
      localStorage.setItem(THEME_KEY, newTheme);
    }
  });
}

function applyTheme(theme) {
  const isLight = theme === "light";
  const iconId = isLight ? "icon-moon" : "icon-sun";

  // Toggle class on both html and body for broad CSS variable support
  document.documentElement.classList.toggle("light-mode", isLight);
  document.body.classList.toggle("light-mode", isLight);

  // Update all theme icons using a compatible method
  document.querySelectorAll(".theme-icon-use").forEach((use) => {
    const fullPath = `${SPRITE_PATH}#${iconId}`;
    use.setAttribute("href", fullPath);
    // Legacy support for some browsers
    use.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", fullPath);

    // Force re-render for SVG use elements in some mobile browsers
    const parent = use.parentNode;
    if (parent) {
      const clone = parent.cloneNode(true);
      parent.parentNode.replaceChild(clone, parent);
    }
  });
}

// Ensure initialization
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initTheme);
} else {
  initTheme();
}
