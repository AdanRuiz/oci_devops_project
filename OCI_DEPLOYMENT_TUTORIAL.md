# OCI Deployment Tutorial

## Day to Day: Deploy a New Version

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

## Rebuild From Scratch

Use this section if the OKE cluster was deleted and needs to be fully recreated.

### Context

- OCI region: `mx-queretaro-1`, compartment: `reacttodo`
- The ATP database `reacttodonoq0x` already exists and must be reused — do NOT create a new one. OCI only allows one always-free ATP per tenancy and this one has the schema and data.
- The DB user is `TODOUSER` (cloud) vs `TODOUSER_DEV` (local dev only).
- Infrastructure is provisioned via Terraform (`MtdrSpring/terraform/`). The setup script is `MtdrSpring/setup.sh`, which calls `main-setup.sh` and runs Terraform in the background.
- **Known issue:** `main-setup.sh` always overwrites `MTDR_DB_NAME` with a generated value (`RUN_NAME + MTDR_KEY`), which produces a wrong alias like `reacttodoq80kr` instead of `reacttodonoq0x`. This must be fixed after setup.
- The K8s node pool must use shape `VM.Standard.E3.Flex` (not E4.Flex — quota issues) with Kubernetes version `v1.34.2`. Both cluster and node pool must be on the same version or node creation will fail.
- All app resources live in the `mtdrworkshop` namespace, not `default`. Always pass `-n mtdrworkshop` to kubectl commands.

### 1. Pre-set state before running setup

```bash
source ~/reacttodo/oracle-pm-project/MtdrSpring/utils/state-functions.sh
state_set MTDR_DB_NAME "reacttodonoq0x"
state_set MTDR_DB_OCID "<atp-ocid-from-oci-console>"
state_set TODO_USER "TODOUSER"
```

### 2. Run setup

```bash
cd ~/reacttodo/oracle-pm-project/MtdrSpring
source setup.sh
```

You will be prompted for:
- **DB password** — password for `TODOUSER` in the ATP (`None00010001`)
- **UI password** — frontend admin password (`None0001`)

### 3. If connection drops mid-setup

Check what state keys are missing and recreate the Kubernetes secrets manually:

```bash
ls ~/reacttodo/oracle-pm-project/MtdrSpring/state/

kubectl create secret generic dbuser --from-literal=dbpassword='None00010001' -n mtdrworkshop
kubectl create secret generic telegram-secret --from-literal=token='<bot-token>' -n mtdrworkshop
kubectl create secret generic frontendadmin --from-literal=password='None0001' -n mtdrworkshop

state_set_done DB_PASSWORD
state_set_done UI_PASSWORD
state_set_done SETUP_VERIFIED
```

### 4. Fix the DB_URL

After setup, `MTDR_DB_NAME` will be wrong. Fix it and patch the deployment:

```bash
state_set MTDR_DB_NAME "reacttodonoq0x"
kubectl set env deployment/todolistapp-springboot-deployment \
  -n mtdrworkshop DB_URL="jdbc:oracle:thin:@reacttodonoq0x_tp"
```

### 5. Create the database schema

`TODOUSER` is a fresh user with no tables. Create them via SQL Developer Web:

- OCI Console → ATP `reacttodonoq0x` → Database Actions → SQL
- Log in as `ADMIN` (password: `None0001`)
- Run in the SQL Worksheet:

```sql
ALTER SESSION SET CURRENT_SCHEMA = TODOUSER;
```

Then paste and execute `schema/schema.sql` followed by `schema/triggers.sql`.

### 6. Verify

```bash
kubectl get pods -n mtdrworkshop
curl http://<load-balancer-ip>/projects
```

---

## Useful Commands

```bash
kubectl get pods -n mtdrworkshop
kubectl logs -l app=todolistapp-springboot -n mtdrworkshop -f
kubectl get svc -n mtdrworkshop
```
