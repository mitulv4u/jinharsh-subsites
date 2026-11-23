# JinHarsh Group — AI Website & Subdomain Guidelines

Welcome **Adesh, Riya, and Gayatri**! Every website or subdomain you build using AI tools must follow these shared standards so all JinHarsh Group sites look cohesive, load fast, and send customer inquiries directly into **Odoo ERP**.

## 1. Folder Structure (`jinharsh-subsites`)
- **Never edit another person's live site folder** without a task assigned in `SITE_TRACKER.md`.
- To create a new product subdomain (e.g., `omega.rexon.co.in`):
  1. Copy `template-subsite/` to `sites/omega.rexon.co.in/`.
  2. Customize branding, product details, and catalog items from `shared/catalogs/`.
  3. Push to a new branch (e.g., `feat/omega-rexon`) and open a **Pull Request**.
  4. Share the automatic **Firebase Preview URL** in the weekly meeting for **Mitul & Dhwani** to approve.
  5. Once approved and merged to `main`, it automatically deploys to `159.89.94.209`.

## 2. Design & Technical Standards
- **Mobile-First**: All pages must be responsive on mobile, tablet, and desktop.
- **SEO & Metadata**: Include `<title>`, `<meta name="description">`, OpenGraph tags, and a clean heading hierarchy (`<h1>` once per page).
- **No Hardcoded Secrets**: Never commit API keys, passwords, or `.env` files to Git.

## 3. Mandatory Inquiry Form Wiring (Odoo ERP)
Every contact / request-for-quote form must submit `POST` JSON to the central Inquiry API (`https://api.jinharsh.com/inquiries`) with:
```json
{
  "name": "...",
  "email": "...",
  "phone": "...",
  "company": "...",
  "message": "...",
  "source_domain": "omega.rexon.co.in",
  "product_category": "Bearings / Industrial Tools"
}
```
This ensures **Odoo ERP** automatically tags and routes the lead to the right sales team.
