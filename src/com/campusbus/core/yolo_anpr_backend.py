# ==============================================================================
# YOLOv8 ANPR BACKEND (Pre-trained Number Plate Capture Model)
# ==============================================================================
# This script is provided as a real YOLO integration for your Java backend.
# You can call this Python script from your Java 'GateMonitor' thread.
#
# Prerequisites to run this (if you want to move away from the pure-browser demo):
# pip install ultralytics easyocr opencv-python numpy flask
# ==============================================================================

import cv2
import numpy as np
from flask import Flask, request, jsonify
# from ultralytics import YOLO
import easyocr

app = Flask(__name__)

# Initialize EasyOCR (for reading the text inside the plate)
reader = easyocr.Reader(['en'], gpu=False)

# NOTE: To use YOLO, you must download a pre-trained Indian Number Plate weights file (.pt).
# Example: 
# yolo_model = YOLO('indian_number_plate_yolov8.pt') 

@app.route('/detect', methods=['POST'])
def detect_plate():
    try:
        # Read image from request (sent by Java backend or Frontend)
        file = request.files['image']
        img_bytes = file.read()
        nparr = np.frombuffer(img_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        # --- STEP 1: YOLO DETECTION ---
        # (Uncomment when you have the YOLO .pt file)
        # results = yolo_model(img)
        # boxes = results[0].boxes
        # if len(boxes) == 0:
        #     return jsonify({"success": False, "message": "No plate detected by YOLO"})
        # 
        # # Crop the plate based on YOLO bounding box
        # x1, y1, x2, y2 = map(int, boxes[0].xyxy[0])
        # cropped_plate = img[y1:y2, x1:x2]
        
        # Since we don't have the custom YOLO weights downloaded here, 
        # we simulate the YOLO crop by passing the whole image to EasyOCR.
        cropped_plate = img 

        # --- STEP 2: OCR (READ TEXT) ---
        ocr_results = reader.readtext(cropped_plate)
        
        detected_text = ""
        for (bbox, text, prob) in ocr_results:
            clean_text = ''.join(e for e in text if e.isalnum()).upper()
            if len(clean_text) >= 6 and len(clean_text) <= 11:
                detected_text = clean_text
                break

        if detected_text:
            return jsonify({
                "success": True, 
                "plate": detected_text,
                # "yolo_box": [x1, y1, x2, y2] # Uncomment when using YOLO
            })
        else:
            return jsonify({"success": False, "message": "Text not readable"})
            
    except Exception as e:
        return jsonify({"success": False, "error": str(e)})

if __name__ == '__main__':
    print("Starting YOLO ANPR API on port 5000...")
    app.run(port=5000)
