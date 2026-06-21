import cv2
import numpy as np
import os

input_path = r"C:\Users\Omux2\.gemini\antigravity\brain\8cc2a539-bdd5-4cc1-b7de-5c1a08902758\media__1782008070969.png"
output_path = r"C:\Headquarters\Projects\GeminiDesktopApp\icon.png"
preview_path = r"C:\Users\Omux2\.gemini\antigravity\brain\8cc2a539-bdd5-4cc1-b7de-5c1a08902758\logo_exact_upload_preview.png"

# Load the image the user directly uploaded
img = cv2.imread(input_path, cv2.IMREAD_UNCHANGED)

if img.shape[2] == 3:
    # Convert BGR to BGRA
    img = cv2.cvtColor(img, cv2.COLOR_BGR2BGRA)

# Make white pixels transparent
# The background is white. Let's find pixels close to white and set alpha to 0.
lower_white = np.array([240, 240, 240, 255])
upper_white = np.array([255, 255, 255, 255])
white_mask = cv2.inRange(img, lower_white, upper_white)

# However, flood fill from the corner is safer so we don't accidentally make white parts of the logo transparent.
h, w = img.shape[:2]
mask_ff = np.zeros((h+2, w+2), np.uint8)
ff_img = img[:,:,:3].copy()
cv2.floodFill(ff_img, mask_ff, (0,0), (0, 255, 0), (5,5,5), (5,5,5))

bg_mask = mask_ff[1:h+1, 1:w+1]

# Set alpha to 0 for background
img[bg_mask == 1, 3] = 0

# Now crop tightly to the bounding box
coords = cv2.findNonZero(cv2.bitwise_not(bg_mask))
if coords is not None:
    x, y, w, h = cv2.boundingRect(coords)
    cropped = img[y:y+h, x:x+w]
    
    cv2.imwrite(preview_path, cropped)
    cv2.imwrite(output_path, cropped)
    print("Success!")
else:
    print("Failed to find bounding box.")
