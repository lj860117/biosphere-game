import http.server, socketserver, threading, time, urllib.request

PORT = 8765

handler = http.server.SimpleHTTPRequestHandler
httpd = socketserver.TCPServer(("", PORT), handler)
t = threading.Thread(target=httpd.serve_forever, daemon=True)
t.start()
print(f"Server started on port {PORT}")

try:
    resp = urllib.request.urlopen(f"http://localhost:{PORT}/index.html", timeout=5)
    html = resp.read().decode()
    print(f"index.html loaded: {len(html)} bytes, status: {resp.status}")
except Exception as e:
    print(f"Error loading index.html: {e}")

try:
    resp = urllib.request.urlopen(f"http://localhost:{PORT}/game.js", timeout=5)
    js = resp.read().decode()
    print(f"game.js loaded: {len(js)} bytes, status: {resp.status}")
except Exception as e:
    print(f"Error loading game.js: {e}")

httpd.shutdown()
print("Done")
