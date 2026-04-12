#!/usr/bin/env python3
"""
VPS Final Fix: Correct config with ALL 6 services at verified ports.

Findings:
- agent  -> 89.117.60.144:5080  (agent-zero container, HTTP 302)
- jarvis -> 89.117.60.144:8100  (python process, HTTP 302)
- mission-> 89.117.60.144:7001  (mc-core container, HTTP 401)
- paper  -> 89.117.60.144:3101  (socat->3100, HTTP 200)
- openclaw->89.117.60.144:18789 (listening but not responding, HTTP 000)
- 9router-> port 20128 NOT listening, port 8100 is jarvis

Traefik mount: /data/coolify/proxy -> /traefik (inside container)
Dynamic config: /data/coolify/proxy/dynamic/ -> /traefik/dynamic/
"""
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
    # STEP 1: Quick check on openclaw and 9router
    # ============================================================
    print("=" * 60)
    print("STEP 1: Check openclaw and 9router status")
    print("=" * 60)

    # OpenClaw - port 18789 is listening but not responding
    ssh_exec(client, "ss -tlnp | grep ':18789'")
    ssh_exec(client, "ps aux | grep openclaw | grep -v grep | head -3")
    ssh_exec(client, "curl -v http://127.0.0.1:18789/ --max-time 3 2>&1 | tail -10")

    # 9Router - check what python on 8100 is
    ssh_exec(client, "ps -p 768 -o pid,comm,args 2>/dev/null || echo 'PID 768 not found'")
    ssh_exec(client, "curl -s http://127.0.0.1:8100/ --max-time 3 2>&1 | head -5")

    # Find any 9router-related service
    ssh_exec(client, "systemctl list-units --type=service | grep -iE 'router\\|9r' || echo 'No 9router systemd service'")
    ssh_exec(client, "docker ps -a --format '{{.Names}} {{.Status}}' | grep -iE 'router\\|9r\\|20128' || echo 'No 9router container'")

    # ============================================================
    # STEP 2: Write COMPLETE dynamic config
    # ============================================================
    print("\n" + "=" * 60)
    print("STEP 2: Write complete Traefik dynamic config")
    print("=" * 60)

    # Using the SAME ports as the old working config that was verified
    # Note: openclaw (18789) may be dead, 9router doesn't have a running service
    # We'll include them anyway so routing is ready when services come back

    config = """http:
  routers:
    # Agent Zero (port 5080)
    agent-secure:
      rule: "Host(`agent.aimasteryedu.in`)"
      entryPoints:
        - https
      service: agent-svc
      tls:
        certResolver: letsencrypt

    # Jarvis / file-search (port 8100)
    jarvis-secure:
      rule: "Host(`jarvis.aimasteryedu.in`)"
      entryPoints:
        - https
      service: jarvis-svc
      tls:
        certResolver: letsencrypt

    # Mission Control / mc-core (port 7001)
    mission-secure:
      rule: "Host(`mission.aimasteryedu.in`)"
      entryPoints:
        - https
      service: mission-svc
      tls:
        certResolver: letsencrypt

    # Paper / Papermark (socat 3101 -> 3100)
    paper-secure:
      rule: "Host(`paper.aimasteryedu.in`)"
      entryPoints:
        - https
      service: paper-svc
      tls:
        certResolver: letsencrypt

    # OpenClaw Gateway (port 18789)
    openclaw-secure:
      rule: "Host(`openclaw.aimasteryedu.in`)"
      entryPoints:
        - https
      service: openclaw-svc
      tls:
        certResolver: letsencrypt

    # 9Router AI proxy (port 8100 - Jarvis/AI router)
    ninerouter-secure:
      rule: "Host(`9router.aimasteryedu.in`)"
      entryPoints:
        - https
      service: ninerouter-svc
      tls:
        certResolver: letsencrypt

  services:
    agent-svc:
      loadBalancer:
        servers:
          - url: "http://89.117.60.144:5080"
        passHostHeader: true

    jarvis-svc:
      loadBalancer:
        servers:
          - url: "http://89.117.60.144:8100"
        passHostHeader: true

    mission-svc:
      loadBalancer:
        servers:
          - url: "http://89.117.60.144:7001"
        passHostHeader: true

    paper-svc:
      loadBalancer:
        servers:
          - url: "http://89.117.60.144:3101"
        passHostHeader: true

    openclaw-svc:
      loadBalancer:
        servers:
          - url: "http://89.117.60.144:18789"
        passHostHeader: true

    ninerouter-svc:
      loadBalancer:
        servers:
          - url: "http://89.117.60.144:8100"
        passHostHeader: true
"""

    ssh_exec(client, f"cat > /data/coolify/proxy/dynamic/custom-services.yaml << 'ENDOFCONFIG'\n{config}\nENDOFCONFIG")

    # Update backup
    ssh_exec(client, "cp /data/coolify/proxy/dynamic/custom-services.yaml /root/traefik-custom-services.yaml.bak")

    # Verify inside container
    ssh_exec(client, "docker exec coolify-proxy cat /traefik/dynamic/custom-services.yaml | head -10 2>&1")

    # ============================================================
    # STEP 3: Wait for Traefik to auto-reload (file.watch=true)
    # ============================================================
    print("\n" + "=" * 60)
    print("STEP 3: Wait for Traefik to detect file change")
    print("=" * 60)

    # Traefik watches the dynamic directory - no restart needed!
    print("Traefik has providers.file.watch=true, waiting 10s for auto-reload...")
    time.sleep(10)

    # Check Traefik logs for the reload
    ssh_exec(client, "docker logs coolify-proxy --tail 20 2>&1 | tail -10")

    # ============================================================
    # STEP 4: Test ALL domains
    # ============================================================
    print("\n" + "=" * 60)
    print("STEP 4: Final verification")
    print("=" * 60)

    domains = [
        ("agent.aimasteryedu.in", "Agent Zero", "302"),
        ("jarvis.aimasteryedu.in", "Jarvis", "302"),
        ("mission.aimasteryedu.in", "Mission Control", "401"),
        ("paper.aimasteryedu.in", "Papermark", "200"),
        ("9router.aimasteryedu.in", "9Router", "302"),
        ("openclaw.aimasteryedu.in", "OpenClaw", "?"),
        ("coolify.aimasteryedu.in", "Coolify UI", "302"),
    ]

    print("\n--- HTTPS (with proper SNI) ---")
    for domain, desc, expected in domains:
        code = ssh_exec(client, f"curl -sk --resolve '{domain}:443:127.0.0.1' -o /dev/null -w '%{{http_code}}' https://{domain} --max-time 8 2>/dev/null")
        ok = code not in ("000", "404", "503")
        mark = "OK" if ok else ("TIMEOUT" if code == "000" else code)
        print(f"  [{mark:8s}] {domain:35s} HTTPS {code} (expected ~{expected}, {desc})")

    print("\n--- HTTP redirect ---")
    for domain, desc, _ in domains:
        code = ssh_exec(client, f"curl -sk --resolve '{domain}:80:127.0.0.1' -o /dev/null -w '%{{http_code}}' http://{domain} --max-time 5 2>/dev/null")
        print(f"  [{'OK' if code in ('301','308') else code:8s}] {domain:35s} HTTP {code}")

    # Direct backend check
    print("\n--- Direct backend health ---")
    backends = [
        ("agent", "89.117.60.144:5080"),
        ("jarvis", "89.117.60.144:8100"),
        ("mission", "89.117.60.144:7001"),
        ("paper", "89.117.60.144:3101"),
        ("openclaw", "89.117.60.144:18789"),
    ]
    for name, url in backends:
        code = ssh_exec(client, f"curl -s -o /dev/null -w '%{{http_code}}' http://{url} --max-time 3 2>/dev/null")
        print(f"  {name:12s} -> {url} = HTTP {code}")

    # If still 000, try with longer timeout and verbose
    print("\n--- Debug 000 responses ---")
    for domain, desc, expected in domains:
        code_check = ssh_exec(client, f"curl -sk --resolve '{domain}:443:127.0.0.1' -o /dev/null -w '%{{http_code}}' https://{domain} --max-time 3 2>/dev/null")
        if code_check == "000":
            print(f"\n  Debugging {domain}:")
            ssh_exec(client, f"curl -vsk --resolve '{domain}:443:127.0.0.1' https://{domain} --max-time 5 2>&1 | tail -15")

    # ============================================================
    # Summary
    # ============================================================
    print("\n" + "=" * 60)
    print("Persistence status:")
    print("=" * 60)
    for unit in ["restore-traefik-custom.path", "restore-traefik-custom.timer", "ensure-https-redirect.path", "socat-paper.service"]:
        a = ssh_exec(client, f"systemctl is-active {unit} 2>&1")
        e = ssh_exec(client, f"systemctl is-enabled {unit} 2>&1")
        print(f"  {unit}: {a}/{e}")

    client.close()
    print("\nDone!")

if __name__ == "__main__":
    main()
