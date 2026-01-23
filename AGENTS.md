# AGENTS.md - AI Agent Instructions for Dictionary Website Project

## Project Overview
This is a vanilla HTML, CSS, and JavaScript online dictionary with Firebase Authentication and Realtime Database. Supports Google/GitHub OAuth login.

## Development Commands

### Running the Project
```bash
# Open directly in browser
open index.html
# or
start index.html  # Windows
```

### Firebase Setup (Required for Auth/Database)
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in project
firebase init

# Select: Hosting, Authentication, Realtime Database
# Use existing project or create new one
# Public directory: .
# Configure as single-page app: yes
```

### Deployment Commands
```bash
# Deploy to Firebase Hosting
firebase deploy

# Preview deployment
firebase serve
```
```bash
# Open directly in browser
open index.html
# or
start index.html  # Windows
```

### Validation (Optional - add when needed)
```bash
# Validate HTML
npx html-validate index.html

# Lint JavaScript
npx eslint js/app.js js/favorites.js js/wordOfDay.js

# Check CSS
npx stylelint css/style.css
```

### Testing (Optional - add when needed)
```bash
# Run all tests
npm test

# Run single test file
npm test -- --grep "test-name"
```

## Code Style Guidelines

### File Structure
```
dictionary-app/
├── index.html
├── firebase.json
├── .firebaserc
├── AGENTS.md
├── css/
│   └── style.css
├── js/
│   ├── firebase-config.js
│   ├── auth.js
│   ├── app.js
│   ├── favorites.js
│   └── wordOfDay.js
├── assets/
│   └── images/
└── README.md
```

### HTML Guidelines
- Use semantic HTML5 elements (header, main, footer, section)
- Include meta viewport tag for responsiveness
- Lowercase for HTML tags and attributes
- Use double quotes for attribute values
- Link CSS in `<head>`, JS before closing `</body>`

### CSS Guidelines
- Use CSS custom properties (variables) for colors, spacing, etc.
- Follow mobile-first responsive design
- Use BEM-like naming: `.component-element`, `.component-element--modifier`
- Classes use kebab-case: `.search-container`, `.word-title`
- Avoid !important unless absolutely necessary
- Use Flexbox and Grid for layouts
- Root variables use lowercase with hyphens: `--primary-color`, `--border-radius`

### JavaScript Guidelines

#### Imports & Modules
- Use vanilla JS with ES6 features
- Add event listeners in `DOMContentLoaded` callback
- Use async/await for API calls
- No external bundlers required

#### Naming Conventions
- Variables/Functions: **camelCase** - `searchInput`, `handleSearch()`
- Constants: **UPPER_SNAKE_CASE** - `API_BASE_URL`, `MAX_HISTORY_ITEMS`
- DOM Elements: **camelCase with El suffix** - `searchInput`, `resultsEl`
- CSS Classes: **kebab-case** - `.search-container`, `.word-title`
- HTML IDs: **camelCase** - `searchInput`, `historyContainer`

#### Code Formatting
- Use 4 spaces for indentation (no tabs)
- Add spaces around operators: `const x = a + b;`
- Add semicolons at end of statements
- Use template literals for string interpolation: `` `${word}` ``
- Place opening braces on same line
- One blank line between functions

#### Error Handling
- Always wrap API calls in try-catch blocks
- Handle network errors gracefully
- Provide user-friendly error messages
- Log errors to console for debugging
- Show error state in UI: `showError(message)`, `hideError()`
- Differentiate between 404 (not found) and network errors

#### Function Organization
- DOM element declarations at top
- Configuration constants follow
- Event listeners come after
- Main functions (handleSearch, fetchWordData, etc.)
- UI helper functions at bottom (showLoading, hideError, etc.)

#### Async Patterns
```javascript
// Always use async/await over .then()
async function handleSearch() {
    try {
        const data = await fetchWordData(word);
        // process data
    } catch (error) {
        showError(error.message);
    }
}

// Fetch function pattern
async function fetchData() {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error('Message');
    }
    return await response.json();
}
```

### LocalStorage Guidelines
- Use descriptive keys: `searchHistory`, `dictionaryFavorites`, `wordOfDay`
- Always parse JSON on retrieval: `JSON.parse(localStorage.getItem(key))`
- Always stringify on storage: `JSON.stringify(data)`
- Check for null/undefined before parsing
- Limit array sizes (e.g., max 10 history items)
- LocalStorage is now fallback for guest users

### Firebase Guidelines
- Always check `getCurrentUser()` before Firebase operations
- Use `auth.onAuthStateChanged` listeners for UI updates
- Use `firebase.database.ServerValue.TIMESTAMP` for timestamps
- Realtime Database paths: `users/{uid}/favorites`, `users/{uid}/searchHistory`
- Use `.on('value', callback)` for real-time updates
- Fall back to localStorage for guest users

#### Firebase Database Patterns
```javascript
// Get user-specific reference
function getUserRef(path) {
    const user = getCurrentUser();
    return user ? database.ref(`users/${user.uid}/${path}`) : null;
}

// Real-time listener
function listenToUpdates(ref, callback) {
    ref.on('value', (snapshot) => {
        const data = [];
        snapshot.forEach(child => data.push(child.val()));
        callback(data);
    });
}

// Write data with Firebase timestamp
ref.set({
    value: data,
    timestamp: firebase.database.ServerValue.TIMESTAMP
});
```
- Base URL: `https://api.dictionaryapi.dev/api/v2/entries/en/`
- Always check response.ok status
- Handle 404 as "word not found"
- Handle other errors as generic failures
- Use data[0] to get first entry from API response

### Responsive Design
- Use media queries starting from mobile (max-width: 600px)
- Test on common breakpoints: 600px, 768px, 1024px
- Use relative units (rem, %) over fixed pixels
- Ensure touch targets are at least 44x44 pixels

### Git Conventions
- Branch: feature/task-name (e.g., feature/search-history)
- Commit messages: feat: add search history, fix: audio button click handler
- Stage changes before committing: `git add . && git commit -m "message"`