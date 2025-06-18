import os

def build_tree(dir_path, prefix=''):
    entries = sorted(os.listdir(dir_path))
    entries = [e for e in entries if e not in {'node_modules', '.git', '__pycache__', 'bin', 'obj', 'structure.md', 'get_structure.py', '.mvn', '.vscode', 'target', 'test', '.env', '.gitattributes', '.gitignore', 'Dockerfile', 'HELP.md', 'mvnw', 'mvnw.cmd', 'data', 'Properties', 'qdrant_data', 'ml'}]
    lines = []
    for index, entry in enumerate(entries):
        path = os.path.join(dir_path, entry)
        connector = '└── ' if index == len(entries) - 1 else '├── '
        lines.append(f"{prefix}{connector}{entry}")
        if os.path.isdir(path) and entry != 'node_modules':
            extension = '    ' if index == len(entries) - 1 else '│   '
            lines.extend(build_tree(path, prefix + extension))
    return lines

if __name__ == '__main__':
    tree_lines = ["# Cấu trúc thư mục\n"]
    tree_lines.extend(build_tree('server/user'))

    output_path = 'server/user/structure.md'
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(tree_lines))

    print(f"Đã lưu cấu trúc thư mục vào {output_path}")
