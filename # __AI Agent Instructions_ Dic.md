## 🤖 Assistant

# **AI Agent Instructions: Dictionary Website Project**

## **Project Overview**
Build a functional online dictionary website as a learning project. No commercial use. Focus on clean code, best practices, and progressive feature implementation.

---

## **PHASE 1: Project Setup & MVP**

### **Task 1.1: Initialize Project Structure**

**Instructions:**
```
Create the following directory structure:

dictionary-app/
├── index.html
├── css/
│   └── style.css
├── js/
│   └── app.js
├── assets/
│   └── images/
└── README.md

Initialize a git repository and create initial commit.
```

### **Task 1.2: Create HTML Structure**

**File: `index.html`**

<thinking>
I should provide specific HTML structure that the AI agent can implement directly.
</thinking>

**Requirements:**
- Semantic HTML5 structure
- Meta tags for responsive design
- Search input with search button
- Results container (initially empty)
- Footer with attribution
- Link CSS and JS files

**Specific Implementation:**
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dictionary Learning Project</title>
    <link rel="stylesheet" href="css/style.css">
</head>
<body>
    <header>
        <h1>📚 Dictionary</h1>
        <p class="subtitle">Your learning dictionary project</p>
    </header>
    
    <main>
        <div class="search-container">
            <input type="text" id="searchInput" placeholder="Search for a word..." />
            <button id="searchBtn">Search</button>
        </div>
        
        <div id="loading" class="loading hidden">Searching...</div>
        <div id="error" class="error hidden"></div><div id="results" class="results"></div>
    </main>
    
    <footer>
        <p>Data provided by Free Dictionary API</p>
    </footer>
    
    <script src="js/app.js"></script>
</body>
</html>
```

### **Task 1.3: Create Base CSS Styling**

**File: `css/style.css`**

<thinking>
I should provide comprehensive CSS that creates a clean, modern look with good UX.
</thinking>

**Requirements:**
- Modern, clean design
- Responsive layout
- Good color contrast
- Smooth transitions
- Mobile-first approach

**Specific Implementation:**
```css
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

:root {
    --primary-color: #4a90e2;
    --secondary-color: #2c3e50;
    --background: #f5f7fa;
    --card-background: #ffffff;
    --text-primary: #2c3e50;
    --text-secondary: #7f8c8d;
    --error-color: #e74c3c;
    --success-color: #27ae60;
    --border-radius: 8px;
    --box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    background-color: var(--background);
    color: var(--text-primary);
    line-height: 1.6;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
}

header {
    background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
    color: white;
    padding: 2rem 1rem;
    text-align: center;
    box-shadow: var(--box-shadow);
}

header h1 {
    font-size: 2.5rem;
    margin-bottom: 0.5rem;
}

.subtitle {
    font-size: 1rem;
    opacity: 0.9;
}

main {
    flex: 1;
    max-width: 800px;
    width: 100%;
    margin: 2rem auto;
    padding: 0 1rem;
}

.search-container {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 2rem;
}

#searchInput {
    flex: 1;
    padding: 1rem;
    font-size: 1rem;
    border: 2px solid #ddd;
    border-radius: var(--border-radius);
    transition: border-color 0.3s;
}

#searchInput:focus {
    outline: none;
    border-color: var(--primary-color);
}

#searchBtn {
    padding: 1rem 2rem;
    background-color: var(--primary-color);
    color: white;
    border: none;
    border-radius: var(--border-radius);
    font-size: 1rem;
    cursor: pointer;
    transition: background-color 0.3s;
}

#searchBtn:hover {
    background-color: #357abd;
}

#searchBtn:active {
    transform: scale(0.98);
}

.loading, .error {
    text-align: center;
    padding: 1rem;
    border-radius: var(--border-radius);
    margin-bottom: 1rem;
}

.loading {
    background-color: #e8f4f8;
    color: var(--primary-color);
}

