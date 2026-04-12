#!/usr/bin/env python3
"""
VPS Firewall Fix: Allow Traefik (Docker) to reach host services.

Root cause: UFW INPUT policy is DROP. Docker containers (agent, mission)
work because Docker PREROUTING rules bypass INPUT. Host processes
(jarvis:8100, paper:3101, openclaw:18789) get DROPPED.

Fix: Add UFW rules to allow Docker internal network traffic to these ports.
"""
import paramiko, sys, time, os

os.environ["PYTHONIOENCODING"] = "utf-8"
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

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
    # Show current UFW rules
    # ============================================================
    print("=" * 60)
    print("Current UFW rules:")
    print("=" * 60)
    ssh_exec(client, "ufw status numbered")

    # ============================================================
    # Add firewall rules for Docker -> host service ports
    # ============================================================
    print("\n" + "=" * 60)
    print("Adding UFW rules for Docker internal traffic")
    print("=" * 60)

    # Docker networks use 10.0.0.0/8 and 172.16.0.0/12 ranges
    # The coolify network is on 10.0.1.0/24
    # Allow from any Docker network range to the specific service ports

    rules = [
        ("3101", "Traefik to Paper/socat"),
        ("8100", "Traefik to Jarvis"),
        ("18789", "Traefik to OpenClaw"),
        ("7001", "Traefik to Mission Control"),
        ("5080", "Traefik to Agent Zero"),
        ("8030", "Traefik to Web Search"),
        ("8031", "Traefik to AutoDoc"),
        ("8032", "Traefik to File Search"),
        ("8033", "Traefik to Manim"),
        ("8034", "Traefik to Remotion"),
    ]

    for port, comment in rules:
        # Allow from Docker's 10.x.x.x range
        ssh_exec(client, f"ufw allow from 10.0.0.0/8 to any port {port} proto tcp comment '{comment}' 2>&1 | grep -v 'Skipping'")
        # Also allow from 172.16-31.x.x Docker range
        ssh_exec(client, f"ufw allow from 172.16.0.0/12 to any port {port} proto tcp comment '{comment}' 2>&1 | grep -v 'Skipping'")

    # Reload UFW
    ssh_exec(client, "ufw reload")

    # Show updated rules
    print("\n--- Updated UFW rules ---")
    ssh_exec(client, "ufw status numbered | head -40")

    # ============================================================
    # Test from Traefik container
    # ============================================================
    print("\n" + "=" * 60)
    print("Testing from inside coolify-proxy AFTER firewall fix")
    print("=" * 60)

    backends = [
        ("agent (Docker)", "89.117.60.144:5080"),
        ("mission (Docker)", "89.117.60.144:7001"),
        ("jarvis (host)", "89.117.60.144:8100"),
        ("paper (socat)", "89.117.60.144:3101"),
        ("openclaw (host)", "89.117.60.144:18789"),
    ]

    for name, url in backends:
        result = ssh_exec(client, f"docker exec coolify-proxy timeout 5 wget -q -O /dev/null --timeout=3 http://{url} 2>&1; echo 'exit:'$?")
        ok = "exit:0" in result or "401" in result
        print(f"  {'OK' if ok else 'FAIL':4s} {name:25s} -> {url}: {result}")

    # ============================================================
    # Test HTTPS via Traefik (the actual routing)
    # ============================================================
    print("\n" + "=" * 60)
    print("HTTPS tests through Traefik")
    print("=" * 60)

    time.sleep(3)  # Give Traefik a moment

    domains = [
        ("agent.aimasteryedu.in", "Agent Zero", "302"),
        ("jarvis.aimasteryedu.in", "Jarvis", "302"),
        ("mission.aimasteryedu.in", "Mission Control", "401"),
        ("paper.aimasteryedu.in", "Papermark", "200"),
        ("9router.aimasteryedu.in", "9Router", "302"),
        ("openclaw.aimasteryedu.in", "OpenClaw", "?"),
        ("coolify.aimasteryedu.in", "Coolify UI", "302"),
    ]

    for domain, desc, expected in domains:
        code = ssh_exec(client, f"curl -sk --resolve '{domain}:443:127.0.0.1' -o /dev/null -w '%{{http_code}}' https://{domain} --max-time 8 2>/dev/null")
        ok = code not in ("000", "503")
        mark = "OK" if ok else ("TIMEOUT" if code == "000" else code)
        print(f"  [{mark:8s}] {domain:35s} HTTPS {code} (expected ~{expected})")

    # ============================================================
    # Test from browser perspective (external)
    # ============================================================
    print("\n" + "=" * 60)
    print("External test (real DNS, real HTTPS)")
    print("=" * 60)

    for domain, desc, expected in domains:
        code = ssh_exec(client, f"curl -sk -o /dev/null -w '%{{http_code}}' https://{domain} --max-time 8 2>/dev/null")
        ok = code not in ("000", "503")
        mark = "OK" if ok else ("TIMEOUT" if code == "000" else code)
        print(f"  [{mark:8s}] {domain:35s} HTTPS {code}")

    print("\n\nDone!")
    client.close()

if __name__ == "__main__":
    main()
