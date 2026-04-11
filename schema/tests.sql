-- =============================================================================
-- Schema & Trigger Tests
-- Run queries one by one in order.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- SECTION 1 — Base data (users, project, sprints)
-- -----------------------------------------------------------------------------

-- 1. Insert two users
INSERT INTO users (id, oci_iam_id, email, system_role)
VALUES (HEXTORAW('00000000000000000000000000000001'), 'oci-user-1', 'dev1@test.com', 'DEVELOPER');

INSERT INTO users (id, oci_iam_id, email, system_role)
VALUES (HEXTORAW('00000000000000000000000000000002'), 'oci-user-2', 'dev2@test.com', 'DEVELOPER');

-- 2. Insert a project
INSERT INTO projects (id, name, owner_id)
VALUES (HEXTORAW('00000000000000000000000000000010'), 'Test Project',
        HEXTORAW('00000000000000000000000000000001'));

-- 3. Insert an UPCOMING sprint and an ACTIVE sprint
INSERT INTO sprints (id, name, project_id, status, start_date, end_date)
VALUES (HEXTORAW('00000000000000000000000000000020'), 'Sprint 1',
        HEXTORAW('00000000000000000000000000000010'),
        'UPCOMING', SYSDATE, SYSDATE + 14);

INSERT INTO sprints (id, name, project_id, status, start_date, end_date)
VALUES (HEXTORAW('00000000000000000000000000000021'), 'Sprint 2 Active',
        HEXTORAW('00000000000000000000000000000010'),
        'ACTIVE', SYSDATE, SYSDATE + 14);


-- -----------------------------------------------------------------------------
-- SECTION 2 — trg_task_bi + trg_task_ai + trg_task_sprint_count
-- -----------------------------------------------------------------------------

-- 4. Insert a task assigned to user1, linked to the UPCOMING sprint.
--    Expects: sprint_added_at and assigned_at auto-stamped,
--             sprint1.planned_task_count becomes 1,
--             one open row in task_assignment_histories.
INSERT INTO tasks (id, title, project_id, sprint_id, assignee_id, created_by)
VALUES (HEXTORAW('00000000000000000000000000000030'), 'Task 1',
        HEXTORAW('00000000000000000000000000000010'),
        HEXTORAW('00000000000000000000000000000020'),
        HEXTORAW('00000000000000000000000000000001'),
        HEXTORAW('00000000000000000000000000000001'));

-- 5. Verify task timestamps were stamped (sprint_added_at and assigned_at NOT NULL).
SELECT title, status, sprint_added_at, assigned_at, entered_in_progress_at, completed_at, rework_count
FROM tasks
WHERE id = HEXTORAW('00000000000000000000000000000030');

-- PHOTO 1

-- 6. Verify sprint planned_task_count incremented to 1.
SELECT name, status, planned_task_count
FROM sprints
WHERE id = HEXTORAW('00000000000000000000000000000020');

-- PHOTO 2

-- 7. Verify the initial assignment history row was opened.
SELECT task_id, assignee_id, assigned_at, unassigned_at
FROM task_assignment_histories
WHERE task_id = HEXTORAW('00000000000000000000000000000030');

-- PHOTO 3

-- 8. Insert a task into the ACTIVE sprint — planned_task_count should NOT change.
INSERT INTO tasks (id, title, project_id, sprint_id, created_by)
VALUES (HEXTORAW('00000000000000000000000000000031'), 'Task 2 (active sprint)',
        HEXTORAW('00000000000000000000000000000010'),
        HEXTORAW('00000000000000000000000000000021'),
        HEXTORAW('00000000000000000000000000000001'));

-- Expected: 0 (active sprint baseline is frozen).
SELECT name, status, planned_task_count
FROM sprints
WHERE id = HEXTORAW('00000000000000000000000000000021');

-- PHOTO 4

-- -----------------------------------------------------------------------------
-- SECTION 3 — trg_task_bu + trg_task_au (status transitions)
-- NOTE: Run the set_actor block before each UPDATE.
-- -----------------------------------------------------------------------------

