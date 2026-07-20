import re
with open(r'c:\Users\Susha\Desktop\Neura-OS.txt', 'r', encoding='utf-8') as f: content=f.read()
paths = re.findall(r'<file path="([^"]+)">', content)
print('Root level folders/files:')
roots = set([p.split('/')[0] for p in paths])
print(list(roots))

print("\nFiles in .lovable:")
print([p for p in paths if p.startswith('.lovable')])

print("\nFiles in src:")
print(len([p for p in paths if p.startswith('src')]))
