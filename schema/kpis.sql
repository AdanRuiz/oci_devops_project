-- =============================================================================
-- Cloud-Native Project Management Tool
-- KPI Queries — derived from the enhanced data model
-- All durations in days. All timestamps assumed UTC.
-- =============================================================================


-- =============================================================================
-- SECTION 1: PRODUCTIVITY KPIs
-- "How fast is work actually getting done?"
-- =============================================================================

-- -----------------------------------------------------------------------------
-- KPI-P1: Average Cycle Time
-- Average number of days a task spends from IN_PROGRESS to DONE in a sprint.
-- Formula: SUM(completed_at - entered_in_progress_at) / n completed tasks
-- -----------------------------------------------------------------------------
SELECT
    s.name                                              AS sprint_name,
    COUNT(t.id)                                         AS completed_tasks,
    ROUND(
        AVG(
            CAST(t.completed_at AS DATE) - CAST(t.entered_in_progress_at AS DATE)
        )
    , 2)                                                AS avg_cycle_time_days
FROM tasks t
JOIN sprints s ON s.id = t.sprint_id
WHERE t.sprint_id  = :sprint_id
  AND t.status     = 'DONE'
  AND t.completed_at            IS NOT NULL
  AND t.entered_in_progress_at  IS NOT NULL
GROUP BY s.name;


-- -----------------------------------------------------------------------------
-- KPI-P2: Scope Creep Rate
-- Percentage of tasks added to the sprint AFTER it officially started.
-- A task added after start_date but before the sprint was planned inflates scope.
-- Formula: (tasks added after sprint start / total sprint tasks) * 100
-- Requires: tasks.sprint_added_at and sprints.planned_task_count
-- -----------------------------------------------------------------------------
SELECT
    s.name                                              AS sprint_name,
    s.planned_task_count,
    COUNT(t.id)                                         AS total_tasks,
    SUM(CASE WHEN t.sprint_added_at > s.start_date
             THEN 1 ELSE 0 END)                         AS tasks_added_after_start,
    ROUND(
        SUM(CASE WHEN t.sprint_added_at > s.start_date
                 THEN 1 ELSE 0 END)
        / NULLIF(COUNT(t.id), 0) * 100
    , 1)                                                AS scope_creep_rate_pct
FROM sprints s
LEFT JOIN tasks t ON t.sprint_id = s.id
WHERE s.id = :sprint_id
GROUP BY s.name, s.planned_task_count;


-- -----------------------------------------------------------------------------
-- KPI-P3: Task Rework Rate
-- Percentage of completed tasks that were moved backward out of DONE at
-- least once. High rework = quality or definition-of-done problems.
-- Requires: tasks.rework_count
-- -----------------------------------------------------------------------------
SELECT
    COUNT(t.id)                                         AS completed_tasks,
    SUM(CASE WHEN t.rework_count > 0 THEN 1 ELSE 0 END) AS reworked_tasks,
    ROUND(
        SUM(CASE WHEN t.rework_count > 0 THEN 1 ELSE 0 END)
        / NULLIF(COUNT(t.id), 0) * 100
    , 1)                                                AS rework_rate_pct,
    ROUND(AVG(t.rework_count), 2)                       AS avg_reworks_per_task
FROM tasks t
WHERE t.sprint_id = :sprint_id
  AND t.status    = 'DONE';


-- -----------------------------------------------------------------------------
-- KPI-P4: Sprint Throughput
-- Total number of tasks completed per sprint, trended across time.
-- Simple count but essential for velocity tracking.
-- -----------------------------------------------------------------------------
SELECT
    s.name                                              AS sprint_name,
    s.start_date,
    s.end_date,
    COUNT(t.id)                                         AS tasks_completed,
    ROUND(
        COUNT(t.id)
        / NULLIF((s.end_date - s.start_date), 0)
    , 2)                                                AS tasks_per_day
FROM sprints s
LEFT JOIN tasks t ON t.sprint_id = s.id AND t.status = 'DONE'
WHERE s.project_id = :project_id
GROUP BY s.id, s.name, s.start_date, s.end_date
ORDER BY s.start_date;


-- =============================================================================
-- SECTION 2: VISIBILITY KPIs
-- "Where is work getting stuck?"
-- =============================================================================

