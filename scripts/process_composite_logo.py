import os
from PIL import Image
from rembg import remove

bg_path = r"C:\Users\Omux2\.gemini\antigravity\brain\8cc2a539-bdd5-4cc1-b7de-5c1a08902758\app_icon_background_1782006171296.png"
logo_path = r"C:\Headquarters\Projects\GeminiDesktopApp\icon.png"
output_path = r"C:\Headquarters\Projects\GeminiDesktopApp\icon.png"
preview_path = r"C:\Users\Omux2\.gemini\antigravity\brain\8cc2a539-bdd5-4cc1-b7de-5c1a08902758\logo_with_background.png"

# 1. Load background and extract it from the white background
print("Extracting background plate...")
bg_img = Image.open(bg_path).convert("RGBA")
bg_extracted = remove(bg_img)

# Crop background to tightest bounding box
bbox = bg_extracted.getbbox()
if bbox:
    bg_extracted = bg_extracted.crop(bbox)

# Make background a square canvas (in case it wasn't perfectly square)
max_dim = max(bg_extracted.width, bg_extracted.height)
final_bg = Image.new("RGBA", (max_dim, max_dim), (0,0,0,0))
final_bg.paste(bg_extracted, ((max_dim - bg_extracted.width) // 2, (max_dim - bg_extracted.height) // 2))

# 2. Load the enhanced diamond logo
logo_img = Image.open(logo_path).convert("RGBA")

# 3. Calculate target size for the logo (e.g., 60% of the background width so it fits nicely inside)
target_logo_size = int(max_dim * 0.60)
logo_resized = logo_img.resize((target_logo_size, target_logo_size), Image.Resampling.LANCZOS)

# 4. Composite the logo on top of the background
final_composite = final_bg.copy()
offset = ((max_dim - target_logo_size) // 2, (max_dim - target_logo_size) // 2)

# Paste using the logo's alpha channel as the mask
final_composite.paste(logo_resized, offset, logo_resized)

# Save
final_composite.save(output_path)
final_composite.save(preview_path)
print("Finished!")
