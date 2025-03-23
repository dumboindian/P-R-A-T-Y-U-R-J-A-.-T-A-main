import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, sendEmailVerification } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { getFirestore, collection, doc, setDoc, updateDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

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
const db = getFirestore(app);

document.addEventListener('DOMContentLoaded', () => {
    console.log('auth.js loaded successfully');

    // Elements for toggling between login and signup
    const loginToggle = document.getElementById('login-toggle');
    const signupToggle = document.getElementById('signup-toggle');
    const formContainer = document.getElementById('form-container');

    // Form elements
    const loginForm = document.getElementById('login-form-element');
    const signupForm = document.getElementById('signup-form-element');
    const loginMessage = document.getElementById('login-message');
    const signupMessage = document.getElementById('signup-message');

    // Toggle between login and signup forms
    loginToggle.addEventListener('click', () => {
        loginToggle.classList.add('active');
        signupToggle.classList.remove('active');
        formContainer.classList.remove('signup-active');
    });

    signupToggle.addEventListener('click', () => {
        signupToggle.classList.add('active');
        loginToggle.classList.remove('active');
        formContainer.classList.add('signup-active');
    });

    // Handle login
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        loginMessage.style.display = 'block';
        loginMessage.textContent = 'Logging in...';

        signInWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {
                const user = userCredential.user;
                console.log('User logged in:', user.uid);
                loginMessage.textContent = 'Login successful! Redirecting...';
                loginMessage.classList.remove('error');

                // Update lastLogin timestamp in Firestore
                const userRef = doc(db, 'users', user.uid);
                updateDoc(userRef, {
                    lastLogin: serverTimestamp()
                }).catch((error) => {
                    console.error('Error updating lastLogin:', error);
                });

                window.location.href = '/index.html';
            })
            .catch((error) => {
                console.error('Login error:', error);
                loginMessage.textContent = error.message;
                loginMessage.classList.add('error');
            });
    });

    // Handle signup
    signupForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('signup-name').value.trim();
        const surname = document.getElementById('signup-surname').value.trim();
        const age = parseInt(document.getElementById('signup-age').value);
        const address = document.getElementById('signup-address').value.trim();
        const countryCode = document.getElementById('signup-country-code').value;
        const phoneNumberInput = document.getElementById('signup-phone').value.trim();
        const email = document.getElementById('signup-email').value.trim();
        const password = document.getElementById('signup-password').value.trim();
        const allergensInput = document.getElementById('signup-allergens').value.trim();
        const dietaryPreference = document.getElementById('signup-dietary').value;
        const preferredLanguage = document.getElementById('signup-language').value;

        // Validate phone number
        const phoneRegex = /^\d{10}$/;
        if (!phoneRegex.test(phoneNumberInput)) {
            signupMessage.textContent = 'Phone number must be exactly 10 digits.';
            signupMessage.classList.add('error');
            return;
        }

        // Combine country code and phone number
        const phoneNumber = `${countryCode}${phoneNumberInput}`;

        // Process allergens (comma-separated input)
        let allergens = [];
        try {
            allergens = allergensInput ? allergensInput.split(',').map(item => {
                const trimmed = item.trim().toLowerCase();
                if (!trimmed.match(/^[a-zA-Z\s-]+$/)) {
                    throw new Error('Allergens must contain only letters, spaces, or hyphens.');
                }
                if (!trimmed) {
                    throw new Error('Allergens cannot be empty.');
                }
                return trimmed;
            }) : [];
        } catch (error) {
            signupMessage.textContent = error.message;
            signupMessage.classList.add('error');
            return;
        }

        signupMessage.style.display = 'block';
        signupMessage.textContent = 'Signing up...';

        createUserWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {
                const user = userCredential.user;
                console.log('User signed up:', user.uid);

                // Send email verification
                sendEmailVerification(user)
                    .then(() => {
                        console.log('Verification email sent to:', email);
                        signupMessage.textContent = 'Sign up successful! Please verify your email.';
                        signupMessage.classList.remove('error');
                    })
                    .catch((error) => {
                        console.error('Error sending verification email:', error);
                        signupMessage.textContent = 'Sign up successful, but failed to send verification email.';
                        signupMessage.classList.add('warning');
                    });

                // Save user data to Firestore
                const userRef = doc(db, 'users', user.uid);
                return setDoc(userRef, {
                    name: name,
                    surname: surname,
                    age: age,
                    address: address,
                    phoneNumber: phoneNumber,
                    email: email,
                    allergens: allergens,
                    dietaryPreference: dietaryPreference,
                    preferredLanguage: preferredLanguage,
                    createdAt: serverTimestamp(),
                    lastLogin: serverTimestamp()
                });
            })
            .then(() => {
                console.log('User data saved to Firestore');
                window.location.href = '/verify-email.html';
            })
            .catch((error) => {
                console.error('Signup error:', error);
                signupMessage.textContent = error.message;
                signupMessage.classList.add('error');
            });
    });

    // Redirect if already logged in
    onAuthStateChanged(auth, (user) => {
        if (user) {
            if (user.emailVerified) {
                console.log('User is logged in and email verified, redirecting to index.html');
                window.location.href = '/index.html';
            } else {
                console.log('User is logged in but email not verified, redirecting to verify-email.html');
                window.location.href = '/verify-email.html';
            }
        }
    });
});