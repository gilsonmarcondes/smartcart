import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore"; // Adicionamos esta linha

const firebaseConfig = {
  apiKey: "AIzaSyAG6qB3Oxm78iyF7D-Q59YyMaXA5ftZrXY",
  authDomain: "smartcart-3a5e1.firebaseapp.com",
  projectId: "smartcart-3a5e1",
  storageBucket: "smartcart-3a5e1.firebasestorage.app",
  messagingSenderId: "891218036945",
  appId: "1:891218036945:web:c7a6f055824a089ed49df0"
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);

// Inicializa o Banco de Dados e exporta para o resto do app usar
export const db = getFirestore(app);