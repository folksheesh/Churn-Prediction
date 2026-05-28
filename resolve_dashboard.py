import sys

def resolve_conflicts(filepath):
    with open(filepath, 'r') as f:
        lines = f.readlines()
        
    out_lines = []
    conflict_index = 0
    state = 'NORMAL'  # NORMAL, IN_HEAD, IN_THEIRS
    
    for line in lines:
        if line.startswith('<<<<<<< HEAD'):
            state = 'IN_HEAD'
            continue
        elif line.startswith('======='):
            state = 'IN_THEIRS'
            continue
        elif line.startswith('>>>>>>> 4272faf'):
            state = 'NORMAL'
            conflict_index += 1
            continue
            
        if state == 'NORMAL':
            out_lines.append(line)
        elif state == 'IN_HEAD':
            out_lines.append(line)
        elif state == 'IN_THEIRS':
            pass # We just discard theirs for this commit, keeping HEAD exactly.
                
    with open(filepath, 'w') as f:
        f.writelines(out_lines)

if __name__ == '__main__':
    resolve_conflicts('frontend/src/pages/user/Dashboard.tsx')
