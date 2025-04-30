# Firebase Setup Guide

## 1. Create a Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter a project name (e.g., "MIDI Generator")
4. Configure Google Analytics (optional but recommended)
5. Click "Create project"

## 2. Register Your Web App
1. From the project dashboard, click the web icon (</>) to add a web app
2. Register your app with a nickname (e.g., "MIDI Generator Web")
3. Check "Also set up Firebase Hosting" (optional)
4. Click "Register app"
5. Copy the Firebase configuration object for later use

## 3. Enable Authentication
1. In the Firebase console, go to "Authentication" → "Sign-in method"
2. Enable the authentication methods you want:
   - Email/Password (recommended)
   - Google (recommended)
   - GitHub (optional)
   - Facebook (optional)

## 4. Set Up Firestore Database
1. Go to "Firestore Database" in the Firebase console
2. Click "Create database"
3. Start in production mode (or test mode for development)
4. Choose a location closest to your target users
5. Click "Enable"

## 5. Configure Firebase Storage
1. Go to "Storage" in the Firebase console
2. Click "Get started"
3. Review and accept the default security rules (you'll modify these later)
4. Choose a location closest to your target users
5. Click "Done"

## 6. Set Up Security Rules
### Firestore Rules
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow users to read and write only their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Allow users to read and write only their own favorites
    match /favorites/{favoriteId} {
      allow read, write: if request.auth != null && 
                          request.auth.uid == resource.data.userId;
    }
    
    // Allow users to read public MIDI files but only write their own
    match /midiFiles/{fileId} {
      allow read: if resource.data.isPublic == true || 
                   (request.auth != null && request.auth.uid == resource.data.userId);
      allow write: if request.auth != null && 
                    request.auth.uid == request.resource.data.userId;
    }
  }
}
```

### Storage Rules
```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /midiFiles/{userId}/{fileName} {
      allow read: if resource.metadata.isPublic == "true" || 
                   (request.auth != null && request.auth.uid == userId);
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```
