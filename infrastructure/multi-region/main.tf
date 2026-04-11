# ═══════════════════════════════════════════════════════════════════════════
# Phase 18: Multi-Region Infrastructure Template
# ═══════════════════════════════════════════════════════════════════════════
# This module can be instantiated once per target region.
# The primary (current) region is eu-central (Frankfurt, 89.117.60.144).
# To expand to a new region, duplicate this module block in the root main.tf.
#
# IMPORTANT: Do not break the current single-region setup.
# This is additive — new regions are opt-in via var.enabled = true.
# ═══════════════════════════════════════════════════════════════════════════

terraform {
  required_providers {
    hcloud = {
      source  = "hetznercloud/hcloud"
      version = "~> 1.45"
    }
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.0"
    }
  }
}

# ═══════════════════════════════════════════════════════════════════════════
# VARIABLES
# ═══════════════════════════════════════════════════════════════════════════

variable "region_name" {
  description = "Logical region identifier (e.g. eu-central, us-east, ap-south)"
  type        = string
}

variable "hcloud_location" {
  description = "Hetzner datacenter location code (nbg1, fsn1, ash, hel1, sin)"
  type        = string
}

variable "ssh_key_name" {
  description = "SSH key name in Hetzner Cloud"
  type        = string
}

variable "server_type" {
  description = "Hetzner server type"
  type        = string
  default     = "cx31"
}

variable "image" {
  description = "Server OS image"
  type        = string
  default     = "ubuntu-24.04"
}

variable "app_domain" {
  description = "Application domain (e.g. upscbyvarunsh.aimasteryedu.in)"
  type        = string
}

variable "cloudflare_zone_id" {
  description = "Cloudflare Zone ID"
  type        = string
}

variable "enabled" {
  description = "Set to false to skip provisioning this region without removing config"
  type        = bool
  default     = false
}

variable "environment" {
  description = "Environment label"
  type        = string
  default     = "production"
}

# ═══════════════════════════════════════════════════════════════════════════
# REGION SERVER
# ═══════════════════════════════════════════════════════════════════════════

resource "hcloud_server" "app" {
  count       = var.enabled ? 1 : 0
  name        = "upsc-${var.region_name}-app"
  server_type = var.server_type
  image       = var.image
  location    = var.hcloud_location
  ssh_keys    = [var.ssh_key_name]

  labels = {
    region      = var.region_name
    environment = var.environment
    app         = "upsc-prepx"
    managed_by  = "terraform"
  }

  user_data = <<-EOF
    #!/bin/bash
    set -e
    apt-get update -y
    apt-get install -y docker.io docker-compose curl
    systemctl enable docker
    systemctl start docker
    # App deployment via CI/CD — server is ready for docker-compose pull + up
  EOF
}

# ═══════════════════════════════════════════════════════════════════════════
# CLOUDFLARE LOAD BALANCING / GEO ROUTING
# ═══════════════════════════════════════════════════════════════════════════

resource "cloudflare_record" "app_region" {
  count   = var.enabled ? 1 : 0
  zone_id = var.cloudflare_zone_id
  name    = var.app_domain
  value   = hcloud_server.app[0].ipv4_address
  type    = "A"
  proxied = true
  comment = "UPSC PrepX ${var.region_name} — managed by Terraform"
}

# ═══════════════════════════════════════════════════════════════════════════
# OUTPUTS
# ═══════════════════════════════════════════════════════════════════════════

output "server_ip" {
  description = "Public IP of the region server"
  value       = var.enabled ? hcloud_server.app[0].ipv4_address : "disabled"
}

output "region_name" {
  value = var.region_name
}
