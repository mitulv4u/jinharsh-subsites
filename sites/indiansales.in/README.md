# indiansales.in — Upload Instructions (Riya & Gayatri)

1. Pull the latest `main` branch:
   ```bash
   git pull origin main
   ```
2. Create a branch for your upload:
   ```bash
   git checkout -b upload/indiansales
   ```
3. Place your built `indiansales.in` website files (`index.html`, `assets/`, `css/`, `js/`, etc.) inside **`sites/indiansales.in/`** (this folder).
   - Do **not** include `.zip` backups or temporary scripts.
4. Commit, push, and open a Pull Request to `main`:
   ```bash
   git add sites/indiansales.in
   git commit -m "Upload indiansales.in website"
   git push -u origin upload/indiansales
   ```
5. Once **Mitul or Dhwani** merges the Pull Request, GitHub Actions will automatically deploy `sites/indiansales.in/` to `https://indiansales.in` (with SSL already active).
