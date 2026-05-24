import re

with open('src/pages/user/Dashboard.tsx', 'r') as f:
    content = f.read()

# Replace axios import with api import
content = content.replace('import axios from "axios";', "import api from '@/lib/api';")

# Replace axios.get(`${API_BASE}/...`) with api.get('/...')
content = re.sub(r'axios\.get\(`\$\{API_BASE\}/customers`\)', r"api.get('/customers/')", content)
content = re.sub(r'axios\.get\(`\$\{API_BASE\}/customers', r"api.get('/customers", content)
content = re.sub(r'axios\.get\(`\$\{API_BASE\}/(.*?)`\)', r"api.get('/\1')", content)

# Replace axios.post(`${API_BASE}/...`) with api.post('/...')
content = re.sub(r'axios\.post\(`\$\{API_BASE\}/(.*?)`', r"api.post('/\1'", content)

# Remove const API_BASE = ...
content = re.sub(r'const API_BASE = "http://localhost:8000/api/v1";\n', '', content)

with open('src/pages/user/Dashboard.tsx', 'w') as f:
    f.write(content)