-- 9. TODO → IN_PROGRESS
--    Expects: entered_in_progress_at stamped, 1 row in task_state_histories.
BEGIN app_ctx.set_actor(HEXTORAW('00000000000000000000000000000001'), 'WEB'); END;
/

UPDATE tasks SET status = 'IN_PROGRESS'
WHERE id = HEXTORAW('00000000000000000000000000000030');

SELECT status, entered_in_progress_at, blocked_at, completed_at, rework_count
FROM tasks WHERE id = HEXTORAW('00000000000000000000000000000030');

SELECT from_status, to_status, source, changed_at
FROM task_state_histories
WHERE task_id = HEXTORAW('00000000000000000000000000000030')
ORDER BY changed_at;

-- PHOTO 5

-- 10. IN_PROGRESS → BLOCKED
--     Expects: blocked_at stamped, 2 rows in history.
BEGIN app_ctx.set_actor(HEXTORAW('00000000000000000000000000000001'), 'WEB'); END;
/

UPDATE tasks SET status = 'BLOCKED'
WHERE id = HEXTORAW('00000000000000000000000000000030');

SELECT status, blocked_at FROM tasks WHERE id = HEXTORAW('00000000000000000000000000000030');

-- PHOTO 6

-- 11. BLOCKED → IN_PROGRESS
--     Expects: blocked_at cleared to NULL, 3 rows in history.
BEGIN app_ctx.set_actor(HEXTORAW('00000000000000000000000000000001'), 'WEB'); END;
/

UPDATE tasks SET status = 'IN_PROGRESS'
WHERE id = HEXTORAW('00000000000000000000000000000030');

-- blocked_at should be NULL.
SELECT status, blocked_at FROM tasks WHERE id = HEXTORAW('00000000000000000000000000000030');

-- PHOTO 7

-- 12. IN_PROGRESS → DONE
--     Expects: completed_at stamped, 4 rows in history.
BEGIN app_ctx.set_actor(HEXTORAW('00000000000000000000000000000001'), 'WEB'); END;
/

UPDATE tasks SET status = 'DONE'
WHERE id = HEXTORAW('00000000000000000000000000000030');

SELECT status, completed_at, rework_count FROM tasks WHERE id = HEXTORAW('00000000000000000000000000000030');

-- PHOTO 8

-- 13. DONE → IN_PROGRESS (rework)
--     Expects: completed_at cleared, rework_count becomes 1, 5 rows in history.
BEGIN app_ctx.set_actor(HEXTORAW('00000000000000000000000000000001'), 'WEB'); END;
/

UPDATE tasks SET status = 'IN_PROGRESS'
WHERE id = HEXTORAW('00000000000000000000000000000030');

-- completed_at NULL, rework_count = 1.
SELECT status, completed_at, rework_count FROM tasks WHERE id = HEXTORAW('00000000000000000000000000000030');

-- PHOTO 9

-- 5 rows total.
SELECT from_status, to_status, changed_at FROM task_state_histories
WHERE task_id = HEXTORAW('00000000000000000000000000000030')
ORDER BY changed_at;

-- PHOTO 10

-- -----------------------------------------------------------------------------
-- SECTION 4 — trg_task_au assignment rotation
-- -----------------------------------------------------------------------------

-- 14. Reassign task from user1 to user2.
--     Expects: old history row gets unassigned_at set,
--              new open row created for user2.
BEGIN app_ctx.set_actor(HEXTORAW('00000000000000000000000000000001'), 'WEB'); END;
/

UPDATE tasks SET assignee_id = HEXTORAW('00000000000000000000000000000002')
WHERE id = HEXTORAW('00000000000000000000000000000030');

-- Row 1: unassigned_at IS NOT NULL (closed, user1).
-- Row 2: unassigned_at IS NULL     (open,   user2).
SELECT assignee_id, assigned_at, unassigned_at
FROM task_assignment_histories
WHERE task_id = HEXTORAW('00000000000000000000000000000030')
ORDER BY assigned_at;