-- -----------------------------------------------------------------------------
-- KPI-V1: Average Blocker Resolution Time
-- How long tasks spend in BLOCKED state on average.
-- Uses task_state_histories to handle multiple block/unblock cycles
-- -----------------------------------------------------------------------------
WITH blocker_periods AS (
    SELECT
        tsh.task_id,
        tsh.to_status,
        tsh.changed_at                                  AS blocked_at,
        LEAD(tsh.changed_at) OVER (
            PARTITION BY tsh.task_id
            ORDER BY tsh.changed_at
        )                                               AS unblocked_at
    FROM task_state_histories tsh
    JOIN tasks t ON t.id = tsh.task_id
    WHERE t.sprint_id     = :sprint_id
)
SELECT
    COUNT(*)                                            AS total_block_events,
    ROUND(
        AVG(
            CAST(unblocked_at AS DATE) - CAST(blocked_at AS DATE)
        )
    , 2)                                                AS avg_blocker_resolution_days,
    ROUND(
        MAX(
            CAST(unblocked_at AS DATE) - CAST(blocked_at AS DATE)
        )
    , 2)                                                AS max_blocker_days
FROM blocker_periods
WHERE to_status     = 'BLOCKED'
  AND unblocked_at IS NOT NULL;


-- -----------------------------------------------------------------------------
-- KPI-V2: Aging Work in Progress
-- Tasks currently IN_PROGRESS and how many days they have been there.
-- Tasks older than the sprint average are flagged as stale.
-- -----------------------------------------------------------------------------
SELECT
    t.id,
    t.title,
    u.email                                             AS assignee,
    s.name                                              AS sprint_name,
    ROUND(
        CAST(SYSTIMESTAMP AS DATE) - CAST(t.entered_in_progress_at AS DATE)
    , 1)                                                AS days_in_progress,
    CASE
        WHEN (CAST(SYSTIMESTAMP AS DATE) - CAST(t.entered_in_progress_at AS DATE)) > 3
        THEN 'STALE'
        ELSE 'OK'
    END                                                 AS wip_health
FROM tasks t
JOIN users u ON u.id = t.assignee_id
JOIN sprints s ON s.id = t.sprint_id
WHERE t.status     = 'IN_PROGRESS'
  AND t.sprint_id  = :sprint_id
ORDER BY days_in_progress DESC;


-- -----------------------------------------------------------------------------
-- KPI-V3: Current Blocked Tasks with Duration
-- Live view of everything stuck right now and for how long.
-- -----------------------------------------------------------------------------
SELECT
    t.id,
    t.title,
    t.priority,
    u.email                                             AS assignee,
    ROUND(
        CAST(SYSTIMESTAMP AS DATE) - CAST(t.blocked_at AS DATE)
    , 1)                                                AS days_blocked,
    t.rework_count
FROM tasks t
JOIN users u ON u.id = t.assignee_id
WHERE t.status     = 'BLOCKED'
  AND t.sprint_id  = :sprint_id
ORDER BY t.blocked_at ASC;


-- =============================================================================
-- SECTION 3: ACCOUNTABILITY KPIs
-- "How is each individual contributing?"
-- =============================================================================

-- -----------------------------------------------------------------------------
-- KPI-A1: Individual Task Completion Rate
-- Percentage of assigned tasks a developer has completed this sprint.
-- Formula: (completed tasks / total assigned tasks) * 100
-- -----------------------------------------------------------------------------
SELECT
    u.email,
    COUNT(t.id)                                         AS total_assigned,
    SUM(CASE WHEN t.status = 'DONE' THEN 1 ELSE 0 END) AS completed,
    SUM(CASE WHEN t.status = 'IN_PROGRESS' THEN 1 ELSE 0 END) AS in_progress,
    SUM(CASE WHEN t.status = 'BLOCKED' THEN 1 ELSE 0 END) AS blocked,
    SUM(CASE WHEN t.status = 'TODO' THEN 1 ELSE 0 END) AS todo,
    ROUND(
        SUM(CASE WHEN t.status = 'DONE' THEN 1 ELSE 0 END)
        / NULLIF(COUNT(t.id), 0) * 100
    , 1)                                                AS completion_rate_pct
FROM users u
JOIN tasks t ON t.assignee_id = u.id
WHERE t.sprint_id = :sprint_id
GROUP BY u.id, u.email
ORDER BY completion_rate_pct DESC;


-- -----------------------------------------------------------------------------
-- KPI-A2: Average Time to Action
-- How quickly a developer picks up a task after it is assigned to them.
-- Measured as the gap between assignment and the first IN_PROGRESS transition.
-- Uses task_assignment_histories to correctly attribute credit to whoever held
-- the task at the moment entered_in_progress_at occurred — not the current
-- assignee, who may have taken over after the task was already started.
-- -----------------------------------------------------------------------------
SELECT
    u.email,
    COUNT(tah.id)                                       AS tasks_measured,
    ROUND(
        AVG(
            CAST(t.entered_in_progress_at AS DATE) - CAST(tah.assigned_at AS DATE)
        )
    , 2)                                                AS avg_time_to_action_days
