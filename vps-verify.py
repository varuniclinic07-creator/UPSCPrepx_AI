#!/usr/bin/env python3
"""Verify Traefik routing with correct TLS SNI and diagnose cert issues"""
import paramiko, sys, time, os

os.environ["PYTHONIOENCODING"] = "utf-8"
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
sys.stderr.reconfigure(encoding='utf-8', errors='replace')

VPS_HOST = "89.117.60.144"
VPS_USER = "root"
VPS_KEY  = r"C:\Users\DR-VARUNI\.ssh\vps_key"

def ssh_exec(client, cmd, timeout=30):
    print(f"\n> {cmd}")
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode('utf-8', errors='replace').strip()
    err = stderr.read().decode('utf-8', errors='replace').strip()
    if out:
        print(out)
    if err and err != out:
        print(f"STDERR: {err}")
    return out

def main():
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    print("Connecting...")
    client.connect(VPS_HOST, username=VPS_USER, key_filename=VPS_KEY, timeout=15)
    print("Connected!\n")

    # ============================================================
    # Check Traefik API - use correct approach
    # ============================================================
    print("=" * 60)
    print("Check Traefik API for loaded routers")
    print("=" * 60)

    # The API might require auth or be on a different endpoint
    ssh_exec(client, "docker exec coolify-proxy wget -q -O - http://localhost:8080/api/http/routers 2>&1 | python3 -m json.tool 2>/dev/null | head -80 || echo 'API query inside container also failed'")

    # Check if API is enabled in docker-compose
    ssh_exec(client, "grep -i 'api' /data/coolify/proxy/docker-compose.yml | head -10")

    # Try the ping endpoint
    ssh_exec(client, "curl -s http://127.0.0.1:8080/api/rawdata 2>/dev/null | python3 -c 'import sys,json; d=json.load(sys.stdin); print(\"Routers:\", list(d.get(\"routers\",{}).keys()))' 2>/dev/null || echo 'rawdata failed too'")
    ssh_exec(client, "curl -s http://127.0.0.1:8080/ping 2>/dev/null || echo 'ping failed'")

    # Maybe it needs a Host header for the dashboard
    ssh_exec(client, "curl -s http://127.0.0.1:8080/ 2>/dev/null | head -5 || echo 'root 8080 no response'")

    # ============================================================
    # Check Traefik logs for errors
    # ============================================================
    print("\n" + "=" * 60)
    print("Traefik recent logs (errors/warnings)")
    print("=" * 60)

    ssh_exec(client, "docker logs coolify-proxy --tail 50 2>&1 | grep -iE 'error|warn|cert|acme|letsencrypt|challenge|failed|refused' | tail -20 || echo 'No relevant log entries'")

    # Check all Traefik logs for our specific domains
    ssh_exec(client, "docker logs coolify-proxy --tail 200 2>&1 | grep -iE 'paper|9router|jarvis|openclaw|ninerouter' | tail -20 || echo 'No domain-specific logs'")

    # ============================================================
    # Test with proper SNI (--resolve flag)
    # ============================================================
    print("\n" + "=" * 60)
    print("HTTPS tests with correct SNI")
    print("=" * 60)

    domains = [
        ("9router.aimasteryedu.in", "9Router"),
        ("agent.aimasteryedu.in", "Agent"),
        ("jarvis.aimasteryedu.in", "Jarvis"),
        ("mission.aimasteryedu.in", "Mission"),
        ("openclaw.aimasteryedu.in", "OpenClaw"),
        ("paper.aimasteryedu.in", "Paper"),
        ("coolify.aimasteryedu.in", "Coolify"),
    ]

    for domain, desc in domains:
        # Use --resolve to set proper SNI
        code = ssh_exec(client, f"curl -sk --resolve '{domain}:443:127.0.0.1' -o /dev/null -w '%{{http_code}}' https://{domain} --max-time 5 2>/dev/null")
        print(f"  HTTPS {domain}: {code} ({desc})")

    print()
    for domain, desc in domains:
        code = ssh_exec(client, f"curl -sk --resolve '{domain}:80:127.0.0.1' -o /dev/null -w '%{{http_code}}' http://{domain} --max-time 5 2>/dev/null")
        print(f"  HTTP  {domain}: {code}")

    # ============================================================
    # Check Let's Encrypt cert status
    # ============================================================
    print("\n" + "=" * 60)
    print("Let's Encrypt certificate status")
    print("=" * 60)

    # Check the acme.json file for issued certs
    ssh_exec(client, "ls -la /data/coolify/proxy/acme.json 2>/dev/null || echo 'No acme.json found'")
    ssh_exec(client, "python3 -c \"import json; d=json.load(open('/data/coolify/proxy/acme.json')); certs=d.get('letsencrypt',{}).get('Certificates',[]); [print(f'  {c.get(\\\"domain\\\",{}).get(\\\"main\\\",\\\"?\\\"):40s}') for c in (certs or [])]\" 2>/dev/null || echo 'Cannot parse acme.json'")

    # Alternative: check if acme certs exist on disk
    ssh_exec(client, "find /data/coolify/proxy/ -name 'acme*' -o -name '*.pem' 2>/dev/null | head -10 || echo 'No cert files found'")

    # Check TLS handshake details
    print("\nTLS handshake check for paper.aimasteryedu.in:")
    ssh_exec(client, "echo | openssl s_client -connect 127.0.0.1:443 -servername paper.aimasteryedu.in 2>&1 | grep -E 'subject|issuer|verify|error|alert' || echo 'openssl check failed'")

    print("\nTLS handshake check for coolify.aimasteryedu.in (known working):")
    ssh_exec(client, "echo | openssl s_client -connect 127.0.0.1:443 -servername coolify.aimasteryedu.in 2>&1 | grep -E 'subject|issuer|verify|error|alert' || echo 'openssl check failed'")

    # ============================================================
    # Check if Coolify's coolify.yaml has agent/mission routers
    # ============================================================
    print("\n" + "=" * 60)
    print("Checking Coolify-managed routers for agent/mission")
    print("=" * 60)
    ssh_exec(client, "grep -A5 'agent\\|mission' /data/coolify/proxy/dynamic/coolify.yaml 2>/dev/null || echo 'Not found in coolify.yaml'")

    # Check what Coolify container/service handles agent.aimasteryedu.in
    ssh_exec(client, "docker ps --format '{{.Names}} {{.Labels}}' | grep -i 'agent' | head -5")

    # Check if agent-zero (port 5080) is what agent.aimasteryedu.in should point to
    ssh_exec(client, "curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:5080 --max-time 3 2>/dev/null")

    # Check the old custom-services.yml port mappings vs what was actually working
    print("\n--- Summary of what WAS working (from old config) ---")
    print("""
Old config (custom-services.yml) had:
  9router  -> 89.117.60.144:20128  (port doesn't exist now!)
  agent    -> 89.117.60.144:5080   (agent-zero container)
  jarvis   -> 89.117.60.144:8100   (python process on 8100)
  mission  -> 89.117.60.144:7001   (mc-core container)
  openclaw -> 89.117.60.144:18789  (openclaw-gateway)
  paper    -> 89.117.60.144:3101   (socat -> 3100 papermark)
""")

    # Verify the old ports match containers
    for name, port in [("agent", 5080), ("jarvis", 8100), ("mission", 7001), ("openclaw", 18789), ("paper", 3101)]:
        resp = ssh_exec(client, f"curl -s -o /dev/null -w '%{{http_code}}' http://89.117.60.144:{port} --max-time 3 2>/dev/null")
        print(f"  {name:12s} -> 89.117.60.144:{port} = HTTP {resp}")

    # What about 9router old port 20128?
    ssh_exec(client, "ss -tlnp | grep ':20128 ' || echo 'Port 20128 NOT listening'")

    client.close()
    print("\nDone!")

if __name__ == "__main__":
    main()
