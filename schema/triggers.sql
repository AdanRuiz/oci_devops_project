-- =============================================================================
-- Cloud-Native Project Management Tool
-- Triggers — keeps the schema self-managing
-- =============================================================================


-- =============================================================================
-- APP_CTX PACKAGE
-- Session-level context the application must set before any task DML.
-- Triggers read actor user_id and update source so task_state_histories
-- is populated correctly without extra round-trips from the app layer.
--
-- Usage (Spring Boot, before any task UPDATE):
--   CALL app_ctx.set_actor(:userId, 'WEB');     -- or 'TELEGRAM' / 'SYSTEM'
-- =============================================================================

CREATE OR REPLACE PACKAGE app_ctx AS
    PROCEDURE set_actor (p_user_id IN RAW, p_source IN VARCHAR2);
    FUNCTION  get_user_id RETURN RAW;
    FUNCTION  get_source  RETURN VARCHAR2;
END app_ctx;
/

CREATE OR REPLACE PACKAGE BODY app_ctx AS
    g_user_id RAW(16)      := NULL;
    g_source  VARCHAR2(16) := 'SYSTEM';

    PROCEDURE set_actor (p_user_id IN RAW, p_source IN VARCHAR2) IS
    BEGIN
        g_user_id := p_user_id;
        g_source  := p_source;
    END set_actor;

    FUNCTION get_user_id RETURN RAW IS
    BEGIN
        RETURN g_user_id;
    END get_user_id;

    FUNCTION get_source RETURN VARCHAR2 IS
    BEGIN
        RETURN g_source;
    END get_source;
END app_ctx;
/


-- =============================================================================
-- TASK TRIGGERS
-- =============================================================================

-- -----------------------------------------------------------------------------
-- trg_task_bi — BEFORE INSERT
-- Stamps sprint_added_at when a task is created already linked to a sprint.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE TRIGGER trg_task_bi
BEFORE INSERT ON tasks
FOR EACH ROW
BEGIN
    IF :NEW.sprint_id IS NOT NULL THEN
        :NEW.sprint_added_at := SYSTIMESTAMP;
    END IF;

    IF :NEW.assignee_id IS NOT NULL THEN
        :NEW.assigned_at := SYSTIMESTAMP;
    END IF;
END trg_task_bi;
/


-- -----------------------------------------------------------------------------
-- trg_task_bu — BEFORE UPDATE
-- Maintains all computed temporal columns and assigned_at.
-- Runs before the row is written so CHECK constraints see the updated values.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE TRIGGER trg_task_bu
BEFORE UPDATE ON tasks
FOR EACH ROW
BEGIN
    -- -------------------------------------------------------------------------
    -- Status change: drive temporal columns
    -- -------------------------------------------------------------------------
    IF :OLD.status != :NEW.status THEN

        -- First move to IN_PROGRESS
        IF :NEW.status = 'IN_PROGRESS' AND :OLD.entered_in_progress_at IS NULL THEN
            :NEW.entered_in_progress_at := SYSTIMESTAMP;
        END IF;

        -- Entering BLOCKED
        IF :NEW.status = 'BLOCKED' THEN
            :NEW.blocked_at := SYSTIMESTAMP;
        END IF;

        -- Leaving BLOCKED
        IF :OLD.status = 'BLOCKED' AND :NEW.status != 'BLOCKED' THEN
            :NEW.blocked_at := NULL;
        END IF;

        -- Completing
        IF :NEW.status = 'DONE' THEN
            :NEW.completed_at := SYSTIMESTAMP;
        END IF;

        -- Rework: moving backward from DONE
        IF :OLD.status = 'DONE' AND :NEW.status != 'DONE' THEN
            :NEW.completed_at := NULL;
            :NEW.rework_count := :OLD.rework_count + 1;
        END IF;

    END IF;

    -- -------------------------------------------------------------------------
    -- Assignee change: stamp assigned_at
    -- -------------------------------------------------------------------------
    IF (:OLD.assignee_id IS NULL     AND :NEW.assignee_id IS NOT NULL) OR
       (:OLD.assignee_id IS NOT NULL AND :NEW.assignee_id IS NULL)     OR
       (:OLD.assignee_id IS NOT NULL AND :NEW.assignee_id IS NOT NULL
        AND :OLD.assignee_id != :NEW.assignee_id)
    THEN
        :NEW.assigned_at := CASE
                                WHEN :NEW.assignee_id IS NOT NULL THEN SYSTIMESTAMP
                                ELSE NULL
                            END;
    END IF;

    -- -------------------------------------------------------------------------
    -- Sprint change: stamp sprint_added_at; clear it when removed from sprint
    -- -------------------------------------------------------------------------
    IF :OLD.sprint_id IS NOT NULL AND :NEW.sprint_id IS NULL THEN
        :NEW.sprint_added_at := NULL;

    ELSIF (:OLD.sprint_id IS NULL AND :NEW.sprint_id IS NOT NULL) OR
          (:OLD.sprint_id IS NOT NULL AND :NEW.sprint_id IS NOT NULL
           AND :OLD.sprint_id != :NEW.sprint_id)
    THEN
        :NEW.sprint_added_at := SYSTIMESTAMP;
    END IF;

END trg_task_bu;
/