.error {
    background-color: #fadbd8;
    color: var(--error-color);
}

.hidden {
    display: none;
}

.results {
    background-color: var(--card-background);
    border-radius: var(--border-radius);
    padding: 2rem;
    box-shadow: var(--box-shadow);
}

.word-title {
    font-size: 2rem;
    color: var(--primary-color);
    margin-bottom: 0.5rem;
}

.phonetic {
    color: var(--text-secondary);
    font-style: italic;
    margin-bottom: 1rem;
}

.audio-btn {
    background-color: var(--success-color);
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: var(--border-radius);
    cursor: pointer;
    margin-left: 1rem;
}

.meaning-section {
    margin: 1.5rem 0;
}

.part-of-speech {
    font-size: 1.2rem;
    color: var(--secondary-color);
    font-weight: bold;
    margin-bottom: 0.5rem;
}

.definition {
    margin: 0.75rem 0;
    padding-left: 1rem;
    border-left: 3px solid var(--primary-color);
}

.example {
    color: var(--text-secondary);
    font-style: italic;
    margin-top: 0.25rem;
}

footer {
    background-color: var(--secondary-color);
    color: white;
    text-align: center;
    padding: 1rem;
    margin-top: auto;
}

/* Responsive Design */
@media (max-width: 600px) {
    header h1 {
        font-size: 2rem;
    }
    
    .search-container {
        flex-direction: column;
    }
    
    #searchBtn {
        width: 100%;
    }
    
    .results {
        padding: 1rem;
    }
}
```

### **Task 1.4: Implement JavaScript Functionality**

**File: `js/app.js`**

<thinking>
Now I need to provide the JavaScript implementation that:
1. Handles search functionality
2. Makes API calls to Free Dictionary API
3. Displays results dynamically
4. Handles errors
5. Shows loading states
6. Implements audio pronunciation
</thinking>

**Requirements:**
- Use Free Dictionary API: `https://api.dictionaryapi.dev/api/v2/entries/en/{word}`
- Implement async/await for API calls
- Handle errors gracefully
- Show loading states
- Display all meanings and definitions
- Add audio pronunciation functionality
- Allow Enter key to trigger search

