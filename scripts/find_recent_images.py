import os
import time

recent_files = []
now = time.time()
search_dir = r"C:\Users\Omux2"

for root, dirs, files in os.walk(search_dir):
    # skip some huge directories to speed up search
    if any(skip in root for skip in ['AppData\\Local', 'node_modules', '.git']):
        continue
    for file in files:
        if file.endswith('.png'):
            path = os.path.join(root, file)
            try:
                mtime = os.path.getmtime(path)
                if now - mtime < 3600: # last 1 hour
                    recent_files.append((path, mtime))
            except:
                pass

recent_files.sort(key=lambda x: x[1], reverse=True)
for path, mtime in recent_files[:20]:
    print(f"{time.ctime(mtime)} : {path}")
