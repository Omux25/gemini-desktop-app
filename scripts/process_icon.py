import os
from rembg import remove
from PIL import Image

input_path = r"C:\Users\Omux2\Downloads\Gemini Logo.png"
output_path = r"C:\Headquarters\Projects\GeminiDesktopApp\icon.png"

print("Loading image...")
input_img = Image.open(input_path)

print("Removing background...")
output_img = remove(input_img)

print("Cropping to bounding box...")
bbox = output_img.getbbox()
if bbox:
    cropped_img = output_img.crop(bbox)
else:
    cropped_img = output_img

print("Making it a perfect square for maximum taskbar size...")
max_dim = max(cropped_img.width, cropped_img.height)
square_img = Image.new('RGBA', (max_dim, max_dim), (0, 0, 0, 0))
offset = ((max_dim - cropped_img.width) // 2, (max_dim - cropped_img.height) // 2)
square_img.paste(cropped_img, offset)

print(f"Saving to {output_path}...")
square_img.save(output_path)
print("Done!")
