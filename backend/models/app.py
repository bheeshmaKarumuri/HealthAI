import logging
from flask import Flask, request, jsonify,send_file
import numpy as np
import os
from ultralytics import YOLO
from flask_cors import CORS
from concurrent.futures import ThreadPoolExecutor
import asyncio
from symptom2disease import DiseasePredictor 
from yoloFractureDetection import process_image
import cv2
from PIL import Image, ImageDraw, ImageFont

# Load your pre-trained model and disease predictor
disease = DiseasePredictor("../models/SyptomsData/Training.csv")

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)
executor = ThreadPoolExecutor()
weights_path = "./best.pt"
class_names = ["elbow positive", "fingers positive", "forearm fracture", "humerus fracture", "humerus", "shoulder fracture", "wrist positive"]
model = YOLO(weights_path)

def draw_boxes(image, boxes, class_names):
    """Draw bounding boxes and labels on the image."""
    draw = ImageDraw.Draw(image)
    
    # Try to load a font, fall back to default if not available
    try:
        font = ImageFont.truetype("arial.ttf", 20)
    except IOError:
        font = ImageFont.load_default()
    
    for box in boxes:
        # Get box coordinates
        x1, y1, x2, y2 = box.xyxy[0].tolist()
        cls = int(box.cls.item())
        conf = box.conf.item()
        
        # Draw rectangle
        draw.rectangle([x1, y1, x2, y2], outline="red", width=3)
        
        # Prepare label
        label = f"{class_names[cls]} {conf:.2f}"
        
        # Get text size using textbbox
        bbox = draw.textbbox((0, 0), label, font=font)
        text_width = bbox[2] - bbox[0]
        text_height = bbox[3] - bbox[1]
        
        # Draw label background
        draw.rectangle([x1, y1 - text_height, x1 + text_width, y1], fill="red")
        
        # Draw label text
        draw.text((x1, y1 - text_height), label, fill="white", font=font)
    
    return image

@app.route("/health", methods=['GET'])
def health_check():
    """Health check endpoint."""
    return jsonify({"status": "healthy", "message": "Server is running"}), 200

@app.route("/check_fracture", methods=['POST'])
async def check_fracture():
    """Endpoint to check for fractures in an X-ray image."""
    if 'image' not in request.files:
        return jsonify({"error": "No image file provided"}), 400

    img = request.files['image']
    print(f"Received file: {img.filename}")

    static_dir = "./static/"
    if not os.path.exists(static_dir):
        os.makedirs(static_dir)

    img_path = os.path.join(static_dir, img.filename)
    img.save(img_path)

    try:
        # Process the image with the model
        image = cv2.imread(img_path)
        image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        results = model(image)
        
        # Get predictions
        predictions = []
        for box in results[0].boxes:
            cls = int(box.cls.item())
            conf = box.conf.item()
            x1, y1, x2, y2 = box.xyxy[0].tolist()
            predictions.append({
                "type": class_names[cls],
                "confidence": f"{conf:.2%}",
                "location": {
                    "x1": int(x1),
                    "y1": int(y1),
                    "x2": int(x2),
                    "y2": int(y2)
                }
            })

        # Process the image using the yoloFractureDetection module
        output_filename = process_image(img_path, model, class_names)
        
        # Copy the processed image to static directory
        processed_filename = f"processed_{os.path.basename(img.filename)}"
        processed_path = os.path.join(static_dir, processed_filename)
        import shutil
        shutil.copy2(output_filename, processed_path)
        
        # Return both the processed image and predictions
        return jsonify({
            "image_url": f"/static/{processed_filename}",
            "predictions": predictions,
            "original_image": f"/static/{img.filename}"
        })
    except Exception as e:
        print(f"Error processing image: {str(e)}")
        return jsonify({"error": "Failed to process image"}), 500

@app.route("/predict_disease", methods=['POST'])
async def predict_disease():
    """Endpoint to predict disease based on symptoms."""
    if not request.is_json:
        return jsonify({"error": "Request must be JSON"}), 400

    symptoms = request.json.get('symptoms')
    print("Received symptoms:", symptoms)
    if not symptoms:
        return jsonify({"error": "No symptoms provided"}), 400

    loop = asyncio.get_event_loop()
    result = await loop.run_in_executor(executor, disease.disease_prediction, symptoms)

    return jsonify(result)

@app.route("/chat/query", methods=['POST', 'OPTIONS'])
async def chat_query():
    """Endpoint to handle medical queries."""
    if request.method == 'OPTIONS':
        return '', 200
        
    if not request.is_json:
        return jsonify({"error": "Request must be JSON"}), 400

    query = request.json.get('query')
    if not query:
        return jsonify({"error": "No query provided"}), 400

    try:
        # Process the query and generate a response
        response = {
            "response": f"Based on your query about '{query}', here are some general recommendations:\n\n" +
                      "1. Maintain a healthy diet rich in fruits, vegetables, and whole grains\n" +
                      "2. Exercise regularly (at least 30 minutes of moderate activity daily)\n" +
                      "3. Get adequate sleep (7-9 hours per night)\n" +
                      "4. Manage stress through relaxation techniques\n" +
                      "5. Avoid smoking and limit alcohol consumption\n" +
                      "6. Regular health check-ups and screenings\n\n" +
                      "Please note: This is general advice. For personalized medical advice, please consult with a healthcare professional."
        }
        return jsonify(response)
    except Exception as e:
        print(f"Error processing query: {str(e)}")
        return jsonify({"error": "Failed to process query"}), 500

# Run the Flask app
if __name__ == '__main__':
    app.run(debug=True, port=5001)
