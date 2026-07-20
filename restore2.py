import os
import re

repomix_file = r'c:\Users\Susha\Desktop\Neura-OS.txt'
target_dir = r'c:\Users\Susha\Desktop\Neura-OS'

with open(repomix_file, 'r', encoding='utf-8') as f:
    content = f.read()

pattern = re.compile(r'<file path="([^"]+)">\n(.*?)</file>', re.DOTALL)
matches = pattern.finditer(content)

restored_count = 0
for match in matches:
    file_path = match.group(1)
    file_content = match.group(2)
    
    full_path = os.path.join(target_dir, file_path)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    
    with open(full_path, 'w', encoding='utf-8') as out_f:
        out_f.write(file_content)
    
    restored_count += 1

print(f"Full restoration complete! Restored {restored_count} files directly into {target_dir}")
