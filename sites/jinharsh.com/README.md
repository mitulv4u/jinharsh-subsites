# jinharsh.com (WordPress)

`jinharsh.com` is hosted at `/www/wwwroot/jinharsh.com/` on `159.89.94.209` as a WordPress site.

- **Protected on server (not stored in Git):** `wp-config.php`, `wp-content/uploads/`, `wp-admin/`, `wp-includes/`, and `.htaccess` remain on the server and are never deleted or overwritten by `rsync`.
- **Deploying custom files / theme overrides:** Any files placed under `sites/jinharsh.com/` (for example `wp-content/themes/custom/...` or static landing pages) are automatically synced to `/www/wwwroot/jinharsh.com/` on merge to `main` (without `--delete`).
