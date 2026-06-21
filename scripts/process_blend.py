import os
import numpy as np
from PIL import Image, ImageChops

original_path = r"C:\Users\Omux2\Downloads\Gemini Logo.png"
texture_path = r"C:\Users\Omux2\.gemini\antigravity\brain\8cc2a539-bdd5-4cc1-b7de-5c1a08902758\white_layered_bg_1782006566339.png"
preview_path = r"C:\Users\Omux2\.gemini\antigravity\brain\8cc2a539-bdd5-4cc1-b7de-5c1a08902758\final_blended_preview.png"
output_path = r"C:\Headquarters\Projects\GeminiDesktopApp\icon.png"

# 1. Load the original raw image
img = Image.open(original_path).convert("RGBA")

# 2. Find the bounding box of the non-white pixels
# Convert to grayscale
gray = img.convert("L")
# Invert so white becomes black (0) and everything else becomes > 0
inv = ImageChops.invert(gray)
bbox = inv.getbbox()

if bbox:
    # Crop to the bounding box of the diamond
    img_cropped = img.crop(bbox)
    
    # We want a square image, and we want to add some margin so it's not touching the edges
    max_dim = max(img_cropped.width, img_cropped.height)
    pad = int(max_dim * 0.02) # 2% margin to maximize logo size
    final_size = max_dim + (pad * 2)
    
    # Create a new solid white square canvas
    square_img = Image.new("RGBA", (final_size, final_size), (255, 255, 255, 255))
    offset = (pad + (max_dim - img_cropped.width) // 2, pad + (max_dim - img_cropped.height) // 2)
    
    # Paste the cropped original image onto the white square canvas
    # We use the image itself as the mask if it has transparency, otherwise just paste
    square_img.paste(img_cropped, offset, img_cropped if img_cropped.mode == 'RGBA' else None)
else:
    # Fallback if bbox fails
    square_img = img

# 3. Load the textured background
texture = Image.open(texture_path).convert("RGBA")
# Resize texture to match our perfectly cropped square image
texture = texture.resize(square_img.size, Image.Resampling.LANCZOS)

# 4. Blend them together!
# Since the original image has a flat white background, multiplying the texture over it 
# will perfectly apply the texture to the white areas, while the dark diamond will just absorb 
# the texture subtly, keeping its original raw antialiased edges perfectly intact!
blended = ImageChops.multiply(square_img.convert("RGB"), texture.convert("RGB"))

# Convert back to RGBA
blended = blended.convert("RGBA")

# Save the final blended result
blended.save(preview_path)
blended.save(output_path)

print("Finished!")