-- PHOTO 11

-- -----------------------------------------------------------------------------
-- SECTION 5 — trg_task_sprint_count on sprint change
-- -----------------------------------------------------------------------------

-- 15. Move task1 from UPCOMING sprint to ACTIVE sprint.
--     Expects: sprint1.planned_task_count decrements to 0 (was UPCOMING).
--              sprint2.planned_task_count stays 0 (ACTIVE, no increment).
UPDATE tasks SET sprint_id = HEXTORAW('00000000000000000000000000000021')
WHERE id = HEXTORAW('00000000000000000000000000000030');

-- Sprint 1 UPCOMING: 0 (decremented).
-- Sprint 2 ACTIVE:   0 (unchanged).
SELECT name, status, planned_task_count FROM sprints
WHERE id IN (HEXTORAW('00000000000000000000000000000020'),
             HEXTORAW('00000000000000000000000000000021'));

-- PHOTO 12

-- -----------------------------------------------------------------------------
-- SECTION 6 — trg_tlc_bi (one active Telegram link code per user)
-- -----------------------------------------------------------------------------

-- 16. Insert first link code for user1.
INSERT INTO telegram_link_codes (id, user_id, code, expires_at)
VALUES (HEXTORAW('00000000000000000000000000000040'),
        HEXTORAW('00000000000000000000000000000001'),
        'CODE0001', SYSTIMESTAMP + INTERVAL '10' MINUTE);

-- 17. Insert a second code — trigger should auto-expire the first (used = 1).
INSERT INTO telegram_link_codes (id, user_id, code, expires_at)
VALUES (HEXTORAW('00000000000000000000000000000041'),
        HEXTORAW('00000000000000000000000000000001'),
        'CODE0002', SYSTIMESTAMP + INTERVAL '10' MINUTE);

-- CODE0001: used = 1 (expired by trigger).
-- CODE0002: used = 0 (active).
SELECT code, used, expires_at
FROM telegram_link_codes
WHERE user_id = HEXTORAW('00000000000000000000000000000001')
ORDER BY expires_at;

-- PHOTO 13

-- -----------------------------------------------------------------------------
-- SECTION 7 — Error path: missing actor context
-- -----------------------------------------------------------------------------

-- 18. Attempt a status update without calling set_actor.
--     Expects: ORA-20001 raised.
UPDATE tasks SET status = 'DONE'
WHERE id = HEXTORAW('00000000000000000000000000000030');

-- PHOTO 14

-- =============================================================================
-- SECTION 8 — KPI Setup
-- Builds on the state left by sections 1-7:
--   Task 1 (030): IN_PROGRESS, assignee=user2, sprint=sprint2 (active), rework_count=1
--   Task 2 (031): TODO, no assignee, sprint=sprint2 (active)
-- =============================================================================

-- 19. Complete Task 1 as user2 (closes the rework cycle).
BEGIN app_ctx.set_actor(HEXTORAW('00000000000000000000000000000002'), 'WEB'); END;
/

UPDATE tasks SET status = 'DONE'
WHERE id = HEXTORAW('00000000000000000000000000000030');

-- 20. Assign Task 2 to user1, move it through IN_PROGRESS to DONE.
BEGIN app_ctx.set_actor(HEXTORAW('00000000000000000000000000000001'), 'WEB'); END;
/

UPDATE tasks SET assignee_id = HEXTORAW('00000000000000000000000000000001')
WHERE id = HEXTORAW('00000000000000000000000000000031');

UPDATE tasks SET status = 'IN_PROGRESS'
WHERE id = HEXTORAW('00000000000000000000000000000031');

UPDATE tasks SET status = 'DONE'
WHERE id = HEXTORAW('00000000000000000000000000000031');

