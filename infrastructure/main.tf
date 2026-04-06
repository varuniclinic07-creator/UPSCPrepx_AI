# ═══════════════════════════════════════════════════════════════
# UPSC CSE MASTER - TERRAFORM MAIN CONFIGURATION
# Multi-VPS Infrastructure with Disaster Recovery
# ═══════════════════════════════════════════════════════════════

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    # Hetzner Cloud - Cost-effective VPS provider
    hcloud = {
      source  = "hetznercloud/hcloud"
      version = "~> 1.45"
    }

    # Cloudflare for DNS and Load Balancing
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.0"
    }

    # Random for generating unique identifiers
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
  }

  # Remote state backend (use Terraform Cloud or S3)
  backend "local" {
    path = "terraform.tfstate"
  }
}

# ═══════════════════════════════════════════════════════════════
# PROVIDERS
# ═══════════════════════════════════════════════════════════════

provider "hcloud" {
  token = var.hcloud_token
}

provider "cloudflare" {
  api_token = var.cloudflare_api_token
}

# ═══════════════════════════════════════════════════════════════
# DATA SOURCES
# ═══════════════════════════════════════════════════════════════

data "hcloud_ssh_key" "default" {
  name = var.ssh_key_name
}

# ═══════════════════════════════════════════════════════════════
# NETWORK - Private Network for Internal Communication
# ═══════════════════════════════════════════════════════════════

resource "hcloud_network" "upsc_network" {
  name     = "upsc-network"
  ip_range = "10.0.0.0/16"
}

resource "hcloud_network_subnet" "upsc_subnet" {
  network_id   = hcloud_network.upsc_network.id
  type         = "cloud"
  network_zone = "eu-central"
  ip_range     = "10.0.1.0/24"
}

# ═══════════════════════════════════════════════════════════════
# PRIMARY VPS - Main Application Server
# ═══════════════════════════════════════════════════════════════

resource "hcloud_server" "primary" {
  name        = "upsc-primary"
  server_type = var.primary_server_type  # cx31 = 2 vCPU, 8GB RAM
  image       = "ubuntu-22.04"
  location    = var.primary_location     # nbg1 = Nuremberg

  ssh_keys = [data.hcloud_ssh_key.default.id]

  labels = {
    environment = var.environment
    role        = "primary"
    project     = "upsc-master"
  }

  user_data = templatefile("${path.module}/scripts/cloud-init-primary.yaml", {
    docker_compose_url = var.docker_compose_url
    env_content        = var.env_content
  })

  network {
    network_id = hcloud_network.upsc_network.id
    ip         = "10.0.1.10"
  }

  depends_on = [hcloud_network_subnet.upsc_subnet]
}

# ═══════════════════════════════════════════════════════════════
# REPLICA VPS - Disaster Recovery / Read Replica
# ═══════════════════════════════════════════════════════════════

resource "hcloud_server" "replica" {
  count = var.enable_replica ? 1 : 0

  name        = "upsc-replica"
  server_type = var.replica_server_type  # cx21 = 2 vCPU, 4GB RAM
  image       = "ubuntu-22.04"
  location    = var.replica_location     # fsn1 = Falkenstein (different DC)

  ssh_keys = [data.hcloud_ssh_key.default.id]

  labels = {
    environment = var.environment
    role        = "replica"
    project     = "upsc-master"
  }

  user_data = templatefile("${path.module}/scripts/cloud-init-replica.yaml", {
    primary_ip         = hcloud_server.primary.ipv4_address
    docker_compose_url = var.docker_compose_url
  })

  network {
    network_id = hcloud_network.upsc_network.id
    ip         = "10.0.1.20"
  }

  depends_on = [hcloud_network_subnet.upsc_subnet, hcloud_server.primary]
}

# ═══════════════════════════════════════════════════════════════
# WORKER NODES - Horizontal Scaling for BullMQ
# ═══════════════════════════════════════════════════════════════

resource "hcloud_server" "workers" {
  count = var.worker_count

  name        = "upsc-worker-${count.index + 1}"
  server_type = var.worker_server_type  # cx11 = 1 vCPU, 2GB RAM
  image       = "ubuntu-22.04"
  location    = var.primary_location

  ssh_keys = [data.hcloud_ssh_key.default.id]

  labels = {
    environment = var.environment
    role        = "worker"
    project     = "upsc-master"
    worker_id   = tostring(count.index + 1)
  }

  user_data = templatefile("${path.module}/scripts/cloud-init-worker.yaml", {
    redis_url    = "redis://10.0.1.10:6379"
    primary_ip   = hcloud_server.primary.ipv4_address
    worker_id    = count.index + 1
  })

  network {
    network_id = hcloud_network.upsc_network.id
    ip         = "10.0.1.${30 + count.index}"
  }

  depends_on = [hcloud_network_subnet.upsc_subnet, hcloud_server.primary]
}

