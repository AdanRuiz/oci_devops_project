# OCI Deployment Tutorial

## Deploy a New Version

**Local:**
```bash
git pull origin main
# make changes
git add . && git commit -m "message" && git push origin main
```

**Cloud Shell:**
```bash
cd ~/reacttodo/oracle-pm-project && git pull origin main
cd MtdrSpring/backend
. build.sh
. deploy.sh
kubectl rollout restart deployment/todolistapp-springboot-deployment -n mtdrworkshop
kubectl rollout status deployment/todolistapp-springboot-deployment -n mtdrworkshop
```

---

## First-Time Infrastructure Setup (OKE cluster from scratch)

### 1. Pre-set state to reuse existing ATP

```bash
source ~/reacttodo/oracle-pm-project/MtdrSpring/utils/state-functions.sh
state_set MTDR_DB_NAME "reacttodonoq0x"
state_set MTDR_DB_OCID "<your-atp-ocid>"
state_set TODO_USER "TODOUSER"
```

### 2. Run setup

```bash
cd ~/reacttodo/oracle-pm-project/MtdrSpring
source setup.sh
```

Prompts: **DB password** (`None00010001`), **UI password** (`None0001`)

### 3. If connection drops mid-setup

```bash
# Check what's missing
ls ~/reacttodo/oracle-pm-project/MtdrSpring/state/

# Recreate missing secrets manually
kubectl create secret generic dbuser --from-literal=dbpassword='None00010001' -n mtdrworkshop
kubectl create secret generic telegram-secret --from-literal=token='<bot-token>' -n mtdrworkshop
kubectl create secret generic frontendadmin --from-literal=password='None0001' -n mtdrworkshop

state_set_done DB_PASSWORD
state_set_done UI_PASSWORD
state_set_done SETUP_VERIFIED
```

### 4. Fix DB_URL (setup always generates a wrong name)

```bash
state_set MTDR_DB_NAME "reacttodonoq0x"
kubectl set env deployment/todolistapp-springboot-deployment \
  -n mtdrworkshop DB_URL="jdbc:oracle:thin:@reacttodonoq0x_tp"
```

### 5. Create the database schema

- OCI Console → ATP `reacttodonoq0x` → Database Actions → SQL
- Log in as `ADMIN`
- Run:

```sql
ALTER SESSION SET CURRENT_SCHEMA = TODOUSER;
```

Then paste and execute `schema/schema.sql` and `schema/triggers.sql`.

---

## Useful Commands

```bash
kubectl get pods -n mtdrworkshop
kubectl logs -l app=todolistapp-springboot -n mtdrworkshop -f
kubectl get svc -n mtdrworkshop
```

---

## Infrastructure

| | |
|---|---|
| Region | `mx-queretaro-1` |
| Compartment | `reacttodo` |
| ATP | `reacttodonoq0x` / user `TODOUSER` |
| Node shape | `VM.Standard.E3.Flex` — 2 OCPUs, 6 GB |
| K8s version | `v1.34.2` |
| Namespace | `mtdrworkshop` |
