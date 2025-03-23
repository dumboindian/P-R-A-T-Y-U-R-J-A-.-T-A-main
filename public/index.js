import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";

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
    console.log('index.js loaded successfully');

    const barcodeInput = document.getElementById('barcode');
    const searchBtn = document.getElementById('search-btn');
    const messageDiv = document.getElementById('message');
    const startScannerBtn = document.getElementById('start-scanner-btn');
    const stopScannerBtn = document.getElementById('stop-scanner-btn');
    const video = document.getElementById('scanner-video');
    const canvas = document.getElementById('scanner-canvas');
    const canvasContext = canvas.getContext('2d');
    const logoutBtn = document.getElementById('logout-btn');
    const profileBtn = document.getElementById('profile-btn');
    let stream = null;

    if (!barcodeInput || !searchBtn || !messageDiv || !startScannerBtn || !stopScannerBtn || !video || !canvas || !logoutBtn || !profileBtn) {
        console.error('index.js: Missing elements');
        return;
    }

    searchBtn.addEventListener('click', () => {
        const query = barcodeInput.value.trim();
        if (!query) {
            messageDiv.textContent = 'Please enter a barcode or product name.';
            messageDiv.classList.add('error');
            return;
        }

        messageDiv.textContent = 'Searching...';
        messageDiv.classList.remove('error');

        fetch(`/api/product?query=${encodeURIComponent(query)}`)
            .then(response => response.json())
            .then(data => {
                if (data.status === 'success') {
                    sessionStorage.setItem('productData', JSON.stringify(data.product));
                    window.location.href = '/results.html';
                } else {
                    messageDiv.textContent = data.message || 'Product not found.';
                    messageDiv.classList.add('error');
                }
            })
            .catch(error => {
                console.error('Error fetching product:', error);
                messageDiv.textContent = 'Error fetching product data.';
                messageDiv.classList.add('error');
            });
    });

    startScannerBtn.addEventListener('click', async () => {
        try {
            stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            video.srcObject = stream;
            video.style.display = 'block';
            video.play();
            startScannerBtn.disabled = true;
            stopScannerBtn.disabled = false;
            canvas.style.display = 'none';
            scanBarcode();
        } catch (error) {
            console.error('Error accessing camera:', error);
            messageDiv.textContent = 'Error accessing camera. Please ensure you have granted permission.';
            messageDiv.classList.add('error');
        }
    });

    stopScannerBtn.addEventListener('click', () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            video.style.display = 'none';
            startScannerBtn.disabled = false;
            stopScannerBtn.disabled = true;
        }
    });

    function scanBarcode() {
        if (!video.videoWidth || !video.videoHeight) {
            requestAnimationFrame(scanBarcode);
            return;
        }

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvasContext.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = canvasContext.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);

        if (code) {
            console.log('Barcode detected:', code.data);
            barcodeInput.value = code.data;
            stopScannerBtn.click();
            searchBtn.click();
        } else {
            requestAnimationFrame(scanBarcode);
        }
    }

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

    profileBtn.addEventListener('click', () => {
        window.location.href = '/profile.html';
    });

    onAuthStateChanged(auth, (user) => {
        if (!user) {
            console.log('No user, redirecting to auth.html');
            window.location.href = '/auth.html';
        } else if (!user.emailVerified) {
            console.log('Email not verified, redirecting to verify-email.html');
            window.location.href = '/verify-email.html';
        }
    });
});