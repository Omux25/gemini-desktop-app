import os
from PIL import Image
from rembg import remove

input_path = r"C:\Users\Omux2\Downloads\Gemini Logo.png"
output_path = r"C:\Headquarters\Projects\GeminiDesktopApp\icon.png"

# 1. Load image
img = Image.open(input_path).convert("RGBA")

# 2. Crop the center 60% to completely eliminate the grey box's rounded borders and drop shadows
w, h = img.size
crop_margin_w = int(w * 0.20)
crop_margin_h = int(h * 0.20)
cropped = img.crop((crop_margin_w, crop_margin_h, w - crop_margin_w, h - crop_margin_h))

# 3. Use rembg on the cropped image. Since the borders are gone, rembg should recognize the diamond as the only foreground object against the grey background.
print("Running rembg on cropped image...")
result = remove(cropped)

# 4. Crop the result to the tightest bounding box
bbox = result.getbbox()
if bbox:
    result = result.crop(bbox)

# 5. Make it a perfect square
max_dim = max(result.width, result.height)
square_img = Image.new("RGBA", (max_dim, max_dim), (0,0,0,0))
offset = ((max_dim - result.width) // 2, (max_dim - result.height) // 2)
square_img.paste(result, offset)

# 6. Save
square_img.save(output_path)
print("Finished!")
