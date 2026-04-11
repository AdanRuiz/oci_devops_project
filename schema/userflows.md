# User flows — Cloud-Native Project Management Tool

## Overview

The system supports three distinct user types, each with a different set of goals and interaction patterns. All users authenticate through OCI IAM before accessing any functionality. The Telegram bot provides an alternative interaction channel for developers and project managers without requiring a web login for routine updates.

---

## Flow 1: Developer daily flow

The most frequent flow in the system. Repeats multiple times per day per developer.

### Prerequisites
- User has an active OCI IAM account
- User has linked their Telegram account (see Flow 4)
- User has been added to at least one project as a member

### Steps

1. **Open web app** — Browser redirects to the OCI IAM hosted login page via OIDC.
2. **Authenticate** — User enters credentials. On success, a JWT is issued and injected into the web session.
3. **View dashboard** — User lands on the personal dashboard showing open tasks, sprint health, blocked items, and average cycle time for the current sprint.
4. **Open Kanban board** — User navigates to the board and drags their task card from `TODO` to `IN_PROGRESS`. A row is written to `task_state_history` with `source = 'WEB'`.
5. **Work on task** — Developer works outside the system.
6. **Log work day** — At standup or end of day, the developer logs a day (or half day) of effort against the task via `task_work_log`.
7. **Update status via Telegram bot** — When work is done or the task hits a problem, the developer sends a natural language message from their phone. The bot uses Gemini to parse the intent, confirms via inline keyboard, and updates the task. A row is written to `task_state_history` with `source = 'TELEGRAM'`.
8. **Repeat** — The developer picks up the next task and the loop continues.

### Outcomes
- Task status updated in the database
- `task_state_history` records each transition with source and timestamp
- `task_work_log` accumulates effort days for KPI-O1
- `entered_in_progress_at` and `completed_at` timestamps feed KPI-P1 (average cycle time)

---

## Flow 2: Blocked task flow

A sub-flow of the developer daily flow, triggered when a task cannot proceed.

### Prerequisites
- Task is currently `IN_PROGRESS`
- Developer has hit a dependency they cannot resolve themselves

### Steps

1. **Signal the block** — Developer either drags the Kanban card to the `BLOCKED` column on the web dashboard, or sends a message to the Telegram bot such as "TS-1046 is blocked, waiting on Gemini API key."
2. **Bot confirmation** — If via Telegram, the bot presents an inline keyboard asking the developer to confirm before committing the change (UR-4 error prevention).
3. **System records the block** — `task.blocked_at` is set. A row is appended to `task_state_history` with `to_status = 'BLOCKED'`.
4. **PM visibility** — The blocked task immediately surfaces on the project manager's dashboard via KPI-V3 with a live days-blocked counter.
5. **Wait or escalate** — The developer waits for the dependency to be resolved. If it persists, the PM escalates.
6. **Blocker resolved** — The developer moves the task back to `IN_PROGRESS` via web or Telegram. Another row is written to `task_state_history` with `to_status = 'IN_PROGRESS'`.
7. **Resolution time recorded** — KPI-V1 calculates the duration between the `BLOCKED` and subsequent `IN_PROGRESS` entries in `task_state_history`. This handles multiple block/unblock cycles correctly.

### Outcomes
- Blocker is visible to the PM immediately, not at end-of-sprint retrospective
- Each block/unblock cycle is individually recorded in `task_state_history`
- KPI-V1 (average blocker resolution time) is updated
- `rework_count` on the task does **not** increment — that only applies when a task moves backward from `DONE`

---

## Flow 3: Project manager flow

Focused on project setup, sprint management, and visibility. Repeats at the start of each sprint and throughout the sprint for monitoring.

### Prerequisites
- User has `PROJECT_MANAGER` role in OCI IAM
- At least one project exists or the PM is creating a new one

### Steps

1. **Login via OCI IAM** — Same OIDC authentication as developers.
2. **Create project** — PM creates a new project with a name, description, and adds team members. Each member gets a row in `project_member` with their assigned project role.
3. **Define sprint** — PM sets the sprint name, start date, and end date. `planned_task_count` is auto-populated by the system to reflect the number of tasks already linked to the sprint when it transitions to `ACTIVE`. Tasks added after that point count as scope creep.
4. **Create and assign tasks** — PM creates tasks with title, description, priority, and assignee. Each task is linked to the project and sprint.
5. **Monitor KPI dashboard** — Throughout the sprint, the PM watches the dashboard for cycle time trends, aging WIP (KPI-V2), and live blocked tasks (KPI-V3).
6. **Query bot for summary** — The PM can message the Telegram bot with natural language queries such as "how is Sprint 3 looking?" The bot uses Gemini to summarise sprint health from the database and returns a formatted response.
7. **Close sprint** — At sprint end, the PM archives the sprint. The system calculates all KPIs and writes them to `sprint_kpi_snapshot`, preserving the numbers permanently even after the 1-year data purge.
8. **Start next sprint** — The loop repeats with a new sprint definition.

