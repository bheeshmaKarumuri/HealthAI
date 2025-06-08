import cv2
from PIL import Image, ImageDraw
from ultralytics import YOLO
import os


def draw_boxes(image, boxes, class_names):
    draw = ImageDraw.Draw(image)
    for box in boxes:
        x1, y1, x2, y2, conf, cls = box.xyxy[0].tolist() + [box.conf.item(), box.cls.item()]
        label = f"{class_names[int(cls)]}: {conf:.2f}"
        draw.rectangle([x1, y1, x2, y2], outline="red", width=2)
        draw.text((x1, y1-10), label, fill="red")
    return image


def process_image(image_path, model, class_names):
    # Read the image
    image = cv2.imread(image_path)
    image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    
    # Process the image with the model
    results = model(image)    
    pil_image = Image.fromarray(image)
    
    # Draw bounding boxes on the image
    result_image = draw_boxes(pil_image, results[0].boxes, class_names)
    
    # Create output directory if it doesn't exist
    output_dir = 'outputs'
    os.makedirs(output_dir, exist_ok=True)

    # Prepare output filename
    base_filename = os.path.basename(image_path)  # Get the filename without the path
    output_filename = os.path.join(output_dir, f"output_{base_filename}")  # Full path for the output file
    
    # Ensure the output filename has the correct extension
    if not output_filename.lower().endswith(('.png', '.jpg', '.jpeg')):
        output_filename += '.png' 

    # Save the resulting image
    result_image.save(output_filename)
    # print(f"Processed {image_path} -> {output_filename}")
    return output_filename

# if __name__ == "__main__":
#     input_path = 'img1.jpg'
#     weights_path = "./best.pt"
#     class_names = ["elbow positive", "fingers positive", "forearm fracture", "humerus fracture", "humerus", "shoulder fracture", "wrist positive"]
    
#     model = YOLO(weights_path)
#     process_image(input_path, model, class_names)
#     print("Processing complete!")   