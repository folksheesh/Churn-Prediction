import re

with open('src/pages/admin/Customers.tsx', 'r') as f:
    content = f.read()

start_idx = content.find("activeTab === 'import_csv' && (")
if start_idx == -1:
    exit(1)
    
end_idx = content.find("{/* Add Customer Drawer */}")
if end_idx == -1:
    exit(1)

block = content[start_idx:end_idx]

replacements = [
    # Card styles
    ('bg-white border border-zinc-200 shadow-sm rounded-2xl', 'bg-white border border-zinc-200/80 shadow-[0_2px_8px_rgb(0,0,0,0.04)] rounded-md'),
    ('rounded-2xl', 'rounded-md'),
    ('rounded-xl', 'rounded-md'),
    
    # Text sizing and weights
    ('text-sm font-extrabold text-slate-900', 'text-[13px] font-semibold text-zinc-900'),
    ('text-sm font-bold text-slate-900', 'text-[13px] font-semibold text-zinc-900'),
    ('text-slate-', 'text-zinc-'),
    ('bg-slate-', 'bg-zinc-'),
    ('border-slate-', 'border-zinc-'),
    
    # Button heights
    ('h-12', 'h-9 text-[13px]'),
    ('px-8 py-2.5', 'px-4 py-1.5 text-[13px]'),
    ('px-6 py-2.5', 'px-4 py-1.5 text-[13px]'),
    ('px-4 py-2', 'px-3 py-1.5 text-[12px]'),
    
    # Specific elements
    ('font-outfit', ''),
    ('text-2xl font-black', 'text-xl font-bold'),
]

for old, new in replacements:
    block = block.replace(old, new)

content = content[:start_idx] + block + content[end_idx:]

with open('src/pages/admin/Customers.tsx', 'w') as f:
    f.write(content)