### Outcomes
- Sprint structure and task assignments created in the database
- KPI dashboard reflects real-time team performance
- `sprint_kpi_snapshot` is populated on sprint close with all obligatory and standard KPIs
- Historical trend data available for KPI-T1 and KPI-T2 (20% improvement verification)

---

## Flow 4: Telegram account linking (one-time setup)

Must be completed before a user can interact with the Telegram bot. Done once per user.

### Prerequisites
- User is logged into the web app
- User has an active Telegram account

### Steps

1. **Request link code** — User navigates to their Profile page in the web app and requests a Telegram link code. If an active (unused) code already exists for this user it is marked `used = 1` before the new one is created — only one active code per user is permitted at a time. The new code is stored in `telegram_link_code` with an expiry timestamp and `used = 0`.
2. **Send code to bot** — User opens Telegram, finds the project bot, and sends `/link 482931` (or whichever code was generated).
3. **Bot validates the code** — The bot looks up the code in `telegram_link_code`, checks it has not expired and has not been used.
4. **On failure** — If the code is expired or already used, the bot replies with an error and the user must request a new code from the web app.
5. **On success** — The bot saves the user's Telegram `chat_id` to `user.telegram_chat_id`. The code row is marked `used = 1` to prevent replay attacks.
6. **Bot is ready** — From this point on, any message from this Telegram account is matched to the user's identity and all bot commands are available.

### Outcomes
- `user.telegram_chat_id` populated
- `telegram_link_code.used` set to `1`
- `bot_conversation` row created on first bot interaction, persisting Gemini message history for conversational context

---

## Flow 5: DevOps / infrastructure flow

Performed by the DevOps engineer to deploy, update, and maintain the system. Not a day-to-day flow — triggered on sprint deployments and infrastructure changes.

### Prerequisites
- Access to the OCI tenancy and the project's Terraform repository
- `kubectl` configured with the OKE kubeconfig
- OCI CLI authenticated

### Steps

1. **Provision infrastructure** — Run Terraform scripts to create or update the OCI VCN, OKE cluster, API Gateway, and ATP database instance. No manual console interaction is permitted (DC-4).
2. **Initialise database credentials** — Download the Oracle Cloud Wallet for the target environment and inject it as a Kubernetes Secret. Spring Boot microservices cannot start without it.
3. **Configure environment variables** — Set OCI tenancy identifiers, Gemini API key, Telegram bot token, and CORS/OIDC URIs via Kubernetes ConfigMaps and OCI Vault secrets.
4. **Trigger CI/CD pipeline** — Commit triggers the automated pipeline which runs unit tests, builds Docker images, pushes to OCI Container Registry, and deploys to OKE. No manual image pushes are permitted (DC-4).
5. **Register Telegram webhook** — On first deployment or after URL changes, send a one-time HTTP request to the Telegram Bot API to bind the bot to the new API Gateway public URL.
6. **Verify pod health** — Check Kubernetes Readiness and Liveness probes. Confirm all microservices are running and the ATP connection is healthy.
7. **Monitor budget** — Check the OCI Cost Management console periodically using the `Environment: Pilot` and `Project: Dev-Tool` resource tags to verify spend against the $300 credit budget.

### Outcomes
- Full environment running on OKE with no manually provisioned resources
- CI/CD pipeline handles all future deployments automatically
- Infrastructure state is fully reproducible from Terraform source — in the event of a region failure, the entire environment can be rebuilt in a new OCI region

---

## Flow 6: Data retention purge (automated, nightly)

Not a user-initiated flow. Executed automatically by a scheduled cron job inside the `project_task` microservice.

### Trigger
System clock reaching the scheduled cron expression — typically runs nightly during off-peak hours.

### Steps

1. **Identify eligible records** — Query `project.created_at < NOW - 365 days` to find projects older than one year.
2. **Dry run log** — Log the count of eligible records before deletion for audit purposes.
3. **Execute delete** — `DELETE FROM project WHERE created_at < SYSTIMESTAMP - INTERVAL '365' DAY`. Cascade constraints automatically delete all associated sprints, tasks, task state history, and work log entries.
4. **Commit transaction** — The entire deletion runs inside a single transaction. If it exceeds the 10-minute window, it is rolled back to prevent long-running locks affecting active users.
5. **Log completion** — Record the number of records purged to stdout for the Kubernetes logging agent to collect.

### Outcomes
- Records older than 365 days permanently deleted from the database
- `sprint_kpi_snapshot` is intentionally excluded — historical KPI numbers are retained indefinitely so trend reports remain available after the underlying task data is purged
- Storage footprint stays within bounds for the pilot phase

---

## Summary table

| Flow | Who | Frequency | Channel |
|---|---|---|---|
| Developer daily flow | Developer | Multiple times per day | Web + Telegram |
| Blocked task flow | Developer | As needed | Web or Telegram |
| Project manager flow | Project manager | Per sprint + daily monitoring | Web + Telegram |
| Telegram account linking | Any user | Once per user | Web + Telegram |
| DevOps / infrastructure flow | DevOps engineer | Per sprint deployment | CLI + OCI Console |
| Data retention purge | System (automated) | Nightly | Internal cron job |