import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: 'AIzaSyBK7JIOXNjYryB08kRi0vXI68XZqA32Hqo',
  authDomain: 'sleep-comfor.firebaseapp.com',
  projectId: 'sleep-comfor',
  storageBucket: 'sleep-comfor.firebasestorage.app',
  messagingSenderId: '860091678943',
  appId: '1:860091678943:web:a287fd754983ee7d3d696a',
}

const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = getFirestore(app)

export { app, auth, db }
