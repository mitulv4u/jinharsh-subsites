#!/usr/bin/env python3
"""
GoDaddy DNS Manager CLI for JinHarsh Group.
Requires environment variables:
  GODADDY_API_KEY
  GODADDY_API_SECRET
"""

import json
import os
import sys
import urllib.error
import urllib.request

BASE_URL = "https://api.godaddy.com/v1"
DEFAULT_SERVER_IP = "159.89.94.209"


def request(method: str, path: str, body=None):
    key = os.environ.get("GODADDY_API_KEY", "").strip()
    secret = os.environ.get("GODADDY_API_SECRET", "").strip()
    if not key or not secret:
        print("Error: GODADDY_API_KEY and GODADDY_API_SECRET must be set.", file=sys.stderr)
        sys.exit(1)

    headers = {
        "Authorization": f"sso-key {key}:{secret}",
        "Accept": "application/json",
        "Content-Type": "application/json",
    }
    data = json.dumps(body).encode("utf-8") if body is not None else None
    req = urllib.request.Request(f"{BASE_URL}{path}", data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            raw = resp.read().decode("utf-8")
            return json.loads(raw) if raw else {}
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8", errors="replace")
        print(f"HTTP {e.code} Error from GoDaddy API: {err_body}", file=sys.stderr)
        sys.exit(1)


def main():
    if len(sys.argv) < 2:
        print("Usage:")
        print("  godaddy-dns.py list-domains")
        print("  godaddy-dns.py get-records <domain>")
        print("  godaddy-dns.py set-a <domain> <name> [ip=159.89.94.209]")
        print("  godaddy-dns.py link-wildcard <domain> [ip=159.89.94.209]")
        sys.exit(1)

    cmd = sys.argv[1]
    if cmd == "list-domains":
        domains = request("GET", "/domains?statuses=ACTIVE")
        for d in domains:
            print(f"{d.get('domain')} | status={d.get('status')} | expires={d.get('expires')}")
    elif cmd == "get-records":
        domain = sys.argv[2]
        records = request("GET", f"/domains/{domain}/records")
        print(json.dumps(records, indent=2))
    elif cmd == "set-a":
        domain = sys.argv[2]
        name = sys.argv[3]
        ip = sys.argv[4] if len(sys.argv) > 4 else DEFAULT_SERVER_IP
        request("PUT", f"/domains/{domain}/records/A/{name}", [{"data": ip, "ttl": 600}])
        print(f"Updated A record: {name}.{domain} -> {ip}")
    elif cmd == "link-wildcard":
        domain = sys.argv[2]
        ip = sys.argv[3] if len(sys.argv) > 3 else DEFAULT_SERVER_IP
        request("PUT", f"/domains/{domain}/records/A/@", [{"data": ip, "ttl": 600}])
        request("PUT", f"/domains/{domain}/records/A/*", [{"data": ip, "ttl": 600}])
        print(f"Linked @ and * for {domain} -> {ip} (MX/TXT untouched)")
    else:
        print(f"Unknown command: {cmd}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
