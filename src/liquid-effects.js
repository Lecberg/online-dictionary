/**
 * Liquid Glass Effects
 * Handles particle animations and floating bubbles
 */

// Configuration
const CONFIG = {
  particles: {
    count: 30,
    minSize: 5,
    maxSize: 25,
    minDuration: 15,
    maxDuration: 35,
  },
  bubbles: {
    count: 15,
    minSize: 50,
    maxSize: 150,
    minDuration: 10,
    maxDuration: 20,
  },
};

/**
 * Create background particles
 */
function createParticles() {
  const container = document.getElementById("particles-container");
  if (!container) return;

  // Clear existing particles
  container.innerHTML = "";

  for (let i = 0; i < CONFIG.particles.count; i++) {
    const particle = document.createElement("div");
    particle.classList.add("particle");

    // Random properties
    const size =
      Math.random() * (CONFIG.particles.maxSize - CONFIG.particles.minSize) +
      CONFIG.particles.minSize;
    const posX = Math.random() * 100;
    const posY = Math.random() * 100;
    const delay = Math.random() * 10;
    const duration =
      Math.random() *
        (CONFIG.particles.maxDuration - CONFIG.particles.minDuration) +
      CONFIG.particles.minDuration;

    particle.style.width = `${size}px`;
    particle.style.height = `${size}px`;
    particle.style.left = `${posX}vw`;
    particle.style.top = `${posY}vh`;
    particle.style.animationDelay = `-${delay}s`;
    particle.style.animationDuration = `${duration}s`;
    particle.style.opacity = Math.random() * 0.5 + 0.1;

    container.appendChild(particle);
  }
}

/**
 * Create liquid bubbles inside a glass card
 * @param {HTMLElement} layerElement - The liquid layer container
 */
function createBubbles(layerElement) {
  if (!layerElement) return;

  // Clear existing bubbles
  layerElement.innerHTML = "";

  for (let i = 0; i < CONFIG.bubbles.count; i++) {
    const bubble = document.createElement("div");
    bubble.classList.add("bubble");

    // Random properties
    const size =
      Math.random() * (CONFIG.bubbles.maxSize - CONFIG.bubbles.minSize) +
      CONFIG.bubbles.minSize;
    const posX = Math.random() * 100;
    const posY = Math.random() * 100;
    const delay = Math.random() * 5;
    const duration =
      Math.random() *
        (CONFIG.bubbles.maxDuration - CONFIG.bubbles.minDuration) +
      CONFIG.bubbles.minDuration;

    bubble.style.width = `${size}px`;
    bubble.style.height = `${size}px`;
    bubble.style.left = `${posX}%`;
    bubble.style.top = `${posY}%`;
    bubble.style.animationDelay = `-${delay}s`;
    bubble.style.animationDuration = `${duration}s`;
    bubble.style.opacity = Math.random() * 0.3 + 0.1;

    layerElement.appendChild(bubble);
  }
}

/**
 * Initialize liquid bubbles for all glass cards
 */
function initLiquidBubbles() {
  // Initialize bubbles for Word of the Day card
  const wodLayer = document.getElementById("wodLiquidLayer");
  if (wodLayer) {
    createBubbles(wodLayer);
  }

  // Initialize bubbles for results card
  const resultsLayer = document.getElementById("resultsLiquidLayer");
  if (resultsLayer) {
    createBubbles(resultsLayer);
  }

  // Watch for results section becoming visible
  const resultsSection = document.getElementById("resultsSection");
  if (resultsSection) {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.type === "attributes" &&
          mutation.attributeName === "class"
        ) {
          if (!resultsSection.classList.contains("hidden")) {
            // Recreate bubbles when card becomes visible
            setTimeout(() => createBubbles(resultsLayer), 100);
          }
        }
      });
    });

    observer.observe(resultsSection, { attributes: true });
  }
}

/**
 * Handle window resize
 */
function handleResize() {
  // Recreate particles on resize
  createParticles();
}

/**
 * Initialize all liquid glass effects
 */
function initLiquidEffects() {
  createParticles();
  initLiquidBubbles();

  window.addEventListener("resize", handleResize);
}

// Initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initLiquidEffects);
} else {
  initLiquidEffects();
}

// Re-initialize bubbles when content changes
window.addEventListener("load", () => {
  setTimeout(initLiquidBubbles, 500);
});
