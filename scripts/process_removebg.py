import cv2
import numpy as np
import os

input_path = r"C:\Users\Omux2\Downloads\image-removebg-preview.png"
output_path = r"C:\Headquarters\Projects\GeminiDesktopApp\icon.png"
preview_path = r"C:\Users\Omux2\.gemini\antigravity\brain\8cc2a539-bdd5-4cc1-b7de-5c1a08902758\logo_removebg_preview.png"

# Load the image
img = cv2.imread(input_path, cv2.IMREAD_UNCHANGED)

# Ensure it's RGBA
if img.shape[2] == 3:
    img = cv2.cvtColor(img, cv2.COLOR_BGR2BGRA)

# Find the bounding box of non-transparent pixels
alpha_channel = img[:, :, 3]
coords = cv2.findNonZero(alpha_channel)

if coords is not None:
    x, y, crop_w, crop_h = cv2.boundingRect(coords)
    cropped = img[y:y+crop_h, x:x+crop_w]
    
    # Let's add a tiny 2% padding so it breathes well as an icon but still maximizes size
    pad = int(max(crop_w, crop_h) * 0.02)
    final_size = max(crop_w, crop_h) + (pad * 2)
    
    square_img = np.zeros((final_size, final_size, 4), dtype=np.uint8)
    
    offset_x = pad + (final_size - pad*2 - crop_w) // 2
    offset_y = pad + (final_size - pad*2 - crop_h) // 2
    
    square_img[offset_y:offset_y+crop_h, offset_x:offset_x+crop_w] = cropped
    
    cv2.imwrite(preview_path, square_img)
    cv2.imwrite(output_path, square_img)
    print("Success! Processed tightly cropped transparent logo from remove.bg.")
else:
    print("Failed to find bounding box. The image might be entirely transparent.")
