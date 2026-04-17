# OCI Deployment Tutorial
## Oracle PM Tool — Cloud-Native Deployment on OKE

This guide covers a full deployment of the Oracle PM Tool to Oracle Cloud Infrastructure
using OKE (Kubernetes), OCIR (Container Registry), and an existing ATP database.

---

## Prerequisites (one-time, already done)

- OCI tenancy with compartment `reacttodo` (region: `mx-queretaro-1`)
- Existing ATP database `reacttodonoq0x` with wallet downloaded
- OCI CLI configured in Cloud Shell
- Docker registry credentials (Auth Token) created in OCI Console
- Terraform installed in Cloud Shell (comes pre-installed)
- `kubectl` configured pointing to the OKE cluster

---

## Infrastructure Setup (one-time, via Terraform)

> Skip this section if the OKE cluster already exists.

### 1. Set state variables before running setup

In Cloud Shell, before sourcing `setup.sh`, pre-set these state variables to reuse
the existing ATP instead of creating a new one:

```bash
source ~/reacttodo/oracle-pm-project/MtdrSpring/utils/state-functions.sh
state_set MTDR_DB_NAME "reacttodonoq0x"
state_set MTDR_DB_OCID "<your-atp-ocid>"
state_set TODO_USER "TODOUSER"          # skip user creation prompt
```

> **Why:** `main-setup.sh` overwrites `MTDR_DB_NAME` with `RUN_NAME + MTDR_KEY`,
> producing a wrong alias. Pre-setting prevents this and tells db-setup.sh to skip
> ATP creation.

### 2. Run setup

```bash
cd ~/reacttodo/oracle-pm-project/MtdrSpring
source setup.sh
```

During setup you will be prompted for:
- **DB password** — password for `TODOUSER` in the ATP (e.g. `None00010001`)
- **UI password** — admin password for the frontend (e.g. `None0001`)

### 3. If you lose connection mid-setup

Check which state keys are missing:

```bash
ls ~/reacttodo/oracle-pm-project/MtdrSpring/state/
```

Manually create missing Kubernetes secrets and mark state as done:

```bash
# DB password secret
kubectl create secret generic dbuser \
  --from-literal=dbpassword='None00010001' -n mtdrworkshop

# Telegram bot secret
kubectl create secret generic telegram-secret \
  --from-literal=token='<your-bot-token>' -n mtdrworkshop

# Frontend admin secret
kubectl create secret generic frontendadmin \
  --from-literal=password='None0001' -n mtdrworkshop

# Mark missing state as done
state_set_done DB_PASSWORD
state_set_done UI_PASSWORD
state_set_done SETUP_VERIFIED
```

---

## Database Schema Setup (one-time)

The app uses `TODOUSER` in the ATP. Tables must be created manually — Hibernate
is set to `ddl-auto=none`.

### 1. Connect to the ATP via SQL Developer Web

- Open the ATP in OCI Console → Database Actions → SQL
- Log in as `ADMIN` (password set during ATP creation, e.g. `None0001`)

### 2. Run the schema

In the SQL Worksheet, set the schema context and run both SQL files:

```sql
ALTER SESSION SET CURRENT_SCHEMA = TODOUSER;
```

Then paste and run the contents of:
- `schema/schema.sql` — all tables
- `schema/triggers.sql` — all triggers

### 3. Verify

```sql
SELECT table_name FROM all_tables WHERE owner = 'TODOUSER' ORDER BY 1;
```

---

## Fix DB_URL After Setup (one-time)

`main-setup.sh` sets `MTDR_DB_NAME` to a generated name. Fix it before deploying:

```bash
source ~/reacttodo/oracle-pm-project/MtdrSpring/utils/state-functions.sh
state_set MTDR_DB_NAME "reacttodonoq0x"
```

Then patch the running deployment directly (if already deployed):

```bash
kubectl set env deployment/todolistapp-springboot-deployment \
  -n mtdrworkshop \
  DB_URL="jdbc:oracle:thin:@reacttodonoq0x_tp"
```

---

## Deploying a New Version

### On your local machine

```bash
git pull origin main
# make your code changes
git add .
git commit -m "your message"
git push origin main
```

### In Cloud Shell

```bash
cd ~/reacttodo/oracle-pm-project
git pull origin main
cd MtdrSpring/backend
. build.sh
. deploy.sh
kubectl rollout restart deployment/todolistapp-springboot-deployment -n mtdrworkshop
kubectl rollout status deployment/todolistapp-springboot-deployment -n mtdrworkshop
```

> `build.sh` runs Maven, builds the Docker image, and pushes it to OCIR.
> `deploy.sh` substitutes placeholders in the K8s YAML and applies it.
> The rollout restart is needed because the image tag (`0.1`) doesn't change between
> deploys, so Kubernetes needs to be told to re-pull it.

### Verify the deployment

```bash
kubectl get pods -n mtdrworkshop
kubectl logs -l app=todolistapp-springboot -n mtdrworkshop --tail=20
curl http://160.34.211.215/projects
```

App is available at: **http://160.34.211.215**

---

## Key Kubernetes Commands

```bash
# All pods across namespaces
kubectl get pods --all-namespaces

# App pods only
kubectl get pods -n mtdrworkshop

# Live logs
kubectl logs -l app=todolistapp-springboot -n mtdrworkshop -f

# Check services / external IP
kubectl get svc -n mtdrworkshop

# Force env var update
kubectl set env deployment/todolistapp-springboot-deployment -n mtdrworkshop KEY=VALUE

# Force rolling restart
kubectl rollout restart deployment/todolistapp-springboot-deployment -n mtdrworkshop
```

---

## Known Gotchas

| Issue | Cause | Fix |
|-------|-------|-----|
| `ORA-12154: Cannot find alias reacttodoq80kr_tp` | `main-setup.sh` overwrites `MTDR_DB_NAME` | `state_set MTDR_DB_NAME "reacttodonoq0x"` + `kubectl set env ...` |
| `ORA-00942: table or view does not exist` | Schema not created in `TODOUSER` | Run `schema.sql` + `triggers.sql` as ADMIN in SQL Developer Web |
| `deploy.sh` shows `unchanged` but deployment missing | Namespace mismatch — resources are in `mtdrworkshop` | Use `-n mtdrworkshop` on all `kubectl` commands |
| Node pool stuck `Creating` for 30+ min | E4.Flex shape quota exceeded or K8s version mismatch | Use `VM.Standard.E3.Flex` with K8s `v1.34.2` |
| Auth token creation failed | Max 2 auth tokens per user | Delete an old token in OCI Console → Profile → Auth Tokens |
| Telegram bot errors in logs | Bot token shared with local dev instance | Expected — stop the local app or use a separate bot token for prod |

---

## Infrastructure Details

| Resource | Value |
|----------|-------|
| Region | `mx-queretaro-1` |
| Compartment | `reacttodo` |
| ATP Database | `reacttodonoq0x` |
| DB User | `TODOUSER` |
| OKE Cluster | `mtdrworkshopcluster-*` |
| Node Shape | `VM.Standard.E3.Flex` (2 OCPUs, 6 GB) |
| Node Count | 3 |
| K8s Version | `v1.34.2` |
| K8s Namespace | `mtdrworkshop` |
| Load Balancer IP | `160.34.211.215` |
| Image Tag | `<ocir-region>.ocir.io/<tenancy>/<repo>/todolistapp-springboot:0.1` |
