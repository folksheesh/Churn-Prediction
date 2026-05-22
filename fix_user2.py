with open("app/pages/user.py", "r") as f:
    text = f.read()

lines = text.split("\n")
new_lines = []
in_html = False

for line in lines:
    if line.strip() == '"""' or line.strip() == '""", unsafe_allow_html=True)':
        pass # we'll handle this naturally
    
    if line.startswith('st.markdown("""'):
        in_html = True
        new_lines.append(line)
    elif line.strip() == '""", unsafe_allow_html=True)' and in_html:
        in_html = False
        new_lines.append(line)
    elif in_html:
        new_lines.append(line.lstrip())
    else:
        new_lines.append(line)

with open("app/pages/user.py", "w") as f:
    f.write("\n".join(new_lines))
