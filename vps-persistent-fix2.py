#!/usr/bin/env python3
"""Continue from where vps-persistent-fix.py left off (systemd enable + test)"""
import paramiko, sys, time, os

# Fix Windows encoding
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
    # Verify files were created in phase 1
    # ============================================================
    print("=" * 60)
    print("Verifying config files exist from previous run...")
    print("=" * 60)
    ssh_exec(client, "ls -la /traefik/dynamic/custom-services.yaml /root/traefik-custom-services.yaml.bak /usr/local/bin/restore-traefik-custom.sh /usr/local/bin/ensure-https-redirect.sh 2>&1")
    ssh_exec(client, "ls -la /etc/systemd/system/restore-traefik-custom.* /etc/systemd/system/ensure-https-redirect.* /etc/systemd/system/socat-paper.service 2>&1")

    # ============================================================
    # Enable all systemd units
    # ============================================================
    print("\n" + "=" * 60)
    print("Enabling systemd units...")
    print("=" * 60)

    ssh_exec(client, "systemctl daemon-reload")

    units = [
        "restore-traefik-custom.path",
        "restore-traefik-custom.timer",
        "ensure-https-redirect.path",
        "socat-paper.service",
    ]

    for unit in units:
        ssh_exec(client, f"systemctl enable {unit} 2>&1 || true")
        ssh_exec(client, f"systemctl restart {unit} 2>&1 || systemctl start {unit} 2>&1 || true")
        active = ssh_exec(client, f"systemctl is-active {unit} 2>&1")
        print(f"  -> {unit}: {active}")

    # ============================================================
    # Check 9router port - what's listening on 8044?
    # ============================================================
    print("\n" + "=" * 60)
    print("Checking 9router backend port...")
    print("=" * 60)

    ssh_exec(client, "ss -tlnp | grep 8044 || echo 'Port 8044 NOT listening!'")
    # Maybe 9router is on a different port?
    ssh_exec(client, "docker ps --format '{{.Names}} {{.Ports}}' | grep -i 'router\\|9r' || echo 'No 9router container found'")

    # Check what's actually running that we can route to
    print("\nAll listening ports on 0.0.0.0 (public):")
    ssh_exec(client, "ss -tlnp | grep '0.0.0.0' | sort -t: -k2 -n | head -25")

    # ============================================================
    # Fix HTTP->HTTPS redirect
    # ============================================================
    print("\n" + "=" * 60)
    print("Checking/fixing HTTP->HTTPS redirect...")
    print("=" * 60)

    redirect_check = ssh_exec(client, "grep 'redirections.entrypoint.to' /data/coolify/proxy/docker-compose.yml 2>/dev/null || echo 'MISSING'")
    if 'MISSING' in redirect_check:
        print("Adding HTTP->HTTPS redirect...")
        ssh_exec(client, r"""sed -i "/--entrypoints.http.address=:80/a\\      - '--entrypoints.http.http.redirections.entrypoint.to=https'\n      - '--entrypoints.http.http.redirections.entrypoint.scheme=https'" /data/coolify/proxy/docker-compose.yml""")
        ssh_exec(client, "grep -A2 'entrypoints.http.address' /data/coolify/proxy/docker-compose.yml")
    else:
        print("HTTP->HTTPS redirect already present")

    # ============================================================
    # Check if /traefik/dynamic/ is mounted into Traefik container
    # ============================================================
    print("\n" + "=" * 60)
    print("Checking Traefik dynamic config mount...")
    print("=" * 60)

    ssh_exec(client, "docker inspect coolify-proxy --format '{{range .Mounts}}{{.Source}} -> {{.Destination}}{{\"\\n\"}}{{end}}' 2>&1")
    ssh_exec(client, "grep 'traefik/dynamic' /data/coolify/proxy/docker-compose.yml 2>/dev/null || echo 'No dynamic dir mount found in docker-compose'")
    ssh_exec(client, "grep 'providers.file' /data/coolify/proxy/docker-compose.yml 2>/dev/null || echo 'No file provider config found'")

    # Check if Traefik can see the config inside the container
    ssh_exec(client, "docker exec coolify-proxy ls -la /traefik/dynamic/ 2>&1 || echo 'Cannot list /traefik/dynamic/ inside container'")
    ssh_exec(client, "docker exec coolify-proxy cat /traefik/dynamic/custom-services.yaml 2>&1 | head -5 || echo 'Cannot read config inside container'")

    # ============================================================
    # Restart Traefik
    # ============================================================
    print("\n" + "=" * 60)
    print("Restarting Traefik...")
    print("=" * 60)

    ssh_exec(client, "cd /data/coolify/proxy && docker compose up -d --force-recreate 2>&1 | tail -5", timeout=60)
    print("Waiting 10s for Traefik to initialize...")
    time.sleep(10)

    # ============================================================
    # Check Traefik routers inside the container
    # ============================================================
    print("\n" + "=" * 60)
    print("Checking Traefik loaded routers via API...")
    print("=" * 60)

    ssh_exec(client, "curl -s http://127.0.0.1:8080/api/http/routers 2>/dev/null | python3 -m json.tool 2>/dev/null | grep -E 'name|rule|status' | head -40 || echo 'Could not query Traefik API'")

    # ============================================================
    # VERIFICATION
    # ============================================================
    print("\n" + "=" * 60)
    print("FINAL VERIFICATION")
    print("=" * 60)

    domains = [
        ("9router.aimasteryedu.in", "9Router proxy"),
        ("agent.aimasteryedu.in", "Agent"),
        ("jarvis.aimasteryedu.in", "Jarvis"),
        ("mission.aimasteryedu.in", "Mission"),
        ("openclaw.aimasteryedu.in", "OpenClaw"),
        ("paper.aimasteryedu.in", "Paper"),
    ]

    print("\nHTTPS:")
    for domain, desc in domains:
        code = ssh_exec(client, f"curl -sk -o /dev/null -w '%{{http_code}}' -H 'Host: {domain}' https://127.0.0.1 --max-time 5 2>/dev/null")
        ok = code and code != "000" and code != "502" and code != "404"
        print(f"  {'OK' if ok else 'FAIL'} {domain}: {code}")

    print("\nHTTP (should redirect):")
    for domain, desc in domains:
        code = ssh_exec(client, f"curl -sk -o /dev/null -w '%{{http_code}}' -H 'Host: {domain}' http://127.0.0.1 --max-time 5 2>/dev/null")
        ok = code in ("301", "308")
        print(f"  {'OK' if ok else 'FAIL'} {domain}: HTTP {code}")

    # Self-healing test
    print("\nSelf-healing test:")
    ssh_exec(client, "rm -f /traefik/dynamic/custom-services.yaml && echo 'Deleted config'")
    time.sleep(3)
    ssh_exec(client, "systemctl start restore-traefik-custom.service 2>&1 || true")
    time.sleep(2)
    ssh_exec(client, "test -f /traefik/dynamic/custom-services.yaml && echo 'Self-heal: PASS' || echo 'Self-heal: FAIL'")

    # Systemd status
    print("\nPersistence status:")
    for unit in units:
        active = ssh_exec(client, f"systemctl is-active {unit} 2>&1")
        enabled = ssh_exec(client, f"systemctl is-enabled {unit} 2>&1")
        print(f"  {unit}: active={active} enabled={enabled}")

    client.close()
    print("\nDone!")

if __name__ == "__main__":
    main()
