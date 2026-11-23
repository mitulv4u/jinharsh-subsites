# Printable Guide for Riya & Gayatri: How to Upload Websites

> **Golden Rule:** Never use FTP or SSH. Everything is uploaded through **GitHub**, previewed on Firebase, and approved by **Mitul / Dhwani** before going live.

## Step 1: Open the Shared Project
1. Accept the GitHub invite from Mitul and open **`jinharsh-subsites`**.
2. Clone it on your computer (or open it in your AI IDE / GitHub Desktop):
   ```bash
   git clone https://github.com/mitulv4u/jinharsh-subsites.git
   ```

## Step 2: Put Your Website Files in the Matching Folder
Inside `sites/`, use the exact folder matching the domain name:
- **For `rexnord.co.in`** → `sites/rexnord.co.in/`
- **For `groz.tools`** → `sites/groz.tools/`
- **For any new subdomain** (e.g., `omega.rexnord.co.in`) → copy `template-subsite/` into `sites/omega.rexnord.co.in/`

## Step 3: Save & Upload to Your Branch (Do NOT Push to `main`)
1. Create a new branch (e.g., `upload/rexnord` or `upload/groz-tools`).
2. Commit your files and **Push** your branch to GitHub.

## Step 4: Open a Pull Request (PR) for Approval
1. On GitHub, click **"Compare & pull request"**.
2. Request review from **Mitul** and **Dhwani**.
3. Check the automatic **Firebase Preview link** (`*.web.app`) on mobile and desktop.

## Step 5: Go Live
Once **Mitul or Dhwani** clicks **Merge pull request**, GitHub automatically deploys your folder to `159.89.94.209` within ~30 seconds.