-- 21. Insert Task 3 into the ACTIVE sprint — scope creep candidate.
--     sprint_added_at will be stamped after the sprint's start_date.
INSERT INTO tasks (id, title, project_id, sprint_id, assignee_id, created_by)
VALUES (HEXTORAW('00000000000000000000000000000032'), 'Task 3 (scope creep)',
        HEXTORAW('00000000000000000000000000000010'),
        HEXTORAW('00000000000000000000000000000021'),
        HEXTORAW('00000000000000000000000000000001'),
        HEXTORAW('00000000000000000000000000000001'));

-- 22. Log work for Task 1 (user2: 1 full day) and Task 2 (user1: 0.5 day).
INSERT INTO task_work_logs (id, task_id, user_id, work_date, days_worked)
VALUES (HEXTORAW('00000000000000000000000000000050'),
        HEXTORAW('00000000000000000000000000000030'),
        HEXTORAW('00000000000000000000000000000002'),
        TRUNC(SYSDATE), 1.0);

INSERT INTO task_work_logs (id, task_id, user_id, work_date, days_worked)
VALUES (HEXTORAW('00000000000000000000000000000051'),
        HEXTORAW('00000000000000000000000000000031'),
        HEXTORAW('00000000000000000000000000000001'),
        TRUNC(SYSDATE), 0.5);

-- 23. Add a TELEGRAM-sourced status update for KPI-A3 bot-adoption test.
BEGIN app_ctx.set_actor(HEXTORAW('00000000000000000000000000000001'), 'TELEGRAM'); END;
/

UPDATE tasks SET status = 'IN_PROGRESS'
WHERE id = HEXTORAW('00000000000000000000000000000032');


-- =============================================================================
-- SECTION 9 — KPI Queries
-- All bind variables replaced with the test sprint/project IDs.
-- Sprint 2 ACTIVE (021) is the target sprint for most KPIs.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- KPI-P1: Average Cycle Time
-- Expects: 1 row for sprint2 with avg_cycle_time_days for task1 + task2.
-- ---------------------------------------------------------------------------
SELECT
    s.name                                                  AS sprint_name,
    COUNT(t.id)                                             AS completed_tasks,
    ROUND(AVG(CAST(t.completed_at AS DATE)
              - CAST(t.entered_in_progress_at AS DATE)), 2) AS avg_cycle_time_days
FROM tasks t
JOIN sprints s ON s.id = t.sprint_id
WHERE t.sprint_id              = HEXTORAW('00000000000000000000000000000021')
  AND t.status                 = 'DONE'
  AND t.completed_at           IS NOT NULL
  AND t.entered_in_progress_at IS NOT NULL
GROUP BY s.name;

-- PHOTO 15

-- ---------------------------------------------------------------------------
-- KPI-P2: Scope Creep Rate
-- Expects: tasks added to sprint2 after its start_date are flagged.
-- Task 3 was inserted after the sprint started → tasks_added_after_start = 1+.
-- ---------------------------------------------------------------------------
SELECT
    s.name                                                  AS sprint_name,
    s.planned_task_count,
    COUNT(t.id)                                             AS total_tasks,
    SUM(CASE WHEN t.sprint_added_at > s.start_date
             THEN 1 ELSE 0 END)                             AS tasks_added_after_start,
    ROUND(SUM(CASE WHEN t.sprint_added_at > s.start_date
                   THEN 1 ELSE 0 END)
          / NULLIF(COUNT(t.id), 0) * 100, 1)               AS scope_creep_rate_pct
FROM sprints s
LEFT JOIN tasks t ON t.sprint_id = s.id
WHERE s.id = HEXTORAW('00000000000000000000000000000021')
GROUP BY s.name, s.planned_task_count;

-- PHOTO 16

-- ---------------------------------------------------------------------------
-- KPI-P3: Task Rework Rate
-- Expects: 1 of 2 DONE tasks has rework_count > 0 → rework_rate_pct = 50.
-- ---------------------------------------------------------------------------
SELECT
    COUNT(t.id)                                             AS completed_tasks,
    SUM(CASE WHEN t.rework_count > 0 THEN 1 ELSE 0 END)    AS reworked_tasks,
    ROUND(SUM(CASE WHEN t.rework_count > 0 THEN 1 ELSE 0 END)
          / NULLIF(COUNT(t.id), 0) * 100, 1)               AS rework_rate_pct,
    ROUND(AVG(t.rework_count), 2)                           AS avg_reworks_per_task
