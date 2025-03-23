document.addEventListener('DOMContentLoaded', () => {
    console.log('script.js loaded successfully');

    if (typeof firebase === 'undefined') {
        console.error('Firebase not defined in script.js');
        return;
    }

    if (typeof ZXing === 'undefined') {
        console.error('ZXing library not loaded');
        return;
    }

    console.log('script.js: Initializing elements');
    const barcodeInput = document.getElementById('barcode');
    const searchBtn = document.getElementById('search-btn');
    const startScannerBtn = document.getElementById('start-scanner-btn');
    const stopScannerBtn = document.getElementById('stop-scanner-btn');
    const scannerVideo = document.getElementById('scanner-video');
    const scannerDiv = document.querySelector('.scanner');
    const loadingDiv = document.getElementById('loading');
    const logoutBtn = document.getElementById('logout-btn');

    if (!barcodeInput || !searchBtn || !startScannerBtn || !stopScannerBtn || !scannerVideo || !scannerDiv || !loadingDiv || !logoutBtn) {
        console.error('script.js: Missing elements:', { barcodeInput, searchBtn, startScannerBtn, stopScannerBtn, scannerVideo, scannerDiv, loadingDiv, logoutBtn });
        return;
    }

    let codeReader = null;

    console.log('script.js: Setting up search button listener');
    searchBtn.addEventListener('click', () => {
        const query = barcodeInput.value.trim();
        if (query) {
            console.log('Search button clicked, query:', query);
            searchProduct(query);
        } else {
            console.log('Search button clicked, but query is empty');
            alert('Please enter a barcode or product name.');
        }
    });

    console.log('script.js: Setting up scanner buttons');
    startScannerBtn.addEventListener('click', () => {
        console.log('Start scanner button clicked');
        startScanner();
    });

    stopScannerBtn.addEventListener('click', () => {
        console.log('Stop scanner button clicked');
        stopScanner();
    });

    console.log('script.js: Setting up logout button');
    logoutBtn.addEventListener('click', () => {
        console.log('Logout button clicked');
        firebase.auth().signOut()
            .then(() => {
                console.log('User logged out successfully');
                window.location.href = '/auth.html';
            })
            .catch((error) => {
                console.error('Logout error:', error);
            });
    });

    function startScanner() {
        console.log('Starting scanner');
        codeReader = new ZXing.BrowserMultiFormatReader();
        scannerDiv.style.display = 'block';
        startScannerBtn.disabled = true;
        stopScannerBtn.disabled = false;

        codeReader.decodeFromVideoDevice(null, 'scanner-video', (result, err) => {
            if (result) {
                console.log('Barcode scanned:', result.text);
                barcodeInput.value = result.text;
                stopScanner();
                searchProduct(result.text);
            }
            if (err && !(err instanceof ZXing.NotFoundException)) {
                console.error('Scanner error:', err);
            }
        }).catch((err) => {
            console.error('Error starting scanner:', err);
            scannerDiv.style.display = 'none';
            startScannerBtn.disabled = false;
            stopScannerBtn.disabled = true;
        });
    }

    function stopScanner() {
        console.log('Stopping scanner');
        if (codeReader) {
            codeReader.reset();
            codeReader = null;
        }
        scannerDiv.style.display = 'none';
        startScannerBtn.disabled = false;
        stopScannerBtn.disabled = true;
    }

    function searchProduct(query) {
        console.log('Searching product with query:', query);
        loadingDiv.style.display = 'block';

        fetch(`/api/product?query=${encodeURIComponent(query)}`)
            .then(response => response.json())
            .then(data => {
                console.log('Product search response:', data);
                loadingDiv.style.display = 'none';
                if (data.status === 'success' && data.product) {
                    // Store product data in sessionStorage
                    sessionStorage.setItem('productData', JSON.stringify(data.product));
                    console.log('Product data stored in sessionStorage, redirecting to results.html');
                    // Redirect to results.html
                    window.location.href = '/results.html';
                } else {
                    alert('Product not found.');
                }
            })
            .catch(error => {
                console.error('Error fetching product:', error);
                loadingDiv.style.display = 'none';
                alert('Error fetching product data.');
            });
    }

    console.log('script.js: Checking auth state');
    firebase.auth().onAuthStateChanged((user) => {
        console.log('Auth state changed in script.js:', user ? user.uid : 'No user');
        if (!user) {
            console.log('No user, redirecting to auth.html');
            window.location.href = '/auth.html';
        } else if (!user.emailVerified) {
            console.log('Email not verified, redirecting to verify-email.html');
            window.location.href = '/verify-email.html';
        }
    });
});