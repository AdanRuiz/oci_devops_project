-- =============================================================================
-- Cloud-Native Project Management Tool
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 1. USERS
--    Stores the internal user record mapped to an external OCI IAM identity.
--    Passwords are never stored here — auth is fully delegated to OCI IAM.
-- -----------------------------------------------------------------------------
CREATE TABLE users (
    id               RAW(16)       DEFAULT SYS_GUID() NOT NULL,
    oci_iam_id       VARCHAR2(255) NOT NULL,
    telegram_chat_id VARCHAR2(64),
    email            VARCHAR2(255) NOT NULL,
    system_role      VARCHAR2(32)  DEFAULT 'DEVELOPER' NOT NULL,
    created_at       TIMESTAMP     DEFAULT SYSTIMESTAMP NOT NULL,

    CONSTRAINT pk_user            PRIMARY KEY (id),
    CONSTRAINT uq_user_oci_iam    UNIQUE (oci_iam_id),
    CONSTRAINT uq_user_telegram   UNIQUE (telegram_chat_id),
    CONSTRAINT uq_user_email      UNIQUE (email),
    CONSTRAINT ck_user_role       CHECK (system_role IN ('DEVELOPER', 'PROJECT_MANAGER', 'ADMIN'))
);

CREATE INDEX idx_user_telegram ON users (telegram_chat_id);


-- -----------------------------------------------------------------------------
-- 2. PROJECTS
--    Root container for all work. Cascading deletes propagate to sprints
--    and tasks (SRS §14 integrity constraints).
-- -----------------------------------------------------------------------------
CREATE TABLE projects (
    id          RAW(16)        DEFAULT SYS_GUID() NOT NULL,
    name        VARCHAR2(100)  NOT NULL,
    description VARCHAR2(2000),
    owner_id    RAW(16)        NOT NULL,
    created_at  TIMESTAMP      DEFAULT SYSTIMESTAMP NOT NULL,

    CONSTRAINT pk_project         PRIMARY KEY (id),
    CONSTRAINT fk_project_owner   FOREIGN KEY (owner_id) REFERENCES users (id)
);

CREATE INDEX idx_project_owner    ON projects (owner_id);
CREATE INDEX idx_project_created  ON projects (created_at);


-- -----------------------------------------------------------------------------
-- 3. PROJECT_MEMBERS
--    Junction table for team membership with per-project roles.
--    Enforces RBAC at project level (SRS §4 PF-1, §5 user characteristics).
--    A user can be VIEWER, DEVELOPER, or PROJECT_MANAGER within a project,
--    independently of their global system_role.
-- -----------------------------------------------------------------------------
CREATE TABLE project_members (
    id         RAW(16)      DEFAULT SYS_GUID() NOT NULL,
    project_id RAW(16)      NOT NULL,
    user_id    RAW(16)      NOT NULL,
    role       VARCHAR2(32) DEFAULT 'DEVELOPER' NOT NULL,
    joined_at  TIMESTAMP    DEFAULT SYSTIMESTAMP NOT NULL,

    CONSTRAINT pk_project_member        PRIMARY KEY (id),
    CONSTRAINT fk_pm_project            FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE,
    CONSTRAINT fk_pm_user               FOREIGN KEY (user_id)    REFERENCES users (id),
    CONSTRAINT uq_pm_project_user       UNIQUE (project_id, user_id),
    CONSTRAINT ck_pm_role               CHECK (role IN ('VIEWER', 'DEVELOPER', 'PROJECT_MANAGER'))
);

CREATE INDEX idx_pm_project ON project_members (project_id);
CREATE INDEX idx_pm_user    ON project_members (user_id);


-- -----------------------------------------------------------------------------
-- 4. SPRINTS
--    Time-boxed iteration. Belongs to one project. Tasks belong to sprints.
--    planned_task_count is snapshot at sprint start for scope creep calculation
-- -----------------------------------------------------------------------------
CREATE TABLE sprints (
    id                 RAW(16)       DEFAULT SYS_GUID() NOT NULL,
    name               VARCHAR2(100) NOT NULL,
    project_id         RAW(16)       NOT NULL,
    status             VARCHAR2(16)  DEFAULT 'UPCOMING' NOT NULL,
    start_date         DATE          NOT NULL,
    end_date           DATE          NOT NULL,
    planned_task_count NUMBER(6)     DEFAULT 0 NOT NULL,

    CONSTRAINT pk_sprint            PRIMARY KEY (id),
    CONSTRAINT fk_sprint_project    FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE,
    CONSTRAINT ck_sprint_status     CHECK (status IN ('UPCOMING', 'ACTIVE', 'COMPLETED')),
    CONSTRAINT ck_sprint_dates      CHECK (end_date > start_date)
);