FROM tasks t
WHERE t.sprint_id = HEXTORAW('00000000000000000000000000000021')
  AND t.status    = 'DONE';

-- PHOTO 17

-- ---------------------------------------------------------------------------
-- KPI-P4: Sprint Throughput
-- Expects: both sprints listed; sprint2 shows 2 completed tasks.
-- ---------------------------------------------------------------------------
SELECT
    s.name                                                  AS sprint_name,
    s.start_date,
    s.end_date,
    COUNT(t.id)                                             AS tasks_completed,
    ROUND(COUNT(t.id) / NULLIF(s.end_date - s.start_date, 0), 2) AS tasks_per_day
FROM sprints s
LEFT JOIN tasks t ON t.sprint_id = s.id AND t.status = 'DONE'
WHERE s.project_id = HEXTORAW('00000000000000000000000000000010')
GROUP BY s.id, s.name, s.start_date, s.end_date
ORDER BY s.start_date;

-- PHOTO 18

-- ---------------------------------------------------------------------------
-- KPI-V1: Average Blocker Resolution Time
-- Expects: 1 block event (BLOCKED→IN_PROGRESS in section 3) with a
-- near-zero resolution duration (same session).
-- Fix: LEAD() runs over ALL history rows per task so unblocked_at correctly
-- captures the next transition out of BLOCKED, not the next BLOCKED entry.
-- ---------------------------------------------------------------------------
WITH blocker_periods AS (
    SELECT
        tsh.task_id,
        tsh.to_status,
        tsh.changed_at                                      AS blocked_at,
        LEAD(tsh.changed_at) OVER (
            PARTITION BY tsh.task_id ORDER BY tsh.changed_at
        )                                                   AS unblocked_at
    FROM task_state_histories tsh
    JOIN tasks t ON t.id = tsh.task_id
    WHERE t.sprint_id = HEXTORAW('00000000000000000000000000000021')
)
SELECT
    COUNT(*)                                                AS total_block_events,
    ROUND(AVG(CAST(unblocked_at AS DATE)
              - CAST(blocked_at AS DATE)), 2)               AS avg_blocker_resolution_days,
    ROUND(MAX(CAST(unblocked_at AS DATE)
              - CAST(blocked_at AS DATE)), 2)               AS max_blocker_days
FROM blocker_periods
WHERE to_status     = 'BLOCKED'
  AND unblocked_at IS NOT NULL;

-- PHOTO 19

-- ---------------------------------------------------------------------------
-- KPI-V2: Aging Work in Progress
-- Expects: Task 3 (IN_PROGRESS) appears; days_in_progress ≈ 0.
-- ---------------------------------------------------------------------------
SELECT
    t.id,
    t.title,
    u.email                                                 AS assignee,
    s.name                                                  AS sprint_name,
    ROUND(CAST(SYSTIMESTAMP AS DATE)
          - CAST(t.entered_in_progress_at AS DATE), 1)      AS days_in_progress,
    CASE
        WHEN (CAST(SYSTIMESTAMP AS DATE)
              - CAST(t.entered_in_progress_at AS DATE)) > 3
        THEN 'STALE' ELSE 'OK'
    END                                                     AS wip_health
FROM tasks t
JOIN users u   ON u.id = t.assignee_id
JOIN sprints s ON s.id = t.sprint_id
WHERE t.status    = 'IN_PROGRESS'
  AND t.sprint_id = HEXTORAW('00000000000000000000000000000021')
ORDER BY days_in_progress DESC;

-- PHOTO 20

