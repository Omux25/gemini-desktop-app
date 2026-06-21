import cv2
import numpy as np
import os
import glob

# 1. Automatically find the absolute newest image uploaded by the user in the artifacts folder
artifact_dir = r"C:\Users\Omux2\.gemini\antigravity\brain\8cc2a539-bdd5-4cc1-b7de-5c1a08902758"
media_files = glob.glob(os.path.join(artifact_dir, "media__*.png"))
if not media_files:
    print("No media files found.")
    exit(1)

# Sort by modification time to get the absolute newest one the user just sent
newest_media = max(media_files, key=os.path.getmtime)
print(f"Processing newest user upload: {newest_media}")

output_path = r"C:\Headquarters\Projects\GeminiDesktopApp\icon.png"
preview_path = os.path.join(artifact_dir, "logo_exact_upload_preview.png")

# 2. Load the image the user directly uploaded
img = cv2.imread(newest_media, cv2.IMREAD_UNCHANGED)

if img.shape[2] == 3:
    # Convert BGR to BGRA
    img = cv2.cvtColor(img, cv2.COLOR_BGR2BGRA)

# 3. Make white pixels perfectly transparent
h, w = img.shape[:2]
mask_ff = np.zeros((h+2, w+2), np.uint8)
ff_img = img[:,:,:3].copy()
# Flood fill from the corners to perfectly mask out the white background without touching the logo
cv2.floodFill(ff_img, mask_ff, (0,0), (0, 255, 0), (10,10,10), (10,10,10))
cv2.floodFill(ff_img, mask_ff, (w-1,0), (0, 255, 0), (10,10,10), (10,10,10))
cv2.floodFill(ff_img, mask_ff, (0,h-1), (0, 255, 0), (10,10,10), (10,10,10))
cv2.floodFill(ff_img, mask_ff, (w-1,h-1), (0, 255, 0), (10,10,10), (10,10,10))

bg_mask = mask_ff[1:h+1, 1:w+1]

# Set alpha to 0 for the flood-filled background
img[bg_mask == 1, 3] = 0

# 4. Crop tightly to the bounding box of the logo to remove all wasted space
coords = cv2.findNonZero(cv2.bitwise_not(bg_mask))
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
    print("Success! Processed tightly cropped transparent logo.")
else:
    print("Failed to find bounding box.")
