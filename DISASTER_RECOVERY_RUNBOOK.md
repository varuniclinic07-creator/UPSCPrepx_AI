# 🚨 DISASTER RECOVERY RUNBOOK

## UPSC CSE Master - DR Procedures

**Last Updated**: January 15, 2026  
**RTO**: 15 minutes | **RPO**: 6 hours

---

## 📋 Quick Reference

| Scenario            | RTO    | RPO    | Procedure                                        |
| ------------------- | ------ | ------ | ------------------------------------------------ |
| Primary Server Down | 15 min | 6 hrs  | [Promote Replica](#1-primary-server-failure)     |
| Database Corruption | 30 min | 24 hrs | [Restore from Backup](#2-database-restore)       |
| Full DC Outage      | 15 min | 6 hrs  | [Failover to Replica](#1-primary-server-failure) |
| Ransomware Attack   | 2 hrs  | 24 hrs | [Clean Restore](#3-ransomware-recovery)          |

---

## 🔴 1. Primary Server Failure

### Detection
- Health check fails: `curl https://app.yourdomain.com/api/health`
- Uptime monitor alerts (UptimeRobot/Pingdom)
- Load balancer reports unhealthy target

### Recovery Steps

```bash
# 1. SSH to replica server
ssh root@REPLICA_IP

# 2. Run promotion script
/opt/upsc-master/scripts/promote-to-primary.sh

# 3. Update DNS (automatic if using Cloudflare load balancer)
# Or manually update A record to point to replica IP

# 4. Verify services
curl http://localhost:3000/api/health

# 5. Monitor for 30 minutes
docker logs -f upsc-app
```

### Post-Recovery
1. ✅ Notify team of incident
2. ✅ Investigate primary server failure
3. ✅ Provision new replica server
4. ✅ Update Terraform state
5. ✅ Document incident in post-mortem

---

## 🔵 2. Database Restore

### From Daily Backup

```bash
# 1. List available backups
ls -la /opt/upsc-master/backups/

# 2. Stop the application
docker-compose down

# 3. Restore PostgreSQL
docker run --rm -v postgres_data:/data \
  -v /opt/upsc-master/backups:/backups \
  postgres:15 \
  pg_restore -d upsc_db /backups/postgres_YYYYMMDD.dump

# 4. Restart application
docker-compose up -d

# 5. Verify data integrity
docker exec upsc-postgres psql -U postgres -d upsc_db -c "SELECT COUNT(*) FROM users;"
```

### From Hetzner Snapshot

```bash
# 1. Stop current server (via Hetzner console)
# 2. Create new server from snapshot
# 3. Update DNS to new server IP
# 4. Verify services
```

---

## 🟣 3. Ransomware Recovery

### Isolation

```bash
# 1. Immediately disconnect from network
# Run from Hetzner console (out-of-band access)
ufw deny all

# 2. Document current state
docker ps -a > /tmp/container_state.txt
ls -la /opt/upsc-master/ > /tmp/filesystem_state.txt
```

### Clean Recovery

```bash
# 1. Provision new server from CLEAN image
terraform apply -target=hcloud_server.primary -var="image=ubuntu-22.04"

# 2. Restore from VERIFIED backup (scan first)
clamscan -r /opt/upsc-master/backups/

# 3. Restore only database (not application files)
pg_restore --clean /backups/postgres_CLEAN.dump

# 4. Redeploy application from Git
git clone https://github.com/your-org/upsc-master.git
docker-compose up -d
```

---

## 📊 4. Scaling Procedures

### Add Worker Nodes

```bash
# 1. Update worker count in terraform.tfvars
worker_count = 2

# 2. Apply changes
terraform plan
terraform apply

# 3. Verify workers connected to Redis
docker exec upsc-redis redis-cli -a $REDIS_PASSWORD CLIENT LIST
```

### Horizontal App Scaling

```bash
# 1. Enable load balancer (if not already)
enable_load_balancer = true

# 2. Enable replica as active node
enable_replica = true

# 3. Apply and verify
terraform apply
curl -I https://app.yourdomain.com
```

---

## 🔧 5. Terraform Commands

```bash
# Initialize (first time)
cd infrastructure/
terraform init

# Plan changes
terraform plan -var-file=terraform.tfvars

# Apply changes
terraform apply -var-file=terraform.tfvars

# Destroy (DANGER!)
terraform destroy -var-file=terraform.tfvars

# Import existing server
terraform import hcloud_server.primary SERVER_ID

# Refresh state
terraform refresh
```

---

## 📞 Contact & Escalation

| Level | Contact          | When           |
| ----- | ---------------- | -------------- |
| L1    | On-call Engineer | First response |
| L2    | DevOps Lead      | >15 min outage |
| L3    | CTO              | >1 hour outage |

---

## ✅ Recovery Checklist

- [ ] Incident detected and logged
- [ ] Team notified
- [ ] Customers notified (if >5 min)
- [ ] Recovery procedure executed
- [ ] Services verified working
- [ ] DNS propagation confirmed
- [ ] Monitoring alerts cleared
- [ ] Post-mortem scheduled
- [ ] Infrastructure restored to HA state
