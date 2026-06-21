import os
from PIL import Image
from rembg import remove

input_path = r"C:\Users\Omux2\Downloads\Gemini Logo.png"

# 1. Load image
img = Image.open(input_path).convert("RGBA")

# 2. Crop only the outer 3% to remove the transparent rounded corners
w, h = img.size
crop_margin_w = int(w * 0.03)
crop_margin_h = int(h * 0.03)
cropped = img.crop((crop_margin_w, crop_margin_h, w - crop_margin_w, h - crop_margin_h))

# Save the cropped pre-processing image for preview
cropped.save(r"C:\Users\Omux2\.gemini\antigravity\brain\8cc2a539-bdd5-4cc1-b7de-5c1a08902758\cropped_preview.png")

# 3. Use rembg
print("Running rembg on mildly cropped image...")
result = remove(cropped)

# 4. Crop the result to tightest bounding box
bbox = result.getbbox()
if bbox:
    result = result.crop(bbox)

# 5. Make it square
max_dim = max(result.width, result.height)
square_img = Image.new("RGBA", (max_dim, max_dim), (0,0,0,0))
offset = ((max_dim - result.width) // 2, (max_dim - result.height) // 2)
square_img.paste(result, offset)

# Save the final result to the artifact folder for preview
square_img.save(r"C:\Users\Omux2\.gemini\antigravity\brain\8cc2a539-bdd5-4cc1-b7de-5c1a08902758\final_preview.png")

print("Done! Check artifacts.")
