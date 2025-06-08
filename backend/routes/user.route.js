const express = require("express")
const { initializeApp } = require('firebase/app');
const { getDatabase, ref, get, child, set, push } = require('firebase/database');

const firebaseConfig = {
    apiKey: "AIzaSyDx-RRRKEZ7rVDHHBYmf4yOBpXFm1426FE",
    authDomain: "intel-7e2a6.firebaseapp.com",
    projectId: "intel-7e2a6",
    storageBucket: "intel-7e2a6.firebasestorage.app",
    messagingSenderId: "1077704129373",
    appId: "1:1077704129373:web:810ad04ccaf71007ac86b4",
    measurementId: "G-3RFS87233D"
};

// Initialize Firebase
let app;
let database;

try {
    app = initializeApp(firebaseConfig);
    database = getDatabase(app);
    console.log('Firebase initialized successfully');
} catch (error) {
    console.error('Error initializing Firebase:', error);
}

const router = express.Router();

async function getAllUsers() {
    const dbRef = ref(database);
    try {
        const snapshot = await get(child(dbRef, 'users/'));
        if (snapshot.exists()) {
            return snapshot.val();
        } else {
            console.log("No users data available");
            return {};
        }
    } catch (error) {
        console.error("Error reading users data:", error);
        throw error;
    }
}

router.get('/', (req, res) => {
    res.send('user route');
});

router.post('/login', async (req, res) => {
    try {
        const user = req.body.user;
        console.log('Login attempt for:', user.email);
        
        const users = await getAllUsers();
        console.log('Retrieved users:', users);

        let usersArray = [];
        for (let key in users) {
            if (users.hasOwnProperty(key)) {
                usersArray.push({ id: key, ...users[key] });
            }
        }

        const foundUser = usersArray.find(u => u.email === user.email);
        console.log('Found user:', foundUser);

        if (foundUser) {
            if (foundUser.pass === user.pass) {
                console.log('Login successful for:', user.email);
                return res.send({ user: { ...foundUser, id: foundUser.id } });
            } else {
                console.log('Invalid password for:', user.email);
                return res.send({ error: 'Invalid password' });
            }
        }

        console.log('User not found:', user.email);
        return res.send({ error: 'Invalid credentials' });
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).send({ error: 'Internal server error' });
    }
});

router.post('/register', async (req, res) => {
    try {
        const user = req.body.user;
        console.log('Registration attempt for:', user.email);

        // Validate required fields
        if (!user.email || !user.pass || !user.name) {
            console.error('Missing required fields');
            return res.status(400).json({ 
                status: 'error',
                message: 'Missing required fields (email, password, name)' 
            });
        }

        const users = await getAllUsers();
        console.log('Current users in database:', users);

        const usersArray = Object.entries(users).map(([key, value]) => ({ id: key, ...value }));
        const foundUser = usersArray.find(u => u.email === user.email);
        
        if (foundUser) {
            console.log('User already exists:', user.email);
            return res.status(409).json({ 
                status: 'error',
                message: "user already exists" 
            });
        }

        // Create user object with additional fields
        const userData = {
            ...user,
            createdAt: new Date().toISOString(),
            chats: [],
            xrays: [],
            prescriptions: []
        };

        console.log('Attempting to store user data:', userData);
        const dbref = ref(database, 'users/');
        const newUserRef = await push(dbref, userData);
        
        if (!newUserRef.key) {
            throw new Error('Failed to generate user ID');
        }

        console.log('User registered successfully:', {
            userId: newUserRef.key,
            email: user.email
        });
        
        return res.status(200).json({ 
            status: 'success',
            message: "user added successfully",
            userId: newUserRef.key
        });
    } catch (error) {
        console.error('Registration error:', error);
        return res.status(500).json({ 
            status: 'error',
            message: error.message 
        });
    }
});

// Add this test route
router.get('/test-firebase', async (req, res) => {
    try {
        console.log('Testing Firebase connection...');
        
        // Test write
        const testRef = ref(database, 'test/connection');
        await set(testRef, {
            timestamp: new Date().toISOString(),
            status: 'connected'
        });
        console.log('Successfully wrote test data to Firebase');

        // Test read
        const snapshot = await get(testRef);
        if (snapshot.exists()) {
            console.log('Successfully read test data from Firebase:', snapshot.val());
            return res.json({
                status: 'success',
                message: 'Firebase connection working',
                data: snapshot.val()
            });
        } else {
            console.log('No test data found in Firebase');
            return res.status(404).json({
                status: 'error',
                message: 'No test data found'
            });
        }
    } catch (error) {
        console.error('Firebase test error:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Firebase connection failed',
            error: error.message
        });
    }
});

module.exports = router;