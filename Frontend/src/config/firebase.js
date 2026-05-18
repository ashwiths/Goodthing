import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyChg459xm8rUlUH-UplN-lhpf0qzurjHyM",
  authDomain: "todo-app-abb8e.firebaseapp.com",
  projectId: "todo-app-abb8e",
  storageBucket: "todo-app-abb8e.firebasestorage.app",
  messagingSenderId: "478377181309",
  appId: "1:478377181309:web:fe064ff035e1c71a6e7114"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);