CREATE INDEX idx_sprint_project ON sprints (project_id);
CREATE INDEX idx_sprint_status  ON sprints (status);


-- -----------------------------------------------------------------------------
-- 5. TASKS
--    Core work item. Temporal columns drive all KPI calculations.
--    sprint_added_at is separate from created_at to detect scope creep —
--    a task created before the sprint but added later still counts as creep.
--    rework_count increments each time status moves backward out of DONE.
-- -----------------------------------------------------------------------------
CREATE TABLE tasks (
    id                      RAW(16)       DEFAULT SYS_GUID() NOT NULL,
    title                   VARCHAR2(100) NOT NULL,
    description             VARCHAR2(2000),
    status                  VARCHAR2(16)  DEFAULT 'TODO' NOT NULL,
    priority                VARCHAR2(8)   DEFAULT 'MEDIUM' NOT NULL,
    project_id              RAW(16)       NOT NULL,
    sprint_id               RAW(16),
    assignee_id             RAW(16),
    created_by              RAW(16)       NOT NULL,
    created_at              TIMESTAMP     DEFAULT SYSTIMESTAMP NOT NULL,
    sprint_added_at         TIMESTAMP,
    assigned_at             TIMESTAMP,
    entered_in_progress_at  TIMESTAMP,
    blocked_at              TIMESTAMP,
    completed_at            TIMESTAMP,
    rework_count            NUMBER(4)     DEFAULT 0 NOT NULL,

    CONSTRAINT pk_task              PRIMARY KEY (id),
    CONSTRAINT fk_task_project      FOREIGN KEY (project_id)  REFERENCES projects (id) ON DELETE CASCADE,
    CONSTRAINT fk_task_sprint       FOREIGN KEY (sprint_id)   REFERENCES sprints (id)  ON DELETE SET NULL,
    CONSTRAINT fk_task_assignee     FOREIGN KEY (assignee_id) REFERENCES users (id)  ON DELETE SET NULL,
    CONSTRAINT fk_task_created_by   FOREIGN KEY (created_by)  REFERENCES users (id),
    CONSTRAINT ck_task_status       CHECK (status   IN ('TODO', 'IN_PROGRESS', 'BLOCKED', 'DONE')),
    CONSTRAINT ck_task_priority     CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH')),
    CONSTRAINT ck_task_ts_assigned  CHECK (assigned_at IS NULL OR assigned_at >= created_at),
    CONSTRAINT ck_task_ts_progress  CHECK (entered_in_progress_at IS NULL OR entered_in_progress_at >= created_at),
    CONSTRAINT ck_task_ts_completed CHECK (completed_at IS NULL OR (
                                        completed_at >= created_at AND
                                        (entered_in_progress_at IS NULL OR completed_at >= entered_in_progress_at)
                                    ))
);

CREATE INDEX idx_task_project    ON tasks (project_id);
CREATE INDEX idx_task_sprint     ON tasks (sprint_id);
CREATE INDEX idx_task_assignee   ON tasks (assignee_id);
CREATE INDEX idx_task_status     ON tasks (status);
CREATE INDEX idx_task_created_at ON tasks (created_at);


-- -----------------------------------------------------------------------------
-- 5a. TASK_ASSIGNMENT_HISTORIES
--     Append-only log of every assignment and reassignment.
--     One row is open (unassigned_at IS NULL) per task at any time.
--     On reassignment the app closes the current row and opens a new one.
--     task.assignee_id / task.assigned_at remain as denormalised convenience
--     columns that always mirror the open row here.
--     KPI-A2 joins this table to attribute time-to-action to whoever held
--     the task when entered_in_progress_at occurred.
-- -----------------------------------------------------------------------------
CREATE TABLE task_assignment_histories (
    id            RAW(16)   DEFAULT SYS_GUID() NOT NULL,
    task_id       RAW(16)   NOT NULL,
    assignee_id   RAW(16)   NOT NULL,
    assigned_at   TIMESTAMP NOT NULL,
    unassigned_at TIMESTAMP,

    CONSTRAINT pk_tah             PRIMARY KEY (id),
    CONSTRAINT fk_tah_task        FOREIGN KEY (task_id)     REFERENCES tasks (id)  ON DELETE CASCADE,
    CONSTRAINT fk_tah_assignee    FOREIGN KEY (assignee_id) REFERENCES users (id),
    CONSTRAINT ck_tah_dates       CHECK (unassigned_at IS NULL OR unassigned_at > assigned_at)
);