**Specific Implementation:**
```javascript
// DOM Elements
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const loadingEl = document.getElementById('loading');
const errorEl = document.getElementById('error');
const resultsEl = document.getElementById('results');

// API Configuration
const API_BASE_URL = 'https://api.dictionaryapi.dev/api/v2/entries/en/';

// Event Listeners
searchBtn.addEventListener('click', handleSearch);
searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        handleSearch();
    }
});

// Main search handler
async function handleSearch() {
    const word = searchInput.value.trim().toLowerCase();
    
    if (!word) {
        showError('Please enter a word to search');
        return;
    }
    
    // Reset UI
    hideError();
    hideResults();
    showLoading();
    
    try {
        const data = await fetchWordData(word);
        hideLoading();
        displayResults(data);
    } catch (error) {
        hideLoading();
        showError(error.message);
    }
}

// Fetch word data from API
async function fetchWordData(word) {
    try {
        const response = await fetch(`${API_BASE_URL}${word}`);
        
        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('Word not found. Please check spelling and try again.');
            }
            throw new Error('Something went wrong. Please try again later.');
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        if (error.message.includes('fetch')) {
            throw new Error('Network error. Please check your connection.');
        }
        throw error;
    }
}

// Display results
function displayResults(data) {
    const wordData = data[0];
    
    let html = `
        <div class="word-header">
            <h2 class="word-title">${wordData.word}</h2>
            ${generatePhoneticSection(wordData)}
        </div>
    `;
    
    wordData.meanings.forEach(meaning => {
        html += generateMeaningSection(meaning);
    });
    
    resultsEl.innerHTML = html;
    resultsEl.classList.remove('hidden');
    
    // Add audio button listeners
    attachAudioListeners();
}

// Generate phonetic section with audio
function generatePhoneticSection(wordData) {
    let phoneticHTML = '';
    
    if (wordData.phonetics && wordData.phonetics.length > 0) {
        const phoneticWithAudio = wordData.phonetics.find(p => p.audio);
        const phoneticWithText = wordData.phonetics.find(p => p.text);
        
        if (phoneticWithText) {
            phoneticHTML += `<p class="phonetic">${phoneticWithText.text}`;
            if (phoneticWithAudio && phoneticWithAudio.audio) {
                phoneticHTML += `
                    <button class="audio-btn" data-audio="${phoneticWithAudio.audio}">
                        🔊 Play
                    </button>
                `;
            }
            
            phoneticHTML += '</p>';
        }
    }
    
    return phoneticHTML;
}

// Generate meaning section
function generateMeaningSection(meaning) {
    let html = `
        <div class="meaning-section">
            <h3 class="part-of-speech">${meaning.partOfSpeech}</h3>`;
    
    meaning.definitions.forEach((def, index) => {
        html += `
            <div class="definition">
                <p><strong>${index + 1}.</strong> ${def.definition}</p>
                ${def.example ? `<p class="example">"${def.example}"</p>` : ''}
            </div>
        `;
    });
    
    // Add synonyms if available
    if (meaning.synonyms && meaning.synonyms.length > 0) {
        html += `
            <p><strong>Synonyms:</strong> ${meaning.synonyms.slice(0, 5).join(', ')}</p>
        `;
    }
    
    // Add antonyms if available
    if (meaning.antonyms && meaning.antonyms.length > 0) {
        html += `
            <p><strong>Antonyms:</strong> ${meaning.antonyms.slice(0, 5).join(', ')}</p>
        `;
    }
    
    html += '</div>';
    return html;
}

// Attach audio button listeners
function attachAudioListeners() {
    const audioButtons = document.querySelectorAll('.audio-btn');
    audioButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const audioUrl = btn.getAttribute('data-audio');
            playAudio(audioUrl);
        });
    });
}

// Play audio pronunciation
function playAudio(url) {
    const audio = new Audio(url);
    audio.play().catch(error => {
        console.error('Error playing audio:', error);
        showError('Could not play audio');
    });
}

// UI Helper Functions
function showLoading() {
    loadingEl.classList.remove('hidden');
}

function hideLoading() {
    loadingEl.classList.add('hidden');
}

function showError(message) {
    errorEl.textContent = message;
    errorEl.classList.remove('hidden');
}

function hideError() {
    errorEl.classList.add('hidden');
}

function hideResults() {
    resultsEl.classList.add('hidden');
}

// Focus on search input on page load
window.addEventListener('DOMContentLoaded', () => {
    searchInput.focus();
});
```

---

## **PHASE 2: Enhancement Features**

### **Task 2.1: Add Search History**

<thinking>
For search history, I should use localStorage to persist data and create a UI to display recent searches.
</thinking>

**Instructions:**
Add the following functionality to `js/app.js`:

