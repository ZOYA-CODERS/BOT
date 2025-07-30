const express = require('express');
const cors = require('cors');
const { db, auth } = require('./firebase-config');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// API endpoint to get messages
app.get('/api/messages', async (req, res) => {
  try {
    const snapshot = await db.ref('messages').orderByChild('timestamp').limitToLast(100).once('value');
    const messages = [];
    snapshot.forEach((child) => {
      messages.push({
        id: child.key,
        ...child.val()
      });
    });
    res.json(messages.reverse()); // Newest first
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API endpoint to post a message
app.post('/api/messages', async (req, res) => {
  const { text, userId, userEmail, userName } = req.body;
  
  if (!text || !userId || !userEmail) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const newMessageRef = db.ref('messages').push();
    await newMessageRef.set({
      text,
      userId,
      userEmail,
      userName: userName || userEmail.split('@')[0],
      timestamp: Date.now()
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API endpoint to register a new user
app.post('/api/register', async (req, res) => {
  const { email, password, name } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: name || email.split('@')[0]
    });
    
    // Create user profile in database
    await db.ref(`users/${userRecord.uid}`).set({
      email,
      name: name || email.split('@')[0],
      createdAt: Date.now()
    });
    
    res.json({ success: true, userId: userRecord.uid });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// API endpoint to login
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    // In a real app, you would use Firebase client-side SDK for login
    // This is a simplified version for demonstration
    const userRecord = await auth.getUserByEmail(email);
    
    // Verify password would normally be done client-side with Firebase Auth
    // Here we just return success if user exists (not secure for production)
    res.json({ 
      success: true, 
      userId: userRecord.uid,
      userEmail: userRecord.email,
      userName: userRecord.displayName
    });
  } catch (error) {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
