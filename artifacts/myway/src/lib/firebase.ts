import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";

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

export { app, analytics, auth };