```javascript
// Add after API Configuration section
const MAX_HISTORY_ITEMS = 10;

// Search History Functions
function saveToHistory(word) {
    let history = getSearchHistory();
    
    // Remove if already exists
    history = history.filter(item => item !== word);
    
    // Add to beginning
    history.unshift(word);
    
    // Limit to MAX_HISTORY_ITEMS
    history = history.slice(0, MAX_HISTORY_ITEMS);
    
    localStorage.setItem('searchHistory', JSON.stringify(history));
    displaySearchHistory();
}

function getSearchHistory() {
    const history = localStorage.getItem('searchHistory');
    return history ? JSON.parse(history) : [];
}

function clearSearchHistory() {
    localStorage.removeItem('searchHistory');
    displaySearchHistory();
}

function displaySearchHistory() {
    const history = getSearchHistory();
    const historyContainer = document.getElementById('historyContainer');
    
    if (!historyContainer) return;
    
    if (history.length === 0) {
        historyContainer.innerHTML = '<p class="no-history">No search history yet</p>';
        return;
    }
    
    let html = '<h3>Recent Searches</h3><div class="history-items">';
    
    history.forEach(word => {
        html += `
            <button class="history-item" data-word="${word}">
                ${word}
            </button>
        `;
    });
    
    html += '</div><button id="clearHistory" class="clear-btn">Clear History</button>';
    
    historyContainer.innerHTML = html;
    
    // Add click listeners
    document.querySelectorAll('.history-item').forEach(btn => {
        btn.addEventListener('click', () => {
            searchInput.value = btn.getAttribute('data-word');
            handleSearch();
        });
    });
    
    const clearBtn = document.getElementById('clearHistory');
    if (clearBtn) {
        clearBtn.addEventListener('click', clearSearchHistory);
    }
}

// Modify handleSearch to save history
// Add this line after successful search (in the try block):
// saveToHistory(word);
```

**Update `index.html`** - Add after search container:
```html
<div id="historyContainer" class="history-container"></div>
```

**Update `css/style.css`** - Add:
```css
.history-container {
    background-color: var(--card-background);
    border-radius: var(--border-radius);
    padding: 1.5rem;
    margin-bottom: 2rem;
    box-shadow: var(--box-shadow);
}

.history-container h3 {
    margin-bottom: 1rem;
    color: var(--secondary-color);
}

.history-items {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-bottom: 1rem;
}

.history-item {
    background-color: var(--background);
    border: 1px solid #ddd;
    padding: 0.5rem 1rem;
    border-radius:20px;
    cursor: pointer;
    transition: all 0.3s;
}

.history-item:hover {
    background-color: var(--primary-color);
    color: white;
    border-color: var(--primary-color);
}

.clear-btn {
    background-color: var(--error-color);
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: var(--border-radius);
    cursor: pointer;
    font-size: 0.9rem;
}

.no-history {
    color: var(--text-secondary);
    font-style: italic;
}
```

### **Task 2.2: Add Favorites Feature**

**Instructions:**
Create new file `js/favorites.js`:

```javascript
// Favorites Management
const FAVORITES_KEY = 'dictionaryFavorites';

function addToFavorites(wordData) {
    let favorites = getFavorites();
    
    // Check if already exists
    if (favorites.some(fav => fav.word === wordData.word)) {
        showNotification('Already in favorites!', 'info');
        return;
    }
    
    // Store simplified version
    const favoriteItem = {
        word: wordData.word,
        phonetic: wordData.phonetics?.[0]?.text || '',
        shortDefinition: wordData.meanings[0]?.definitions[0]?.definition || '',
        timestamp: Date.now()
    };
    
    favorites.unshift(favoriteItem);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
    
    showNotification('Added to favorites!', 'success');displayFavorites();
}

function removeFromFavorites(word) {
    let favorites = getFavorites();
    favorites = favorites.filter(fav => fav.word !== word);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
    
    showNotification('Removed from favorites', 'info');
    displayFavorites();
}

function getFavorites() {
    const favorites = localStorage.getItem(FAVORITES_KEY);
    return favorites ? JSON.parse(favorites) : [];
}

function displayFavorites() {
    const favorites = getFavorites();
    const favContainer = document.getElementById('favoritesContainer');
    
    if (!favContainer) return;
    
    if (favorites.length === 0) {
        favContainer.innerHTML = '<p class="no-favorites">No favorites yet. Start adding words!</p>';
        return;
    }
    
    let html = '<h3>⭐ Favorites</h3><div class="favorites-grid">';
    
    favorites.forEach(fav => {
        html += `
            <div class="favorite-card">
                <div class="favorite-header">
                    <h4>${fav.word}</h4>
                    <button class="remove-fav-btn" data-word="${fav.word}">✕</button>
                </div>
                ${fav.phonetic ? `<p class="fav-phonetic">${fav.phonetic}</p>` : ''}
                <p class="fav-definition">${fav.shortDefinition}</p>
                <button class="view-fav-btn" data-word="${fav.word}">View Full</button>
            </div>
        `;
    });
    
    html += '</div>';
    favContainer.innerHTML = html;
    
    // Add event listeners
    document.querySelectorAll('.remove-fav-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            removeFromFavorites(btn.getAttribute('data-word'));
        });
    });
    
    document.querySelectorAll('.view-fav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            searchInput.value = btn.getAttribute('data-word');
            handleSearch();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    });
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Initialize on page load
window.addEventListener('DOMContentLoaded', () => {
    displayFavorites();
});
```