-- ---------------------------------------------------------------------------
-- KPI-V3: Current Blocked Tasks with Duration
-- Expects: 0 rows (no task is BLOCKED at this point).
-- ---------------------------------------------------------------------------
SELECT
    t.id,
    t.title,
    t.priority,
    u.email                                                 AS assignee,
    ROUND(CAST(SYSTIMESTAMP AS DATE)
          - CAST(t.blocked_at AS DATE), 1)                  AS days_blocked,
    t.rework_count
FROM tasks t
JOIN users u ON u.id = t.assignee_id
WHERE t.status    = 'BLOCKED'
  AND t.sprint_id = HEXTORAW('00000000000000000000000000000021')
ORDER BY t.blocked_at ASC;

-- PHOTO 21

-- ---------------------------------------------------------------------------
-- KPI-A1: Individual Task Completion Rate
-- Expects: user1 and user2 each with 1 completed task.
-- ---------------------------------------------------------------------------
SELECT
    u.email,
    COUNT(t.id)                                             AS total_assigned,
    SUM(CASE WHEN t.status = 'DONE'        THEN 1 ELSE 0 END) AS completed,
    SUM(CASE WHEN t.status = 'IN_PROGRESS' THEN 1 ELSE 0 END) AS in_progress,
    SUM(CASE WHEN t.status = 'BLOCKED'     THEN 1 ELSE 0 END) AS blocked,
    SUM(CASE WHEN t.status = 'TODO'        THEN 1 ELSE 0 END) AS todo,
    ROUND(SUM(CASE WHEN t.status = 'DONE' THEN 1 ELSE 0 END)
          / NULLIF(COUNT(t.id), 0) * 100, 1)               AS completion_rate_pct
FROM users u
JOIN tasks t ON t.assignee_id = u.id
WHERE t.sprint_id = HEXTORAW('00000000000000000000000000000021')
GROUP BY u.id, u.email
ORDER BY completion_rate_pct DESC;

-- PHOTO 22

-- ---------------------------------------------------------------------------
-- KPI-A2: Average Time to Action
-- Expects: user1 and/or user2 with near-zero avg_time_to_action_days
-- (assignment and start happened in the same session).
-- ---------------------------------------------------------------------------
SELECT
    u.email,
    COUNT(tah.id)                                           AS tasks_measured,
    ROUND(AVG(CAST(t.entered_in_progress_at AS DATE)
              - CAST(tah.assigned_at AS DATE)), 2)          AS avg_time_to_action_days
FROM tasks t
JOIN task_assignment_histories tah
    ON  tah.task_id     = t.id
    AND tah.assigned_at <= t.entered_in_progress_at
    AND (tah.unassigned_at IS NULL OR tah.unassigned_at >= t.entered_in_progress_at)
JOIN users u ON u.id = tah.assignee_id
WHERE t.sprint_id              = HEXTORAW('00000000000000000000000000000021')
  AND t.entered_in_progress_at IS NOT NULL
GROUP BY u.id, u.email
ORDER BY avg_time_to_action_days;

-- PHOTO 23

-- ---------------------------------------------------------------------------
-- KPI-A3: Source of Updates (Web vs Telegram Bot)
-- Expects: user1 has both WEB and TELEGRAM updates; bot_adoption_pct > 0.
-- ---------------------------------------------------------------------------
SELECT
    u.email,
    SUM(CASE WHEN tsh.source = 'WEB'      THEN 1 ELSE 0 END) AS web_updates,
    SUM(CASE WHEN tsh.source = 'TELEGRAM' THEN 1 ELSE 0 END) AS bot_updates,
    COUNT(tsh.id)                                             AS total_updates,
    ROUND(SUM(CASE WHEN tsh.source = 'TELEGRAM' THEN 1 ELSE 0 END)
          / NULLIF(COUNT(tsh.id), 0) * 100, 1)               AS bot_adoption_pct
FROM task_state_histories tsh
JOIN tasks t ON t.id  = tsh.task_id
JOIN users u ON u.id  = tsh.changed_by
WHERE t.sprint_id = HEXTORAW('00000000000000000000000000000021')
GROUP BY u.id, u.email
ORDER BY bot_adoption_pct DESC;

