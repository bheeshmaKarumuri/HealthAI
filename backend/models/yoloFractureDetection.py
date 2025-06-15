import cv2
from PIL import Image, ImageDraw
from ultralytics import YOLO
import os
import numpy as np

def preprocess_image(image):
    # Convert to RGB if not already
    if len(image.shape) == 2:  # If grayscale
        image = cv2.cvtColor(image, cv2.COLOR_GRAY2RGB)
    elif image.shape[2] == 4:  # If RGBA
        image = cv2.cvtColor(image, cv2.COLOR_RGBA2RGB)
    
    # Normalize image
    image = image.astype(np.float32) / 255.0
    
    # Enhance contrast
    lab = cv2.cvtColor(image, cv2.COLOR_RGB2LAB)
    l, a, b = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8,8))
    cl = clahe.apply(l)
    enhanced = cv2.merge((cl,a,b))
    enhanced = cv2.cvtColor(enhanced, cv2.COLOR_LAB2RGB)
    
    return enhanced

def draw_boxes(image, boxes, class_names):
    draw = ImageDraw.Draw(image)
    for box in boxes:
        x1, y1, x2, y2, conf, cls = box.xyxy[0].tolist() + [box.conf.item(), box.cls.item()]
        # Only draw boxes with confidence > 0.3
        if conf > 0.3:
            label = f"{class_names[int(cls)]}: {conf:.2f}"
            draw.rectangle([x1, y1, x2, y2], outline="red", width=2)
            draw.text((x1, y1-10), label, fill="red")
    return image

def process_image(image_path, model, class_names):
    try:
        # Read the image
        image = cv2.imread(image_path)
        if image is None:
            raise ValueError(f"Could not read image at {image_path}")
            
        # Convert to RGB
        image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        
        # Preprocess the image
        processed_image = preprocess_image(image)
        
        # Convert back to uint8 for model input
        processed_image = (processed_image * 255).astype(np.uint8)
        
        # Process the image with the model
        results = model(processed_image, conf=0.3)  # Lower confidence threshold
        pil_image = Image.fromarray(image)
        
        # Draw bounding boxes on the image
        result_image = draw_boxes(pil_image, results[0].boxes, class_names)
        
        # Create output directory if it doesn't exist
        output_dir = 'outputs'
        os.makedirs(output_dir, exist_ok=True)

        # Prepare output filename
        base_filename = os.path.basename(image_path)
        output_filename = os.path.join(output_dir, f"output_{base_filename}")
        
        # Ensure the output filename has the correct extension
        if not output_filename.lower().endswith(('.png', '.jpg', '.jpeg')):
            output_filename += '.png'

        # Save the resulting image
        result_image.save(output_filename)
        return output_filename
        
    except Exception as e:
        print(f"Error processing image: {str(e)}")
        raise

# if __name__ == "__main__":
#     input_path = 'img1.jpg'
#     weights_path = "./best.pt"
#     class_names = ["elbow positive", "fingers positive", "forearm fracture", "humerus fracture", "humerus", "shoulder fracture", "wrist positive"]
    
#     model = YOLO(weights_path)
#     process_image(input_path, model, class_names)
#     print("Processing complete!")   