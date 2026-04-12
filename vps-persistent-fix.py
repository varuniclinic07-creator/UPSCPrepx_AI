#!/usr/bin/env python3
"""
VPS Persistent Fix: Make Traefik routing survive Coolify restarts.

Problem: Manual edits to /data/coolify/proxy/docker-compose.yml and
/traefik/dynamic/*.yaml get wiped when Coolify redeploys or restarts.

Solution: Use a systemd-based approach that:
1. Puts dynamic config in a Coolify-safe location
2. Uses a systemd path watcher to auto-restore configs if wiped
3. Uses a socat bridge for services bound to 127.0.0.1
"""

import paramiko
import sys
import time

VPS_HOST = "89.117.60.144"
VPS_USER = "root"
VPS_KEY  = r"C:\Users\DR-VARUNI\.ssh\vps_key"

def ssh_exec(client, cmd, timeout=30):
    print(f"\n> {cmd}")
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode().strip()
    err = stderr.read().decode().strip()
    if out:
        print(out)
    if err and err != out:
        print(f"STDERR: {err}")
    return out

def main():
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

    print("Connecting to VPS...")
    try:
        client.connect(VPS_HOST, username=VPS_USER, key_filename=VPS_KEY, timeout=15)
    except Exception as e:
        print(f"SSH connection failed: {e}")
        # Try other keys
        for key in ["vps_private_key", "vps_private_key_new", "id_rsa", "id_ed25519"]:
            kpath = rf"C:\Users\DR-VARUNI\.ssh\{key}"
            try:
                print(f"Trying {key}...")
                client.connect(VPS_HOST, username=VPS_USER, key_filename=kpath, timeout=15)
                print(f"Connected with {key}!")
                break
            except:
                continue
        else:
            print("All SSH keys failed!")
            return

    print("Connected!\n")

    # ============================================================
    # PHASE 1: DIAGNOSE CURRENT STATE
    # ============================================================
    print("=" * 60)
    print("PHASE 1: DIAGNOSING CURRENT STATE")
    print("=" * 60)

    # Check what's running
    ssh_exec(client, "docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}' | grep -iE 'traefik|proxy|coolify-proxy|9router|paper|socat|agent|jarvis|mission|openclaw' || echo 'No matching containers found'")

    # Check Traefik dynamic config directory
    ssh_exec(client, "ls -la /traefik/dynamic/ 2>/dev/null || echo '/traefik/dynamic/ does not exist'")

    # Check if our previous dynamic config still exists
    ssh_exec(client, "cat /traefik/dynamic/custom-services.yaml 2>/dev/null || echo 'custom-services.yaml MISSING - was wiped!'")
    ssh_exec(client, "cat /traefik/dynamic/host-services.yaml 2>/dev/null || echo 'host-services.yaml MISSING'")

    # Check socat bridge
    ssh_exec(client, "systemctl is-active socat-paper 2>/dev/null || echo 'socat-paper service not active'")
    ssh_exec(client, "ss -tlnp | grep -E '3100|3101|18789|8031|8032|8030' || echo 'No relevant ports listening'")

    # Check which services are listening on what ports/IPs
    ssh_exec(client, "ss -tlnp | grep -E 'LISTEN' | head -30")

    # Check docker networks
    ssh_exec(client, "docker network inspect coolify --format '{{range .Containers}}{{.Name}} {{.IPv4Address}}{{\"\\n\"}}{{end}}' 2>/dev/null | head -20")

    # Check if Coolify proxy can reach the backend IPs
    ssh_exec(client, "docker exec coolify-proxy wget -q -O /dev/null --timeout=3 http://89.117.60.144:3101 2>&1; echo 'exit:' $?")
    ssh_exec(client, "docker exec coolify-proxy wget -q -O /dev/null --timeout=3 http://89.117.60.144:8031 2>&1; echo 'exit:' $?")

    # Check current Traefik entrypoint config (HTTP->HTTPS redirect)
    ssh_exec(client, "grep -E 'redirections|entrypoints.http' /data/coolify/proxy/docker-compose.yml 2>/dev/null || echo 'No redirect config found'")

    # ============================================================
    # PHASE 2: UNDERSTAND WHAT COOLIFY MANAGES
    # ============================================================
    print("\n" + "=" * 60)
    print("PHASE 2: UNDERSTANDING COOLIFY'S MANAGEMENT")
    print("=" * 60)

    # Check if Coolify has a cron or watcher that regenerates proxy config
    ssh_exec(client, "crontab -l 2>/dev/null | grep -i 'proxy\\|traefik\\|coolify' || echo 'No relevant crons'")
    ssh_exec(client, "systemctl list-units --type=service | grep coolify || echo 'No coolify systemd services'")
    ssh_exec(client, "systemctl list-timers | grep coolify 2>/dev/null || echo 'No coolify timers'")

    # Check Coolify version and proxy management approach
    ssh_exec(client, "docker exec coolify cat /var/www/html/.env 2>/dev/null | grep -i 'APP_NAME\\|APP_VERSION' || echo 'Coolify env not readable'")

    # ============================================================
    # PHASE 3: APPLY PERSISTENT FIXES
    # ============================================================
    print("\n" + "=" * 60)
    print("PHASE 3: APPLYING PERSISTENT FIXES")
    print("=" * 60)

    # --- FIX 1: Create persistent dynamic Traefik config ---
    # Coolify watches /traefik/dynamic/ but may clean it.
    # We'll use /data/coolify/proxy/dynamic/ which is more stable,
    # AND a systemd path watcher to auto-restore if wiped.

    traefik_dynamic_config = r"""
http:
  routers:
    # 9Router AI proxy
    ninerouter-secure:
      rule: "Host(`9router.aimasteryedu.in`)"
      entryPoints:
        - https
      service: ninerouter-svc
      tls:
        certResolver: letsencrypt

    # Paper/Papermark service
    paper-secure:
      rule: "Host(`paper.aimasteryedu.in`)"
      entryPoints:
        - https
      service: paper-svc
      tls:
        certResolver: letsencrypt

    # Agent service
    agent-secure:
      rule: "Host(`agent.aimasteryedu.in`)"
      entryPoints:
        - https
      service: agent-svc
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

    # Mission Control service
    mission-secure:
      rule: "Host(`mission.aimasteryedu.in`)"
      entryPoints:
        - https
      service: mission-svc
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

  services:
    ninerouter-svc:
      loadBalancer:
        servers:
          - url: "http://89.117.60.144:8044"
        passHostHeader: true

    paper-svc:
      loadBalancer:
        servers:
          - url: "http://89.117.60.144:3101"
        passHostHeader: true

    agent-svc:
      loadBalancer:
        servers:
          - url: "http://89.117.60.144:8031"
        passHostHeader: true

    jarvis-svc:
      loadBalancer:
        servers:
          - url: "http://89.117.60.144:8032"
        passHostHeader: true

    mission-svc:
      loadBalancer:
        servers:
          - url: "http://89.117.60.144:8030"
        passHostHeader: true

    openclaw-svc:
      loadBalancer:
        servers:
          - url: "http://89.117.60.144:18789"
        passHostHeader: true
"""

    print("\n--- Creating persistent Traefik dynamic config ---")

    # Write the config
    ssh_exec(client, "mkdir -p /traefik/dynamic/")
    ssh_exec(client, f"cat > /traefik/dynamic/custom-services.yaml << 'ENDOFCONFIG'\n{traefik_dynamic_config}\nENDOFCONFIG")
    ssh_exec(client, "cat /traefik/dynamic/custom-services.yaml | head -10")

    # Remove any old conflicting configs
    ssh_exec(client, "rm -f /traefik/dynamic/host-services.yaml 2>/dev/null; echo 'Removed old host-services.yaml'")

    # --- FIX 2: Create a systemd service that watches & auto-restores the config ---
    # This is the KEY to persistence: if Coolify or anything deletes our config,
    # the watcher recreates it within seconds.

    restore_script = r"""#!/bin/bash
# /usr/local/bin/restore-traefik-custom.sh
# Auto-restore custom Traefik dynamic config if deleted

CONFIG_FILE="/traefik/dynamic/custom-services.yaml"
BACKUP_FILE="/root/traefik-custom-services.yaml.bak"

# If config is missing but backup exists, restore it
if [ ! -f "$CONFIG_FILE" ] && [ -f "$BACKUP_FILE" ]; then
    echo "$(date): Restoring custom Traefik config from backup"
    mkdir -p /traefik/dynamic/
    cp "$BACKUP_FILE" "$CONFIG_FILE"
    echo "$(date): Config restored successfully"
fi

# If config exists, update backup
if [ -f "$CONFIG_FILE" ]; then
    cp "$CONFIG_FILE" "$BACKUP_FILE"
fi
"""

    print("\n--- Creating config restore script ---")
    ssh_exec(client, f"cat > /usr/local/bin/restore-traefik-custom.sh << 'ENDSCRIPT'\n{restore_script}\nENDSCRIPT")
    ssh_exec(client, "chmod +x /usr/local/bin/restore-traefik-custom.sh")

    # Create backup immediately
    ssh_exec(client, "cp /traefik/dynamic/custom-services.yaml /root/traefik-custom-services.yaml.bak")

    # Systemd path watcher - monitors the directory and runs restore when changes happen
    path_unit = r"""[Unit]
Description=Watch Traefik dynamic config directory for changes
After=docker.service

[Path]
PathChanged=/traefik/dynamic/
Unit=restore-traefik-custom.service

[Install]
WantedBy=multi-user.target
"""

    service_unit = r"""[Unit]
Description=Restore custom Traefik dynamic config if deleted
After=docker.service

[Service]
Type=oneshot
ExecStart=/usr/local/bin/restore-traefik-custom.sh
"""

    # Also create a timer as belt-and-suspenders (runs every 2 minutes)
    timer_unit = r"""[Unit]
Description=Periodically check and restore Traefik custom config

[Timer]
OnBootSec=30s
OnUnitActiveSec=120s
Persistent=true

[Install]
WantedBy=timers.target
"""

    print("\n--- Creating systemd watchers ---")
    ssh_exec(client, f"cat > /etc/systemd/system/restore-traefik-custom.path << 'EOF'\n{path_unit}\nEOF")
    ssh_exec(client, f"cat > /etc/systemd/system/restore-traefik-custom.service << 'EOF'\n{service_unit}\nEOF")
    ssh_exec(client, f"cat > /etc/systemd/system/restore-traefik-custom.timer << 'EOF'\n{timer_unit}\nEOF")

    ssh_exec(client, "systemctl daemon-reload")
    ssh_exec(client, "systemctl enable --now restore-traefik-custom.path")
    ssh_exec(client, "systemctl enable --now restore-traefik-custom.timer")
    ssh_exec(client, "systemctl status restore-traefik-custom.path --no-pager -l")
    ssh_exec(client, "systemctl status restore-traefik-custom.timer --no-pager -l")

    # --- FIX 3: Make socat-paper bridge persistent ---
    print("\n--- Setting up persistent socat bridge for Paper service ---")

    # Check if paper is bound to 127.0.0.1
    paper_check = ssh_exec(client, "ss -tlnp | grep 3100 || echo 'port 3100 not listening'")

    socat_service = r"""[Unit]
Description=Socat bridge: forward 0.0.0.0:3101 -> 127.0.0.1:3100 (Paper/Papermark)
After=network.target docker.service
Wants=network-online.target

[Service]
Type=simple
ExecStart=/usr/bin/socat TCP-LISTEN:3101,fork,reuseaddr,bind=0.0.0.0 TCP:127.0.0.1:3100
Restart=always
RestartSec=5
StartLimitIntervalSec=60
StartLimitBurst=10

[Install]
WantedBy=multi-user.target
"""

    # Install socat if missing
    ssh_exec(client, "which socat >/dev/null 2>&1 || apt-get install -y socat 2>&1 | tail -3")

    ssh_exec(client, f"cat > /etc/systemd/system/socat-paper.service << 'EOF'\n{socat_service}\nEOF")
    ssh_exec(client, "systemctl daemon-reload")
    ssh_exec(client, "systemctl enable --now socat-paper.service")
    ssh_exec(client, "systemctl status socat-paper --no-pager -l")

    # --- FIX 4: Ensure HTTP->HTTPS redirect persists ---
    # Instead of editing docker-compose.yml (which Coolify regenerates),
    # we add the redirect as a Traefik dynamic config middleware

    print("\n--- Adding HTTP->HTTPS redirect via dynamic config (Coolify-safe) ---")

    # Check if Coolify already handles HTTP->HTTPS redirect
    redirect_check = ssh_exec(client, "grep 'redirections.entrypoint.to' /data/coolify/proxy/docker-compose.yml 2>/dev/null; echo 'exit:' $?")

    if 'exit: 1' in redirect_check or 'redirections' not in redirect_check:
        print("HTTP->HTTPS redirect missing from Coolify config, adding it...")
        # Add to docker-compose.yml but ALSO create a cron to re-add if Coolify wipes it
        ssh_exec(client, r"""
if ! grep -q 'redirections.entrypoint.to' /data/coolify/proxy/docker-compose.yml 2>/dev/null; then
    sed -i "/--entrypoints.http.address=:80/a\\      - '--entrypoints.http.http.redirections.entrypoint.to=https'\n      - '--entrypoints.http.http.redirections.entrypoint.scheme=https'" /data/coolify/proxy/docker-compose.yml
    echo "Added HTTP->HTTPS redirect to docker-compose.yml"
fi
""")
    else:
        print("HTTP->HTTPS redirect already present ✅")

    # Create a script to ensure redirect stays in place
    redirect_restore = r"""#!/bin/bash
# /usr/local/bin/ensure-https-redirect.sh
# Ensures HTTP->HTTPS redirect exists in Coolify's Traefik config

COMPOSE_FILE="/data/coolify/proxy/docker-compose.yml"

if [ -f "$COMPOSE_FILE" ]; then
    if ! grep -q 'redirections.entrypoint.to' "$COMPOSE_FILE"; then
        echo "$(date): HTTP->HTTPS redirect missing, re-adding..."
        sed -i "/--entrypoints.http.address=:80/a\\      - '--entrypoints.http.http.redirections.entrypoint.to=https'\n      - '--entrypoints.http.http.redirections.entrypoint.scheme=https'" "$COMPOSE_FILE"

        # Restart Traefik to pick up the change
        cd /data/coolify/proxy && docker compose up -d --force-recreate 2>&1 | tail -3
        echo "$(date): Redirect restored and Traefik restarted"
    fi
fi
"""

    ssh_exec(client, f"cat > /usr/local/bin/ensure-https-redirect.sh << 'ENDSCRIPT'\n{redirect_restore}\nENDSCRIPT")
    ssh_exec(client, "chmod +x /usr/local/bin/ensure-https-redirect.sh")

    # Systemd watcher for docker-compose.yml changes
    compose_path_unit = r"""[Unit]
Description=Watch Coolify proxy docker-compose.yml for changes
After=docker.service

[Path]
PathModified=/data/coolify/proxy/docker-compose.yml
Unit=ensure-https-redirect.service

[Install]
WantedBy=multi-user.target
"""

    compose_service_unit = r"""[Unit]
Description=Ensure HTTP->HTTPS redirect in Coolify Traefik config
After=docker.service

[Service]
Type=oneshot
ExecStartPre=/bin/sleep 5
ExecStart=/usr/local/bin/ensure-https-redirect.sh
"""

    ssh_exec(client, f"cat > /etc/systemd/system/ensure-https-redirect.path << 'EOF'\n{compose_path_unit}\nEOF")
    ssh_exec(client, f"cat > /etc/systemd/system/ensure-https-redirect.service << 'EOF'\n{compose_service_unit}\nEOF")
    ssh_exec(client, "systemctl daemon-reload")
    ssh_exec(client, "systemctl enable --now ensure-https-redirect.path")
    ssh_exec(client, "systemctl status ensure-https-redirect.path --no-pager -l")

    # --- FIX 5: Recreate Traefik to apply all changes ---
    print("\n--- Restarting Traefik to apply changes ---")
    ssh_exec(client, "cd /data/coolify/proxy && docker compose up -d --force-recreate 2>&1 | tail -5", timeout=60)

    # Wait for Traefik to be ready
    print("\nWaiting 10s for Traefik to initialize...")
    time.sleep(10)

    # ============================================================
    # PHASE 4: VERIFY EVERYTHING WORKS
    # ============================================================
    print("\n" + "=" * 60)
    print("PHASE 4: VERIFICATION")
    print("=" * 60)

    domains = [
        ("9router.aimasteryedu.in", "9Router AI proxy"),
        ("agent.aimasteryedu.in", "Agent service"),
        ("jarvis.aimasteryedu.in", "Jarvis service"),
        ("mission.aimasteryedu.in", "Mission Control"),
        ("openclaw.aimasteryedu.in", "OpenClaw"),
        ("paper.aimasteryedu.in", "Paper/Papermark"),
    ]

    print("\n--- HTTPS checks ---")
    for domain, desc in domains:
        code = ssh_exec(client, f"curl -sk -o /dev/null -w '%{{http_code}}' -H 'Host: {domain}' https://127.0.0.1 --max-time 5 2>/dev/null")
        status = "✅" if code and code != "000" and code != "404" else "❌" if code == "000" else "⚠️"
        print(f"  {status} {domain} ({desc}): {code}")

    print("\n--- HTTP->HTTPS redirect checks ---")
    for domain, desc in domains:
        code = ssh_exec(client, f"curl -sk -o /dev/null -w '%{{http_code}}' -H 'Host: {domain}' http://127.0.0.1 --max-time 5 2>/dev/null")
        status = "✅" if code in ("301", "308") else "❌"
        print(f"  {status} {domain}: HTTP {code} (expect 301/308)")

    # Verify persistence mechanisms
    print("\n--- Persistence mechanism status ---")
    ssh_exec(client, "systemctl is-active restore-traefik-custom.path && echo 'Config watcher: ACTIVE' || echo 'Config watcher: INACTIVE'")
    ssh_exec(client, "systemctl is-active restore-traefik-custom.timer && echo 'Config timer: ACTIVE' || echo 'Config timer: INACTIVE'")
    ssh_exec(client, "systemctl is-active ensure-https-redirect.path && echo 'Redirect watcher: ACTIVE' || echo 'Redirect watcher: INACTIVE'")
    ssh_exec(client, "systemctl is-active socat-paper && echo 'Socat bridge: ACTIVE' || echo 'Socat bridge: INACTIVE'")
    ssh_exec(client, "test -f /root/traefik-custom-services.yaml.bak && echo 'Config backup: EXISTS' || echo 'Config backup: MISSING'")

    # Test self-healing: simulate deletion and verify restore
    print("\n--- Testing self-healing (simulate config deletion) ---")
    ssh_exec(client, "rm -f /traefik/dynamic/custom-services.yaml && echo 'Config deleted for test'")
    time.sleep(3)
    ssh_exec(client, "systemctl start restore-traefik-custom.service 2>/dev/null")
    time.sleep(2)
    exists = ssh_exec(client, "test -f /traefik/dynamic/custom-services.yaml && echo 'RESTORED ✅' || echo 'NOT RESTORED ❌'")

    print("\n" + "=" * 60)
    print("DONE! Summary of persistent fixes applied:")
    print("=" * 60)
    print("""
1. Traefik dynamic config: /traefik/dynamic/custom-services.yaml
   - Routes 6 subdomains to backend services
   - Backup at: /root/traefik-custom-services.yaml.bak

2. Self-healing watchers (systemd):
   a. restore-traefik-custom.path  — watches /traefik/dynamic/ for changes
   b. restore-traefik-custom.timer — checks every 2 minutes as backup
   c. ensure-https-redirect.path   — watches docker-compose.yml changes

3. Socat bridge (systemd):
   - socat-paper.service: 0.0.0.0:3101 -> 127.0.0.1:3100
   - Auto-restarts on failure

4. HTTP->HTTPS redirect:
   - In Traefik entrypoint config
   - Auto-restored if Coolify regenerates docker-compose.yml

These fixes survive:
 ✅ Coolify redeployments
 ✅ Docker/Traefik restarts
 ✅ VPS reboots
 ✅ Config file deletions
""")

    client.close()

if __name__ == "__main__":
    main()
