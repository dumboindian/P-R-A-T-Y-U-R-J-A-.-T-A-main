import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

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
let userAllergens = [];
let preferredLanguage = 'en'; // Default to English

document.addEventListener('DOMContentLoaded', () => {
    console.log('results.js loaded successfully');

    console.log('results.js: Initializing elements');
    const loadingDiv = document.getElementById('loading');
    const resultDiv = document.getElementById('result');
    const productDetailsDiv = document.getElementById('product-details');
    const warningMessage = document.getElementById('warning-message');
    const logoutBtn = document.getElementById('logout-btn');
    const profileBtn = document.getElementById('profile-btn');

    if (!loadingDiv || !resultDiv || !productDetailsDiv || !warningMessage || !logoutBtn || !profileBtn) {
        console.error('results.js: Missing elements:', { loadingDiv, resultDiv, productDetailsDiv, warningMessage, logoutBtn, profileBtn });
        return;
    }

    console.log('results.js: Setting up logout button');
    logoutBtn.addEventListener('click', () => {
        console.log('Logout button clicked');
        signOut(auth)
            .then(() => {
                console.log('User logged out successfully');
                window.location.href = '/auth.html';
            })
            .catch((error) => {
                console.error('Logout error:', error);
            });
    });

    console.log('results.js: Setting up profile button');
    profileBtn.addEventListener('click', () => {
        window.location.href = '/profile.html';
    });

    console.log('results.js: Retrieving product data from sessionStorage');
    const product = JSON.parse(sessionStorage.getItem('productData'));

    if (product) {
        console.log('Product data found:', product);
        displayProduct(product);
    } else {
        console.log('No product data found in sessionStorage');
        loadingDiv.style.display = 'none';
        resultDiv.innerHTML = '<p class="error">No product data available. Please search again.</p>';
        resultDiv.style.display = 'block';
    }

    async function displayProduct(product) {
        console.log('Displaying product in results.js:', product);
        let html = `
            <h2>${product.product_name || 'Unknown Product'}</h2>
            <p><strong>Nutri-Score:</strong> <span class="nutriscore nutriscore-${product.nutriscore_grade || 'e'}">${(product.nutriscore_grade || 'E').toUpperCase()}</span></p>
        `;

        // Normalize product allergens
        const productAllergens = (product.allergens || []).map(allergen => allergen.toLowerCase());
        console.log('Normalized product allergens:', productAllergens);

        // Normalize ingredients text (split by commas, remove extra spaces, convert to lowercase)
        const ingredientsText = product.ingredients_text || '';
        const productIngredients = ingredientsText
            ? ingredientsText.split(',').map(item => item.trim().toLowerCase()).filter(item => item)
            : [];
        console.log('Normalized product ingredients:', productIngredients);

        // Check for allergen matches in both allergens and ingredients
        let matchedAllergens = [];
        let matchedIngredients = [];

        if (userAllergens.length > 0) {
            // Compare with product allergens
            if (productAllergens.length > 0) {
                matchedAllergens = productAllergens.filter(allergen => 
                    userAllergens.some(userAllergen => allergen.includes(userAllergen))
                );
                console.log('Matched allergens:', matchedAllergens);
            }

            // Compare with product ingredients
            if (productIngredients.length > 0) {
                matchedIngredients = productIngredients.filter(ingredient =>
                    userAllergens.some(userAllergen => ingredient.includes(userAllergen))
                );
                console.log('Matched ingredients:', matchedIngredients);
            }
        }

        // Combine matches for the warning message
        const allMatches = [...new Set([...matchedAllergens, ...matchedIngredients])]; // Remove duplicates
        console.log('All matches:', allMatches);

        // Update warning message
        const allergenLoading = document.getElementById('allergen-loading');
        if (allergenLoading) {
            allergenLoading.style.display = 'none';
        }
        warningMessage.style.display = 'block';
        if (allMatches.length > 0) {
            const warningDetails = allMatches.map(match => {
                if (matchedAllergens.includes(match) && matchedIngredients.includes(match)) {
                    return `${match} (in allergens and ingredients)`;
                } else if (matchedAllergens.includes(match)) {
                    return `${match} (in allergens)`;
                } else {
                    return `${match} (in ingredients)`;
                }
            }).join(', ');
            warningMessage.textContent = `Not Safe: Contains ${warningDetails}`;
            warningMessage.classList.add('error');
        } else {
            warningMessage.textContent = 'Safe';
            warningMessage.classList.remove('error');
        }

        if (productAllergens.length > 0) {
            html += `
                <h3>Allergens</h3>
                <div class="allergens">
                    <ul>
                        ${productAllergens.map(allergen => {
                            const isMatched = matchedAllergens.includes(allergen);
                            return `<li class="${isMatched ? 'highlight' : ''}">${allergen}</li>`;
                        }).join('')}
                    </ul>
                </div>
            `;
        }

        if (product.ingredients_text) {
            html += `
                <h3>Ingredients <button class="translate-btn" id="translate-ingredients-btn">Translate to ${preferredLanguage.toUpperCase()}</button></h3>
                <div class="ingredients" id="ingredients-box">
                    ${productIngredients.map(ingredient => {
                        const isMatched = matchedIngredients.includes(ingredient);
                        return `<span class="${isMatched ? 'highlight' : ''}">${ingredient}</span>`;
                    }).join(', ')}
                </div>
            `;
        }

        if (product.additives && product.additives.length > 0) {
            html += `
                <h3>Additives</h3>
                <div class="additives">
                    <ul>
                        ${product.additives.map(additive => `<li>${additive}</li>`).join('')}
                    </ul>
                </div>
            `;
        }

        if (product.colors && product.colors.length > 0) {
            html += `
                <h3>Colors</h3>
                <div class="colors">
                    <ul>
                        ${product.colors.map(color => `<li>${color}</li>`).join('')}
                    </ul>
                </div>
            `;
        }

        if (product.preservatives && product.preservatives.length > 0) {
            html += `
                <h3>Preservatives</h3>
                <div class="preservatives">
                    <ul>
                        ${product.preservatives.map(preservative => `<li>${preservative}</li>`).join('')}
                    </ul>
                </div>
            `;
        }

        if (product.nutriments) {
            const desiredNutrients = [
                { key: 'energy-kcal', label: 'Energy (kcal)' },
                { key: 'fat', label: 'Fat' },
                { key: 'saturated-fat', label: 'Saturated Fat' },
                { key: 'unsaturated-fat', label: 'Unsaturated Fat', calculated: true },
                { key: 'proteins', label: 'Proteins' },
                { key: 'carbohydrates', label: 'Carbohydrates' },
                { key: 'fiber', label: 'Fiber' },
                { key: 'cholesterol', label: 'Cholesterol' },
                { key: 'calcium', label: 'Calcium' },
                { key: 'copper', label: 'Copper' },
                { key: 'iodine', label: 'Iodine' },
                { key: 'iron', label: 'Iron' },
                { key: 'potassium', label: 'Potassium' },
                { key: 'salt', label: 'Salt' },
                { key: 'vitamin-b12', label: 'Vitamin B12' },
                { key: 'vitamin-c', label: 'Vitamin C' },
                { key: 'zinc', label: 'Zinc' }
            ];

            const nutrientRows = desiredNutrients
                .map(nutrient => {
                    if (nutrient.calculated && nutrient.key === 'unsaturated-fat') {
                        const totalFat = product.nutriments['fat'] || 0;
                        const saturatedFat = product.nutriments['saturated-fat'] || 0;
                        const unsaturatedFat = totalFat - saturatedFat;
                        if (totalFat > 0) {
                            return `
                                <div class="nutrient-row">
                                    <span class="nutrient-label">${nutrient.label}</span>
                                    <span class="nutrient-value">${unsaturatedFat.toFixed(1)} ${product.nutriments['fat_unit'] || 'g'}</span>
                                </div>
                            `;
                        }
                    } else if (product.nutriments[nutrient.key] !== undefined) {
                        return `
                            <div class="nutrient-row">
                                <span class="nutrient-label">${nutrient.label}</span>
                                <span class="nutrient-value">${product.nutriments[nutrient.key]} ${product.nutriments[nutrient.key + '_unit'] || ''}</span>
                            </div>
                        `;
                    }
                    return null;
                })
                .filter(row => row !== null)
                .join('');

            if (nutrientRows) {
                html += `
                    <div class="nutritional-values">
                        <h3>Nutritional Values (per 100g)</h3>
                        ${nutrientRows}
                    </div>
                `;
            }
        }

        loadingDiv.style.display = 'none';
        productDetailsDiv.innerHTML = html;
        resultDiv.style.display = 'block';

        // Add event listener for the translate button
        const translateBtn = document.getElementById('translate-ingredients-btn');
        const ingredientsBox = document.getElementById('ingredients-box');
        if (translateBtn && ingredientsBox) {
            translateBtn.addEventListener('click', async () => {
                translateBtn.disabled = true;
                translateBtn.textContent = 'Translating...';
                try {
                    const originalText = product.ingredients_text;
                    const translatedText = await translateIngredients(originalText, preferredLanguage);
                    // Split translated text and reapply highlighting
                    const translatedIngredients = translatedText
                        ? translatedText.split(',').map(item => item.trim().toLowerCase()).filter(item => item)
                        : [];
                    ingredientsBox.innerHTML = translatedIngredients.map(ingredient => {
                        const isMatched = matchedIngredients.some(matched => ingredient.includes(matched));
                        return `<span class="${isMatched ? 'highlight' : ''}">${ingredient}</span>`;
                    }).join(', ');
                    translateBtn.textContent = 'Translated!';
                    translateBtn.disabled = true;
                } catch (error) {
                    console.error('Error translating ingredients:', error);
                    ingredientsBox.textContent = 'Translation failed. Please try again.';
                    translateBtn.textContent = `Translate to ${preferredLanguage.toUpperCase()}`;
                    translateBtn.disabled = false;
                }
            });
        }
    }

    async function translateIngredients(ingredientsText, targetLang) {
        console.log('Translating ingredients:', ingredientsText, 'to', targetLang);
        const response = await fetch('/api/translate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ text: ingredientsText, targetLang })
        });

        const data = await response.json();
        if (data.status === 'success') {
            return data.translatedText;
        } else {
            throw new Error(data.message || 'Translation failed');
        }
    }

    console.log('results.js: Checking auth state');
    onAuthStateChanged(auth, (user) => {
        console.log('Auth state changed in results.js:', user ? user.uid : 'No user');
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

        // Load user allergens and preferred language from Firestore
        const userRef = doc(db, 'users', user.uid);
        getDoc(userRef)
            .then((docSnap) => {
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    userAllergens = data.allergens || [];
                    preferredLanguage = data.preferredLanguage || 'en';
                    console.log('User allergens loaded:', userAllergens);
                    console.log('User preferred language loaded:', preferredLanguage);
                    // Re-display the product to update the translate button and warning
                    if (product) {
                        displayProduct(product);
                    }
                } else {
                    console.error('User document not found in Firestore');
                    const allergenLoading = document.getElementById('allergen-loading');
                    if (allergenLoading) {
                        allergenLoading.style.display = 'none';
                    }
                    warningMessage.style.display = 'block';
                    warningMessage.textContent = 'Error loading user data.';
                    warningMessage.classList.add('error');
                }
            })
            .catch((error) => {
                console.error('Error loading user data:', error);
                const allergenLoading = document.getElementById('allergen-loading');
                if (allergenLoading) {
                    allergenLoading.style.display = 'none';
                }
                warningMessage.style.display = 'block';
                warningMessage.textContent = 'Error loading user data.';
                warningMessage.classList.add('error');
            });
    });
});