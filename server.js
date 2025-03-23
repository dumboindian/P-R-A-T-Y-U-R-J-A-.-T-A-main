const express = require('express');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// In-memory cache
const productCache = new Map();

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/auth.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'auth.html'));
});

app.get('/verify-email.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'verify-email.html'));
});

app.get('/results.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'results.html'));
});

app.get('/profile.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'profile.html'));
});

app.get('/api/product', async (req, res) => {
    const query = req.query.query;
    if (!query) {
        return res.status(400).json({ status: 'error', message: 'Query parameter is required' });
    }

    // Check cache
    if (productCache.has(query)) {
        console.log(`Cache hit for query: ${query}`);
        return res.json(productCache.get(query));
    }

    // Retry logic
    const maxRetries = 3;
    let attempt = 0;
    let lastError = null;

    while (attempt < maxRetries) {
        try {
            const response = await axios.get(`https://world.openfoodfacts.org/api/v0/product/${query}.json`, {
                timeout: 5000 // 5 seconds timeout
            });
            if (response.data.status === 1) {
                const product = response.data.product;
                const productData = {
                    status: 'success',
                    product: {
                        product_name: product.product_name || 'Unknown Product',
                        nutriscore_grade: product.nutriscore_grade || 'e',
                        allergens: product.allergens_tags || [],
                        ingredients_text: product.ingredients_text || '',
                        additives: product.additives_tags || [],
                        colors: product.colors_tags || [],
                        preservatives: product.preservatives_tags || [],
                        nutriments: product.nutriments || {}
                    }
                };
                // Store in cache
                productCache.set(query, productData);
                return res.json(productData);
            } else {
                return res.json({ status: 'error', message: 'Product not found' });
            }
        } catch (error) {
            console.error(`Attempt ${attempt + 1} failed for query ${query}:`, error.message);
            lastError = error;
            attempt++;
            if (attempt < maxRetries) {
                await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Exponential backoff
            }
        }
    }

    console.error('All retries failed for query:', query);
    res.status(500).json({ status: 'error', message: `Error fetching product data: ${lastError.message}` });
});

app.post('/api/translate', async (req, res) => {
    const { text, targetLang } = req.body;
    if (!text || !targetLang) {
        return res.status(400).json({ status: 'error', message: 'Text and targetLang parameters are required' });
    }

    try {
        // Detect source language (simplified: assume 'fr' if targetLang is not 'fr', else 'en')
        const sourceLang = targetLang === 'fr' ? 'en' : 'fr';
        const params = new URLSearchParams({
            q: text,
            langpair: `${sourceLang}|${targetLang}`
        });
        const response = await axios.get(`https://api.mymemory.translated.net/get?${params.toString()}`);
        const data = response.data;
        if (data.responseStatus === 200 && data.responseData && data.responseData.translatedText) {
            res.json({ status: 'success', translatedText: data.responseData.translatedText });
        } else {
            res.status(500).json({ status: 'error', message: data.responseDetails || 'Translation failed' });
        }
    } catch (error) {
        console.error('Error translating text with MyMemory API:', error.message);
        res.status(500).json({ status: 'error', message: 'Error translating text' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});