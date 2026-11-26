// Hands PDFs chosen on the main page over to the team page (which does the actual upload).
// They wait in this browser's own storage for a moment, then are taken and removed.
const DB = 'jdocs-handoff', STORE = 'files', KEY = 'pending';

function open() {
  return new Promise((ok, no) => {
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => r.result.createObjectStore(STORE);
    r.onsuccess = () => ok(r.result);
    r.onerror = () => no(r.error);
  });
}

export async function saveFiles(files) {
  const db = await open();
  await new Promise((ok, no) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put([...files], KEY);
    tx.oncomplete = ok; tx.onerror = () => no(tx.error); tx.onabort = () => no(tx.error);
  });
  db.close();
}

export async function takeFiles() {
  try {
    const db = await open();
    const list = await new Promise((ok, no) => {
      const tx = db.transaction(STORE, 'readwrite');
      const st = tx.objectStore(STORE);
      const g = st.get(KEY);
      g.onsuccess = () => { st.delete(KEY); ok(g.result || []); };
      g.onerror = () => no(g.error);
    });
    db.close();
    return list.map((f) => (f instanceof File ? f : new File([f], f.name || 'document.pdf', { type: 'application/pdf' })));
  } catch { return []; }
}
