// Replace with your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyDhiYhW5vlzumEScjaNXywh_JLVNRMWwy8",
  authDomain: "zoya-694aa.firebaseapp.com",
  databaseURL: "https://zoya-694aa-default-rtdb.firebaseio.com",
  projectId: "zoya-694aa",
  storageBucket: "zoya-694aa.firebasestorage.app",
  messagingSenderId: "274392639729",
  appId: "1:274392639729:web:6386ac182bae69e4c0a150"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = firebase.auth();
const database = firebase.database();
