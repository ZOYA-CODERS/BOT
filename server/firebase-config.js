const admin = require('firebase-admin');

const serviceAccount = require('./serviceAccountKey.json'); // Download from Firebase Project Settings

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "YOUR_FIREBASE_DATABASE_URL" // Replace with your Firebase database URL
});

const db = admin.database();
const auth = admin.auth();

// Schedule daily cleanup of messages older than 24 hours
function scheduleCleanup() {
  const now = Date.now();
  const twentyFourHoursAgo = now - 24 * 60 * 60 * 1000;
  
  db.ref('messages').orderByChild('timestamp').endAt(twentyFourHoursAgo).once('value', (snapshot) => {
    const updates = {};
    snapshot.forEach((child) => {
      updates[child.key] = null;
    });
    if (Object.keys(updates).length > 0) {
      db.ref('messages').update(updates);
    }
  });
  
  // Run cleanup every hour
  setTimeout(scheduleCleanup, 60 * 60 * 1000);
}

// Start the cleanup schedule
scheduleCleanup();

module.exports = { admin, db, auth };