CREATE INDEX idx_tah_task        ON task_assignment_histories (task_id);
CREATE INDEX idx_tah_assignee    ON task_assignment_histories (assignee_id);
CREATE INDEX idx_tah_assigned_at ON task_assignment_histories (assigned_at);


-- -----------------------------------------------------------------------------
-- 6. TASK_STATE_HISTORIES
--    Append-only audit log of every status transition.
--    Enables blocker resolution time and multi-cycle rework KPIs that the
--    single timestamp columns on TASKS cannot capture alone.
--    source distinguishes web UI changes from Telegram bot changes.
-- -----------------------------------------------------------------------------
CREATE TABLE task_state_histories (
    id          RAW(16)      DEFAULT SYS_GUID() NOT NULL,
    task_id     RAW(16)      NOT NULL,
    changed_by  RAW(16)      NOT NULL,
    from_status VARCHAR2(16),
    to_status   VARCHAR2(16) NOT NULL,
    source      VARCHAR2(16) DEFAULT 'WEB' NOT NULL,
    changed_at  TIMESTAMP    DEFAULT SYSTIMESTAMP NOT NULL,

    CONSTRAINT pk_task_state_history    PRIMARY KEY (id),
    CONSTRAINT fk_tsh_task              FOREIGN KEY (task_id)    REFERENCES tasks (id) ON DELETE CASCADE,
    CONSTRAINT fk_tsh_user              FOREIGN KEY (changed_by) REFERENCES users (id),
    CONSTRAINT ck_tsh_from_status       CHECK (from_status IS NULL OR from_status IN ('TODO', 'IN_PROGRESS', 'BLOCKED', 'DONE')),
    CONSTRAINT ck_tsh_to_status         CHECK (to_status IN ('TODO', 'IN_PROGRESS', 'BLOCKED', 'DONE')),
    CONSTRAINT ck_tsh_source            CHECK (source IN ('WEB', 'TELEGRAM', 'SYSTEM'))
);

CREATE INDEX idx_tsh_task       ON task_state_histories (task_id);
CREATE INDEX idx_tsh_changed_at ON task_state_histories (changed_at);


-- -----------------------------------------------------------------------------
-- 7. TASK_WORK_LOGS
--    One row per day a developer actively works on a task.
--    Granularity is days (full or half) rather than hours — developers
--    log work at standup or end of day, not minute by minute.
--    The unique constraint on (task_id, user_id, work_date) prevents
--    accidental duplicate entries for the same day.
-- -----------------------------------------------------------------------------
CREATE TABLE task_work_logs (
    id          RAW(16)     DEFAULT SYS_GUID() NOT NULL,
    task_id     RAW(16)     NOT NULL,
    user_id     RAW(16)     NOT NULL,
    work_date   DATE        NOT NULL,
    days_worked NUMBER(3,1) DEFAULT 1.0 NOT NULL,
    note        VARCHAR2(500),

    CONSTRAINT pk_task_work_log     PRIMARY KEY (id),
    CONSTRAINT fk_twl_task          FOREIGN KEY (task_id) REFERENCES tasks (id) ON DELETE CASCADE,
    CONSTRAINT fk_twl_user          FOREIGN KEY (user_id) REFERENCES users (id),
    CONSTRAINT uq_twl_task_user_day UNIQUE (task_id, user_id, work_date),
    CONSTRAINT ck_twl_days          CHECK (days_worked IN (0.5, 1.0))
);

CREATE INDEX idx_twl_task      ON task_work_logs (task_id);
CREATE INDEX idx_twl_user      ON task_work_logs (user_id);
CREATE INDEX idx_twl_work_date ON task_work_logs (work_date);


