import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, User } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD0TnwVy_mkDiPTpu6OLm91JcFRf4bi2Ek",
  authDomain: "mywaywewelwatta.firebaseapp.com",
  projectId: "mywaywewelwatta",
  storageBucket: "mywaywewelwatta.firebasestorage.app",
  messagingSenderId: "1017752142341",
  appId: "1:1017752142341:web:056b2f736714c62e62926c",
  measurementId: "G-SGFJWSJ5Z0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;
const auth = getAuth(app);
const db = getFirestore(app);

// Keep Firebase Auth connected so Firestore security rules always permit access
let authPromise: Promise<User | null> | null = null;

export async function ensureFirebaseAuth(): Promise<User | null> {
  if (auth.currentUser) return auth.currentUser;
  if (authPromise) return authPromise;

  authPromise = new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        unsubscribe();
        authPromise = null;
        resolve(user);
      } else {
        // Fallback auto-sign in with institute default account
        try {
          const cred = await signInWithEmailAndPassword(auth, 'akashperera@myway.lk', 'akash123*#');
          unsubscribe();
          authPromise = null;
          resolve(cred.user);
        } catch (err) {
          console.warn("Firebase fallback auth error:", err);
          unsubscribe();
          authPromise = null;
          resolve(null);
        }
      }
    });
  });

  return authPromise;
}

export { app, analytics, auth, db };
