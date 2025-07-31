import { initializeApp } from "firebase/app";
import { getDatabase, onValue, ref, set, off, onDisconnect, serverTimestamp } from "firebase/database";
import { getAuth, 
         createUserWithEmailAndPassword, 
         signInWithEmailAndPassword, 
         signOut, 
         onAuthStateChanged, 
         GoogleAuthProvider, 
         signInWithPopup } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  databaseURL: "YOUR_DATABASE_URL",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Enhanced security rules (should also be set in Firebase Console)
// Set these rules in Firebase Realtime Database Rules:
/*
{
  "rules": {
    "users": {
      "$uid": {
        ".read": "$uid === auth.uid",
        ".write": "$uid === auth.uid"
      }
    },
    "messages": {
      ".read": "auth != null",
      ".write": "auth != null",
      "$messageId": {
        ".validate": "newData.hasChildren(['senderId', 'senderName', 'text', 'timestamp'])",
        "senderId": {
          ".validate": "newData.val() === auth.uid"
        },
        "senderName": {
          ".validate": "newData.isString() && newData.val().length > 0"
        },
        "text": {
          ".validate": "newData.isString() && newData.val().length > 0 && newData.val().length < 1000"
        },
        "timestamp": {
          ".validate": "newData.val() <= now"
        },
        "$other": {
          ".validate": false
        }
      }
    },
    "presence": {
      "$uid": {
        ".read": "auth != null",
        ".write": "$uid === auth.uid"
      }
    }
  }
}
*/

export { 
  database, 
  auth, 
  googleProvider, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  signInWithPopup,
  onValue, 
  ref, 
  set, 
  off,
  onDisconnect,
  serverTimestamp
};
