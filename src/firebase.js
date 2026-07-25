import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBEfS-2zn155LzbSv3LMC5xXwm3RIuKMxU",
  authDomain: "makesurprise-248c1.firebaseapp.com",
  projectId: "makesurprise-248c1",
  storageBucket: "makesurprise-248c1.firebasestorage.app",
  messagingSenderId: "467512746437",
  appId: "1:467512746437:web:d0fdf2754973a9ecdb2bac"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);