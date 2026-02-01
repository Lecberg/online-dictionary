/**
 * Theme Manager
 * Handles switching between Oceanic (Dark) and White Frosted (Light) themes
 */

const THEME_KEY = "lexicon-theme";

function initTheme() {
  const savedTheme = localStorage.getItem(THEME_KEY) || "dark";
  applyTheme(savedTheme);

  const toggleBtns = [
    document.getElementById("themeToggleBtn"),
    document.getElementById("themeToggleGuestBtn"),
  ];

  toggleBtns.forEach((btn) => {
    if (btn) {
      btn.addEventListener("click", toggleTheme);
    }
  });
}

function toggleTheme() {
  const isLight = document.body.classList.contains("light-mode");
  const newTheme = isLight ? "dark" : "light";
  applyTheme(newTheme);
  localStorage.setItem(THEME_KEY, newTheme);
}

function applyTheme(theme) {
  const iconPaths = {
    dark: "/src/assets/icons/sprite.svg#icon-sun",
    light: "/src/assets/icons/sprite.svg#icon-moon",
  };

  if (theme === "light") {
    document.body.classList.add("light-mode");
  } else {
    document.body.classList.remove("light-mode");
  }

  // Update all theme icons
  ["themeIcon", "themeIconGuest"].forEach((id) => {
    const iconUse = document.getElementById(id);
    if (iconUse) {
      iconUse.setAttribute("href", iconPaths[theme]);
    }
  });
}

// Initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initTheme);
} else {
  initTheme();
}
