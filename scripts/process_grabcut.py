import cv2
import numpy as np
from PIL import Image
import sys

input_path = r"C:\Users\Omux2\Downloads\Gemini Logo.png"
output_path = r"C:\Headquarters\Projects\GeminiDesktopApp\icon.png"

img = cv2.imread(input_path)
if img is None:
    print("Could not read image.")
    sys.exit(1)

h, w = img.shape[:2]
# The grey box probably takes up most of the image, so we'll start GrabCut with an inner rectangle 
# that tightly bounds the center diamond. Let's say inner 50%
rect = (int(w * 0.25), int(h * 0.25), int(w * 0.5), int(h * 0.5))

mask = np.zeros((h, w), np.uint8)
bgdModel = np.zeros((1, 65), np.float64)
fgdModel = np.zeros((1, 65), np.float64)

print("Running GrabCut...")
cv2.grabCut(img, mask, rect, bgdModel, fgdModel, 10, cv2.GC_INIT_WITH_RECT)

mask2 = np.where((mask == 2) | (mask == 0), 0, 1).astype('uint8')

# Find the largest contour in the mask to ensure we don't have scattered noise
contours, _ = cv2.findContours(mask2, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
if contours:
    largest_contour = max(contours, key=cv2.contourArea)
    clean_mask = np.zeros_like(mask2)
    cv2.drawContours(clean_mask, [largest_contour], -1, 1, thickness=cv2.FILLED)
    mask2 = clean_mask

img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
result = img_rgb * mask2[:, :, np.newaxis]
alpha = mask2 * 255
rgba = np.dstack((result, alpha))

pil_img = Image.fromarray(rgba)
bbox = pil_img.getbbox()
if bbox:
    cropped = pil_img.crop(bbox)
else:
    cropped = pil_img

max_dim = max(cropped.width, cropped.height)
square_img = Image.new('RGBA', (max_dim, max_dim), (0, 0, 0, 0))
offset = ((max_dim - cropped.width) // 2, (max_dim - cropped.height) // 2)
square_img.paste(cropped, offset)

square_img.save(output_path)
print("Finished!")
