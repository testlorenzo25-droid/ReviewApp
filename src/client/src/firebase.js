// client/src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCDoIZyqVQUe2xh4shEWTbDsh8d57PAzds",
  authDomain: "test-dae4d.firebaseapp.com",
  projectId: "test-dae4d",
  storageBucket: "test-dae4d.appspot.com",
  messagingSenderId: "790476273236",
  appId: "1:790476273236:web:03e059e7106c6be2515fc1"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const db = getFirestore(app);

export { auth, provider, signInWithPopup, signOut, db };