FROM tasks t
JOIN task_assignment_histories tah
    ON  tah.task_id     = t.id
    AND tah.assigned_at <= t.entered_in_progress_at
    AND (tah.unassigned_at IS NULL OR tah.unassigned_at >= t.entered_in_progress_at)
JOIN users u ON u.id = tah.assignee_id
WHERE t.sprint_id              = :sprint_id
  AND t.entered_in_progress_at IS NOT NULL
GROUP BY u.id, u.email
ORDER BY avg_time_to_action_days;


-- -----------------------------------------------------------------------------
-- KPI-A3: Source of Updates (Web vs Telegram Bot)
-- Measures bot adoption, what fraction of status changes come from
-- the Telegram bot vs the web dashboard.
-- Requires: task_state_histories.source
-- -----------------------------------------------------------------------------
SELECT
    u.email,
    SUM(CASE WHEN tsh.source = 'WEB'      THEN 1 ELSE 0 END) AS web_updates,
    SUM(CASE WHEN tsh.source = 'TELEGRAM' THEN 1 ELSE 0 END) AS bot_updates,
    COUNT(tsh.id)                                             AS total_updates,
    ROUND(
        SUM(CASE WHEN tsh.source = 'TELEGRAM' THEN 1 ELSE 0 END)
        / NULLIF(COUNT(tsh.id), 0) * 100
    , 1)                                                      AS bot_adoption_pct
FROM task_state_histories tsh
JOIN tasks t    ON t.id    = tsh.task_id
JOIN users u  ON u.id   = tsh.changed_by
WHERE t.sprint_id = :sprint_id
GROUP BY u.id, u.email
ORDER BY bot_adoption_pct DESC;


-- =============================================================================
-- SECTION 4: AGGREGATE & TREND KPIs
-- "Are we improving over time?"
-- =============================================================================

-- -----------------------------------------------------------------------------
-- KPI-T1: Cycle Time Trend Across Sprints
-- Used by the KPI dashboard chart to show the downward trend the SRS
-- targets (20% improvement). Reads from sprint_kpi_snapshots for speed
-- once sprints are closed; falls back to live calculation for active sprint.
-- -----------------------------------------------------------------------------
SELECT
    s.name                                              AS sprint_name,
    s.start_date,
    COALESCE(
        snap.avg_cycle_time_days,
        ROUND(
            AVG(CAST(t.completed_at AS DATE) - CAST(t.entered_in_progress_at AS DATE))
        , 2)
    )                                                   AS avg_cycle_time_days,
    COALESCE(snap.scope_creep_rate_pct,  NULL)          AS scope_creep_rate_pct,
    COALESCE(snap.tasks_completed,
        COUNT(CASE WHEN t.status = 'DONE' THEN 1 END))  AS tasks_completed
FROM sprints s
LEFT JOIN sprint_kpi_snapshots snap ON snap.sprint_id = s.id
LEFT JOIN tasks t ON t.sprint_id = s.id
    AND t.status = 'DONE'
    AND t.completed_at IS NOT NULL
    AND t.entered_in_progress_at IS NOT NULL
WHERE s.project_id = :project_id
GROUP BY s.id, s.name, s.start_date,
         snap.avg_cycle_time_days, snap.scope_creep_rate_pct, snap.tasks_completed
ORDER BY s.start_date;


-- -----------------------------------------------------------------------------
-- KPI-T2: 20% Improvement Verification
-- Compares the current sprint's avg cycle time to the previous sprint's.
-- This is the headline metric the SRS sets as the primary success criterion.
-- -----------------------------------------------------------------------------
WITH sprint_cycles AS (
    SELECT
        s.id,
        s.name,
        s.start_date,
        ROW_NUMBER() OVER (ORDER BY s.start_date DESC)  AS rn,
        COALESCE(
            snap.avg_cycle_time_days,
            ROUND(
                AVG(CAST(t.completed_at AS DATE) - CAST(t.entered_in_progress_at AS DATE))
            , 2)
        )                                               AS avg_cycle_time_days
    FROM sprints s
    LEFT JOIN sprint_kpi_snapshots snap ON snap.sprint_id = s.id
    LEFT JOIN tasks t ON t.sprint_id = s.id
        AND t.status = 'DONE'
        AND t.completed_at IS NOT NULL
        AND t.entered_in_progress_at IS NOT NULL
    WHERE s.project_id = :project_id
    GROUP BY s.id, s.name, s.start_date, snap.avg_cycle_time_days
)
SELECT
    curr.name                                           AS current_sprint,
    curr.avg_cycle_time_days                            AS current_cycle_days,
    prev.name                                           AS previous_sprint,
    prev.avg_cycle_time_days                            AS previous_cycle_days,
    ROUND(
        (prev.avg_cycle_time_days - curr.avg_cycle_time_days)
        / NULLIF(prev.avg_cycle_time_days, 0) * 100
    , 1)                                                AS improvement_pct,
    CASE
        WHEN (prev.avg_cycle_time_days - curr.avg_cycle_time_days)
             / NULLIF(prev.avg_cycle_time_days, 0) * 100 >= 20
        THEN 'TARGET MET'
        ELSE 'BELOW TARGET'
    END                                                 AS target_status
