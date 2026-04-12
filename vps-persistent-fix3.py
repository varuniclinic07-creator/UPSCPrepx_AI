#!/usr/bin/env python3
"""
VPS Fix v3: Correct the Traefik dynamic config path and fix all routing.

Root cause found:
- Traefik mounts /data/coolify/proxy -> /traefik inside container
- So dynamic config must go to /data/coolify/proxy/dynamic/ on host
- Previous fix was writing to /traefik/dynamic/ on host (WRONG!)
- 9router has no container running - need to check what it should route to
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
    # STEP 1: Understand what Coolify already routes
    # ============================================================
    print("=" * 60)
    print("STEP 1: Check what Coolify already manages")
    print("=" * 60)

    # See what's in the CORRECT dynamic config dir
    ssh_exec(client, "ls -la /data/coolify/proxy/dynamic/")
    ssh_exec(client, "echo '--- coolify.yaml ---' && cat /data/coolify/proxy/dynamic/coolify.yaml 2>/dev/null")
    ssh_exec(client, "echo '--- custom-services.yml (old) ---' && cat /data/coolify/proxy/dynamic/custom-services.yml 2>/dev/null")
    ssh_exec(client, "echo '--- default_redirect_503.yaml ---' && cat /data/coolify/proxy/dynamic/default_redirect_503.yaml 2>/dev/null")

    # Check what docker containers are running and what ports they expose
    ssh_exec(client, "docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}' | head -30")

    # Specifically find what agent.aimasteryedu.in routes to (it works!)
    ssh_exec(client, "docker ps --format '{{.Names}} {{.Ports}}' | grep -i 'agent\\|jarvis\\|mission\\|paper\\|open\\|claw'")

    # ============================================================
    # STEP 2: Figure out correct backend ports
    # ============================================================
    print("\n" + "=" * 60)
    print("STEP 2: Identify backend service ports")
    print("=" * 60)

    # Check all services that could be the backends
    ports_to_check = [3100, 3101, 8030, 8031, 8032, 8033, 8034, 8044, 8084, 8089, 8100, 18789, 5080]
    for port in ports_to_check:
        ssh_exec(client, f"ss -tlnp | grep ':{port} ' | head -1 || true")

    # Check what Coolify containers are on the coolify network
    ssh_exec(client, "docker network inspect coolify --format '{{{{range .Containers}}}}{{{{.Name}}}} {{{{.IPv4Address}}}}\\n{{{{end}}}}' 2>/dev/null | sort")

    # ============================================================
    # STEP 3: Write config to CORRECT path
    # ============================================================
    print("\n" + "=" * 60)
    print("STEP 3: Write dynamic config to CORRECT path")
    print("=" * 60)

    # The correct path is /data/coolify/proxy/dynamic/
    # which maps to /traefik/dynamic/ inside the container.

    # First remove the old broken config files
    ssh_exec(client, "rm -f /data/coolify/proxy/dynamic/custom-services.yml 2>/dev/null && echo 'Removed old .yml'")
    ssh_exec(client, "rm -f /data/coolify/proxy/dynamic/host-services.yaml 2>/dev/null")

    # Also clean up the wrong-path files
    ssh_exec(client, "rm -rf /traefik/dynamic/ 2>/dev/null && echo 'Cleaned up wrong-path /traefik/dynamic/'")

    # Write the new config at the CORRECT path
    # Note: agent and mission are managed by Coolify (in coolify.yaml),
    # so we only need custom config for the non-Coolify services
    traefik_config = """http:
  routers:
    # Paper/Papermark service (bound to 127.0.0.1:3100, socat bridge on 3101)
    paper-secure:
      rule: "Host(`paper.aimasteryedu.in`)"
      entryPoints:
        - https
      service: paper-svc
      tls:
        certResolver: letsencrypt

    # Jarvis service
    jarvis-secure:
      rule: "Host(`jarvis.aimasteryedu.in`)"
      entryPoints:
        - https
      service: jarvis-svc
      tls:
        certResolver: letsencrypt

    # OpenClaw service
    openclaw-secure:
      rule: "Host(`openclaw.aimasteryedu.in`)"
      entryPoints:
        - https
      service: openclaw-svc
      tls:
        certResolver: letsencrypt

    # 9Router AI proxy - routes to external 9router API
    ninerouter-secure:
      rule: "Host(`9router.aimasteryedu.in`)"
      entryPoints:
        - https
      service: ninerouter-svc
      tls:
        certResolver: letsencrypt

  services:
    paper-svc:
      loadBalancer:
        servers:
          - url: "http://89.117.60.144:3101"
        passHostHeader: true

    jarvis-svc:
      loadBalancer:
        servers:
          - url: "http://89.117.60.144:8032"
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

    print("\nWriting config to /data/coolify/proxy/dynamic/custom-services.yaml ...")
    ssh_exec(client, f"cat > /data/coolify/proxy/dynamic/custom-services.yaml << 'ENDOFCONFIG'\n{traefik_config}\nENDOFCONFIG")

    # Verify it's there
    ssh_exec(client, "ls -la /data/coolify/proxy/dynamic/")
    ssh_exec(client, "cat /data/coolify/proxy/dynamic/custom-services.yaml | head -5")

    # Verify it's visible INSIDE the container
    ssh_exec(client, "docker exec coolify-proxy ls -la /traefik/dynamic/ 2>&1")
    ssh_exec(client, "docker exec coolify-proxy cat /traefik/dynamic/custom-services.yaml 2>&1 | head -5")

    # ============================================================
    # STEP 4: Update self-healing to use correct paths
    # ============================================================
    print("\n" + "=" * 60)
    print("STEP 4: Fix self-healing scripts for correct path")
    print("=" * 60)

    restore_script = """#!/bin/bash
# /usr/local/bin/restore-traefik-custom.sh
# Auto-restore custom Traefik dynamic config if deleted
# CORRECT PATH: /data/coolify/proxy/dynamic/ (mounted as /traefik/dynamic/ in container)

CONFIG_FILE="/data/coolify/proxy/dynamic/custom-services.yaml"
BACKUP_FILE="/root/traefik-custom-services.yaml.bak"

# If config is missing but backup exists, restore it
if [ ! -f "$CONFIG_FILE" ] && [ -f "$BACKUP_FILE" ]; then
    echo "$(date): Restoring custom Traefik config from backup"
    cp "$BACKUP_FILE" "$CONFIG_FILE"
    echo "$(date): Config restored successfully"
fi

# If config exists, update backup
if [ -f "$CONFIG_FILE" ]; then
    cp "$CONFIG_FILE" "$BACKUP_FILE"
fi

# Also clean up any wrong-path config
rm -f /data/coolify/proxy/dynamic/custom-services.yml 2>/dev/null
rm -f /data/coolify/proxy/dynamic/host-services.yaml 2>/dev/null
"""

    ssh_exec(client, f"cat > /usr/local/bin/restore-traefik-custom.sh << 'ENDSCRIPT'\n{restore_script}\nENDSCRIPT")
    ssh_exec(client, "chmod +x /usr/local/bin/restore-traefik-custom.sh")

    # Update backup
    ssh_exec(client, "cp /data/coolify/proxy/dynamic/custom-services.yaml /root/traefik-custom-services.yaml.bak")

    # Update path watcher to watch correct directory
    path_unit = """[Unit]
Description=Watch Traefik dynamic config directory for changes
After=docker.service

[Path]
PathChanged=/data/coolify/proxy/dynamic/
Unit=restore-traefik-custom.service

[Install]
WantedBy=multi-user.target
"""

    ssh_exec(client, f"cat > /etc/systemd/system/restore-traefik-custom.path << 'EOF'\n{path_unit}\nEOF")

    # ============================================================
    # STEP 5: Create HTTP->HTTPS redirect watcher
    # ============================================================
    print("\n" + "=" * 60)
    print("STEP 5: Create HTTP->HTTPS redirect persistence")
    print("=" * 60)

    redirect_script = """#!/bin/bash
# /usr/local/bin/ensure-https-redirect.sh
COMPOSE_FILE="/data/coolify/proxy/docker-compose.yml"

if [ -f "$COMPOSE_FILE" ]; then
    if ! grep -q 'redirections.entrypoint.to' "$COMPOSE_FILE"; then
        echo "$(date): HTTP->HTTPS redirect missing, re-adding..."
        sed -i "/--entrypoints.http.address=:80/a\\\\      - '--entrypoints.http.http.redirections.entrypoint.to=https'\\n      - '--entrypoints.http.http.redirections.entrypoint.scheme=https'" "$COMPOSE_FILE"
        cd /data/coolify/proxy && docker compose up -d --force-recreate 2>&1 | tail -3
        echo "$(date): Redirect restored and Traefik restarted"
    fi
fi
"""

    ssh_exec(client, f"cat > /usr/local/bin/ensure-https-redirect.sh << 'ENDSCRIPT'\n{redirect_script}\nENDSCRIPT")
    ssh_exec(client, "chmod +x /usr/local/bin/ensure-https-redirect.sh")

    compose_path_unit = """[Unit]
Description=Watch Coolify proxy docker-compose.yml for changes
After=docker.service

[Path]
PathModified=/data/coolify/proxy/docker-compose.yml
Unit=ensure-https-redirect.service

[Install]
WantedBy=multi-user.target
"""

    compose_service_unit = """[Unit]
Description=Ensure HTTP->HTTPS redirect in Coolify Traefik config
After=docker.service

[Service]
Type=oneshot
ExecStartPre=/bin/sleep 5
ExecStart=/usr/local/bin/ensure-https-redirect.sh
"""

    ssh_exec(client, f"cat > /etc/systemd/system/ensure-https-redirect.path << 'EOF'\n{compose_path_unit}\nEOF")
    ssh_exec(client, f"cat > /etc/systemd/system/ensure-https-redirect.service << 'EOF'\n{compose_service_unit}\nEOF")

    # ============================================================
    # STEP 6: Enable everything and restart
    # ============================================================
    print("\n" + "=" * 60)
    print("STEP 6: Enable services and restart Traefik")
    print("=" * 60)

    ssh_exec(client, "systemctl daemon-reload")

    units = [
        "restore-traefik-custom.path",
        "restore-traefik-custom.timer",
        "ensure-https-redirect.path",
        "socat-paper.service",
    ]

    for unit in units:
        ssh_exec(client, f"systemctl enable {unit} 2>&1 | grep -v 'Created symlink' || true")
        ssh_exec(client, f"systemctl restart {unit} 2>&1 || systemctl start {unit} 2>&1 || true")
        active = ssh_exec(client, f"systemctl is-active {unit} 2>&1")
        print(f"  -> {unit}: {active}")

    # Traefik should auto-detect file changes (providers.file.watch=true)
    # But let's verify by checking the routers
    print("\nWaiting 5s for Traefik to pick up file changes...")
    time.sleep(5)

    # Check Traefik API for loaded routers
    ssh_exec(client, "curl -s http://127.0.0.1:8080/api/http/routers 2>/dev/null | python3 -c \"import sys,json; [print(f\\\"  {r['name']:40s} {r.get('status','?'):10s} {r.get('rule','')}\\\") for r in json.load(sys.stdin)]\" 2>/dev/null || echo 'Could not query Traefik API (may need restart)'")

    # If we can't see routers, restart Traefik
    routers = ssh_exec(client, "curl -s http://127.0.0.1:8080/api/http/routers 2>/dev/null | python3 -c 'import sys,json; data=json.load(sys.stdin); print(len(data))' 2>/dev/null || echo '0'")

    if not routers or routers == '0':
        print("\nNo routers visible - restarting Traefik...")
        ssh_exec(client, "cd /data/coolify/proxy && docker compose up -d --force-recreate 2>&1 | tail -5", timeout=60)
        print("Waiting 10s...")
        time.sleep(10)
        ssh_exec(client, "curl -s http://127.0.0.1:8080/api/http/routers 2>/dev/null | python3 -c \"import sys,json; [print(f\\\"  {r['name']:40s} {r.get('status','?'):10s} {r.get('rule','')}\\\") for r in json.load(sys.stdin)]\" 2>/dev/null || echo 'Still cannot query API'")

    # ============================================================
    # STEP 7: Check what port 8100 (9router) is
    # ============================================================
    print("\n" + "=" * 60)
    print("STEP 7: Check 9router backend")
    print("=" * 60)

    r8100 = ssh_exec(client, "ss -tlnp | grep ':8100 ' || echo 'Port 8100 not listening'")
    if '8100 not listening' in r8100:
        # Check if there's a python process that handles 9router
        ssh_exec(client, "ps aux | grep -i '9router\\|router9\\|ai-router\\|8044' | grep -v grep || echo 'No 9router process found'")
        # Check if there's a container that might be it
        ssh_exec(client, "docker ps --format '{{.Names}} {{.Ports}}' | grep -iE '8044|8100|router' || echo 'No router container'")
        print("\n*** 9router has NO backend service running! ***")
        print("The 9router.aimasteryedu.in domain will return 502 Bad Gateway.")
        print("You need to start the 9router service or change its backend URL.")
    else:
        print("Port 8100 is listening - 9router backend exists")

    # ============================================================
    # STEP 8: FINAL VERIFICATION
    # ============================================================
    print("\n" + "=" * 60)
    print("FINAL VERIFICATION")
    print("=" * 60)

    domains = [
        ("9router.aimasteryedu.in", "9Router proxy"),
        ("agent.aimasteryedu.in", "Agent (Coolify-managed)"),
        ("jarvis.aimasteryedu.in", "Jarvis"),
        ("mission.aimasteryedu.in", "Mission (Coolify-managed)"),
        ("openclaw.aimasteryedu.in", "OpenClaw"),
        ("paper.aimasteryedu.in", "Paper"),
        ("coolify.aimasteryedu.in", "Coolify UI"),
    ]

    print("\nHTTPS:")
    for domain, desc in domains:
        code = ssh_exec(client, f"curl -sk -o /dev/null -w '%{{http_code}}' -H 'Host: {domain}' https://127.0.0.1 --max-time 5 2>/dev/null")
        if code in ("200", "302", "307", "401"):
            mark = "OK"
        elif code == "502":
            mark = "BAD_GW"
        elif code == "000":
            mark = "NO_ROUTE"
        else:
            mark = code
        print(f"  [{mark:8s}] {domain:35s} -> {code}  ({desc})")

    print("\nHTTP -> HTTPS redirect:")
    for domain, desc in domains:
        code = ssh_exec(client, f"curl -sk -o /dev/null -w '%{{http_code}}' -H 'Host: {domain}' http://127.0.0.1 --max-time 5 2>/dev/null")
        mark = "OK" if code in ("301", "308") else code
        print(f"  [{mark:8s}] {domain:35s} -> {code}")

    # Self-healing test
    print("\nSelf-healing test (delete + restore):")
    ssh_exec(client, "rm -f /data/coolify/proxy/dynamic/custom-services.yaml && echo 'Config deleted'")
    time.sleep(3)
    ssh_exec(client, "/usr/local/bin/restore-traefik-custom.sh 2>&1")
    result = ssh_exec(client, "test -f /data/coolify/proxy/dynamic/custom-services.yaml && echo 'RESTORED OK' || echo 'RESTORE FAILED'")
    print(f"  Result: {result}")

    # Summary
    print("\n" + "=" * 60)
    print("PERSISTENCE MECHANISMS:")
    print("=" * 60)
    for unit in units:
        active = ssh_exec(client, f"systemctl is-active {unit} 2>&1")
        enabled = ssh_exec(client, f"systemctl is-enabled {unit} 2>&1")
        print(f"  {unit}: active={active} enabled={enabled}")

    print(f"""
KEY FIX: Config now written to CORRECT path:
  /data/coolify/proxy/dynamic/custom-services.yaml
  (= /traefik/dynamic/custom-services.yaml inside container)

Previous WRONG path: /traefik/dynamic/ on host (not mounted!)
""")

    client.close()
    print("Done!")

if __name__ == "__main__":
    main()
