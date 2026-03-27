# Local Development Setup

Before you start, ask Jozef for:
- The `wallet-local/` folder (Oracle DB wallet files)
- The `TODOUSER_DEV` database password
- The DeepSeek API key (if we have one)

You'll create your **own** Telegram bot for local dev (see Step 4).

---

## Step 1: Clone the repo and copy the build script

```bash
cd MtdrSpring/backend
cp build-local.sh.template build-local.sh
chmod +x build-local.sh
```

`build-local.sh` is gitignored so credentials stay local.

---

## Step 2: Add the wallet

Place the `wallet-local/` folder Jozef gave you inside `MtdrSpring/backend/`:

```
MtdrSpring/backend/wallet-local/    <- should be here
```

---

## Step 3: Fill in `build-local.sh`

Open `MtdrSpring/backend/build-local.sh` and set:

```bash
DB_USER="TODOUSER_DEV"
DB_PASSWORD="ask Jozef"
DB_URL="ask Jozef
```

---

## Step 4: Create your own Telegram dev bot

Each developer needs their own bot for local dev — we can't share the prod bot since only one instance can run at a time.

1. Open Telegram → search for `@BotFather` → send `/newbot`
2. Give it any name, e.g. `yourname_todo_dev_bot`
3. Copy the token BotFather gives you

Then create your `.env`:

```bash
cd MtdrSpring/backend
cp .env.template .env
```

Open `.env` and fill in:

```env
TELEGRAM_BOT_TOKEN=your-personal-dev-bot-token
TELEGRAM_BOT_NAME=yourname_todo_dev_bot
DEEPSEEK_API_KEY=sk-your-deepseek-key-here
```

`DEEPSEEK_API_KEY` can be left as-is if we don't have a key yet.

---

## Step 5: Build and run

```bash
cd MtdrSpring/backend
./build-local.sh
```

Then start the container:

```bash
docker stop todolistapp 2>/dev/null; docker rm todolistapp 2>/dev/null
docker run -d --name todolistapp -p 8080:8080 --env-file .env todolistapp-springboot:local
```

Open **http://localhost:8080**.

The app connects to a shared dev database (`TODOUSER_DEV`) that is separate from production, so feel free to add/delete data without worrying.

---

## Accessing the dev database directly (optional)

If you want to run SQL against `TODOUSER_DEV` directly (useful for testing schema changes or inspecting data), you don't need an OCI account. Just use Database Actions:

1. Ask Jozef for the Database Actions URL (looks like `https://xxxxx.adb.region.oraclecloudapps.com/ords/sql-developer`)
2. Log in with:
   - Username: `TODOUSER_DEV`
   - Password: ask Jozef
3. Run whatever SQL you need — it's the dev schema so nothing here affects production

---

## Note on deployments

Production deploys to Kubernetes are handled by Jozef only.