**Update `index.html`** - Add link to favorites.js and container:
```html
<!-- In head or before closing body -->
<script src="js/favorites.js"></script>

<!-- After history container -->
<div id="favoritesContainer" class="favorites-container"></div>
```

**Modify `displayResults` function in app.js** - Add favorite button:
```javascript
// Add after word-header div
html += `
    <button id="addToFavBtn" class="favorite-btn">⭐ Add to Favorites</button>
`;

// After setting innerHTML, add listener:
document.getElementById('addToFavBtn')?.addEventListener('click', () => {
    addToFavorites(wordData);
});
```

**Update CSS** - Add:
```css
.favorite-btn {
    background-color: #f39c12;
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: var(--border-radius);
    cursor: pointer;
    margin: 1rem 0;
    font-size: 1rem;
}

.favorites-container {
    background-color: var(--card-background);
    border-radius: var(--border-radius);
    padding: 1.5rem;
    margin-bottom: 2rem;
    box-shadow: var(--box-shadow);
}

.favorites-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 1rem;
    margin-top: 1rem;
}

.favorite-card {
    background-color: var(--background);
    padding: 1rem;
    border-radius: var(--border-radius);
    border: 2px solid #e0e0e0;
}

.favorite-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
}

.favorite-header h4 {
    color: var(--primary-color);
    margin: 0;
}

.remove-fav-btn {
    background: none;
    border: none;
    color: var(--error-color);
    font-size: 1.5rem;
    cursor: pointer;padding: 0;
    width: 30px;
    height: 30px;
}

.fav-phonetic {
    color: var(--text-secondary);
    font-size: 0.9rem;
    margin-bottom: 0.5rem;
}

.fav-definition {
    font-size: 0.9rem;
    margin-bottom: 1rem;
    color: var(--text-primary);
}

.view-fav-btn {
    background-color: var(--primary-color);
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: var(--border-radius);
    cursor: pointer;
    width: 100%;
}

.notification {
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 1rem 1.5rem;
    border-radius: var(--border-radius);
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    transform: translateX(400px);
    transition: transform 0.3s ease;
    z-index: 1000;
}

.notification.show {
    transform: translateX(0);
}

.notification-success {
    background-color: var(--success-color);
    color: white;
}

.notification-info {
    background-color: var(--primary-color);
    color: white;
}
```

---

## **PHASE 3: Advanced Features**

### **Task 3.1: Add Word of the Day**

**Instructions:**
Create `js/wordOfDay.js`:

