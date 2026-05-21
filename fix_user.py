with open("app/pages/user.py", "r") as f:
    text = f.read()

# change st.html back to st.markdown
text = text.replace("st.html(", "st.markdown(")

# append unsafe_allow_html=True
text = text.replace('""")', '""", unsafe_allow_html=True)')

# Remove 4-space indentations that cause markdown to render as code blocks
lines = text.split("\n")
new_lines = []
for line in lines:
    if line.startswith("    "):
        new_lines.append(line[4:])
    else:
        new_lines.append(line)

with open("app/pages/user.py", "w") as f:
    f.write("\n".join(new_lines))