# ═══════════════════════════════════════════════════════════════
# LOAD BALANCER - Distributes traffic across app servers
# ═══════════════════════════════════════════════════════════════

resource "hcloud_load_balancer" "app" {
  count = var.enable_load_balancer ? 1 : 0

  name               = "upsc-lb"
  load_balancer_type = "lb11"
  location           = var.primary_location

  labels = {
    environment = var.environment
    project     = "upsc-master"
  }
}

resource "hcloud_load_balancer_target" "primary" {
  count = var.enable_load_balancer ? 1 : 0

  type             = "server"
  load_balancer_id = hcloud_load_balancer.app[0].id
  server_id        = hcloud_server.primary.id
  use_private_ip   = true
}

resource "hcloud_load_balancer_target" "replica" {
  count = var.enable_load_balancer && var.enable_replica ? 1 : 0

  type             = "server"
  load_balancer_id = hcloud_load_balancer.app[0].id
  server_id        = hcloud_server.replica[0].id
  use_private_ip   = true
}

resource "hcloud_load_balancer_service" "https" {
  count = var.enable_load_balancer ? 1 : 0

  load_balancer_id = hcloud_load_balancer.app[0].id
  protocol         = "https"
  listen_port      = 443
  destination_port = 3000

  http {
    sticky_sessions = true
    cookie_name     = "UPSC_LB"
    cookie_lifetime = 300
  }

  health_check {
    protocol = "http"
    port     = 3000
    interval = 15
    timeout  = 10
    retries  = 3
    http {
      path         = "/api/health"
      status_codes = ["2??", "3??"]
    }
  }
}

# ═══════════════════════════════════════════════════════════════
# CLOUDFLARE DNS
# ═══════════════════════════════════════════════════════════════

resource "cloudflare_record" "app" {
  zone_id = var.cloudflare_zone_id
  name    = var.app_subdomain
  type    = "A"
  value   = var.enable_load_balancer ? hcloud_load_balancer.app[0].ipv4 : hcloud_server.primary.ipv4_address
  proxied = true
  ttl     = 1  # Auto when proxied
}

# ═══════════════════════════════════════════════════════════════
# VOLUMES - Persistent Storage
# ═══════════════════════════════════════════════════════════════

resource "hcloud_volume" "data" {
  name     = "upsc-data"
  size     = var.data_volume_size
  location = var.primary_location

  labels = {
    environment = var.environment
    project     = "upsc-master"
  }
}

resource "hcloud_volume_attachment" "data" {
  volume_id = hcloud_volume.data.id
  server_id = hcloud_server.primary.id
  automount = true
}

# ═══════════════════════════════════════════════════════════════
# BACKUPS - Automated Snapshots
# ═══════════════════════════════════════════════════════════════

resource "hcloud_snapshot" "primary_backup" {
  count = var.enable_automated_backups ? 1 : 0

  server_id   = hcloud_server.primary.id
  description = "Automated backup - ${timestamp()}"

  labels = {
    type   = "automated"
    server = "primary"
  }
}

# ═══════════════════════════════════════════════════════════════
# FIREWALL
# ═══════════════════════════════════════════════════════════════

resource "hcloud_firewall" "app" {
  name = "upsc-firewall"

  # SSH
  rule {
    direction  = "in"
    protocol   = "tcp"
    port       = "22"
    source_ips = var.allowed_ssh_ips
  }

  # HTTP
  rule {
    direction  = "in"
    protocol   = "tcp"
    port       = "80"
    source_ips = ["0.0.0.0/0", "::/0"]
  }

  # HTTPS
  rule {
    direction  = "in"
    protocol   = "tcp"
    port       = "443"
    source_ips = ["0.0.0.0/0", "::/0"]
  }

  # Internal network - all traffic
  rule {
    direction  = "in"
    protocol   = "tcp"
    port       = "any"
    source_ips = ["10.0.0.0/16"]
  }
}

resource "hcloud_firewall_attachment" "primary" {
  firewall_id = hcloud_firewall.app.id
  server_ids  = [hcloud_server.primary.id]
}
