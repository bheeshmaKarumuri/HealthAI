const express = require("express");
const cors = require('cors');
const path = require('path');  

const userRoute = require("./routes/user.route");
const prescriptionRoute = require("./routes/prescription.route")
const chatRoute = require("./routes/chat.route");
const historyRoute = require("./routes/history.route");

const app = express();

app.use(express.json());
app.use(cors());
app.use('/uploads',express.static('uploads'));
app.use('/frontend',express.static('frontend'));
app.use("/users", userRoute);
app.use("/chat", chatRoute);
app.use("/prescription", prescriptionRoute);
app.use("/history", historyRoute);

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'login.html'));
});

app.get('/',(req,res)=>{
    res.sendFile(path.join(__dirname,'frontend','index.html'));
})

app.get('/medicalquery', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'medicalQuery.html'));
});

app.get('/fracture', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'fracture.html'));
});

app.get('/prescription_analyser', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'prescription.html'));
});

app.get('/symptom2disease', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'symptom2disease.html'));
});

app.get('/profile', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'profile.html'));
});

app.listen(3000, () => { 
    console.log("Listening on port 3000");
});