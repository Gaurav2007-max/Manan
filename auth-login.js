import { 
  initializeApp 
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";

import { 
  getAuth, 
  signInWithEmailAndPassword, 
  signOut,
  createUserWithEmailAndPassword   // ← ADD THIS
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";

import { 
  getFirestore, 
  doc, 
  setDoc 
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js"; 

const firebaseConfig = {
  apiKey: "AIzaSyDJtmkCoy3cgn-0RKEyvxqbxEycvl29gZU",
  authDomain: "manan-a5cac.firebaseapp.com",
  projectId: "manan-a5cac",
  storageBucket: "manan-a5cac.firebasestorage.app",
  messagingSenderId: "749930441436",
  appId: "1:749930441436:web:e2bcc3dd932413d5862219",
  measurementId: "G-NC89F27XCQ"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const emailEl = document.getElementById('liEmail');
const passEl = document.getElementById('liPass');
const btn = document.getElementById('liSignIn');
const msg = document.getElementById('liMsg');

async function isApproved(user) {
  if (!user || !user.uid) return false;
  try {
    const adminSnap = await getDoc(doc(db,'admins',user.uid));
    if (adminSnap.exists()) return true;
    const memSnap = await getDoc(doc(db,'members',user.uid));
    if (memSnap.exists()) return true;
    // fallback: by email in admins collection
    const all = await getDocs(collection(db,'admins'));
    const emailLower = (user.email||'').toLowerCase();
    let ok=false;
    all.forEach(d=>{ const data=d.data(); if(data.email && data.email.toLowerCase()===emailLower) ok=true });
    return ok;
  } catch(e) {
    console.error(e); return false;
  }
}

btn.addEventListener('click', async () => {
  msg.innerText = '';
  const email = (emailEl.value||'').trim();
  const pass = passEl.value || '';
  if(!email || !pass) { msg.innerText='Enter email & password'; return; }
  try {
    const cred = await signInWithEmailAndPassword(auth, email, pass);
    const ok = await isApproved(cred.user);
    if (ok) location.href = 'home.html';
    else { msg.innerText='Account not approved. Contact admin.'; await signOut(auth); }
  } catch(err) {
    console.error(err);
    msg.innerText = err.message || 'Sign-in failed';
  }

});
