# Lexicon | Modern Dictionary Website

Lexicon: A modern, modular dictionary website powered by the Free Dictionary API. Features Firebase authentication, real-time search history, and customizable AI translation supporting multiple LLM protocols (OpenAI/Gemini).

## Features

- 🔍 Word search with definitions
- 🪄 **Customizable AI Translation** (Supports OpenAI, Gemini, and local LLMs)
- 🤖 **Multi-Config AI Support** (Save and switch between different AI providers)
- 🔊 Audio pronunciation
- 📚 Multiple meanings and examples
- ⭐ Favorites system (synced to cloud)
- 📜 Search history (synced to cloud)
- 📅 Word of the day
- 🔐 Google & GitHub OAuth login
- ☁️ Firebase Realtime Database sync
- 📱 Fully responsive design

## Technologies Used

- HTML5
- CSS3 (Custom Properties, Flexbox, Grid)
- Vanilla JavaScript (ES6+)
- Firebase (Auth & Realtime Database)
- Free Dictionary API
- LocalStorage for guest users

## Quick Start

### Local Development (Minimal Setup)

1. Clone the repository
2. Open `index.html` in a web browser
3. Works as guest (search history/favorites saved locally in browser)

### Full Setup with Firebase Auth & Cloud Sync

1. **Install Firebase CLI**

   ```bash
   npm install -g firebase-tools
   ```

2. **Set up Firebase Project**
   - Follow [FIREBASE_SETUP.md](FIREBASE_SETUP.md) for detailed instructions
   - Create project at [console.firebase.google.com](https://console.firebase.google.com/)
   - Enable Google & GitHub Authentication
   - Enable Realtime Database
   - Update `js/firebase-config.js` with your credentials

3. **Deploy**
   ```bash
   firebase deploy
   ```

## API

This project uses the [Free Dictionary API](https://dictionaryapi.dev/)

## Auth Providers

- **Google OAuth** - Sign in with your Google account
- **GitHub OAuth** - Sign in with your GitHub account

## Data Storage

| Feature         | Guest Users   | Authenticated Users  |
| --------------- | ------------- | -------------------- |
| Word of the Day | LocalStorage  | LocalStorage         |
| Search History  | LocalStorage  | Firebase Realtime DB |
| Favorites       | Not available | Firebase Realtime DB |

## Learning Outcomes

- Firebase Authentication & OAuth integration
- Firebase Realtime Database usage
- API integration
- Async/await patterns
- LocalStorage usage
- DOM manipulation
- Responsive design
- Error handling

## Directory Structure

```
dictionary-app/
├── index.html              # Main HTML file
├── firebase.json           # Firebase Hosting config
├── .firebaserc            # Firebase project ID
├── FIREBASE_SETUP.md      # Firebase setup guide
├── src/
│   ├── components/
│   │   └── UI.js          # UI rendering logic
│   ├── services/
│   │   ├── auth.js        # Authentication logic
│   │   ├── db.js          # Database/Storage logic
│   │   ├── ai.js          # LLM Translation service
│   │   └── firebase.js    # Firebase config
│   ├── styles/
│   │   └── main.css       # Stylesheet
│   └── main.js            # Main entry point
├── assets/
└── README.md
```

dictionary-app/
├── index.html # Main HTML file
├── firebase.json # Firebase Hosting config
├── .firebaserc # Firebase project ID
├── FIREBASE_SETUP.md # Firebase setup guide
├── css/
│ └── style.css # Main stylesheet
├── js/
│ ├── firebase-config.js # Firebase credentials
│ ├── auth.js # Authentication logic
│ ├── app.js # Main app & search functionality
│ ├── favorites.js # Favorites management
│ └── wordOfDay.js # Word of the day
├── assets/
│ └── images/
└── README.md

```

```