-- -----------------------------------------------------------------------------
-- 8. TELEGRAM_LINK_CODES
--    Short-lived numeric codes for linking a Telegram chat ID to a user
--    account.
--    used flag prevents replay attacks. One active code per user at a time.
-- -----------------------------------------------------------------------------
CREATE TABLE telegram_link_codes (
    id         RAW(16)     DEFAULT SYS_GUID() NOT NULL,
    user_id    RAW(16)     NOT NULL,
    code       VARCHAR2(8) NOT NULL,
    expires_at TIMESTAMP   NOT NULL,
    used       NUMBER(1)   DEFAULT 0 NOT NULL,

    CONSTRAINT pk_telegram_link_code    PRIMARY KEY (id),
    CONSTRAINT fk_tlc_user              FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT uq_tlc_code              UNIQUE (code),
    CONSTRAINT ck_tlc_used              CHECK (used IN (0, 1))
);

CREATE INDEX idx_tlc_user ON telegram_link_codes (user_id);

-- Enforces at most one active (unused) code per user.
-- Function returns user_id when used = 0, NULL when used = 1.
-- Oracle unique indexes permit multiple NULLs, so expired codes never conflict.
-- The application must mark any existing active code used = 1 before inserting a new one.
CREATE UNIQUE INDEX uq_tlc_active_user ON telegram_link_codes (
    CASE WHEN used = 0 THEN user_id ELSE NULL END
);


-- -----------------------------------------------------------------------------
-- 9. BOT_CONVERSATIONS
--    Persists the Gemini LLM message history per user so the bot retains
--    conversational context across separate Telegram messages.
--    One active conversation record per user; updated on each exchange.
-- -----------------------------------------------------------------------------
CREATE TABLE bot_conversations (
    id               RAW(16)      DEFAULT SYS_GUID() NOT NULL,
    user_id          RAW(16)      NOT NULL,
    telegram_chat_id VARCHAR2(64) NOT NULL,
    message_history  CLOB         NOT NULL,
    last_active_at   TIMESTAMP    DEFAULT SYSTIMESTAMP NOT NULL,

    CONSTRAINT pk_bot_conversation  PRIMARY KEY (id),
    CONSTRAINT fk_bc_user           FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT uq_bc_user           UNIQUE (user_id),
    CONSTRAINT ck_bc_history_json   CHECK (message_history IS JSON)
);

CREATE INDEX idx_bc_last_active ON bot_conversations (last_active_at);


-- -----------------------------------------------------------------------------
-- 10. SPRINT_KPI_SNAPSHOTS
--     Pre-computed KPI values stored when a sprint closes.
--     Preserves historical metrics even after the 1-year data purge deletes
--     the underlying task rows.
-- -----------------------------------------------------------------------------
CREATE TABLE sprint_kpi_snapshots (
    id                       RAW(16)     DEFAULT SYS_GUID() NOT NULL,
    sprint_id                RAW(16)     NOT NULL,
    avg_cycle_time_days      NUMBER(8,2),
    scope_creep_rate_pct     NUMBER(5,2),
    blocker_resolution_days  NUMBER(8,2),
    tasks_reworked           NUMBER(6)   DEFAULT 0 NOT NULL,
    -- Obligatory KPIs
    tasks_completed          NUMBER(6)   DEFAULT 0 NOT NULL,
    total_days_worked        NUMBER(8,1),
    calculated_at            TIMESTAMP   DEFAULT SYSTIMESTAMP NOT NULL,

    CONSTRAINT pk_sprint_kpi_snapshot   PRIMARY KEY (id),
    CONSTRAINT fk_sks_sprint            FOREIGN KEY (sprint_id) REFERENCES sprints (id) ON DELETE CASCADE,
    CONSTRAINT uq_sks_sprint            UNIQUE (sprint_id)
);


-- =============================================================================
-- DATA RETENTION — nightly purge job
-- Deletes project + sprint + task records older than 365 days.
-- Cascade constraints handle child rows automatically.
-- sprint_kpi_snapshots is intentionally excluded —
-- KPI snapshots are kept indefinitely so trend reports
-- remain available after the underlying task data is purged.
-- =============================================================================
-- DELETE FROM projects
--  WHERE created_at < SYSTIMESTAMP - INTERVAL '365' DAY;
--
-- Cascades: projects → sprints → tasks → task_state_histories, task_work_logs
--           users   → telegram_link_codes, bot_conversations
-- =============================================================================
