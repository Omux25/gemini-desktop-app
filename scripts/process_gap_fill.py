import cv2
import numpy as np

# Load the image
input_path = r"C:\Users\Omux2\Downloads\Gemini Logo.png"
output_path = r"C:\Headquarters\Projects\GeminiDesktopApp\icon.png"
preview_path = r"C:\Users\Omux2\.gemini\antigravity\brain\8cc2a539-bdd5-4cc1-b7de-5c1a08902758\logo_filled_preview.png"

img = cv2.imread(input_path, cv2.IMREAD_UNCHANGED)

# If it has an alpha channel, convert to BGR for processing but keep alpha for later
if img.shape[2] == 4:
    alpha = img[:,:,3]
    bgr = img[:,:,:3]
else:
    bgr = img
    alpha = np.full((img.shape[0], img.shape[1]), 255, dtype=np.uint8)

# 1. Identify the background
# We assume the top-left corner (0,0) is background. 
# We'll flood fill the background with a special color to isolate it from the white line.
h, w = bgr.shape[:2]
mask_ff = np.zeros((h+2, w+2), np.uint8)

# Create a copy to flood fill
ff_img = bgr.copy()
cv2.floodFill(ff_img, mask_ff, (0,0), (0, 255, 0), (10,10,10), (10,10,10))

# The mask_ff is 1 where the background was flooded. It is sized (h+2, w+2)
bg_mask = mask_ff[1:h+1, 1:w+1]

# Now, any pixel in bgr that is roughly white AND NOT in bg_mask is the white line!
# Let's find white pixels
lower_white = np.array([230, 230, 230])
upper_white = np.array([255, 255, 255])
white_mask = cv2.inRange(bgr, lower_white, upper_white)

# The white line mask is white pixels that are NOT background
line_mask = cv2.bitwise_and(white_mask, cv2.bitwise_not(bg_mask * 255))

# 2. Fill the white line using nearest-neighbor color
# Known pixels are everything EXCEPT the white line
known_mask = cv2.bitwise_not(line_mask)

# We can use distance transform to find nearest known pixel for every pixel
# OpenCV doesn't directly give nearest pixel indices easily for color images, 
# but we can do a simple morphological dilation loop or use scipy if available.
# Let's use a morphological dilation loop to "grow" the known colors into the line!
result_bgr = bgr.copy()

# While there are still pixels in the line mask
kernel = np.ones((3,3), np.uint8)
while cv2.countNonZero(line_mask) > 0:
    # Dilate the current result
    dilated = cv2.dilate(result_bgr, kernel)
    # The pixels to update are the ones in line_mask that are adjacent to known pixels
    # We can just apply the dilated image to the line_mask!
    # But dilating an image takes the maximum pixel value, which ruins colors.
    
    # Let's use cv2.inpaint with radius 1 iteratively? No, inpaint blurs.
    break # Fallback to a better method

# Better method: scikit-image or scipy nearest neighbor, or just standard inpaint.
# Actually, since it's just two colors (black and red), we can separate them!
dark_mask = cv2.inRange(bgr, np.array([0, 0, 0]), np.array([100, 100, 100]))
red_mask = cv2.inRange(bgr, np.array([0, 0, 100]), np.array([100, 100, 255]))

# Dilate both masks until they fill the line
while True:
    new_dark = cv2.dilate(dark_mask, kernel)
    new_red = cv2.dilate(red_mask, kernel)
    
    # Only allow expansion into the line_mask
    expand_dark = cv2.bitwise_and(new_dark, line_mask)
    expand_red = cv2.bitwise_and(new_red, line_mask)
    
    if cv2.countNonZero(expand_dark) == 0 and cv2.countNonZero(expand_red) == 0:
        break
        
    # Update dark and red masks
    dark_mask = cv2.bitwise_or(dark_mask, expand_dark)
    red_mask = cv2.bitwise_or(red_mask, expand_red)
    
    # Remove filled pixels from line_mask
    filled = cv2.bitwise_or(expand_dark, expand_red)
    line_mask = cv2.bitwise_and(line_mask, cv2.bitwise_not(filled))

# Now reconstruct the image
# Find the average color of dark and red regions from the original image
dark_pixels = bgr[dark_mask == 255]
red_pixels = bgr[red_mask == 255]

if len(dark_pixels) > 0 and len(red_pixels) > 0:
    dark_color = np.median(dark_pixels, axis=0).astype(np.uint8)
    red_color = np.median(red_pixels, axis=0).astype(np.uint8)

    final_bgr = np.zeros_like(bgr)
    # Background should be transparent, but let's make it white for a moment
    final_bgr[:] = [255, 255, 255]
    final_bgr[dark_mask == 255] = dark_color
    final_bgr[red_mask == 255] = red_color

    # Set background alpha to 0
    final_alpha = np.full((h, w), 255, dtype=np.uint8)
    final_alpha[bg_mask == 1] = 0
    
    # Also, we should smooth the edges using anti-aliasing (GaussianBlur + threshold)
    # But let's just save the raw result for now.
    final_img = np.dstack((final_bgr, final_alpha))
    
    # Crop it correctly (the user asked to crop it correctly)
    # Find bounding box of non-transparent pixels
    coords = cv2.findNonZero(dark_mask | red_mask)
    if coords is not None:
        x, y, w, h = cv2.boundingRect(coords)
        cropped_img = final_img[y:y+h, x:x+w]
        
        cv2.imwrite(preview_path, cropped_img)
        cv2.imwrite(output_path, cropped_img)
        print("Success!")
    else:
        print("Error: No bounding box found.")
else:
    print("Error: Could not find colors.")
