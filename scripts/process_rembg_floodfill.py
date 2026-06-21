import os
import numpy as np
from PIL import Image
from rembg import remove

input_path = r"C:\Users\Omux2\Downloads\Gemini Logo.png"
output_path = r"C:\Headquarters\Projects\GeminiDesktopApp\icon.png"

# 1. Load image
img = Image.open(input_path).convert("RGBA")
arr = np.array(img)

# The image is a rounded rectangle on a transparent background.
# We want to replace all transparent pixels with the color of the rounded rectangle box.
# We can sample the color of the box near the edge but inside the rounding.
# For example, at (width/2, height/2), wait, that's the diamond!
# Let's sample the color at (width*0.1, height/2). That should safely be the grey box.
h, w = arr.shape[:2]
sample_color = arr[int(h/2), int(w*0.05)] # [R, G, B, A]
bg_color = [sample_color[0], sample_color[1], sample_color[2], 255]

# Find all pixels with alpha < 255
alpha_channel = arr[:, :, 3]
mask = alpha_channel < 255

# Replace those pixels with bg_color
arr[mask] = bg_color

# Now the image has NO transparent corners, and the grey box fills the entire canvas!
filled_img = Image.fromarray(arr)

# Save filled_img for artifact preview
filled_img.save(r"C:\Users\Omux2\.gemini\antigravity\brain\8cc2a539-bdd5-4cc1-b7de-5c1a08902758\filled_preview.png")

# 3. Use rembg. Since the grey box spans the entire image, it is treated as the background.
print("Running rembg on filled image...")
result = remove(filled_img)

# 4. Crop the result to tightest bounding box
bbox = result.getbbox()
if bbox:
    result = result.crop(bbox)

# 5. Make it square
max_dim = max(result.width, result.height)
square_img = Image.new("RGBA", (max_dim, max_dim), (0,0,0,0))
offset = ((max_dim - result.width) // 2, (max_dim - result.height) // 2)
square_img.paste(result, offset)

# Save the final result
square_img.save(output_path)
print("Finished!")
