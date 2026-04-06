# ═══════════════════════════════════════════════════════════════
# TERRAFORM OUTPUTS
# ═══════════════════════════════════════════════════════════════

# ═══════════════════════════════════════════════════════════════
# SERVER IPs
# ═══════════════════════════════════════════════════════════════

output "primary_ip" {
  description = "Public IP of primary server"
  value       = hcloud_server.primary.ipv4_address
}

output "primary_private_ip" {
  description = "Private IP of primary server"
  value       = "10.0.1.10"
}

output "replica_ip" {
  description = "Public IP of replica server"
  value       = var.enable_replica ? hcloud_server.replica[0].ipv4_address : null
}

output "worker_ips" {
  description = "Public IPs of worker nodes"
  value       = [for w in hcloud_server.workers : w.ipv4_address]
}

# ═══════════════════════════════════════════════════════════════
# LOAD BALANCER
# ═══════════════════════════════════════════════════════════════

output "load_balancer_ip" {
  description = "Load balancer public IP"
  value       = var.enable_load_balancer ? hcloud_load_balancer.app[0].ipv4 : null
}

# ═══════════════════════════════════════════════════════════════
# APPLICATION URL
# ═══════════════════════════════════════════════════════════════

output "app_url" {
  description = "Application URL"
  value       = "https://${var.app_subdomain}.${var.cloudflare_zone_id}"
}

# ═══════════════════════════════════════════════════════════════
# SSH COMMANDS
# ═══════════════════════════════════════════════════════════════

output "ssh_primary" {
  description = "SSH command for primary server"
  value       = "ssh root@${hcloud_server.primary.ipv4_address}"
}

output "ssh_replica" {
  description = "SSH command for replica server"
  value       = var.enable_replica ? "ssh root@${hcloud_server.replica[0].ipv4_address}" : null
}

# ═══════════════════════════════════════════════════════════════
# COST ESTIMATE
# ═══════════════════════════════════════════════════════════════

output "estimated_monthly_cost" {
  description = "Estimated monthly cost in EUR"
  value = {
    primary      = "€11.90"
    replica      = var.enable_replica ? "€5.93" : "€0"
    workers      = "€${var.worker_count * 4.15}"
    load_balancer = var.enable_load_balancer ? "€5.83" : "€0"
    volume       = "€${var.data_volume_size * 0.0476}"
    total        = "~€${11.90 + (var.enable_replica ? 5.93 : 0) + (var.worker_count * 4.15) + (var.enable_load_balancer ? 5.83 : 0) + (var.data_volume_size * 0.0476)}"
  }
}
