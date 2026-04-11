# ═══════════════════════════════════════════════════════════════════════════
# Phase 18: Multi-Region Example — US East expansion
# Copy this file as us-east.tfvars and set enabled = true when ready.
# ═══════════════════════════════════════════════════════════════════════════

region_name     = "us-east"
hcloud_location = "ash"          # Hetzner Ashburn, VA
ssh_key_name    = "upsc-master"
server_type     = "cx31"         # 2 vCPU, 8 GB RAM
image           = "ubuntu-24.04"
app_domain      = "upscbyvarunsh.aimasteryedu.in"
environment     = "production"
enabled         = false          # Flip to true when ready to deploy
