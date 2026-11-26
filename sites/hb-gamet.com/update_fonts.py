import glob

for file in glob.glob('*.html'):
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()

    # Original multi-line format
    content = content.replace(
        '<link\n        href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Outfit:wght@500;600;700;800&display=swap"\n        rel="stylesheet">',
        '<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Urbanist:wght@600;700;800&display=swap" rel="stylesheet">'
    )
    
    # Generic single-line format
    content = content.replace(
        '<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Outfit:wght@500;600;700;800&display=swap" rel="stylesheet">',
        '<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Urbanist:wght@600;700;800&display=swap" rel="stylesheet">'
    )

    with open(file, 'w', encoding='utf-8') as f:
        f.write(content)

print("Updated typography to Urbanist/Inter across all HTML files.")
