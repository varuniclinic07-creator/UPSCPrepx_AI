# ═══════════════════════════════════════════════════════════════
# TERRAFORM VARIABLES
# ═══════════════════════════════════════════════════════════════

# ═══════════════════════════════════════════════════════════════
# PROVIDER CREDENTIALS
# ═══════════════════════════════════════════════════════════════

variable "hcloud_token" {
  description = "Hetzner Cloud API token"
  type        = string
  sensitive   = true
}

variable "cloudflare_api_token" {
  description = "Cloudflare API token"
  type        = string
  sensitive   = true
}

variable "cloudflare_zone_id" {
  description = "Cloudflare Zone ID for your domain"
  type        = string
}

variable "ssh_key_name" {
  description = "Name of SSH key in Hetzner Cloud"
  type        = string
  default     = "upsc-master"
}

# ═══════════════════════════════════════════════════════════════
# ENVIRONMENT
# ═══════════════════════════════════════════════════════════════

variable "environment" {
  description = "Environment name (production, staging)"
  type        = string
  default     = "production"
}

variable "app_subdomain" {
  description = "Subdomain for the application"
  type        = string
  default     = "app"
}

# ═══════════════════════════════════════════════════════════════
# PRIMARY SERVER
# ═══════════════════════════════════════════════════════════════

variable "primary_server_type" {
  description = "Hetzner server type for primary"
  type        = string
  default     = "cx31"  # 2 vCPU, 8GB RAM, €11.90/mo
}

variable "primary_location" {
  description = "Primary datacenter location"
  type        = string
  default     = "nbg1"  # Nuremberg, Germany
}

# ═══════════════════════════════════════════════════════════════
# REPLICA SERVER (Disaster Recovery)
# ═══════════════════════════════════════════════════════════════

variable "enable_replica" {
  description = "Enable replica server for DR"
  type        = bool
  default     = true
}

variable "replica_server_type" {
  description = "Hetzner server type for replica"
  type        = string
  default     = "cx21"  # 2 vCPU, 4GB RAM, €5.93/mo
}

variable "replica_location" {
  description = "Replica datacenter (different from primary)"
  type        = string
  default     = "fsn1"  # Falkenstein, Germany
}

# ═══════════════════════════════════════════════════════════════
# WORKER NODES (Horizontal Scaling)
# ═══════════════════════════════════════════════════════════════

variable "worker_count" {
  description = "Number of worker nodes for BullMQ"
  type        = number
  default     = 0  # Start with 0, scale up as needed
}

variable "worker_server_type" {
  description = "Hetzner server type for workers"
  type        = string
  default     = "cx11"  # 1 vCPU, 2GB RAM, €4.15/mo
}

# ═══════════════════════════════════════════════════════════════
# LOAD BALANCER
# ═══════════════════════════════════════════════════════════════

variable "enable_load_balancer" {
  description = "Enable load balancer for HA"
  type        = bool
  default     = true
}

# ═══════════════════════════════════════════════════════════════
# STORAGE
# ═══════════════════════════════════════════════════════════════

variable "data_volume_size" {
  description = "Size of data volume in GB"
  type        = number
  default     = 100
}

# ═══════════════════════════════════════════════════════════════
# BACKUPS
# ═══════════════════════════════════════════════════════════════

variable "enable_automated_backups" {
  description = "Enable automated server snapshots"
  type        = bool
  default     = true
}

# ═══════════════════════════════════════════════════════════════
# SECURITY
# ═══════════════════════════════════════════════════════════════

variable "allowed_ssh_ips" {
  description = "IP addresses allowed for SSH access"
  type        = list(string)
  default     = ["0.0.0.0/0"]  # Restrict this in production!
}

# ═══════════════════════════════════════════════════════════════
# APPLICATION CONFIG
# ═══════════════════════════════════════════════════════════════

variable "docker_compose_url" {
  description = "URL to docker-compose.production.yml"
  type        = string
  default     = "https://raw.githubusercontent.com/your-repo/main/docker-compose.production.yml"
}

variable "env_content" {
  description = "Content of .env file"
  type        = string
  sensitive   = true
  default     = ""
}
