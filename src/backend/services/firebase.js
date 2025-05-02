import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: 'AIzaSyA46_XYmJxXQ13cZLKNb63LrbHFl3uWGoA',
  authDomain: 'midi-generator-81875.firebaseapp.com',
  projectId: 'midi-generator-81875',
  storageBucket: 'midi-generator-81875.firebasestorage.app',
  messagingSenderId: '245994337664',
  appId: '1:245994337664:web:ddcc7c7e6cfd910af9fd65',
  measurementId: 'G-C3N34T18JK',
  databaseURL: 'https://midi-generator-81875-default-rtdb.asia-southeast1.firebasedatabase.app',
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
