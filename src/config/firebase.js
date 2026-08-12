import { initializeApp } from "firebase/app";
import { getAuth, initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyCDU-wruUsRdypLHKuRksQuO0vQhdEjDeM",
  authDomain: "financia-app-67634.firebaseapp.com",
  projectId: "financia-app-67634",
  storageBucket: "financia-app-67634.firebasestorage.app",
  messagingSenderId: "948882782923",
  appId: "1:948882782923:web:ca8c6c0949c8be379df94e",
  measurementId: "G-4CM9JEL7EW"
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth: use getAuth() on Web, and initializeAuth with persistence on Native
import { Platform } from 'react-native';
const auth = Platform.OS === 'web'
  ? getAuth(app)
  : initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage)
    });

// Initialize Firestore DB
const db = getFirestore(app);

export { auth, db, app };
