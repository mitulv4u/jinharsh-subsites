# gametbearing.com — Deployment & Upload Guide

**Strategy:** Stealth / Brand-Neutral (Do **not** mention or link `jinharsh.com` anywhere on `gametbearing.com`).

## Workflow
1. Pull the latest `main` branch:
   ```bash
   git checkout main && git pull origin main
   ```
2. Create a feature branch:
   ```bash
   git checkout -b upload/gametbearing
   ```
3. Place the website files (`index.html`, `css/`, `js/`, `images/`, etc.) inside **`sites/gametbearing.com/`**.
4. Commit, push, and merge a Pull Request to `main`:
   ```bash
   git add sites/gametbearing.com
   git commit -m "feat(gametbearing.com): upload website"
   git push -u origin upload/gametbearing
   ```
5. Merging to `main` automatically deploys `sites/gametbearing.com/` to `/www/wwwroot/gametbearing.com/` on `159.89.94.209`.
   - Once GoDaddy DNS A-records (`@` and `www`) point to `159.89.94.209`, `auto-ssl-guardian.py` automatically issues and renews the Let's Encrypt SSL certificate.
