import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js';
import { getAuth, setPersistence, browserLocalPersistence } from 'https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js';

const firebaseConfig = {
  apiKey: 'AIzaSyCPv8kPC2aPcfMTOTwXJyP4QnC6t90aMuU',
  authDomain: 'exbr-0709.firebaseapp.com',
  projectId: 'exbr-0709',
  storageBucket: 'exbr-0709.firebasestorage.app',
  messagingSenderId: '1022883693484',
  appId: '1:1022883693484:web:f0a2e2541f2d6197907009',
  measurementId: 'G-5WG9VRFKEM'
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

setPersistence(auth, browserLocalPersistence).catch(() => {
  // O Firebase mantém a persistência disponível pelo navegador quando possível.
});

export { app, auth, db };
