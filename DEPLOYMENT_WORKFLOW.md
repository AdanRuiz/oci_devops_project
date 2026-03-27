# Deployment Workflow

This is how we deploy updates to production on OCI.

| | Local dev | Production (K8s) |
|---|---|---|
| **Database** | `TODOUSER_DEV` (shared dev schema) | `TODOUSER` (prod schema) |
| **Telegram bot** | Your personal dev bot | `oci_cloud_devops_bot` (prod bot) |
| **Who deploys** | Anyone (runs locally) | Jozef only (via Cloud Shell) |

---

## Every time you want to deploy an update

### Step 1: Open OCI Cloud Shell

Go to OCI Console → click the Cloud Shell icon (top right). Make sure the architecture is set to **x86_64** (Actions → Architecture if you need to change it).

### Step 2: Go to the backend folder

```bash
cd reacttodo/oci_devops_project/MtdrSpring/backend
```

### Step 3: Pull latest changes

```bash
git pull
```

### Step 4: Build and push the Docker image

```bash
source build.sh
```

This runs Maven, builds the Docker image, and pushes it to OCI Container Registry. If it asks you to choose an openjdk image, pick the one from `docker.io`.

If you get a "not authorized" error on docker push:
```bash
docker login -u "$(state_get NAMESPACE)/$(state_get USER_NAME)" "$(state_get REGION).ocir.io"
# use an Auth Token as the password (OCI Console → Profile → Auth Tokens → Generate)
```

### Step 5: Deploy to Kubernetes

```bash
export TELEGRAM_BOT_TOKEN="prod-bot-token"  # the production bot, NOT your personal dev one
source deploy.sh
```

This updates the K8s deployment. Kubernetes will pull the new image and rolling-restart the pods automatically.

### Step 6: Verify it's running

```bash
pods      # check pods are Running (2/2)
services  # get the external IP of the load balancer
```

Open the external IP in your browser to confirm the frontend is up.

---

## Database schema changes

We use Hibernate with `ddl-auto=update`, which means **the database updates itself automatically** when the app restarts after a deploy. But there are limits:

| Type of change | What happens |
|----------------|-------------|
| Add a new table (new JPA entity) | Auto-created on next deploy |
| Add a new column (new field on entity) | Auto-added on next deploy |
| Rename a column | **NOT automatic** — requires manual SQL |
| Drop a column | **NOT automatic** — requires manual SQL |
| Change a column type | **NOT automatic** — requires manual SQL |

### For additive changes (new table / new column)

Just deploy normally — Hibernate handles it.

### For destructive changes (rename / drop / type change)

1. Test the SQL on the dev schema first (connect as `TODOUSER_DEV` in Database Actions):
```sql
-- example: rename a column
ALTER TABLE TODOITEM RENAME COLUMN OLD_NAME TO NEW_NAME;
```

2. Once confirmed working on dev, run the same SQL on prod (connect as `TODOUSER` in Database Actions):
```sql
ALTER TABLE TODOITEM RENAME COLUMN OLD_NAME TO NEW_NAME;
```

3. Then deploy the app code change normally (steps above).

> Always run schema changes on `TODOUSER_DEV` first and make sure the app works locally before touching `TODOUSER` (prod).

---

## If something goes wrong

**Pods crashing / not starting:**
```bash
kubectl logs -n mtdrworkshop <pod-name>
```

**Roll back to previous version:**
Re-run `build.sh` from the previous git commit, then `deploy.sh`.

**Full environment reset (last resort):**
```bash
source destroy.sh   # tears down all infra
source setup.sh     # rebuilds everything from scratch
```
Only do this if nothing else works.