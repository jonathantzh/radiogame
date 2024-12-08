// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";


const firebaseConfig = {
    apiKey: "AIzaSyD8UyQ3IKzuqUEC8RbipApBJ2g3JLDlV8I",
    authDomain: "radiology-game.firebaseapp.com",
    projectId: "radiology-game",
    storageBucket: "radiology-game.firebasestorage.app",
    messagingSenderId: "434993329685",
    appId: "1:434993329685:web:2830d406b9aee9ef88801c",
    databaseURL: "https://radiology-game-default-rtdb.asia-southeast1.firebasedatabase.app/",
  };
  

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
export const auth = getAuth(app);
