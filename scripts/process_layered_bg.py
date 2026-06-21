import os
from PIL import Image

bg_path = r"C:\Users\Omux2\.gemini\antigravity\brain\8cc2a539-bdd5-4cc1-b7de-5c1a08902758\white_layered_bg_1782006566339.png"
logo_path = r"C:\Users\Omux2\.gemini\antigravity\brain\8cc2a539-bdd5-4cc1-b7de-5c1a08902758\icon_unclipped.png"
output_path = r"C:\Headquarters\Projects\GeminiDesktopApp\icon.png"
preview_path = r"C:\Users\Omux2\.gemini\antigravity\brain\8cc2a539-bdd5-4cc1-b7de-5c1a08902758\logo_layered_white.png"

# 1. Load background
bg_img = Image.open(bg_path).convert("RGBA")

# Make background a square canvas if it's not already
max_dim = max(bg_img.width, bg_img.height)
final_bg = Image.new("RGBA", (max_dim, max_dim), (255,255,255,0))
final_bg.paste(bg_img, ((max_dim - bg_img.width) // 2, (max_dim - bg_img.height) // 2))

# 2. Load the unclipped original diamond logo mask
logo_img = Image.open(logo_path).convert("RGBA")

# Make sure logo is tightly cropped before resizing
bbox = logo_img.getbbox()
if bbox:
    logo_img = logo_img.crop(bbox)

# 3. Calculate target size for the logo (85% so the textured white layers frame it nicely)
target_logo_size = int(max_dim * 0.85)
logo_resized = logo_img.resize((target_logo_size, target_logo_size), Image.Resampling.LANCZOS)

# 4. Composite the logo on top of the textured background
final_composite = final_bg.copy()
offset = ((max_dim - target_logo_size) // 2, (max_dim - target_logo_size) // 2)

# Paste using the logo's alpha channel as the mask
final_composite.paste(logo_resized, offset, logo_resized)

# Save
final_composite.save(output_path)
final_composite.save(preview_path)
print("Finished!")
