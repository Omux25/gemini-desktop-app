from PIL import Image

for path in [
    r"C:\Headquarters\Projects\GeminiDesktopApp\icon.png",
    r"C:\Headquarters\Projects\GeminiDesktopApp\build\icon.png",
    r"C:\Headquarters\Projects\GeminiDesktopApp\docs\icon.png"
]:
    try:
        img = Image.open(path)
        img = img.resize((512, 512), Image.Resampling.LANCZOS)
        img.save(path)
        print(f"Resized {path} to 512x512")
    except Exception as e:
        print(f"Failed to resize {path}: {e}")
