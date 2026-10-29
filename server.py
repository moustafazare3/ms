#!/usr/bin/env python3
"""Serve the invitation and store RSVP replies in data/rsvps.json.

Run from this folder:

    python3 server.py

Guests open the invitation. Mostafa and Salma open /contacts.html and
enter their mobile number. There is no password. The reply file is not
served as a normal page.
"""

import cgi
import json
import os
import re
import secrets
import threading
from datetime import datetime, timedelta, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlparse

ROOT = Path(__file__).resolve().parent
DATA_FILE = ROOT / "data" / "rsvps.json"
HOST = "0.0.0.0"
PORT = 8080
MAX_BODY = 100_000
SESSION_HOURS = 12

ADMINS = {
    "01208601044": "مصطفى",
    "01224506489": "سلمى",
}

LOCK = threading.Lock()
SESSIONS = {}


def normalize_phone(value):
    digits = re.sub(r"\D", "", value or "")
    if digits.startswith("0020"):
        digits = digits[4:]
    elif digits.startswith("20") and len(digits) >= 12:
        digits = digits[2:]
    if len(digits) == 10 and digits.startswith("1"):
        digits = "0" + digits
    return digits


def load_rsvps():
    if not DATA_FILE.exists():
        return []
    try:
        data = json.loads(DATA_FILE.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return []
    return data if isinstance(data, list) else []


def save_rsvps(rows):
    DATA_FILE.parent.mkdir(parents=True, exist_ok=True)
    temporary = DATA_FILE.with_suffix(".json.tmp")
    temporary.write_text(
        json.dumps(rows, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    temporary.replace(DATA_FILE)


def clean_sessions():
    now = datetime.now(timezone.utc)
    expired = [token for token, session in SESSIONS.items() if session["expires"] <= now]
    for token in expired:
        SESSIONS.pop(token, None)


def session_from_cookie(header):
    if not header:
        return None
    token = ""
    for part in header.split(";"):
        name, _, value = part.strip().partition("=")
        if name == "contacts_session":
            token = value
            break
    clean_sessions()
    return SESSIONS.get(token)


class InvitationHandler(BaseHTTPRequestHandler):
    server_version = "Invitation/1.0"

    def log_message(self, fmt, *args):
        print("[%s] %s" % (self.log_date_time_string(), fmt % args))

    def send_json(self, status, payload, cookie=None, clear_cookie=False):
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        if cookie:
            self.send_header(
                "Set-Cookie",
                "contacts_session=%s; HttpOnly; SameSite=Lax; Path=/; Max-Age=%d"
                % (cookie, SESSION_HOURS * 3600),
            )
        if clear_cookie:
            self.send_header(
                "Set-Cookie",
                "contacts_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0",
            )
        self.end_headers()
        self.wfile.write(body)

    def read_limited(self):
        length = int(self.headers.get("Content-Length", "0") or "0")
        if length < 0 or length > MAX_BODY:
            return None
        return self.rfile.read(length) if length else b""

    def do_GET(self):
        path = unquote(urlparse(self.path).path)
        if path == "/api/rsvps":
            self.handle_list()
            return
        if path.startswith("/api/") or path.startswith("/data/"):
            self.send_error(404)
            return
        self.serve_file(path)

    def do_POST(self):
        path = unquote(urlparse(self.path).path)
        if path == "/api/rsvp":
            self.handle_rsvp()
        elif path == "/api/session":
            self.handle_session()
        elif path == "/api/logout":
            self.send_json(200, {"ok": True}, clear_cookie=True)
        else:
            self.send_error(404)

    def handle_rsvp(self):
        form = cgi.FieldStorage(
            fp=self.rfile,
            headers=self.headers,
            environ={
                "REQUEST_METHOD": "POST",
                "CONTENT_TYPE": self.headers.get("Content-Type", ""),
            },
        )
        if form.getvalue("website"):
            self.send_json(200, {"ok": True})
            return

        name = " ".join(str(form.getvalue("name") or "").split())
        status = str(form.getvalue("status") or "")
        message = str(form.getvalue("message") or "").strip()
        if not name or len(name) > 120:
            self.send_json(400, {"ok": False, "error": "اكتب الاسم"})
            return
        if status not in ("attending", "declined"):
            self.send_json(400, {"ok": False, "error": "اختر حالة الحضور"})
            return
        if len(message) > 600:
            message = message[:600]

        row = {
            "id": secrets.token_hex(8),
            "name": name,
            "status": status,
            "message": message,
            "at": datetime.now().astimezone().isoformat(timespec="seconds"),
        }
        with LOCK:
            rows = load_rsvps()
            rows.append(row)
            save_rsvps(rows)
        self.send_json(200, {"ok": True, "message": "شكراً لكم — تم تسجيل ردكم."})

    def handle_session(self):
        raw = self.read_limited()
        if raw is None:
            self.send_json(413, {"ok": False, "error": "الطلب كبير"})
            return
        try:
            payload = json.loads(raw.decode("utf-8") or "{}")
        except (UnicodeDecodeError, json.JSONDecodeError):
            payload = {}
        phone = normalize_phone(payload.get("phone") if isinstance(payload, dict) else "")
        name = ADMINS.get(phone)
        if not name:
            self.send_json(401, {"ok": False, "error": "هذا الرقم غير مصرّح له"})
            return
        token = secrets.token_urlsafe(32)
        SESSIONS[token] = {
            "name": name,
            "expires": datetime.now(timezone.utc) + timedelta(hours=SESSION_HOURS),
        }
        self.send_json(200, {"ok": True, "name": name}, cookie=token)

    def handle_list(self):
        session = session_from_cookie(self.headers.get("Cookie"))
        if not session:
            self.send_json(401, {"ok": False, "error": "أدخل رقم الموبايل"})
            return
        with LOCK:
            rows = load_rsvps()
        rows = list(reversed(rows))
        attending = sum(1 for row in rows if row.get("status") == "attending")
        self.send_json(200, {
            "ok": True,
            "name": session["name"],
            "total": len(rows),
            "attending": attending,
            "declined": len(rows) - attending,
            "replies": rows,
        })

    def serve_file(self, path):
        relative = path.lstrip("/") or "index.html"
        if relative.endswith("/"):
            relative += "index.html"
        target = (ROOT / relative).resolve()
        if ROOT not in target.parents and target != ROOT:
            self.send_error(403)
            return
        if not target.is_file():
            self.send_error(404)
            return
        content_type = {
            ".html": "text/html; charset=utf-8",
            ".css": "text/css; charset=utf-8",
            ".js": "text/javascript; charset=utf-8",
            ".json": "application/json; charset=utf-8",
            ".webp": "image/webp",
            ".jpg": "image/jpeg",
            ".jpeg": "image/jpeg",
            ".png": "image/png",
            ".mp4": "video/mp4",
            ".mp3": "audio/mpeg",
            ".svg": "image/svg+xml",
            ".ico": "image/x-icon",
        }.get(target.suffix.lower(), "application/octet-stream")
        data = target.read_bytes()
        self.send_response(200)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)


if __name__ == "__main__":
    DATA_FILE.parent.mkdir(parents=True, exist_ok=True)
    if not DATA_FILE.exists():
        save_rsvps([])
    server = ThreadingHTTPServer((HOST, PORT), InvitationHandler)
    print("Invitation: http://127.0.0.1:%d/" % PORT)
    print("Replies:    http://127.0.0.1:%d/contacts.html" % PORT)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopped.")
