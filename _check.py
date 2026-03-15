with open('game.js','r') as f:
    lines = f.readlines()

balance = 0
for i, line in enumerate(lines, 1):
    in_str = None
    escaped = False
    for ch in line:
        if escaped:
            escaped = False
            continue
        if ch == '\\':
            escaped = True
            continue
        if ch in ('"', "'", '`'):
            if in_str is None:
                in_str = ch
            elif in_str == ch:
                in_str = None
            continue
        if in_str:
            continue
        if ch == '(':
            balance += 1
        elif ch == ')':
            balance -= 1

print(f'Final paren balance: {balance}')

# Now scan for regex patterns that look like unbalanced parens
# Actually, the -11 is likely from regex literals which contain () 
# Let's just check if the file actually has a syntax error by looking for obvious issues

# Check the specific area we modified
for i in range(2430, 2540):
    if i < len(lines):
        line = lines[i]
        stripped = line.strip()
        if stripped and not stripped.startswith('//'):
            opens = stripped.count('(')
            closes = stripped.count(')')
            if opens != closes:
                print(f'  Line {i+1}: ({opens} opens, {closes} closes): {stripped[:100]}')
