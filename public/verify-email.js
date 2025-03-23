import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut, sendEmailVerification } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyBylEy_Hii_U5sJBn12hSSBBwwQRVKN7w8",
  authDomain: "jagoindia-f5188.firebaseapp.com",
  databaseURL: "https://jagoindia-f5188-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "jagoindia-f5188",
  storageBucket: "jagoindia-f5188.firebasestorage.app",
  messagingSenderId: "1054822290701",
  appId: "1:1054822290701:web:33f3dfec9c1548b69b4c44",
  measurementId: "G-XV9NLY32XW"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

document.addEventListener('DOMContentLoaded', () => {
    console.log('verify-email.js loaded successfully');

    const resendBtn = document.getElementById('resend-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const messageDiv = document.getElementById('message');

    if (!resendBtn || !logoutBtn || !messageDiv) {
        console.error('verify-email.js: Missing elements');
        return;
    }

    resendBtn.addEventListener('click', () => {
        const user = auth.currentUser;
        if (user) {
            sendEmailVerification(user)
                .then(() => {
                    messageDiv.textContent = 'Verification email resent! Please check your inbox.';
                    messageDiv.classList.remove('error');
                })
                .catch((error) => {
                    console.error('Error resending verification email:', error);
                    messageDiv.textContent = error.message;
                    messageDiv.classList.add('error');
                });
        } else {
            messageDiv.textContent = 'No user is currently signed in.';
            messageDiv.classList.add('error');
        }
    });

    logoutBtn.addEventListener('click', () => {
        signOut(auth)
            .then(() => {
                console.log('User logged out successfully');
                window.location.href = '/auth.html';
            })
            .catch((error) => {
                console.error('Logout error:', error);
                messageDiv.textContent = error.message;
                messageDiv.classList.add('error');
            });
    });

    onAuthStateChanged(auth, (user) => {
        if (!user) {
            console.log('No user, redirecting to auth.html');
            window.location.href = '/auth.html';
        } else if (user.emailVerified) {
            console.log('Email verified, redirecting to index.html');
            window.location.href = '/index.html';
        }
    });
});