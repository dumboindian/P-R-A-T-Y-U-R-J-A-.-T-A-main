import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { getFirestore, doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

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

// List of country codes (must match the options in the dropdown)
const countryCodes = ['+1', '+91', '+44', '+33', '+49', '+81', '+61'];

document.addEventListener('DOMContentLoaded', () => {
    console.log('profile.js loaded successfully');

    // Load user profile data
    onAuthStateChanged(auth, (user) => {
        if (!user) {
            console.log('No user, redirecting to auth.html');
            window.location.href = '/auth.html';
            return;
        }

        if (!user.emailVerified) {
            console.log('Email not verified, redirecting to verify-email.html');
            window.location.href = '/verify-email.html';
            return;
        }

        // DOM elements (moved inside the callback to ensure page context)
        const loadingDiv = document.getElementById('loading');
        const profileDiv = document.getElementById('profile');
        const profileForm = document.getElementById('profile-form');
        const profileMessage = document.getElementById('profile-message');
        const logoutBtn = document.getElementById('logout-btn');
        const backBtn = document.getElementById('back-btn');

        // Form fields
        const nameInput = document.getElementById('profile-name');
        const surnameInput = document.getElementById('profile-surname');
        const ageInput = document.getElementById('profile-age');
        const addressInput = document.getElementById('profile-address');
        const countryCodeSelect = document.getElementById('profile-country-code');
        const phoneInput = document.getElementById('profile-phone');
        const emailInput = document.getElementById('profile-email');
        const allergensInput = document.getElementById('profile-allergens');
        const dietarySelect = document.getElementById('profile-dietary');
        const languageInput = document.getElementById('profile-language');

        // Debug: Log DOM elements to ensure they are found
        console.log('nameInput:', nameInput);
        console.log('countryCodeSelect:', countryCodeSelect);

        // Handle logout
        logoutBtn.addEventListener('click', () => {
            signOut(auth)
                .then(() => {
                    console.log('User logged out successfully');
                    window.location.href = '/auth.html';
                })
                .catch((error) => {
                    console.error('Logout error:', error);
                });
        });

        // Handle back button
        backBtn.addEventListener('click', () => {
            window.location.href = '/index.html';
        });

        // Load user data from Firestore
        const userRef = doc(db, 'users', user.uid);
        getDoc(userRef)
            .then((docSnap) => {
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    nameInput.value = data.name || '';
                    surnameInput.value = data.surname || '';
                    ageInput.value = data.age || '';
                    addressInput.value = data.address || '';
                    emailInput.value = data.email || user.email;
                    allergensInput.value = data.allergens ? data.allergens.join(', ') : '';
                    dietarySelect.value = data.dietaryPreference || 'vegetarian';
                    languageInput.value = data.preferredLanguage || 'en';

                    // Split the phoneNumber into country code and the rest
                    const phoneNumber = data.phoneNumber || '';
                    let countryCode = '+1'; // Default to +1 if not found
                    let phoneNumberWithoutCode = phoneNumber;

                    // Find the country code in the phone number
                    for (const code of countryCodes) {
                        if (phoneNumber.startsWith(code)) {
                            countryCode = code;
                            phoneNumberWithoutCode = phoneNumber.slice(code.length);
                            break;
                        }
                    }

                    countryCodeSelect.value = countryCode;
                    phoneInput.value = phoneNumberWithoutCode;

                    loadingDiv.style.display = 'none';
                    profileDiv.style.display = 'block';
                } else {
                    console.error('User document not found in Firestore');
                    loadingDiv.style.display = 'none';
                    profileDiv.innerHTML = '<p class="error">Profile not found. Please contact support.</p>';
                    profileDiv.style.display = 'block';
                }
            })
            .catch((error) => {
                console.error('Error loading profile:', error);
                loadingDiv.style.display = 'none';
                profileDiv.innerHTML = '<p class="error">Error loading profile. Please try again.</p>';
                profileDiv.style.display = 'block';
            });

        // Handle profile form submission
        profileForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const user = auth.currentUser;
            if (!user) {
                profileMessage.textContent = 'User not authenticated.';
                profileMessage.classList.add('error');
                return;
            }

            const name = nameInput.value.trim();
            const surname = surnameInput.value.trim();
            const age = parseInt(ageInput.value);
            const address = addressInput.value.trim();
            const countryCode = countryCodeSelect.value;
            const phoneNumberInput = phoneInput.value.trim();
            const dietaryPreference = dietarySelect.value.trim();
            const preferredLanguage = languageInput.value;

            // Validate phone number
            const phoneRegex = /^\d{10}$/;
            if (!phoneRegex.test(phoneNumberInput)) {
                profileMessage.textContent = 'Phone number must be exactly 10 digits.';
                profileMessage.classList.add('error');
                return;
            }

            // Combine country code and phone number
            const phoneNumber = `${countryCode}${phoneNumberInput}`;

            // Process allergens (comma-separated input)
            const allergensInputValue = allergensInput.value.trim();
            const allergens = allergensInputValue ? allergensInputValue.split(',').map(item => {
                const trimmed = item.trim().toLowerCase();
                if (!trimmed.match(/^[a-zA-Z\s-]+$/)) {
                    throw new Error('Allergens must contain only letters, spaces, or hyphens.');
                }
                return trimmed;
            }) : [];

            // Validate allergens
            try {
                allergens.forEach(allergen => {
                    if (!allergen) throw new Error('Allergens cannot be empty.');
                });
            } catch (error) {
                profileMessage.textContent = error.message;
                profileMessage.classList.add('error');
                return;
            }

            profileMessage.style.display = 'block';
            profileMessage.textContent = 'Saving changes...';

            const userRef = doc(db, 'users', user.uid);
            updateDoc(userRef, {
                name: name,
                surname: surname,
                age: age,
                address: address,
                phoneNumber: phoneNumber,
                allergens: allergens,
                dietaryPreference: dietaryPreference,
                preferredLanguage: preferredLanguage
            })
            .then(() => {
                console.log('Profile updated successfully');
                profileMessage.textContent = 'Profile updated successfully!';
                profileMessage.classList.remove('error');
            })
            .catch((error) => {
                console.error('Error updating profile:', error);
                profileMessage.textContent = error.message;
                profileMessage.classList.add('error');
            });
        });
    });
});