-- PHOTO 24

-- ---------------------------------------------------------------------------
-- KPI-O1a: Total days worked per task
-- Expects: task1 = 1.0 day (user2), task2 = 0.5 day (user1).
-- ---------------------------------------------------------------------------
SELECT
    t.id,
    t.title,
    t.status,
    u.email                                                 AS assignee,
    ROUND(SUM(twl.days_worked), 1)                          AS total_days_worked,
    COUNT(twl.id)                                           AS log_entries
FROM tasks t
JOIN users u                 ON u.id       = t.assignee_id
LEFT JOIN task_work_logs twl ON twl.task_id = t.id
WHERE t.sprint_id = HEXTORAW('00000000000000000000000000000021')
GROUP BY t.id, t.title, t.status, u.email
ORDER BY total_days_worked DESC;

-- PHOTO 25

-- ---------------------------------------------------------------------------
-- KPI-O1b: Total days worked per developer
-- Expects: user1 = 0.5, user2 = 1.0.
-- ---------------------------------------------------------------------------
SELECT
    u.email,
    COUNT(DISTINCT twl.task_id)                             AS tasks_worked_on,
    ROUND(SUM(twl.days_worked), 1)                          AS total_days_worked
FROM task_work_logs twl
JOIN users u ON u.id  = twl.user_id
JOIN tasks t ON t.id  = twl.task_id
WHERE t.sprint_id = HEXTORAW('00000000000000000000000000000021')
GROUP BY u.id, u.email
ORDER BY total_days_worked DESC;

-- PHOTO 26

-- ---------------------------------------------------------------------------
-- KPI-O1c: Effort ratio (logged days vs calendar days)
-- Expects: rows for task1 and task2 with effort_ratio_pct computed.
-- ---------------------------------------------------------------------------
SELECT
    t.id,
    t.title,
    u.email                                                 AS assignee,
    ROUND(SUM(twl.days_worked), 1)                          AS days_logged,
    ROUND(CAST(t.completed_at AS DATE)
          - CAST(t.entered_in_progress_at AS DATE), 1)      AS calendar_days,
    ROUND(SUM(twl.days_worked)
          / NULLIF(CAST(t.completed_at AS DATE)
                   - CAST(t.entered_in_progress_at AS DATE), 0) * 100, 1) AS effort_ratio_pct
FROM tasks t
JOIN users u                 ON u.id       = t.assignee_id
LEFT JOIN task_work_logs twl ON twl.task_id = t.id
WHERE t.sprint_id              = HEXTORAW('00000000000000000000000000000021')
  AND t.status                 = 'DONE'
  AND t.completed_at           IS NOT NULL
  AND t.entered_in_progress_at IS NOT NULL
GROUP BY t.id, t.title, u.email, t.completed_at, t.entered_in_progress_at
ORDER BY effort_ratio_pct;

-- PHOTO 27

-- ---------------------------------------------------------------------------
-- KPI-O2: Tasks completed per developer
-- Expects: user1 and user2 each with 1 completed task.
-- ---------------------------------------------------------------------------
SELECT
    u.email,
    COUNT(t.id)                                             AS total_assigned,
    SUM(CASE WHEN t.status = 'DONE' THEN 1 ELSE 0 END)     AS tasks_completed,
    ROUND(SUM(CASE WHEN t.status = 'DONE' THEN 1 ELSE 0 END)
          / NULLIF(COUNT(t.id), 0) * 100, 1)               AS completion_rate_pct
FROM users u
JOIN tasks t ON t.assignee_id = u.id
WHERE t.sprint_id = HEXTORAW('00000000000000000000000000000021')
GROUP BY u.id, u.email
ORDER BY tasks_completed DESC;

-- PHOTO 28

