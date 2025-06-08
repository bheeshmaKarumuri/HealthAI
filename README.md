# HealthAI - AI-Powered Healthcare Platform

A comprehensive healthcare platform that leverages artificial intelligence to provide various medical services including prescription analysis, medical query assistance, symptom-to-disease mapping, and X-ray fracture detection.

## Features

- **Prescription Analysis**: Upload and analyze medical prescriptions using OCR and AI
- **Medical Query Assistant**: Get medical information in multiple languages
- **Symptom to Disease Mapping**: AI-powered disease prediction based on symptoms
- **X-Ray Fracture Detection**: Detect fractures in X-ray images using YOLO model
- **User Profile Management**: Track medical history and previous consultations

## Tech Stack

- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Node.js, Express.js, Python/Flask
- **AI/ML**: 
  - YOLO for fracture detection
  - Groq AI for medical queries
  - Tesseract.js for OCR
  - Custom disease prediction model
- **Database**: Firebase Realtime Database
- **Authentication**: Firebase Authentication

## Setup Instructions

1. Clone the repository:
```bash
git clone [your-repository-url]
cd Project_oneAPI_hack_kpr-main
```

2. Install dependencies:
```bash
# Install Node.js dependencies
cd backend
npm install

# Install Python dependencies
pip install -r requirements.txt
```

3. Set up environment variables:
- Create a `.env` file in the backend directory
- Add your Firebase and API credentials

4. Start the servers:
```bash
# Start Node.js server
npm start

# Start Python server
python models/app.py
```

5. Access the application:
- Open `http://localhost:3000` in your browser

## API Endpoints

- `/users` - User management
- `/chat` - Medical query handling
- `/prescription` - Prescription analysis
- `/history` - User history management

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Firebase for authentication and database
- Groq AI for medical query processing
- YOLO for fracture detection
- Tesseract.js for OCR capabilities 