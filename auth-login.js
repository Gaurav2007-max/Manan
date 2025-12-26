// -------- IMPORTS --------
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";

import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  fetchSignInMethodsForEmail
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";

import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  getDocs,
  collection
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";


// -------- FIREBASE CONFIG --------
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


// -------- UI ELEMENTS --------
const liEmail = document.getElementById("liEmail");
const liPass = document.getElementById("liPass");
const liSignIn = document.getElementById("liSignIn");
const liMsg = document.getElementById("liMsg");

const forgotPassBtn = document.getElementById("forgotPass");


const suName = document.getElementById("suName");
const suEmail = document.getElementById("suEmail");
const suPass = document.getElementById("suPass");
const suYear = document.getElementById("suYear");
const suRoll = document.getElementById("suRoll");
const suBranch = document.getElementById("suBranch");
const doSignUp = document.getElementById("doSignUp");
const suMsg = document.getElementById("suMsg");


// -------- ADMIN / MEMBER CHECK FUNCTION --------
async function isApproved(user) {
  if (!user || !user.email) return false;

  const uid = user.uid;
  const emailLower = user.email.toLowerCase();

  try {
    // Check admins by UID
    const adminUID = await getDoc(doc(db, "admins", uid));
    if (adminUID.exists()) return "admin";

    // Check admins by EMAIL
    const admins = await getDocs(collection(db, "admins"));
    let isAdmin = false;
    admins.forEach(d => {
      const data = d.data();
      if (data.email && data.email.toLowerCase() === emailLower) {
        isAdmin = true;
      }
    });
    if (isAdmin) return "admin";

    // Check members by UID
    const memUID = await getDoc(doc(db, "members", uid));
    if (memUID.exists()) return "member";

    return false;

  } catch (err) {
    console.error("Approval check error:", err);
    return false;
  }
}



// -------- SIGN IN --------
liSignIn.addEventListener("click", async () => {
  liMsg.innerText = "";

  const email = liEmail.value.trim();
  const pass = liPass.value;

  if (!email || !pass) {
    liMsg.innerText = "Enter email & password";
    return;
  }

  try {
    const cred = await signInWithEmailAndPassword(auth, email, pass);

    const status = await isApproved(cred.user);

    if (status === "admin") {
      liMsg.innerText = "Welcome Admin!";
      location.href = "home.html";
      return;
    }

    if (status === "member") {
      liMsg.innerText = "Welcome!";
      location.href = "home.html";
      return;
    }

    liMsg.innerText = "Account not approved. Contact admin.";
    await signOut(auth);

  } catch (e) {
    console.error(e);
    liMsg.innerText = e.message;
  }
});


// -------- FORGOT PASSWORD --------

if (forgotPassBtn) {
  forgotPassBtn.addEventListener("click", async () => {
    liMsg.innerText = "";
    const email = liEmail.value.trim();

    if (!email) {
      liMsg.innerText = "Enter your email first.";
      return;
    }

    try {
      const methods = await fetchSignInMethodsForEmail(auth, email);

      if (methods.length === 0) {
        liMsg.innerText = "Invalid login email.";
        return;
      }

      await sendPasswordResetEmail(auth, email);
      liMsg.innerText = "Password reset email sent.";

    } catch (e) {
      console.error("reset password", e);
      liMsg.innerText = "Something went wrong. Try again.";
    }
  });
}



// -------- SIGN UP --------
if (doSignUp) {
  doSignUp.addEventListener("click", async () => {
    const name = suName.value.trim();
    const email = suEmail.value.trim();
    const pass = suPass.value;
    const year = suYear.value.trim();
    const roll = suRoll.value.trim();
    const branch = suBranch.value.trim();

    if (!name || !email || !pass || !year || !roll || !branch) {
      suMsg.innerText = "Please fill all fields.";
      return;
    }

    try {
      const cred = await createUserWithEmailAndPassword(auth, email, pass);

      await setDoc(doc(db, "pendingSignups", cred.user.uid), {
        uid: cred.user.uid,
        name,
        email,
        year,
        roll,
        branch,
        createdAt: new Date().toISOString()
      });

      suMsg.innerText =
        "Signup request submitted. Wait for admin approval.";

      // Clear form inputs after successful request
      suName.value = '';
      suEmail.value = '';
      suPass.value = '';
      suYear.value = '';
      suRoll.value = '';
      suBranch.value = '';

    } catch (e) {
      console.error(e);
      suMsg.innerText = e.message;
    }
  });
}


