import os
import numpy as np
from PIL import Image, ImageDraw

logo_path = r"C:\Users\Omux2\.gemini\antigravity\brain\8cc2a539-bdd5-4cc1-b7de-5c1a08902758\icon_enhanced_original.png"
output_path = r"C:\Headquarters\Projects\GeminiDesktopApp\icon.png"
preview_path = r"C:\Users\Omux2\.gemini\antigravity\brain\8cc2a539-bdd5-4cc1-b7de-5c1a08902758\logo_with_square_bg.png"

# Load the enhanced diamond logo
logo_img = Image.open(logo_path).convert("RGBA")

# Create a rounded square background
size = 1024
radius = 220 # Premium rounded corner size

# Create diagonal gradient (Dark Slate to Midnight Black)
y = np.linspace(0, 1, size)
x = np.linspace(0, 1, size)
xv, yv = np.meshgrid(x, y)
grad = (xv + yv) / 2.0

# Color 1: #2C2D35 (44, 45, 53)
# Color 2: #0D0E15 (13, 14, 21)
r = (44 * (1 - grad) + 13 * grad).astype(np.uint8)
g = (45 * (1 - grad) + 14 * grad).astype(np.uint8)
b = (53 * (1 - grad) + 21 * grad).astype(np.uint8)
a = np.full((size, size), 255, dtype=np.uint8)

img_arr = np.dstack((r, g, b, a))
bg = Image.fromarray(img_arr, 'RGBA')

# Create rounded mask
mask = Image.new('L', (size, size), 0)
draw = ImageDraw.Draw(mask)
draw.rounded_rectangle((0, 0, size, size), radius=radius, fill=255)

# Apply mask
bg.putalpha(mask)

# Scale the diamond so it is almost as big as the edges (92% of the canvas)
target_logo_size = int(size * 0.92)

# Make sure logo is tightly cropped before resizing
bbox = logo_img.getbbox()
if bbox:
    logo_img = logo_img.crop(bbox)

logo_resized = logo_img.resize((target_logo_size, target_logo_size), Image.Resampling.LANCZOS)

# Composite the logo on top of the background
final_composite = bg.copy()
offset = ((size - target_logo_size) // 2, (size - target_logo_size) // 2)

# Paste using the logo's alpha channel as the mask
final_composite.paste(logo_resized, offset, logo_resized)

# Save
final_composite.save(output_path)
final_composite.save(preview_path)
print("Finished!")