```javascript
const WORD_OF_DAY_KEY = 'wordOfDay';
const WORD_LIST = [
    'serendipity', 'ephemeral', 'eloquent', 'resilient', 'paradigm',
    'ubiquitous', 'pragmatic', 'ambiguous', 'benevolent', 'catalyst',
    'diligent', 'empathy', 'facetious', 'gregarious', 'hypothesis',
    'innovative', 'juxtapose', 'kinetic', 'lucid', 'meticulous'
];

function getWordOfDay() {
    const stored = localStorage.getItem(WORD_OF_DAY_KEY);
    if (stored) {
        const data = JSON.parse(stored);
        const today = new Date().toDateString();
        
        if (data.date === today) {
            return data.word;
        }
    }
    
    // Generate new word of the day
    const randomWord = WORD_LIST[Math.floor(Math.random() * WORD_LIST.length)];
    const today = new Date().toDateString();
    localStorage.setItem(WORD_OF_DAY_KEY, JSON.stringify({
        word: randomWord,
        date: today
    }));
    
    return randomWord;
}

async function displayWordOfDay() {
    const word = getWordOfDay();
    const container = document.getElementById('wordOfDayContainer');
    
    if (!container) return;
    
    container.innerHTML = `
        <div class="wod-loading">Loading word of the day...</div>
    `;
    
    try {
        const response = await fetch(`${API_BASE_URL}${word}`);
        const data = await response.json();
        const wordData = data[0];
        
        const shortDef = wordData.meanings[0]?.definitions[0]?.definition || '';
        
        container.innerHTML = `
            <h3>📅 Word of the Day</h3>
            <div class="wod-content">
                <h2class="wod-word">${wordData.word}</h2>
                <p class="wod-phonetic">${wordData.phonetics?.[0]?.text || ''}</p>
                <p class="wod-definition">${shortDef}</p>
                <button id="learnMoreWOD" class="wod-btn">Learn More</button>
            </div>
        `;
        
        document.getElementById('learnMoreWOD').addEventListener('click', () => {
            searchInput.value = word;
            handleSearch();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
        
    } catch (error) {
        container.innerHTML = `
            <h3>📅 Word of the Day</h3>
            <p class="wod-error">Could not load word of the day</p>
        `;
    }
}

// Initialize
window.addEventListener('DOMContentLoaded', () => {
    displayWordOfDay();
});
```

**Update HTML** - Add container at top of main:
```html
<div id="wordOfDayContainer" class="wod-container"></div>
```

**Update CSS**:
```css
.wod-container {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border-radius: var(--border-radius);
    padding: 2rem;
    margin-bottom: 2rem;
    box-shadow: var(--box-shadow);
}

.wod-container h3 {
    margin-bottom: 1rem;
    font-size: 1.2rem;
}

.wod-content {
    text-align: center;
}

.wod-word {
    font-size: 2.5rem;
    margin-bottom: 0.5rem;
}

.wod-phonetic {
    font-size: 1.1rem;
    opacity: 0.9;
    margin-bottom: 1rem;
}

.wod-definition {
    font-size: 1.1rem;
    line-height: 1.6;
    margin-bottom: 1.5rem;
}

.wod-btn {
    background-color: white;
    color: #667eea;
    border: none;
    padding: 0.75rem 2rem;
    border-radius: var(--border-radius);
    font-size: 1rem;
    font-weight: bold;
    cursor: pointer;
}

.wod-loading, .wod-error {
    text-align: center;
    padding: 1rem;
}
```

---

## **PHASE 4: Testing & Deployment**

### **Task 4.1: Create README Documentation**

**File: `README.md`**

```markdown
# Dictionary Learning Project

A clean, modern dictionary web application built as a learning project.

## Features

- 🔍 Word search with definitions
- 🔊 Audio pronunciation
- 📚 Multiple meanings and examples
- ⭐ Favorites system
- 📜 Search history
- 📅 Word of the day
-📱 Fully responsive design

## Technologies Used

- HTML5
- CSS3 (Custom Properties, Flexbox, Grid)
- Vanilla JavaScript (ES6+)
- Free Dictionary API
- LocalStorage for data persistence

## Setup

1. Clone the repository
2. Open `index.html` in a web browser
3. No build process required!

## API

This project uses the [Free Dictionary API](https://dictionaryapi.dev/)

## Learning Outcomes

- API integration
- Async/await patterns
- LocalStorage usage
- DOM manipulation
- Responsive design
- Error handling