-- ---------------------------------------------------------------------------
-- KPI-T1: Cycle Time Trend Across Sprints
-- Expects: 2 rows (sprint1 UPCOMING with no tasks, sprint2 ACTIVE with data).
-- ---------------------------------------------------------------------------
SELECT
    s.name                                                  AS sprint_name,
    s.start_date,
    COALESCE(
        snap.avg_cycle_time_days,
        ROUND(AVG(CAST(t.completed_at AS DATE)
                  - CAST(t.entered_in_progress_at AS DATE)), 2)
    )                                                       AS avg_cycle_time_days,
    COALESCE(snap.scope_creep_rate_pct, NULL)               AS scope_creep_rate_pct,
    COALESCE(snap.tasks_completed,
             COUNT(CASE WHEN t.status = 'DONE' THEN 1 END)) AS tasks_completed
FROM sprints s
LEFT JOIN sprint_kpi_snapshots snap ON snap.sprint_id = s.id
LEFT JOIN tasks t ON t.sprint_id = s.id
    AND t.status                 = 'DONE'
    AND t.completed_at           IS NOT NULL
    AND t.entered_in_progress_at IS NOT NULL
WHERE s.project_id = HEXTORAW('00000000000000000000000000000010')
GROUP BY s.id, s.name, s.start_date,
         snap.avg_cycle_time_days, snap.scope_creep_rate_pct, snap.tasks_completed
ORDER BY s.start_date;

-- PHOTO 29

-- ---------------------------------------------------------------------------
-- KPI-T2: 20% Improvement Verification
-- Expects: NULL or BELOW TARGET (only 1 sprint has data; no previous sprint
-- to compare against yet).
-- ---------------------------------------------------------------------------
WITH sprint_cycles AS (
    SELECT
        s.id,
        s.name,
        s.start_date,
        ROW_NUMBER() OVER (ORDER BY s.start_date DESC)     AS rn,
        COALESCE(
            snap.avg_cycle_time_days,
            ROUND(AVG(CAST(t.completed_at AS DATE)
                      - CAST(t.entered_in_progress_at AS DATE)), 2)
        )                                                   AS avg_cycle_time_days
    FROM sprints s
    LEFT JOIN sprint_kpi_snapshots snap ON snap.sprint_id = s.id
    LEFT JOIN tasks t ON t.sprint_id = s.id
        AND t.status                 = 'DONE'
        AND t.completed_at           IS NOT NULL
        AND t.entered_in_progress_at IS NOT NULL
    WHERE s.project_id = HEXTORAW('00000000000000000000000000000010')
    GROUP BY s.id, s.name, s.start_date, snap.avg_cycle_time_days
)
SELECT
    curr.name                                               AS current_sprint,
    curr.avg_cycle_time_days                                AS current_cycle_days,
    prev.name                                               AS previous_sprint,
    prev.avg_cycle_time_days                                AS previous_cycle_days,
    ROUND((prev.avg_cycle_time_days - curr.avg_cycle_time_days)
          / NULLIF(prev.avg_cycle_time_days, 0) * 100, 1)  AS improvement_pct,
    CASE
        WHEN (prev.avg_cycle_time_days - curr.avg_cycle_time_days)
             / NULLIF(prev.avg_cycle_time_days, 0) * 100 >= 20
        THEN 'TARGET MET'
        ELSE 'BELOW TARGET'
    END                                                     AS target_status
FROM sprint_cycles curr
JOIN sprint_cycles prev ON prev.rn = curr.rn + 1
WHERE curr.rn = 1;

-- PHOTO 30


-- -----------------------------------------------------------------------------
-- CLEANUP
-- -----------------------------------------------------------------------------

DELETE FROM tasks    WHERE project_id = HEXTORAW('00000000000000000000000000000010');
DELETE FROM sprints  WHERE project_id = HEXTORAW('00000000000000000000000000000010');
DELETE FROM projects WHERE id         = HEXTORAW('00000000000000000000000000000010');
DELETE FROM users    WHERE id IN (HEXTORAW('00000000000000000000000000000001'),
                                  HEXTORAW('00000000000000000000000000000002'));
