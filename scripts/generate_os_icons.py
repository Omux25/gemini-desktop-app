import os
from PIL import Image

icon_path = r"C:\Headquarters\Projects\GeminiDesktopApp\icon.png"
ico_path = r"C:\Headquarters\Projects\GeminiDesktopApp\build\icon.ico"
icns_path = r"C:\Headquarters\Projects\GeminiDesktopApp\build\icon.icns"

try:
    img = Image.open(icon_path).convert("RGBA")
    
    # Save as .ico (Windows)
    # Windows icons usually contain multiple sizes
    icon_sizes = [(16,16), (32, 32), (48, 48), (64,64), (128, 128), (256, 256)]
    img.save(ico_path, format='ICO', sizes=icon_sizes)
    print(f"Successfully created {ico_path}")
    
    # Save as .icns (macOS)
    img.save(icns_path, format='ICNS')
    print(f"Successfully created {icns_path}")
    
except Exception as e:
    print(f"Error converting icons: {e}")
