import struct, re, olefile

ppt_path = r'c:\Users\mitul\OneDrive\Desktop\Downloads\GametWebsite\catalogs\Introduction - Gamet PPT.ppt'
ole = olefile.OleFileIO(ppt_path)
data = ole.openstream('PowerPoint Document').read()

# Extract text atoms from binary PPT
# TextCharsAtom = record type 4000, TextBytesAtom = 4008
texts = []
i = 0
while i < len(data) - 8:
    record_type = struct.unpack_from('<H', data, i+2)[0]
    record_len  = struct.unpack_from('<I', data, i+4)[0]
    if record_type == 4000 and record_len > 0:  # TextCharsAtom (UTF-16)
        try:
            raw = data[i+8:i+8+record_len]
            text = raw.decode('utf-16-le', errors='ignore').strip()
            if len(text) > 3:
                texts.append(('CHARS', text))
        except:
            pass
    elif record_type == 4008 and record_len > 0:  # TextBytesAtom (latin-1)
        try:
            raw = data[i+8:i+8+record_len]
            text = raw.decode('latin-1', errors='ignore').strip()
            if len(text) > 3:
                texts.append(('BYTES', text))
        except:
            pass
    i += 8 + record_len

for t, text in texts:
    print(f'[{t}] {repr(text[:200])}')
