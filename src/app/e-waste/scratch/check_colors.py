import re

with open('src/app/e-waste/page.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

colors = ['green', 'slate', 'amber', 'blue', 'red', 'emerald', 'teal']
pattern = r'\b(?:' + '|'.join(colors) + r')-\d+(?:/\d+)?\b'

valid_shades = {'50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'}

for idx, line in enumerate(lines):
    line_num = idx + 1
    matches = re.findall(pattern, line)
    for m in matches:
        shade = m.split('-')[1].split('/')[0]
        if shade not in valid_shades:
            print(f"Line {line_num}: {m} -> {line.strip()}")
