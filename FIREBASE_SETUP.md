# Firebase Setup Guide

Follow these steps to configure Firebase for your dictionary app:

## 1. Create Firebase Project

1. Go to [https://console.firebase.google.com/](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter project name (e.g., `dictionary-learning-app`)
4. Click "Continue"
5. Choose whether to enable Google Analytics (optional)
6. Click "Create project"

## 2. Enable Authentication

1. In Firebase Console, click **Authentication** in the left sidebar
2. Click **Get Started**
3. Click **Sign-in method** tab
4. Enable **Google**:
   - Click Google
   - Enable toggle
   - Add support email
   - Click **Save**
5. Enable **GitHub**:
   - Click GitHub
   - Enable toggle
   - Click **Save**
   - You'll need to set up GitHub OAuth:
     - Go to `https://github.com/settings/developers`
     - Create a new OAuth App
     - Authorization callback URL: `https://YOUR_PROJECT_ID.firebaseapp.com/__/auth/handler`
     - Copy Client ID and Client Secret to Firebase

## 3. Create Realtime Database

1. In Firebase Console, click **Realtime Database** in the left sidebar
2. Click **Create Database**
3. Choose a location (default is fine)
4. Select **Start in Test Mode** for development
5. Click **Enable**

### Database Rules (for production):

```json
{
  "rules": {
    "users": {
      "$uid": {
        ".read": "$uid === auth.uid",
        ".write": "$uid === auth.uid"
      }
    }
  }
}
```

## 4. Get Firebase Configuration

1. In Firebase Console, click **Project Settings** (gear icon)
2. Scroll down to "Your apps" section
3. Click the **</>** icon (Web app)
4. Enter app name (e.g., `Dictionary App`)
5. Copy the `firebaseConfig` object

## 5. Update firebase-config.js

Replace the content in `js/firebase-config.js` with your actual config:

```javascript
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    databaseURL: "https://YOUR_PROJECT_ID-default-rtdb.firebaseio.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};
```

## 6. Update .firebaserc

Replace `YOUR_PROJECT_ID` in `.firebaserc` with your project ID:

```json
{
  "projects": {
    "default": "your-actual-project-id"
  }
}
```

## 7. Add Authorized Domains

1. In Firebase Console → Authentication → Settings
2. Scroll to "Authorized domains"
3. For local development, you may need to add `localhost` or use Firebase Hosting

## 8. Deploy to Firebase Hosting

After configuring Firebase:

```bash
# Login to Firebase (if not already)
firebase login

# Initialize hosting (if not already done)
firebase init

# Deploy
firebase deploy
```

Your app will be available at:
```
https://YOUR_PROJECT_ID.web.app
```

## Testing Auth Locally

For local development with Firebase Auth, you can use `firebase serve`:

```bash
firebase serve --only hosting
```

Or use an HTTP server like `http-server`:

```bash
npx http-server .
```

## Common Issues

**"auth/user-not-found"**: User doesn't exist, create account first

**"auth/wrong-password"**: Wrong password for email/password authentication

**CORS errors**: Make sure your domain is added to Firebase Auth authorized domains

**Database Permission Denied**: Check Firebase Realtime Database rules