-- -----------------------------------------------------------------------------
-- trg_task_ai — AFTER INSERT
-- Opens the first task_assignment_histories row when a task is created assigned.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE TRIGGER trg_task_ai
AFTER INSERT ON tasks
FOR EACH ROW
BEGIN
    IF :NEW.assignee_id IS NOT NULL THEN
        INSERT INTO task_assignment_histories (task_id, assignee_id, assigned_at)
        VALUES (:NEW.id, :NEW.assignee_id, :NEW.assigned_at);
    END IF;
END trg_task_ai;
/


-- -----------------------------------------------------------------------------
-- trg_task_au — AFTER UPDATE
-- 1. Inserts a task_state_histories row on every status transition.
-- 2. Closes the current task_assignment_histories row and opens a new one
--    whenever the assignee changes.
--
-- Requires app_ctx.set_actor to have been called in the same session.
-- Raises -20001 if no actor is set and a status change is attempted,
-- because task_state_histories.changed_by is NOT NULL.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE TRIGGER trg_task_au
AFTER UPDATE ON tasks
FOR EACH ROW
DECLARE
    v_changed_by RAW(16) := app_ctx.get_user_id();
BEGIN
    -- -------------------------------------------------------------------------
    -- Status transition audit
    -- -------------------------------------------------------------------------
    IF :OLD.status != :NEW.status THEN

        IF v_changed_by IS NULL THEN
            RAISE_APPLICATION_ERROR(
                -20001,
                'app_ctx.set_actor must be called before updating task status'
            );
        END IF;

        INSERT INTO task_state_histories
            (task_id, changed_by, from_status, to_status, source)
        VALUES
            (:NEW.id, v_changed_by, :OLD.status, :NEW.status, app_ctx.get_source());

    END IF;

    -- -------------------------------------------------------------------------
    -- Assignment rotation
    -- -------------------------------------------------------------------------
    IF (:OLD.assignee_id IS NULL     AND :NEW.assignee_id IS NOT NULL) OR
       (:OLD.assignee_id IS NOT NULL AND :NEW.assignee_id IS NULL)     OR
       (:OLD.assignee_id IS NOT NULL AND :NEW.assignee_id IS NOT NULL
        AND :OLD.assignee_id != :NEW.assignee_id)
    THEN
        -- Close the previous open assignment record
        IF :OLD.assignee_id IS NOT NULL THEN
            UPDATE task_assignment_histories
            SET    unassigned_at = SYSTIMESTAMP
            WHERE  task_id       = :OLD.id
              AND  unassigned_at IS NULL;
        END IF;

        -- Open a new assignment record
        IF :NEW.assignee_id IS NOT NULL THEN
            INSERT INTO task_assignment_histories (task_id, assignee_id, assigned_at)
            VALUES (:NEW.id, :NEW.assignee_id, :NEW.assigned_at);
        END IF;
    END IF;

END trg_task_au;
/


-- =============================================================================
-- SPRINT TRIGGERS
-- =============================================================================

-- -----------------------------------------------------------------------------
-- trg_task_sprint_count — AFTER INSERT OR UPDATE on tasks
-- Keeps sprints.planned_task_count accurate for UPCOMING sprints only.
--
-- Tasks added or moved while the sprint is ACTIVE or COMPLETED are intentionally
-- excluded — they count as scope creep in KPI-P2 and must not shift the baseline
-- that was captured at sprint activation.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE TRIGGER trg_task_sprint_count
AFTER INSERT OR UPDATE OF sprint_id ON tasks
FOR EACH ROW
DECLARE
    v_status sprints.status%TYPE;
BEGIN
    -- Decrement the old sprint's baseline if it is still UPCOMING
    IF UPDATING
       AND :OLD.sprint_id IS NOT NULL
       AND (:NEW.sprint_id IS NULL OR :OLD.sprint_id != :NEW.sprint_id)
    THEN
        SELECT status INTO v_status FROM sprints WHERE id = :OLD.sprint_id;
        IF v_status = 'UPCOMING' THEN
            UPDATE sprints
            SET    planned_task_count = planned_task_count - 1
            WHERE  id = :OLD.sprint_id;
        END IF;
    END IF;

    -- Increment the new sprint's baseline if it is still UPCOMING
    IF :NEW.sprint_id IS NOT NULL
       AND (INSERTING
            OR :OLD.sprint_id IS NULL
            OR :OLD.sprint_id != :NEW.sprint_id)
    THEN
        SELECT status INTO v_status FROM sprints WHERE id = :NEW.sprint_id;
        IF v_status = 'UPCOMING' THEN
            UPDATE sprints
            SET    planned_task_count = planned_task_count + 1
            WHERE  id = :NEW.sprint_id;
        END IF;
    END IF;

END trg_task_sprint_count;
/


-- =============================================================================
-- TELEGRAM TRIGGERS
-- =============================================================================

-- -----------------------------------------------------------------------------
-- trg_tlc_bi — BEFORE INSERT on telegram_link_codes
-- Marks any existing active (used = 0) code for this user as used = 1
-- before the new code is inserted. Works in concert with the
-- uq_tlc_active_user function-based index to guarantee exactly one
-- active code per user at all times.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE TRIGGER trg_tlc_bi
BEFORE INSERT ON telegram_link_codes
FOR EACH ROW
BEGIN
    UPDATE telegram_link_codes
    SET    used    = 1
    WHERE  user_id = :NEW.user_id
      AND  used    = 0;
END trg_tlc_bi;
/