FROM sprint_cycles curr
JOIN sprint_cycles prev ON prev.rn = curr.rn + 1
WHERE curr.rn = 1;


-- =============================================================================
-- SECTION 5: OBLIGATORY KPIs
-- =============================================================================

-- -----------------------------------------------------------------------------
-- KPI-O1: Hours worked on tasks
-- Uses task_work_logs (hours granularity — entered at task completion
-- or reassignment, 0.5-step increments up to 100 h per entry).
-- -----------------------------------------------------------------------------

-- Total hours worked per task in a sprint
SELECT
    t.id,
    t.title,
    t.status,
    u.email                                             AS assignee,
    ROUND(SUM(twl.hours_worked), 2)                     AS total_hours_worked,
    COUNT(twl.id)                                       AS log_entries
FROM tasks t
JOIN users u                ON u.id       = t.assignee_id
LEFT JOIN task_work_logs twl  ON twl.task_id = t.id
WHERE t.sprint_id = :sprint_id
GROUP BY t.id, t.title, t.status, u.email
ORDER BY total_hours_worked DESC;

-- Total hours worked per developer in a sprint
SELECT
    u.email,
    COUNT(DISTINCT twl.task_id)                         AS tasks_worked_on,
    ROUND(SUM(twl.hours_worked), 2)                     AS total_hours_worked
FROM task_work_logs twl
JOIN users u ON u.id  = twl.user_id
JOIN tasks t   ON t.id  = twl.task_id
WHERE t.sprint_id = :sprint_id
GROUP BY u.id, u.email
ORDER BY total_hours_worked DESC;

-- Calendar hours vs logged hours efficiency ratio
-- Flags tasks where elapsed time far exceeds actual effort logged
-- (calendar_hours = calendar_days * 8 assuming an 8-hour workday)
SELECT
    t.id,
    t.title,
    u.email                                             AS assignee,
    ROUND(SUM(twl.hours_worked), 2)                     AS hours_logged,
    ROUND((CAST(t.completed_at AS DATE) - CAST(t.entered_in_progress_at AS DATE)) * 8, 1) AS calendar_hours,
    ROUND(
        SUM(twl.hours_worked)
        / NULLIF((CAST(t.completed_at AS DATE) - CAST(t.entered_in_progress_at AS DATE)) * 8, 0) * 100
    , 1)                                                AS effort_ratio_pct
FROM tasks t
JOIN users u                ON u.id       = t.assignee_id
LEFT JOIN task_work_logs twl  ON twl.task_id = t.id
WHERE t.sprint_id              = :sprint_id
  AND t.status                 = 'DONE'
  AND t.completed_at           IS NOT NULL
  AND t.entered_in_progress_at IS NOT NULL
GROUP BY t.id, t.title, u.email, t.completed_at, t.entered_in_progress_at
ORDER BY effort_ratio_pct;


-- -----------------------------------------------------------------------------
-- KPI-O2: Tasks completed
-- Consolidated per-developer summary for a sprint.
-- -----------------------------------------------------------------------------
SELECT
    u.email,
    COUNT(t.id)                                         AS total_assigned,
    SUM(CASE WHEN t.status = 'DONE' THEN 1 ELSE 0 END) AS tasks_completed,
    ROUND(
        SUM(CASE WHEN t.status = 'DONE' THEN 1 ELSE 0 END)
        / NULLIF(COUNT(t.id), 0) * 100
    , 1)                                                AS completion_rate_pct
FROM users u
JOIN tasks t ON t.assignee_id = u.id
WHERE t.sprint_id = :sprint_id
GROUP BY u.id, u.email
ORDER BY tasks_completed DESC;
