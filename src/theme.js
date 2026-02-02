/**
 * Theme Manager
 * Robustly handles switching between Oceanic (Dark) and White Frosted (Light) themes
 */

const THEME_KEY = "lexicon-theme";
const getSpritePath = () =>
  `${window.APP_BASE_PATH || "./"}src/assets/icons/sprite.svg`;

// Apply class immediately to prevent flash of un-themed content
(function () {
  const savedTheme = localStorage.getItem(THEME_KEY) || "dark";
  if (savedTheme === "light") {
    document.documentElement.classList.add("light-mode");
    if (document.body) document.body.classList.add("light-mode");
  }
})();

function initTheme() {
  if (window.__themeInit) return;
  window.__themeInit = true;

  const savedTheme = localStorage.getItem(THEME_KEY) || "dark";
  applyTheme(savedTheme);

  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".theme-toggle-btn");
    if (btn) {
      e.preventDefault();
      e.stopPropagation();
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

  document.documentElement.classList.toggle("light-mode", isLight);
  document.body.classList.toggle("light-mode", isLight);

  const spritePath = getSpritePath();
  document.querySelectorAll(".theme-icon-use").forEach((use) => {
    const fullPath = `${spritePath}#${iconId}`;
    use.setAttribute("href", fullPath);
    use.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", fullPath);

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
