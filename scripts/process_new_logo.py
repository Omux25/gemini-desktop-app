import os
from PIL import Image
from rembg import remove

input_path = r"C:\Users\Omux2\.gemini\antigravity\brain\8cc2a539-bdd5-4cc1-b7de-5c1a08902758\gemini_desktop_logo_1782005813660.png"
output_path = r"C:\Headquarters\Projects\GeminiDesktopApp\icon.png"

# 1. Load image
img = Image.open(input_path).convert("RGBA")

# 2. Use rembg
print("Running rembg on newly generated logo...")
result = remove(img)

# 3. Crop the result to tightest bounding box
bbox = result.getbbox()
if bbox:
    result = result.crop(bbox)

# 4. Make it square with a tiny margin (5% padding so it breathes well)
max_dim = max(result.width, result.height)
pad = int(max_dim * 0.05)
final_size = max_dim + (pad * 2)

square_img = Image.new("RGBA", (final_size, final_size), (0,0,0,0))
offset = (pad + (max_dim - result.width) // 2, pad + (max_dim - result.height) // 2)
square_img.paste(result, offset)

# Save the final result
square_img.save(output_path)
print("Finished!")
