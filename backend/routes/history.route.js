const express = require("express");
const { initializeApp } = require('firebase/app');
const { getDatabase, ref, get, child, set, push } = require('firebase/database');
const multer = require('multer');
const path = require('path');

const firebaseConfig = {
    apiKey: "AIzaSyDx-RRRKEZ7rVDHHBYmf4yOBpXFm1426FE",
    authDomain: "intel-7e2a6.firebaseapp.com",
    projectId: "intel-7e2a6",
    storageBucket: "intel-7e2a6.firebasestorage.app",
    messagingSenderId: "1077704129373",
    appId: "1:1077704129373:web:810ad04ccaf71007ac86b4",
    measurementId: "G-3RFS87233D"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// Store chat history
router.post('/store-chat', async (req, res) => {
    try {
        const { userId, query, response } = req.body;
        const chatRef = ref(database, `users/${userId}/chats`);
        const newChat = {
            query,
            response,
            timestamp: new Date().toISOString()
        };
        
        await push(chatRef, newChat);
        res.status(200).json({ message: 'Chat stored successfully' });
    } catch (error) {
        console.error('Error storing chat:', error);
        res.status(500).json({ error: 'Failed to store chat' });
    }
});

// Store X-ray image
router.post('/store-xray', upload.single('xray'), async (req, res) => {
    try {
        const { userId, analysis } = req.body;
        const xrayRef = ref(database, `users/${userId}/xrays`);
        const newXray = {
            imageUrl: `/uploads/${req.file.filename}`,
            analysis,
            timestamp: new Date().toISOString()
        };
        
        await push(xrayRef, newXray);
        res.status(200).json({ message: 'X-ray stored successfully' });
    } catch (error) {
        console.error('Error storing X-ray:', error);
        res.status(500).json({ error: 'Failed to store X-ray' });
    }
});

// Store prescription
router.post('/store-prescription', upload.single('prescription'), async (req, res) => {
    try {
        const { userId, analysis } = req.body;
        const prescriptionRef = ref(database, `users/${userId}/prescriptions`);
        const newPrescription = {
            imageUrl: `/uploads/${req.file.filename}`,
            analysis,
            timestamp: new Date().toISOString()
        };
        
        await push(prescriptionRef, newPrescription);
        res.status(200).json({ message: 'Prescription stored successfully' });
    } catch (error) {
        console.error('Error storing prescription:', error);
        res.status(500).json({ error: 'Failed to store prescription' });
    }
});

// Get user history
router.get('/get-history/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const userRef = ref(database, `users/${userId}`);
        const snapshot = await get(userRef);
        
        if (snapshot.exists()) {
            const userData = snapshot.val();
            console.log('User data retrieved from Firebase for history:', userData);
            console.log('Chats data from Firebase (raw): ', userData.chats);
            res.status(200).json({
                chats: userData.chats || {},
                xrays: userData.xrays || {},
                prescriptions: userData.prescriptions || {}
            });
        } else {
            console.log('User history not found for userId:', userId);
            res.status(404).json({ error: 'User history not found' });
        }
    } catch (error) {
        console.error('Error fetching user history:', error);
        res.status(500).json({ error: 'Failed to fetch user history' });
    }
});

module.exports = router; 