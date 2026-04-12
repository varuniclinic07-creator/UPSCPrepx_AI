#!/usr/bin/env python3
"""Debug: test Traefik container's network access to host process backends"""
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

    # Test from INSIDE the Traefik container (coolify-proxy)
    print("=" * 60)
    print("Testing from INSIDE coolify-proxy container")
    print("=" * 60)

    backends = [
        ("agent (Docker)", "89.117.60.144:5080"),
        ("mission (Docker)", "89.117.60.144:7001"),
        ("jarvis (host)", "89.117.60.144:8100"),
        ("paper (host socat)", "89.117.60.144:3101"),
        ("openclaw (host)", "89.117.60.144:18789"),
    ]

    for name, url in backends:
        result = ssh_exec(client, f"docker exec coolify-proxy timeout 3 wget -q -O /dev/null --timeout=3 http://{url} 2>&1; echo 'exit:'$?")
        print(f"  {name:25s} -> {url}: {result}")

    # Test with curl from inside container
    print("\n--- Same test with curl (if available) ---")
    for name, url in backends:
        result = ssh_exec(client, f"docker exec coolify-proxy curl -s -o /dev/null -w '%{{http_code}}' --max-time 3 http://{url} 2>/dev/null || echo 'curl not available in container'")
        print(f"  {name:25s} -> {url}: HTTP {result}")

    # What network is coolify-proxy on?
    print("\n--- Coolify-proxy networks ---")
    ssh_exec(client, "docker inspect coolify-proxy --format '{{json .NetworkSettings.Networks}}' 2>/dev/null | python3 -m json.tool 2>/dev/null | head -15")

    # What IP does coolify-proxy see for 89.117.60.144?
    ssh_exec(client, "docker exec coolify-proxy ping -c 1 -W 2 89.117.60.144 2>&1 | head -3 || echo 'ping not available'")

    # What about host.docker.internal or gateway?
    ssh_exec(client, "docker exec coolify-proxy cat /etc/hosts 2>&1 | grep -i host || echo 'no host.docker.internal'")

    # Check the Docker bridge gateway
    ssh_exec(client, "docker network inspect coolify --format '{{(index .IPAM.Config 0).Gateway}}' 2>/dev/null || echo 'no gateway'")

    # Test with Docker gateway IP instead
    print("\n--- Test with Docker bridge gateway IP ---")
    gateway = ssh_exec(client, "docker network inspect bridge --format '{{(index .IPAM.Config 0).Gateway}}' 2>/dev/null")
    if gateway:
        print(f"Docker bridge gateway: {gateway}")
        for name, url in [("jarvis", f"{gateway}:8100"), ("paper", f"{gateway}:3101")]:
            result = ssh_exec(client, f"docker exec coolify-proxy timeout 3 wget -q -O /dev/null --timeout=3 http://{url} 2>&1; echo 'exit:'$?")
            print(f"  {name:25s} -> {url}: {result}")

    # Test with coolify network gateway
    coolify_gw = ssh_exec(client, "docker network inspect coolify --format '{{(index .IPAM.Config 0).Gateway}}' 2>/dev/null")
    if coolify_gw:
        print(f"\nCoolify network gateway: {coolify_gw}")
        for name, url in [("jarvis", f"{coolify_gw}:8100"), ("paper", f"{coolify_gw}:3101")]:
            result = ssh_exec(client, f"docker exec coolify-proxy timeout 3 wget -q -O /dev/null --timeout=3 http://{url} 2>&1; echo 'exit:'$?")
            print(f"  {name:25s} -> {url}: {result}")

    # Check iptables for any REJECT/DROP rules on Docker traffic
    print("\n--- iptables rules that might block Docker -> host ---")
    ssh_exec(client, "iptables -L INPUT -n -v | grep -E 'DROP|REJECT' | head -10 || echo 'no DROP/REJECT rules'")
    ssh_exec(client, "iptables -L DOCKER-USER -n -v 2>/dev/null | head -10 || echo 'no DOCKER-USER chain'")

    # Check UFW
    ssh_exec(client, "ufw status 2>/dev/null | head -10 || echo 'ufw not installed'")

    # What's the firewall situation?
    ssh_exec(client, "nft list ruleset 2>/dev/null | grep -E 'drop|reject' | head -10 || echo 'no nftables rules'")

    client.close()
    print("\nDone!")

if __name__ == "__main__":
    main()
