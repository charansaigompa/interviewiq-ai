// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import {getAuth, GoogleAuthProvider} from "firebase/auth"
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_APIKEY,
  authDomain: "interviewiq-93ee7.firebaseapp.com",
  projectId: "interviewiq-93ee7",
  storageBucket: "interviewiq-93ee7.firebasestorage.app",
  messagingSenderId: "36924991713",
  appId: "1:36924991713:web:e7f597b78db279817defa0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth=getAuth(app)
const provider=new GoogleAuthProvider()
export  {auth,provider}