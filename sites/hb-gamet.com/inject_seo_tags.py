import glob

meta_tags = """
    <meta name="keywords" content="Gamet Bearings, High Precision Tapered Roller Bearings, Spindle Bearings, Machine Tool Bearings, Inch Variation Bearings, Metric Bearings, Gamet Types, Plain, Flanged, Spring Preload, Lathe Spindle, CNC Spindle, Colchester Bearings, HB Bearings, Exact Replacement">
    <meta name="robots" content="index, follow">"""

for file in glob.glob("*.html"):
    with open(file, "r", encoding="utf-8") as f:
        content = f.read()
    
    if "meta name=\"keywords\"" not in content and "<meta name=\"keywords\"" not in content:
        content = content.replace("</title>", "</title>\n" + meta_tags)
        with open(file, "w", encoding="utf-8") as f:
            f.write(content)
        print("Injected SEO tags to", file)
    else:
        print("SEO tags already in", file)
