-- =============================================================================
-- SEED DATA — Viernes-13 / Oracle Project Management Tool
-- Generated for demo/KPI showcase purposes.
-- Timestamps are simulated to exercise all KPI scenarios:
--   KPI-P1  avg cycle time          → tasks with varying IN_PROGRESS durations
--   KPI-P2  scope creep             → tasks added after sprint activation
--   KPI-V2  aging WIP               → Sprint 3 tasks left IN_PROGRESS
--   KPI-V3  blocked tasks           → several tasks that passed through BLOCKED
--   KPI-A2  time-to-action          → tasks assigned but slow to start
--   KPI-O1  effort logged           → task_work_logs populated
--   rework  rework_count > 0        → a few tasks moved back from DONE
--
-- Triggers handle:
--   • task_assignment_histories  (trg_task_ai, trg_task_au)
--   • task_state_histories       (trg_task_au — needs app_ctx.set_actor)
--   • sprints.planned_task_count (trg_task_sprint_count)
--   • temporal columns           (trg_task_bi, trg_task_bu)
--
-- Because we are inserting historical data directly (bypassing the app layer)
-- we must:
--   1. Call app_ctx.set_actor before any task status UPDATE.
--   2. Insert task_state_histories manually for the initial INSERT transition
--      (trigger only fires on UPDATE).
--   3. Insert task_assignment_histories manually for the first assignment
--      (trg_task_ai covers it, but we set assignee_id in INSERT so it fires).
--   4. Disable trg_task_sprint_count while seeding so planned_task_count
--      is set explicitly per sprint rather than double-counted.
-- =============================================================================
SET DEFINE OFF

-- ---------------------------------------------------------------------------
-- 0. DISABLE count trigger during bulk seed; we will set planned_task_count
--    explicitly on each sprint row after all tasks are inserted.
-- ---------------------------------------------------------------------------
ALTER TRIGGER trg_task_sprint_count DISABLE;


-- =============================================================================
-- 1. USERS
-- =============================================================================
-- UUIDs are fixed so we can reference them by variable throughout the script.
-- OCI IAM IDs are placeholder strings (auth not yet configured).

-- Baltazar Servín Riveroll  — DEVELOPER
INSERT INTO users (id, oci_iam_id, email, system_role, created_at)
VALUES (
    HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'),
    'A01643496@tec.mx',
    'A01643496@tec.mx',
    'DEVELOPER',
    TIMESTAMP '2026-02-20 09:00:00'
);

-- Ana Elena Velasco García  — DEVELOPER
INSERT INTO users (id, oci_iam_id, email, system_role, created_at)
VALUES (
    HEXTORAW('E5E7D6DC9BA54E7A95B198EF1AA32060'),
    'a01639866@tec.mx',
    'a01639866@tec.mx',
    'DEVELOPER',
    TIMESTAMP '2026-02-20 09:05:00'
);

-- Luis Ignacio Gómez López  — DEVELOPER
INSERT INTO users (id, oci_iam_id, email, system_role, created_at)
VALUES (
    HEXTORAW('D9664711BC1348ABA56BCA68B161244A'),
    'A01644423@tec.mx',
    'A01644423@tec.mx',
    'DEVELOPER',
    TIMESTAMP '2026-02-20 09:10:00'
);

-- Ana Paula Navarro Hernández  — DEVELOPER
INSERT INTO users (id, oci_iam_id, email, system_role, created_at)
VALUES (
    HEXTORAW('09F9156961144414AF1D9815FED84D5F'),
    'A01644875@tec.mx',
    'A01644875@tec.mx',
    'DEVELOPER',
    TIMESTAMP '2026-02-20 09:15:00'
);

-- jozefhdez  — DEVELOPER
INSERT INTO users (id, oci_iam_id, email, system_role, created_at)
VALUES (
    HEXTORAW('DB5CABA59E764D2C83167B8578AB06DB'),
    'a01644644@tec.mx',
    'a01644644@tec.mx',
    'DEVELOPER',
    TIMESTAMP '2026-02-20 09:20:00'
);


-- =============================================================================
-- 2. PROJECT
-- =============================================================================
INSERT INTO projects (id, name, description, owner_id, created_at)
VALUES (
    HEXTORAW('F18FB987E9A04CA58213404D089F41AA'),
    'Oracle Project Management Tool',
    'Develop a software to Oracle to help reduce 20% of administrative work.',
    HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'),   -- Baltazar is owner
    TIMESTAMP '2026-02-20 09:30:00'
);


-- =============================================================================
-- 3. PROJECT MEMBERS
-- =============================================================================
-- Baltazar → PROJECT_MANAGER within the project
INSERT INTO project_members (id, project_id, user_id, role, joined_at)
VALUES (
    HEXTORAW('85991BFEDF41459EA0D4D8784F1C4283'),
    HEXTORAW('F18FB987E9A04CA58213404D089F41AA'),
    HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'),
    'PROJECT_MANAGER',
    TIMESTAMP '2026-02-20 09:30:00'
);

INSERT INTO project_members (id, project_id, user_id, role, joined_at)
VALUES (
    HEXTORAW('242C360C69644F328E5D320BE4117C28'),
    HEXTORAW('F18FB987E9A04CA58213404D089F41AA'),
    HEXTORAW('D9664711BC1348ABA56BCA68B161244A'),
    'DEVELOPER',
    TIMESTAMP '2026-02-20 09:30:00'
);

INSERT INTO project_members (id, project_id, user_id, role, joined_at)
VALUES (
    HEXTORAW('F9B3682278CE41D19E4F33FDD3149784'),
    HEXTORAW('F18FB987E9A04CA58213404D089F41AA'),
    HEXTORAW('DB5CABA59E764D2C83167B8578AB06DB'),
    'DEVELOPER',
    TIMESTAMP '2026-02-20 09:30:00'
);

INSERT INTO project_members (id, project_id, user_id, role, joined_at)
VALUES (
    HEXTORAW('D809FFE4F3EE4D44BBB01BC8E823CB89'),
    HEXTORAW('F18FB987E9A04CA58213404D089F41AA'),
    HEXTORAW('E5E7D6DC9BA54E7A95B198EF1AA32060'),
    'DEVELOPER',
    TIMESTAMP '2026-02-20 09:30:00'
);

INSERT INTO project_members (id, project_id, user_id, role, joined_at)
VALUES (
    HEXTORAW('4C7477B0E82D40BC95961611A7C8505A'),
    HEXTORAW('F18FB987E9A04CA58213404D089F41AA'),
    HEXTORAW('09F9156961144414AF1D9815FED84D5F'),
    'DEVELOPER',
    TIMESTAMP '2026-02-20 09:30:00'
);


-- =============================================================================
-- 4. SPRINTS
-- planned_task_count will be updated at the end of this script.
-- =============================================================================

-- Sprint 1 — Infrastructure & Kickoff  (COMPLETED — was "Active overdue")
INSERT INTO sprints (id, name, project_id, status, start_date, end_date, planned_task_count)
VALUES (
    HEXTORAW('A4F9BF0579724468B818665F2FC03AA1'),
    'Sprint 1 — Infrastructure & Kickoff',
    HEXTORAW('F18FB987E9A04CA58213404D089F41AA'),
    'COMPLETED',
    DATE '2026-02-23',
    DATE '2026-03-14',
    0   -- will be updated
);

-- Sprint 2 — Dashboard & Database  (COMPLETED — was "Active overdue")
INSERT INTO sprints (id, name, project_id, status, start_date, end_date, planned_task_count)
VALUES (
    HEXTORAW('9E957AA9278043FDB4AAD86065F344F9'),
    'Sprint 2 — Dashboard & Database',
    HEXTORAW('F18FB987E9A04CA58213404D089F41AA'),
    'COMPLETED',
    DATE '2026-03-23',
    DATE '2026-04-11',
    0
);

-- Sprint 3 — Auth via OCI IAM  (ACTIVE)
INSERT INTO sprints (id, name, project_id, status, start_date, end_date, planned_task_count)
VALUES (
    HEXTORAW('99087F6CA1DC4845989F419A1D58B6DA'),
    'Sprint 3 — Auth via OCI IAM (OIDC)',
    HEXTORAW('F18FB987E9A04CA58213404D089F41AA'),
    'ACTIVE',
    DATE '2026-04-13',
    DATE '2026-04-25',
    0
);


-- =============================================================================
-- 5. TASKS
--
-- Strategy for simulated lifecycle (all Sprint 1 & 2 tasks are DONE):
--
--  • Most tasks: clean happy path  TODO → IN_PROGRESS → DONE
--  • ~4 tasks:   passed through BLOCKED before completing        (KPI-V3 history)
--  • ~3 tasks:   rework — moved DONE → IN_PROGRESS → DONE again  (rework_count)
--  • ~2 tasks:   added to sprint after activation                 (scope creep KPI-P2)
--  • Sprint 3:   parent tasks IN_PROGRESS, subtasks TODO          (KPI-V2 aging WIP)
--
-- Because triggers stamp temporal columns on UPDATE, we insert tasks
-- with their FINAL state and manually set the temporal columns to
-- historically plausible values. We also insert task_state_histories
-- directly to give the KPI queries full event data.
--
-- NOTE on "Unassigned" tasks in the .md: we assign them to Baltazar
-- (as PM he owns unowned items).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Convenience: set actor = Baltazar / WEB for all history inserts
-- ---------------------------------------------------------------------------

BEGIN
    app_ctx.set_actor(HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), 'WEB');
END;
/

-- ============================================================
-- SPRINT 1 TASKS
-- Sprint ran 2026-02-23 → 2026-03-14 (19 days)
-- Tasks created ~Feb 23, worked through the sprint.
-- ============================================================

-- V13-42 | Configure OCI Environment | Ana Elena | DONE  (normal path)
INSERT INTO tasks (id, title, description, status, priority, project_id, sprint_id,
                   assignee_id, created_by, created_at, sprint_added_at, assigned_at,
                   entered_in_progress_at, completed_at, rework_count)
VALUES (
    HEXTORAW('E0000000000000000000000000000001'),
    'V13-42 Configure OCI Environment',
    'As a Developer, I want to configure the OCI environment so that I can deploy the Cloud Native application.',
    'DONE', 'HIGH',
    HEXTORAW('F18FB987E9A04CA58213404D089F41AA'),
    HEXTORAW('A4F9BF0579724468B818665F2FC03AA1'),
    HEXTORAW('E5E7D6DC9BA54E7A95B198EF1AA32060'),  -- Ana Elena
    HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'),  -- created by Baltazar
    TIMESTAMP '2026-02-23 08:00:00',
    TIMESTAMP '2026-02-23 08:00:00',
    TIMESTAMP '2026-02-23 08:00:00',
    TIMESTAMP '2026-02-23 10:00:00',
    TIMESTAMP '2026-02-25 17:00:00',
    0
);
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at)
VALUES (HEXTORAW('E0000000000000000000000000000001'), HEXTORAW('E5E7D6DC9BA54E7A95B198EF1AA32060'), NULL, 'TODO', 'WEB', TIMESTAMP '2026-02-23 08:00:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at)
VALUES (HEXTORAW('E0000000000000000000000000000001'), HEXTORAW('E5E7D6DC9BA54E7A95B198EF1AA32060'), 'TODO', 'IN_PROGRESS', 'WEB', TIMESTAMP '2026-02-23 10:00:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at)
VALUES (HEXTORAW('E0000000000000000000000000000001'), HEXTORAW('E5E7D6DC9BA54E7A95B198EF1AA32060'), 'IN_PROGRESS', 'DONE', 'WEB', TIMESTAMP '2026-02-25 17:00:00');
INSERT INTO task_work_logs (task_id, user_id, work_date, hours_worked) VALUES (HEXTORAW('E0000000000000000000000000000001'), HEXTORAW('E5E7D6DC9BA54E7A95B198EF1AA32060'), DATE '2026-02-25', 9.0);


-- V13-43 | Create OCI Compartment and VCN | Baltazar | DONE
INSERT INTO tasks (id, title, description, status, priority, project_id, sprint_id,
                   assignee_id, created_by, created_at, sprint_added_at, assigned_at,
                   entered_in_progress_at, completed_at, rework_count)
VALUES (
    HEXTORAW('E0000000000000000000000000000002'),
    'V13-43 Create OCI Compartment and a Virtual Cloud Network',
    NULL,
    'DONE', 'HIGH',
    HEXTORAW('F18FB987E9A04CA58213404D089F41AA'),
    HEXTORAW('A4F9BF0579724468B818665F2FC03AA1'),
    HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'),
    HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'),
    TIMESTAMP '2026-02-23 08:05:00',
    TIMESTAMP '2026-02-23 08:05:00',
    TIMESTAMP '2026-02-23 08:05:00',
    TIMESTAMP '2026-02-23 09:00:00',
    TIMESTAMP '2026-02-24 16:00:00',
    0
);
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at)
VALUES (HEXTORAW('E0000000000000000000000000000002'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), NULL, 'TODO', 'WEB', TIMESTAMP '2026-02-23 08:05:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at)
VALUES (HEXTORAW('E0000000000000000000000000000002'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), 'TODO', 'IN_PROGRESS', 'WEB', TIMESTAMP '2026-02-23 09:00:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at)
VALUES (HEXTORAW('E0000000000000000000000000000002'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), 'IN_PROGRESS', 'DONE', 'WEB', TIMESTAMP '2026-02-24 16:00:00');
INSERT INTO task_work_logs (task_id, user_id, work_date, hours_worked) VALUES (HEXTORAW('E0000000000000000000000000000002'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), DATE '2026-02-24', 7.0);


-- V13-44 | Set up Kubernetes Cluster (OKE) | Baltazar | DONE  (BLOCKED scenario)
INSERT INTO tasks (id, title, description, status, priority, project_id, sprint_id,
                   assignee_id, created_by, created_at, sprint_added_at, assigned_at,
                   entered_in_progress_at, blocked_at, completed_at, rework_count)
VALUES (
    HEXTORAW('E0000000000000000000000000000003'),
    'V13-44 Set up a Kubernetes Cluster (OKE) for microservices deployment',
    NULL,
    'DONE', 'HIGH',
    HEXTORAW('F18FB987E9A04CA58213404D089F41AA'),
    HEXTORAW('A4F9BF0579724468B818665F2FC03AA1'),
    HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'),
    HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'),
    TIMESTAMP '2026-02-23 08:10:00',
    TIMESTAMP '2026-02-23 08:10:00',
    TIMESTAMP '2026-02-23 08:10:00',
    TIMESTAMP '2026-02-23 11:00:00',
    NULL,  -- blocked_at is NULL because task is DONE (unblocked)
    TIMESTAMP '2026-02-27 15:00:00',
    0
);
-- State history includes a BLOCKED detour
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at)
VALUES (HEXTORAW('E0000000000000000000000000000003'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), NULL, 'TODO', 'WEB', TIMESTAMP '2026-02-23 08:10:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at)
VALUES (HEXTORAW('E0000000000000000000000000000003'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), 'TODO', 'IN_PROGRESS', 'WEB', TIMESTAMP '2026-02-23 11:00:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at)
VALUES (HEXTORAW('E0000000000000000000000000000003'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), 'IN_PROGRESS', 'BLOCKED', 'WEB', TIMESTAMP '2026-02-24 14:00:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at)
VALUES (HEXTORAW('E0000000000000000000000000000003'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), 'BLOCKED', 'IN_PROGRESS', 'WEB', TIMESTAMP '2026-02-26 09:00:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at)
VALUES (HEXTORAW('E0000000000000000000000000000003'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), 'IN_PROGRESS', 'DONE', 'WEB', TIMESTAMP '2026-02-27 15:00:00');
INSERT INTO task_work_logs (task_id, user_id, work_date, hours_worked) VALUES (HEXTORAW('E0000000000000000000000000000003'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), DATE '2026-02-27', 9.0);


-- V13-45 | Configure local IDE | Luis | DONE
INSERT INTO tasks (id, title, description, status, priority, project_id, sprint_id,
                   assignee_id, created_by, created_at, sprint_added_at, assigned_at,
                   entered_in_progress_at, completed_at, rework_count)
VALUES (
    HEXTORAW('E0000000000000000000000000000004'),
    'V13-45 Configure local IDE (IntelliJ/VS Code) with OCI CLI and Docker',
    NULL,
    'DONE', 'MEDIUM',
    HEXTORAW('F18FB987E9A04CA58213404D089F41AA'),
    HEXTORAW('A4F9BF0579724468B818665F2FC03AA1'),
    HEXTORAW('D9664711BC1348ABA56BCA68B161244A'),
    HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'),
    TIMESTAMP '2026-02-23 08:15:00',
    TIMESTAMP '2026-02-23 08:15:00',
    TIMESTAMP '2026-02-23 08:15:00',
    TIMESTAMP '2026-02-23 13:00:00',
    TIMESTAMP '2026-02-24 12:00:00',
    0
);
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at)
VALUES (HEXTORAW('E0000000000000000000000000000004'), HEXTORAW('D9664711BC1348ABA56BCA68B161244A'), NULL, 'TODO', 'WEB', TIMESTAMP '2026-02-23 08:15:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at)
VALUES (HEXTORAW('E0000000000000000000000000000004'), HEXTORAW('D9664711BC1348ABA56BCA68B161244A'), 'TODO', 'IN_PROGRESS', 'WEB', TIMESTAMP '2026-02-23 13:00:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at)
VALUES (HEXTORAW('E0000000000000000000000000000004'), HEXTORAW('D9664711BC1348ABA56BCA68B161244A'), 'IN_PROGRESS', 'DONE', 'WEB', TIMESTAMP '2026-02-24 12:00:00');
INSERT INTO task_work_logs (task_id, user_id, work_date, hours_worked) VALUES (HEXTORAW('E0000000000000000000000000000004'), HEXTORAW('D9664711BC1348ABA56BCA68B161244A'), DATE '2026-02-24', 6.0);


-- V13-46 | Create Scrum Board | Ana Paula | DONE
INSERT INTO tasks (id, title, description, status, priority, project_id, sprint_id,
                   assignee_id, created_by, created_at, sprint_added_at, assigned_at,
                   entered_in_progress_at, completed_at, rework_count)
VALUES (
    HEXTORAW('E0000000000000000000000000000005'),
    'V13-46 Create the Scrum Board and Invite Team Members',
    NULL,
    'DONE', 'MEDIUM',
    HEXTORAW('F18FB987E9A04CA58213404D089F41AA'),
    HEXTORAW('A4F9BF0579724468B818665F2FC03AA1'),
    HEXTORAW('09F9156961144414AF1D9815FED84D5F'),
    HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'),
    TIMESTAMP '2026-02-23 08:20:00',
    TIMESTAMP '2026-02-23 08:20:00',
    TIMESTAMP '2026-02-23 08:20:00',
    TIMESTAMP '2026-02-23 09:30:00',
    TIMESTAMP '2026-02-23 14:00:00',
    0
);
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at)
VALUES (HEXTORAW('E0000000000000000000000000000005'), HEXTORAW('09F9156961144414AF1D9815FED84D5F'), NULL, 'TODO', 'WEB', TIMESTAMP '2026-02-23 08:20:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at)
VALUES (HEXTORAW('E0000000000000000000000000000005'), HEXTORAW('09F9156961144414AF1D9815FED84D5F'), 'TODO', 'IN_PROGRESS', 'WEB', TIMESTAMP '2026-02-23 09:30:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at)
VALUES (HEXTORAW('E0000000000000000000000000000005'), HEXTORAW('09F9156961144414AF1D9815FED84D5F'), 'IN_PROGRESS', 'DONE', 'WEB', TIMESTAMP '2026-02-23 14:00:00');
INSERT INTO task_work_logs (task_id, user_id, work_date, hours_worked) VALUES (HEXTORAW('E0000000000000000000000000000005'), HEXTORAW('09F9156961144414AF1D9815FED84D5F'), DATE '2026-02-23', 3.0);


-- V13-48 | Analyze base code | Ana Elena | DONE
INSERT INTO tasks (id, title, description, status, priority, project_id, sprint_id,
                   assignee_id, created_by, created_at, sprint_added_at, assigned_at,
                   entered_in_progress_at, completed_at, rework_count)
VALUES (
    HEXTORAW('E0000000000000000000000000000006'),
    'V13-48 Analyze the provided base code',
    'As a Developer, I want to analyze the provided base code so that I can plan the microservices architecture.',
    'DONE', 'HIGH',
    HEXTORAW('F18FB987E9A04CA58213404D089F41AA'),
    HEXTORAW('A4F9BF0579724468B818665F2FC03AA1'),
    HEXTORAW('E5E7D6DC9BA54E7A95B198EF1AA32060'),
    HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'),
    TIMESTAMP '2026-02-23 08:30:00',
    TIMESTAMP '2026-02-23 08:30:00',
    TIMESTAMP '2026-02-23 08:30:00',
    TIMESTAMP '2026-02-24 09:00:00',
    TIMESTAMP '2026-02-26 16:00:00',
    0
);
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at)
VALUES (HEXTORAW('E0000000000000000000000000000006'), HEXTORAW('E5E7D6DC9BA54E7A95B198EF1AA32060'), NULL, 'TODO', 'WEB', TIMESTAMP '2026-02-23 08:30:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at)
VALUES (HEXTORAW('E0000000000000000000000000000006'), HEXTORAW('E5E7D6DC9BA54E7A95B198EF1AA32060'), 'TODO', 'IN_PROGRESS', 'WEB', TIMESTAMP '2026-02-24 09:00:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at)
VALUES (HEXTORAW('E0000000000000000000000000000006'), HEXTORAW('E5E7D6DC9BA54E7A95B198EF1AA32060'), 'IN_PROGRESS', 'DONE', 'WEB', TIMESTAMP '2026-02-26 16:00:00');
INSERT INTO task_work_logs (task_id, user_id, work_date, hours_worked) VALUES (HEXTORAW('E0000000000000000000000000000006'), HEXTORAW('E5E7D6DC9BA54E7A95B198EF1AA32060'), DATE '2026-02-26', 8.0);


-- V13-49 | Clone repo & run local build | Luis | DONE
INSERT INTO tasks (id, title, description, status, priority, project_id, sprint_id,
                   assignee_id, created_by, created_at, sprint_added_at, assigned_at,
                   entered_in_progress_at, completed_at, rework_count)
VALUES (
    HEXTORAW('E0000000000000000000000000000007'),
    'V13-49 Clone the GitHub repository and run a local build',
    NULL,
    'DONE', 'MEDIUM',
    HEXTORAW('F18FB987E9A04CA58213404D089F41AA'),
    HEXTORAW('A4F9BF0579724468B818665F2FC03AA1'),
    HEXTORAW('D9664711BC1348ABA56BCA68B161244A'),
    HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'),
    TIMESTAMP '2026-02-23 08:35:00',
    TIMESTAMP '2026-02-23 08:35:00',
    TIMESTAMP '2026-02-23 08:35:00',
    TIMESTAMP '2026-02-23 14:00:00',
    TIMESTAMP '2026-02-23 17:00:00',
    0
);
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at)
VALUES (HEXTORAW('E0000000000000000000000000000007'), HEXTORAW('D9664711BC1348ABA56BCA68B161244A'), NULL, 'TODO', 'WEB', TIMESTAMP '2026-02-23 08:35:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at)
VALUES (HEXTORAW('E0000000000000000000000000000007'), HEXTORAW('D9664711BC1348ABA56BCA68B161244A'), 'TODO', 'IN_PROGRESS', 'WEB', TIMESTAMP '2026-02-23 14:00:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at)
VALUES (HEXTORAW('E0000000000000000000000000000007'), HEXTORAW('D9664711BC1348ABA56BCA68B161244A'), 'IN_PROGRESS', 'DONE', 'WEB', TIMESTAMP '2026-02-23 17:00:00');
INSERT INTO task_work_logs (task_id, user_id, work_date, hours_worked) VALUES (HEXTORAW('E0000000000000000000000000000007'), HEXTORAW('D9664711BC1348ABA56BCA68B161244A'), DATE '2026-02-23', 3.0);


-- V13-50 | Map endpoints & Telegram Bot | jozefhdez | DONE
INSERT INTO tasks (id, title, description, status, priority, project_id, sprint_id,
                   assignee_id, created_by, created_at, sprint_added_at, assigned_at,
                   entered_in_progress_at, completed_at, rework_count)
VALUES (
    HEXTORAW('E0000000000000000000000000000008'),
    'V13-50 Map the existing endpoints and Telegram Bot integration logic',
    NULL,
    'DONE', 'MEDIUM',
    HEXTORAW('F18FB987E9A04CA58213404D089F41AA'),
    HEXTORAW('A4F9BF0579724468B818665F2FC03AA1'),
    HEXTORAW('DB5CABA59E764D2C83167B8578AB06DB'),
    HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'),
    TIMESTAMP '2026-02-23 08:40:00',
    TIMESTAMP '2026-02-23 08:40:00',
    TIMESTAMP '2026-02-23 08:40:00',
    TIMESTAMP '2026-02-24 10:00:00',
    TIMESTAMP '2026-02-25 16:00:00',
    0
);
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at)
VALUES (HEXTORAW('E0000000000000000000000000000008'), HEXTORAW('DB5CABA59E764D2C83167B8578AB06DB'), NULL, 'TODO', 'WEB', TIMESTAMP '2026-02-23 08:40:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at)
VALUES (HEXTORAW('E0000000000000000000000000000008'), HEXTORAW('DB5CABA59E764D2C83167B8578AB06DB'), 'TODO', 'IN_PROGRESS', 'WEB', TIMESTAMP '2026-02-24 10:00:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at)
VALUES (HEXTORAW('E0000000000000000000000000000008'), HEXTORAW('DB5CABA59E764D2C83167B8578AB06DB'), 'IN_PROGRESS', 'DONE', 'WEB', TIMESTAMP '2026-02-25 16:00:00');
INSERT INTO task_work_logs (task_id, user_id, work_date, hours_worked) VALUES (HEXTORAW('E0000000000000000000000000000008'), HEXTORAW('DB5CABA59E764D2C83167B8578AB06DB'), DATE '2026-02-25', 8.0);


-- V13-51 | HLD Diagram | Ana Elena | DONE  (REWORK scenario)
INSERT INTO tasks (id, title, description, status, priority, project_id, sprint_id,
                   assignee_id, created_by, created_at, sprint_added_at, assigned_at,
                   entered_in_progress_at, completed_at, rework_count)
VALUES (
    HEXTORAW('E0000000000000000000000000000009'),
    'V13-51 Create a High-Level Architecture diagram (HLD)',
    NULL,
    'DONE', 'MEDIUM',
    HEXTORAW('F18FB987E9A04CA58213404D089F41AA'),
    HEXTORAW('A4F9BF0579724468B818665F2FC03AA1'),
    HEXTORAW('E5E7D6DC9BA54E7A95B198EF1AA32060'),
    HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'),
    TIMESTAMP '2026-02-23 08:45:00',
    TIMESTAMP '2026-02-23 08:45:00',
    TIMESTAMP '2026-02-23 08:45:00',
    TIMESTAMP '2026-02-24 09:00:00',
    TIMESTAMP '2026-03-02 15:00:00',
    1   -- reworked once
);
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at)
VALUES (HEXTORAW('E0000000000000000000000000000009'), HEXTORAW('E5E7D6DC9BA54E7A95B198EF1AA32060'), NULL, 'TODO', 'WEB', TIMESTAMP '2026-02-23 08:45:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at)
VALUES (HEXTORAW('E0000000000000000000000000000009'), HEXTORAW('E5E7D6DC9BA54E7A95B198EF1AA32060'), 'TODO', 'IN_PROGRESS', 'WEB', TIMESTAMP '2026-02-24 09:00:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at)
VALUES (HEXTORAW('E0000000000000000000000000000009'), HEXTORAW('E5E7D6DC9BA54E7A95B198EF1AA32060'), 'IN_PROGRESS', 'DONE', 'WEB', TIMESTAMP '2026-02-26 17:00:00');
-- Rework: stakeholder requested updates
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at)
VALUES (HEXTORAW('E0000000000000000000000000000009'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), 'DONE', 'IN_PROGRESS', 'WEB', TIMESTAMP '2026-02-27 10:00:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at)
VALUES (HEXTORAW('E0000000000000000000000000000009'), HEXTORAW('E5E7D6DC9BA54E7A95B198EF1AA32060'), 'IN_PROGRESS', 'DONE', 'WEB', TIMESTAMP '2026-03-02 15:00:00');
INSERT INTO task_work_logs (task_id, user_id, work_date, hours_worked) VALUES (HEXTORAW('E0000000000000000000000000000009'), HEXTORAW('E5E7D6DC9BA54E7A95B198EF1AA32060'), DATE '2026-03-02', 8.0);


-- V13-52 | Containerize Spring Boot | jozefhdez | DONE
INSERT INTO tasks (id, title, description, status, priority, project_id, sprint_id,
                   assignee_id, created_by, created_at, sprint_added_at, assigned_at,
                   entered_in_progress_at, completed_at, rework_count)
VALUES (
    HEXTORAW('E000000000000000000000000000000A'),
    'V13-52 Containerize the Spring Boot application using Docker',
    NULL,
    'DONE', 'HIGH',
    HEXTORAW('F18FB987E9A04CA58213404D089F41AA'),
    HEXTORAW('A4F9BF0579724468B818665F2FC03AA1'),
    HEXTORAW('DB5CABA59E764D2C83167B8578AB06DB'),
    HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'),
    TIMESTAMP '2026-02-23 08:50:00',
    TIMESTAMP '2026-02-23 08:50:00',
    TIMESTAMP '2026-02-23 08:50:00',
    TIMESTAMP '2026-02-25 10:00:00',
    TIMESTAMP '2026-02-27 16:00:00',
    0
);
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at)
VALUES (HEXTORAW('E000000000000000000000000000000A'), HEXTORAW('DB5CABA59E764D2C83167B8578AB06DB'), NULL, 'TODO', 'WEB', TIMESTAMP '2026-02-23 08:50:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at)
VALUES (HEXTORAW('E000000000000000000000000000000A'), HEXTORAW('DB5CABA59E764D2C83167B8578AB06DB'), 'TODO', 'IN_PROGRESS', 'WEB', TIMESTAMP '2026-02-25 10:00:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at)
VALUES (HEXTORAW('E000000000000000000000000000000A'), HEXTORAW('DB5CABA59E764D2C83167B8578AB06DB'), 'IN_PROGRESS', 'DONE', 'WEB', TIMESTAMP '2026-02-27 16:00:00');
INSERT INTO task_work_logs (task_id, user_id, work_date, hours_worked) VALUES (HEXTORAW('E000000000000000000000000000000A'), HEXTORAW('DB5CABA59E764D2C83167B8578AB06DB'), DATE '2026-02-27', 14.0);


-- V13-59 | Define Initial KPIs | Ana Elena | DONE
INSERT INTO tasks (id, title, description, status, priority, project_id, sprint_id,
                   assignee_id, created_by, created_at, sprint_added_at, assigned_at,
                   entered_in_progress_at, completed_at, rework_count)
VALUES (
    HEXTORAW('E000000000000000000000000000000B'),
    'V13-59 Define Initial KPIs for the project',
    NULL,
    'DONE', 'HIGH',
    HEXTORAW('F18FB987E9A04CA58213404D089F41AA'),
    HEXTORAW('A4F9BF0579724468B818665F2FC03AA1'),
    HEXTORAW('E5E7D6DC9BA54E7A95B198EF1AA32060'),
    HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'),
    TIMESTAMP '2026-02-23 09:00:00',
    TIMESTAMP '2026-02-23 09:00:00',
    TIMESTAMP '2026-02-23 09:00:00',
    TIMESTAMP '2026-02-23 10:30:00',
    TIMESTAMP '2026-02-25 12:00:00',
    0
);
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at)
VALUES (HEXTORAW('E000000000000000000000000000000B'), HEXTORAW('E5E7D6DC9BA54E7A95B198EF1AA32060'), NULL, 'TODO', 'WEB', TIMESTAMP '2026-02-23 09:00:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at)
VALUES (HEXTORAW('E000000000000000000000000000000B'), HEXTORAW('E5E7D6DC9BA54E7A95B198EF1AA32060'), 'TODO', 'IN_PROGRESS', 'WEB', TIMESTAMP '2026-02-23 10:30:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at)
VALUES (HEXTORAW('E000000000000000000000000000000B'), HEXTORAW('E5E7D6DC9BA54E7A95B198EF1AA32060'), 'IN_PROGRESS', 'DONE', 'WEB', TIMESTAMP '2026-02-25 12:00:00');
INSERT INTO task_work_logs (task_id, user_id, work_date, hours_worked) VALUES (HEXTORAW('E000000000000000000000000000000B'), HEXTORAW('E5E7D6DC9BA54E7A95B198EF1AA32060'), DATE '2026-02-25', 6.0);


-- V13-60 | Establish Jira | Ana Paula | DONE
INSERT INTO tasks (id, title, description, status, priority, project_id, sprint_id,
                   assignee_id, created_by, created_at, sprint_added_at, assigned_at,
                   entered_in_progress_at, completed_at, rework_count)
VALUES (
    HEXTORAW('E000000000000000000000000000000C'),
    'V13-60 Establish the Project Management Tool (Jira)',
    'As a Team Member, I want to establish the Project Management Tool (Jira) to track our 20% productivity goal.',
    'DONE', 'MEDIUM',
    HEXTORAW('F18FB987E9A04CA58213404D089F41AA'),
    HEXTORAW('A4F9BF0579724468B818665F2FC03AA1'),
    HEXTORAW('09F9156961144414AF1D9815FED84D5F'),
    HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'),
    TIMESTAMP '2026-02-23 09:05:00',
    TIMESTAMP '2026-02-23 09:05:00',
    TIMESTAMP '2026-02-23 09:05:00',
    TIMESTAMP '2026-02-23 09:15:00',
    TIMESTAMP '2026-02-23 11:30:00',
    0
);
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at)
VALUES (HEXTORAW('E000000000000000000000000000000C'), HEXTORAW('09F9156961144414AF1D9815FED84D5F'), NULL, 'TODO', 'WEB', TIMESTAMP '2026-02-23 09:05:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at)
VALUES (HEXTORAW('E000000000000000000000000000000C'), HEXTORAW('09F9156961144414AF1D9815FED84D5F'), 'TODO', 'IN_PROGRESS', 'WEB', TIMESTAMP '2026-02-23 09:15:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at)
VALUES (HEXTORAW('E000000000000000000000000000000C'), HEXTORAW('09F9156961144414AF1D9815FED84D5F'), 'IN_PROGRESS', 'DONE', 'WEB', TIMESTAMP '2026-02-23 11:30:00');
INSERT INTO task_work_logs (task_id, user_id, work_date, hours_worked) VALUES (HEXTORAW('E000000000000000000000000000000C'), HEXTORAW('09F9156961144414AF1D9815FED84D5F'), DATE '2026-02-23', 2.0);


-- V13-61 | Perform Initial Deployment | Ana Paula | DONE  (BLOCKED scenario)
INSERT INTO tasks (id, title, description, status, priority, project_id, sprint_id,
                   assignee_id, created_by, created_at, sprint_added_at, assigned_at,
                   entered_in_progress_at, completed_at, rework_count)
VALUES (
    HEXTORAW('E000000000000000000000000000000D'),
    'V13-61 Perform the Initial Deployment',
    'As a Developer, I want to perform the Initial Deployment to understand how the process works.',
    'DONE', 'HIGH',
    HEXTORAW('F18FB987E9A04CA58213404D089F41AA'),
    HEXTORAW('A4F9BF0579724468B818665F2FC03AA1'),
    HEXTORAW('09F9156961144414AF1D9815FED84D5F'),
    HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'),
    TIMESTAMP '2026-02-25 09:00:00',
    TIMESTAMP '2026-02-25 09:00:00',
    TIMESTAMP '2026-02-25 09:00:00',
    TIMESTAMP '2026-02-25 10:00:00',
    TIMESTAMP '2026-03-04 14:00:00',
    0
);
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at)
VALUES (HEXTORAW('E000000000000000000000000000000D'), HEXTORAW('09F9156961144414AF1D9815FED84D5F'), NULL, 'TODO', 'WEB', TIMESTAMP '2026-02-25 09:00:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at)
VALUES (HEXTORAW('E000000000000000000000000000000D'), HEXTORAW('09F9156961144414AF1D9815FED84D5F'), 'TODO', 'IN_PROGRESS', 'WEB', TIMESTAMP '2026-02-25 10:00:00');
-- Blocked: OKE cluster not ready yet
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at)
VALUES (HEXTORAW('E000000000000000000000000000000D'), HEXTORAW('09F9156961144414AF1D9815FED84D5F'), 'IN_PROGRESS', 'BLOCKED', 'WEB', TIMESTAMP '2026-02-26 11:00:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at)
VALUES (HEXTORAW('E000000000000000000000000000000D'), HEXTORAW('09F9156961144414AF1D9815FED84D5F'), 'BLOCKED', 'IN_PROGRESS', 'WEB', TIMESTAMP '2026-02-28 09:00:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at)
VALUES (HEXTORAW('E000000000000000000000000000000D'), HEXTORAW('09F9156961144414AF1D9815FED84D5F'), 'IN_PROGRESS', 'DONE', 'WEB', TIMESTAMP '2026-03-04 14:00:00');
INSERT INTO task_work_logs (task_id, user_id, work_date, hours_worked) VALUES (HEXTORAW('E000000000000000000000000000000D'), HEXTORAW('09F9156961144414AF1D9815FED84D5F'), DATE '2026-03-04', 18.0);


-- V13-62 | Deploy container to OCIR | Baltazar | DONE
INSERT INTO tasks (id, title, description, status, priority, project_id, sprint_id,
                   assignee_id, created_by, created_at, sprint_added_at, assigned_at,
                   entered_in_progress_at, completed_at, rework_count)
VALUES (
    HEXTORAW('E000000000000000000000000000000E'),
    'V13-62 Deploy the initial container to the OCI Container Registry (OCIR)',
    NULL,
    'DONE', 'HIGH',
    HEXTORAW('F18FB987E9A04CA58213404D089F41AA'),
    HEXTORAW('A4F9BF0579724468B818665F2FC03AA1'),
    HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'),
    HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'),
    TIMESTAMP '2026-02-27 09:00:00',
    TIMESTAMP '2026-02-27 09:00:00',
    TIMESTAMP '2026-02-27 09:00:00',
    TIMESTAMP '2026-02-27 10:00:00',
    TIMESTAMP '2026-02-27 17:00:00',
    0
);
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at)
VALUES (HEXTORAW('E000000000000000000000000000000E'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), NULL, 'TODO', 'WEB', TIMESTAMP '2026-02-27 09:00:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at)
VALUES (HEXTORAW('E000000000000000000000000000000E'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), 'TODO', 'IN_PROGRESS', 'WEB', TIMESTAMP '2026-02-27 10:00:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at)
VALUES (HEXTORAW('E000000000000000000000000000000E'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), 'IN_PROGRESS', 'DONE', 'WEB', TIMESTAMP '2026-02-27 17:00:00');
INSERT INTO task_work_logs (task_id, user_id, work_date, hours_worked) VALUES (HEXTORAW('E000000000000000000000000000000E'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), DATE '2026-02-27', 3.0);


-- V13-63 | Verify task list from deployed service | Ana Paula | DONE
INSERT INTO tasks (id, title, description, status, priority, project_id, sprint_id,
                   assignee_id, created_by, created_at, sprint_added_at, assigned_at,
                   entered_in_progress_at, completed_at, rework_count)
VALUES (
    HEXTORAW('E000000000000000000000000000000F'),
    'V13-63 Verify the Task list or initial response from the deployed service',
    NULL,
    'DONE', 'MEDIUM',
    HEXTORAW('F18FB987E9A04CA58213404D089F41AA'),
    HEXTORAW('A4F9BF0579724468B818665F2FC03AA1'),
    HEXTORAW('09F9156961144414AF1D9815FED84D5F'),
    HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'),
    TIMESTAMP '2026-02-27 17:30:00',
    TIMESTAMP '2026-02-27 17:30:00',
    TIMESTAMP '2026-02-27 17:30:00',
    TIMESTAMP '2026-02-28 09:00:00',
    TIMESTAMP '2026-02-28 11:00:00',
    0
);
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at)
VALUES (HEXTORAW('E000000000000000000000000000000F'), HEXTORAW('09F9156961144414AF1D9815FED84D5F'), NULL, 'TODO', 'WEB', TIMESTAMP '2026-02-27 17:30:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at)
VALUES (HEXTORAW('E000000000000000000000000000000F'), HEXTORAW('09F9156961144414AF1D9815FED84D5F'), 'TODO', 'IN_PROGRESS', 'WEB', TIMESTAMP '2026-02-28 09:00:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at)
VALUES (HEXTORAW('E000000000000000000000000000000F'), HEXTORAW('09F9156961144414AF1D9815FED84D5F'), 'IN_PROGRESS', 'DONE', 'WEB', TIMESTAMP '2026-02-28 11:00:00');
INSERT INTO task_work_logs (task_id, user_id, work_date, hours_worked) VALUES (HEXTORAW('E000000000000000000000000000000F'), HEXTORAW('09F9156961144414AF1D9815FED84D5F'), DATE '2026-02-28', 2.0);


-- V13-64 | Provision ATP | Luis | DONE  (REWORK scenario)
INSERT INTO tasks (id, title, description, status, priority, project_id, sprint_id,
                   assignee_id, created_by, created_at, sprint_added_at, assigned_at,
                   entered_in_progress_at, completed_at, rework_count)
VALUES (
    HEXTORAW('E0000000000000000000000000000010'),
    'V13-64 Provision an Oracle Autonomous Database (ATP) instance',
    NULL,
    'DONE', 'HIGH',
    HEXTORAW('F18FB987E9A04CA58213404D089F41AA'),
    HEXTORAW('A4F9BF0579724468B818665F2FC03AA1'),
    HEXTORAW('D9664711BC1348ABA56BCA68B161244A'),
    HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'),
    TIMESTAMP '2026-02-23 09:10:00',
    TIMESTAMP '2026-02-23 09:10:00',
    TIMESTAMP '2026-02-23 09:10:00',
    TIMESTAMP '2026-02-23 14:00:00',
    TIMESTAMP '2026-03-05 16:00:00',
    1
);
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at)
VALUES (HEXTORAW('E0000000000000000000000000000010'), HEXTORAW('D9664711BC1348ABA56BCA68B161244A'), NULL, 'TODO', 'WEB', TIMESTAMP '2026-02-23 09:10:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at)
VALUES (HEXTORAW('E0000000000000000000000000000010'), HEXTORAW('D9664711BC1348ABA56BCA68B161244A'), 'TODO', 'IN_PROGRESS', 'WEB', TIMESTAMP '2026-02-23 14:00:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at)
VALUES (HEXTORAW('E0000000000000000000000000000010'), HEXTORAW('D9664711BC1348ABA56BCA68B161244A'), 'IN_PROGRESS', 'DONE', 'WEB', TIMESTAMP '2026-02-25 15:00:00');
-- Rework: wrong wallet config discovered
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at)
VALUES (HEXTORAW('E0000000000000000000000000000010'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), 'DONE', 'IN_PROGRESS', 'WEB', TIMESTAMP '2026-03-03 09:00:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at)
VALUES (HEXTORAW('E0000000000000000000000000000010'), HEXTORAW('D9664711BC1348ABA56BCA68B161244A'), 'IN_PROGRESS', 'DONE', 'WEB', TIMESTAMP '2026-03-05 16:00:00');
INSERT INTO task_work_logs (task_id, user_id, work_date, hours_worked) VALUES (HEXTORAW('E0000000000000000000000000000010'), HEXTORAW('D9664711BC1348ABA56BCA68B161244A'), DATE '2026-03-05', 14.0);


-- OCI Training tasks — Sprint 1 (abbreviated: each is a short 0.5d task, no rework)
-- V13-66–V13-84 (15 training tasks across 5 people)

-- Baltazar's training
INSERT INTO tasks (id, title, status, priority, project_id, sprint_id, assignee_id, created_by,
                   created_at, sprint_added_at, assigned_at, entered_in_progress_at, completed_at, rework_count)
VALUES (HEXTORAW('E0000000000000000000000000000011'), 'V13-66 Complete OCI training (Baltazar)',
        'DONE', 'MEDIUM', HEXTORAW('F18FB987E9A04CA58213404D089F41AA'), HEXTORAW('A4F9BF0579724468B818665F2FC03AA1'),
        HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'),
        TIMESTAMP '2026-02-23 09:00:00', TIMESTAMP '2026-02-23 09:00:00', TIMESTAMP '2026-02-23 09:00:00',
        TIMESTAMP '2026-03-02 09:00:00', TIMESTAMP '2026-03-06 17:00:00', 0);
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E0000000000000000000000000000011'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), NULL, 'TODO', 'WEB', TIMESTAMP '2026-02-23 09:00:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E0000000000000000000000000000011'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), 'TODO', 'IN_PROGRESS', 'WEB', TIMESTAMP '2026-03-02 09:00:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E0000000000000000000000000000011'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), 'IN_PROGRESS', 'DONE', 'WEB', TIMESTAMP '2026-03-06 17:00:00');
INSERT INTO task_work_logs (task_id, user_id, work_date, hours_worked) VALUES (HEXTORAW('E0000000000000000000000000000011'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), DATE '2026-03-06', 7.0);

INSERT INTO tasks (id, title, status, priority, project_id, sprint_id, assignee_id, created_by,
                   created_at, sprint_added_at, assigned_at, entered_in_progress_at, completed_at, rework_count)
VALUES (HEXTORAW('E0000000000000000000000000000012'), 'V13-67 Complete the OCI Foundations Associate course (Baltazar)',
        'DONE', 'MEDIUM', HEXTORAW('F18FB987E9A04CA58213404D089F41AA'), HEXTORAW('A4F9BF0579724468B818665F2FC03AA1'),
        HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'),
        TIMESTAMP '2026-03-02 09:00:00', TIMESTAMP '2026-03-02 09:00:00', TIMESTAMP '2026-03-02 09:00:00',
        TIMESTAMP '2026-03-02 09:30:00', TIMESTAMP '2026-03-04 15:00:00', 0);
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E0000000000000000000000000000012'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), NULL, 'TODO', 'WEB', TIMESTAMP '2026-03-02 09:00:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E0000000000000000000000000000012'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), 'TODO', 'IN_PROGRESS', 'WEB', TIMESTAMP '2026-03-02 09:30:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E0000000000000000000000000000012'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), 'IN_PROGRESS', 'DONE', 'WEB', TIMESTAMP '2026-03-04 15:00:00');
INSERT INTO task_work_logs (task_id, user_id, work_date, hours_worked) VALUES (HEXTORAW('E0000000000000000000000000000012'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), DATE '2026-03-04', 5.0);

INSERT INTO tasks (id, title, status, priority, project_id, sprint_id, assignee_id, created_by,
                   created_at, sprint_added_at, assigned_at, entered_in_progress_at, completed_at, rework_count)
VALUES (HEXTORAW('E0000000000000000000000000000013'), 'V13-68 Take the Cloud Native Development badge assessment (Baltazar)',
        'DONE', 'MEDIUM', HEXTORAW('F18FB987E9A04CA58213404D089F41AA'), HEXTORAW('A4F9BF0579724468B818665F2FC03AA1'),
        HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'),
        TIMESTAMP '2026-03-04 15:30:00', TIMESTAMP '2026-03-04 15:30:00', TIMESTAMP '2026-03-04 15:30:00',
        TIMESTAMP '2026-03-05 09:00:00', TIMESTAMP '2026-03-06 16:00:00', 0);
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E0000000000000000000000000000013'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), NULL, 'TODO', 'WEB', TIMESTAMP '2026-03-04 15:30:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E0000000000000000000000000000013'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), 'TODO', 'IN_PROGRESS', 'WEB', TIMESTAMP '2026-03-05 09:00:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E0000000000000000000000000000013'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), 'IN_PROGRESS', 'DONE', 'WEB', TIMESTAMP '2026-03-06 16:00:00');
INSERT INTO task_work_logs (task_id, user_id, work_date, hours_worked) VALUES (HEXTORAW('E0000000000000000000000000000013'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), DATE '2026-03-06', 3.0);

-- Luis's training
INSERT INTO tasks (id, title, status, priority, project_id, sprint_id, assignee_id, created_by,
                   created_at, sprint_added_at, assigned_at, entered_in_progress_at, completed_at, rework_count)
VALUES (HEXTORAW('E0000000000000000000000000000014'), 'V13-70 Complete OCI training (Luis)',
        'DONE', 'MEDIUM', HEXTORAW('F18FB987E9A04CA58213404D089F41AA'), HEXTORAW('A4F9BF0579724468B818665F2FC03AA1'),
        HEXTORAW('D9664711BC1348ABA56BCA68B161244A'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'),
        TIMESTAMP '2026-02-23 09:00:00', TIMESTAMP '2026-02-23 09:00:00', TIMESTAMP '2026-02-23 09:00:00',
        TIMESTAMP '2026-03-02 09:00:00', TIMESTAMP '2026-03-07 17:00:00', 0);
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E0000000000000000000000000000014'), HEXTORAW('D9664711BC1348ABA56BCA68B161244A'), NULL, 'TODO', 'WEB', TIMESTAMP '2026-02-23 09:00:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E0000000000000000000000000000014'), HEXTORAW('D9664711BC1348ABA56BCA68B161244A'), 'TODO', 'IN_PROGRESS', 'WEB', TIMESTAMP '2026-03-02 09:00:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E0000000000000000000000000000014'), HEXTORAW('D9664711BC1348ABA56BCA68B161244A'), 'IN_PROGRESS', 'DONE', 'WEB', TIMESTAMP '2026-03-07 17:00:00');
INSERT INTO task_work_logs (task_id, user_id, work_date, hours_worked) VALUES (HEXTORAW('E0000000000000000000000000000014'), HEXTORAW('D9664711BC1348ABA56BCA68B161244A'), DATE '2026-03-07', 9.0);

INSERT INTO tasks (id, title, status, priority, project_id, sprint_id, assignee_id, created_by,
                   created_at, sprint_added_at, assigned_at, entered_in_progress_at, completed_at, rework_count)
VALUES (HEXTORAW('E0000000000000000000000000000015'), 'V13-71 OCI Foundations Associate course (Luis)',
        'DONE', 'MEDIUM', HEXTORAW('F18FB987E9A04CA58213404D089F41AA'), HEXTORAW('A4F9BF0579724468B818665F2FC03AA1'),
        HEXTORAW('D9664711BC1348ABA56BCA68B161244A'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'),
        TIMESTAMP '2026-03-02 09:00:00', TIMESTAMP '2026-03-02 09:00:00', TIMESTAMP '2026-03-02 09:00:00',
        TIMESTAMP '2026-03-02 10:00:00', TIMESTAMP '2026-03-05 14:00:00', 0);
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E0000000000000000000000000000015'), HEXTORAW('D9664711BC1348ABA56BCA68B161244A'), NULL, 'TODO', 'WEB', TIMESTAMP '2026-03-02 09:00:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E0000000000000000000000000000015'), HEXTORAW('D9664711BC1348ABA56BCA68B161244A'), 'TODO', 'IN_PROGRESS', 'WEB', TIMESTAMP '2026-03-02 10:00:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E0000000000000000000000000000015'), HEXTORAW('D9664711BC1348ABA56BCA68B161244A'), 'IN_PROGRESS', 'DONE', 'WEB', TIMESTAMP '2026-03-05 14:00:00');
INSERT INTO task_work_logs (task_id, user_id, work_date, hours_worked) VALUES (HEXTORAW('E0000000000000000000000000000015'), HEXTORAW('D9664711BC1348ABA56BCA68B161244A'), DATE '2026-03-05', 7.0);

INSERT INTO tasks (id, title, status, priority, project_id, sprint_id, assignee_id, created_by,
                   created_at, sprint_added_at, assigned_at, entered_in_progress_at, completed_at, rework_count)
VALUES (HEXTORAW('E0000000000000000000000000000016'), 'V13-72 Cloud Native Development badge assessment (Luis)',
        'DONE', 'MEDIUM', HEXTORAW('F18FB987E9A04CA58213404D089F41AA'), HEXTORAW('A4F9BF0579724468B818665F2FC03AA1'),
        HEXTORAW('D9664711BC1348ABA56BCA68B161244A'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'),
        TIMESTAMP '2026-03-05 14:00:00', TIMESTAMP '2026-03-05 14:00:00', TIMESTAMP '2026-03-05 14:00:00',
        TIMESTAMP '2026-03-06 09:00:00', TIMESTAMP '2026-03-07 16:00:00', 0);
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E0000000000000000000000000000016'), HEXTORAW('D9664711BC1348ABA56BCA68B161244A'), NULL, 'TODO', 'WEB', TIMESTAMP '2026-03-05 14:00:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E0000000000000000000000000000016'), HEXTORAW('D9664711BC1348ABA56BCA68B161244A'), 'TODO', 'IN_PROGRESS', 'WEB', TIMESTAMP '2026-03-06 09:00:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E0000000000000000000000000000016'), HEXTORAW('D9664711BC1348ABA56BCA68B161244A'), 'IN_PROGRESS', 'DONE', 'WEB', TIMESTAMP '2026-03-07 16:00:00');
INSERT INTO task_work_logs (task_id, user_id, work_date, hours_worked) VALUES (HEXTORAW('E0000000000000000000000000000016'), HEXTORAW('D9664711BC1348ABA56BCA68B161244A'), DATE '2026-03-07', 5.0);

-- jozef's training
INSERT INTO tasks (id, title, status, priority, project_id, sprint_id, assignee_id, created_by,
                   created_at, sprint_added_at, assigned_at, entered_in_progress_at, completed_at, rework_count)
VALUES (HEXTORAW('E0000000000000000000000000000017'), 'V13-74 Complete OCI training (jozefhdez)',
        'DONE', 'MEDIUM', HEXTORAW('F18FB987E9A04CA58213404D089F41AA'), HEXTORAW('A4F9BF0579724468B818665F2FC03AA1'),
        HEXTORAW('DB5CABA59E764D2C83167B8578AB06DB'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'),
        TIMESTAMP '2026-02-23 09:00:00', TIMESTAMP '2026-02-23 09:00:00', TIMESTAMP '2026-02-23 09:00:00',
        TIMESTAMP '2026-03-02 09:00:00', TIMESTAMP '2026-03-06 14:00:00', 0);
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E0000000000000000000000000000017'), HEXTORAW('DB5CABA59E764D2C83167B8578AB06DB'), NULL, 'TODO', 'WEB', TIMESTAMP '2026-02-23 09:00:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E0000000000000000000000000000017'), HEXTORAW('DB5CABA59E764D2C83167B8578AB06DB'), 'TODO', 'IN_PROGRESS', 'WEB', TIMESTAMP '2026-03-02 09:00:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E0000000000000000000000000000017'), HEXTORAW('DB5CABA59E764D2C83167B8578AB06DB'), 'IN_PROGRESS', 'DONE', 'WEB', TIMESTAMP '2026-03-06 14:00:00');
INSERT INTO task_work_logs (task_id, user_id, work_date, hours_worked) VALUES (HEXTORAW('E0000000000000000000000000000017'), HEXTORAW('DB5CABA59E764D2C83167B8578AB06DB'), DATE '2026-03-06', 7.0);

INSERT INTO tasks (id, title, status, priority, project_id, sprint_id, assignee_id, created_by,
                   created_at, sprint_added_at, assigned_at, entered_in_progress_at, completed_at, rework_count)
VALUES (HEXTORAW('E0000000000000000000000000000018'), 'V13-75 OCI Foundations Associate course (jozefhdez)',
        'DONE', 'MEDIUM', HEXTORAW('F18FB987E9A04CA58213404D089F41AA'), HEXTORAW('A4F9BF0579724468B818665F2FC03AA1'),
        HEXTORAW('DB5CABA59E764D2C83167B8578AB06DB'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'),
        TIMESTAMP '2026-03-02 09:00:00', TIMESTAMP '2026-03-02 09:00:00', TIMESTAMP '2026-03-02 09:00:00',
        TIMESTAMP '2026-03-02 10:00:00', TIMESTAMP '2026-03-04 17:00:00', 0);
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E0000000000000000000000000000018'), HEXTORAW('DB5CABA59E764D2C83167B8578AB06DB'), NULL, 'TODO', 'WEB', TIMESTAMP '2026-03-02 09:00:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E0000000000000000000000000000018'), HEXTORAW('DB5CABA59E764D2C83167B8578AB06DB'), 'TODO', 'IN_PROGRESS', 'WEB', TIMESTAMP '2026-03-02 10:00:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E0000000000000000000000000000018'), HEXTORAW('DB5CABA59E764D2C83167B8578AB06DB'), 'IN_PROGRESS', 'DONE', 'WEB', TIMESTAMP '2026-03-04 17:00:00');
INSERT INTO task_work_logs (task_id, user_id, work_date, hours_worked) VALUES (HEXTORAW('E0000000000000000000000000000018'), HEXTORAW('DB5CABA59E764D2C83167B8578AB06DB'), DATE '2026-03-04', 7.0);

INSERT INTO tasks (id, title, status, priority, project_id, sprint_id, assignee_id, created_by,
                   created_at, sprint_added_at, assigned_at, entered_in_progress_at, completed_at, rework_count)
VALUES (HEXTORAW('E0000000000000000000000000000019'), 'V13-76 Cloud Native Development badge assessment (jozefhdez)',
        'DONE', 'MEDIUM', HEXTORAW('F18FB987E9A04CA58213404D089F41AA'), HEXTORAW('A4F9BF0579724468B818665F2FC03AA1'),
        HEXTORAW('DB5CABA59E764D2C83167B8578AB06DB'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'),
        TIMESTAMP '2026-03-04 17:00:00', TIMESTAMP '2026-03-04 17:00:00', TIMESTAMP '2026-03-04 17:00:00',
        TIMESTAMP '2026-03-05 09:00:00', TIMESTAMP '2026-03-06 13:00:00', 0);
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E0000000000000000000000000000019'), HEXTORAW('DB5CABA59E764D2C83167B8578AB06DB'), NULL, 'TODO', 'WEB', TIMESTAMP '2026-03-04 17:00:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E0000000000000000000000000000019'), HEXTORAW('DB5CABA59E764D2C83167B8578AB06DB'), 'TODO', 'IN_PROGRESS', 'WEB', TIMESTAMP '2026-03-05 09:00:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E0000000000000000000000000000019'), HEXTORAW('DB5CABA59E764D2C83167B8578AB06DB'), 'IN_PROGRESS', 'DONE', 'WEB', TIMESTAMP '2026-03-06 13:00:00');
INSERT INTO task_work_logs (task_id, user_id, work_date, hours_worked) VALUES (HEXTORAW('E0000000000000000000000000000019'), HEXTORAW('DB5CABA59E764D2C83167B8578AB06DB'), DATE '2026-03-06', 5.0);

-- Ana Elena's training
INSERT INTO tasks (id, title, status, priority, project_id, sprint_id, assignee_id, created_by,
                   created_at, sprint_added_at, assigned_at, entered_in_progress_at, completed_at, rework_count)
VALUES (HEXTORAW('E000000000000000000000000000001A'), 'V13-78 Complete OCI training (Ana Elena)',
        'DONE', 'MEDIUM', HEXTORAW('F18FB987E9A04CA58213404D089F41AA'), HEXTORAW('A4F9BF0579724468B818665F2FC03AA1'),
        HEXTORAW('E5E7D6DC9BA54E7A95B198EF1AA32060'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'),
        TIMESTAMP '2026-02-23 09:00:00', TIMESTAMP '2026-02-23 09:00:00', TIMESTAMP '2026-02-23 09:00:00',
        TIMESTAMP '2026-03-03 09:00:00', TIMESTAMP '2026-03-07 17:00:00', 0);
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E000000000000000000000000000001A'), HEXTORAW('E5E7D6DC9BA54E7A95B198EF1AA32060'), NULL, 'TODO', 'WEB', TIMESTAMP '2026-02-23 09:00:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E000000000000000000000000000001A'), HEXTORAW('E5E7D6DC9BA54E7A95B198EF1AA32060'), 'TODO', 'IN_PROGRESS', 'WEB', TIMESTAMP '2026-03-03 09:00:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E000000000000000000000000000001A'), HEXTORAW('E5E7D6DC9BA54E7A95B198EF1AA32060'), 'IN_PROGRESS', 'DONE', 'WEB', TIMESTAMP '2026-03-07 17:00:00');
INSERT INTO task_work_logs (task_id, user_id, work_date, hours_worked) VALUES (HEXTORAW('E000000000000000000000000000001A'), HEXTORAW('E5E7D6DC9BA54E7A95B198EF1AA32060'), DATE '2026-03-07', 6.0);

INSERT INTO tasks (id, title, status, priority, project_id, sprint_id, assignee_id, created_by,
                   created_at, sprint_added_at, assigned_at, entered_in_progress_at, completed_at, rework_count)
VALUES (HEXTORAW('E000000000000000000000000000001B'), 'V13-79 OCI Foundations Associate course (Ana Elena)',
        'DONE', 'MEDIUM', HEXTORAW('F18FB987E9A04CA58213404D089F41AA'), HEXTORAW('A4F9BF0579724468B818665F2FC03AA1'),
        HEXTORAW('E5E7D6DC9BA54E7A95B198EF1AA32060'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'),
        TIMESTAMP '2026-03-03 09:00:00', TIMESTAMP '2026-03-03 09:00:00', TIMESTAMP '2026-03-03 09:00:00',
        TIMESTAMP '2026-03-03 10:00:00', TIMESTAMP '2026-03-05 15:00:00', 0);
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E000000000000000000000000000001B'), HEXTORAW('E5E7D6DC9BA54E7A95B198EF1AA32060'), NULL, 'TODO', 'WEB', TIMESTAMP '2026-03-03 09:00:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E000000000000000000000000000001B'), HEXTORAW('E5E7D6DC9BA54E7A95B198EF1AA32060'), 'TODO', 'IN_PROGRESS', 'WEB', TIMESTAMP '2026-03-03 10:00:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E000000000000000000000000000001B'), HEXTORAW('E5E7D6DC9BA54E7A95B198EF1AA32060'), 'IN_PROGRESS', 'DONE', 'WEB', TIMESTAMP '2026-03-05 15:00:00');
INSERT INTO task_work_logs (task_id, user_id, work_date, hours_worked) VALUES (HEXTORAW('E000000000000000000000000000001B'), HEXTORAW('E5E7D6DC9BA54E7A95B198EF1AA32060'), DATE '2026-03-05', 5.0);

INSERT INTO tasks (id, title, status, priority, project_id, sprint_id, assignee_id, created_by,
                   created_at, sprint_added_at, assigned_at, entered_in_progress_at, completed_at, rework_count)
VALUES (HEXTORAW('E000000000000000000000000000001C'), 'V13-80 Cloud Native Development badge assessment (Ana Elena)',
        'DONE', 'MEDIUM', HEXTORAW('F18FB987E9A04CA58213404D089F41AA'), HEXTORAW('A4F9BF0579724468B818665F2FC03AA1'),
        HEXTORAW('E5E7D6DC9BA54E7A95B198EF1AA32060'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'),
        TIMESTAMP '2026-03-05 15:00:00', TIMESTAMP '2026-03-05 15:00:00', TIMESTAMP '2026-03-05 15:00:00',
        TIMESTAMP '2026-03-06 09:00:00', TIMESTAMP '2026-03-07 15:00:00', 0);
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E000000000000000000000000000001C'), HEXTORAW('E5E7D6DC9BA54E7A95B198EF1AA32060'), NULL, 'TODO', 'WEB', TIMESTAMP '2026-03-05 15:00:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E000000000000000000000000000001C'), HEXTORAW('E5E7D6DC9BA54E7A95B198EF1AA32060'), 'TODO', 'IN_PROGRESS', 'WEB', TIMESTAMP '2026-03-06 09:00:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E000000000000000000000000000001C'), HEXTORAW('E5E7D6DC9BA54E7A95B198EF1AA32060'), 'IN_PROGRESS', 'DONE', 'WEB', TIMESTAMP '2026-03-07 15:00:00');
INSERT INTO task_work_logs (task_id, user_id, work_date, hours_worked) VALUES (HEXTORAW('E000000000000000000000000000001C'), HEXTORAW('E5E7D6DC9BA54E7A95B198EF1AA32060'), DATE '2026-03-07', 4.0);

-- Ana Paula's training
INSERT INTO tasks (id, title, status, priority, project_id, sprint_id, assignee_id, created_by,
                   created_at, sprint_added_at, assigned_at, entered_in_progress_at, completed_at, rework_count)
VALUES (HEXTORAW('E000000000000000000000000000001D'), 'V13-82 Complete OCI training (Ana Paula)',
        'DONE', 'MEDIUM', HEXTORAW('F18FB987E9A04CA58213404D089F41AA'), HEXTORAW('A4F9BF0579724468B818665F2FC03AA1'),
        HEXTORAW('09F9156961144414AF1D9815FED84D5F'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'),
        TIMESTAMP '2026-02-23 09:00:00', TIMESTAMP '2026-02-23 09:00:00', TIMESTAMP '2026-02-23 09:00:00',
        TIMESTAMP '2026-03-02 09:00:00', TIMESTAMP '2026-03-07 16:00:00', 0);
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E000000000000000000000000000001D'), HEXTORAW('09F9156961144414AF1D9815FED84D5F'), NULL, 'TODO', 'WEB', TIMESTAMP '2026-02-23 09:00:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E000000000000000000000000000001D'), HEXTORAW('09F9156961144414AF1D9815FED84D5F'), 'TODO', 'IN_PROGRESS', 'WEB', TIMESTAMP '2026-03-02 09:00:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E000000000000000000000000000001D'), HEXTORAW('09F9156961144414AF1D9815FED84D5F'), 'IN_PROGRESS', 'DONE', 'WEB', TIMESTAMP '2026-03-07 16:00:00');
INSERT INTO task_work_logs (task_id, user_id, work_date, hours_worked) VALUES (HEXTORAW('E000000000000000000000000000001D'), HEXTORAW('09F9156961144414AF1D9815FED84D5F'), DATE '2026-03-07', 9.0);

INSERT INTO tasks (id, title, status, priority, project_id, sprint_id, assignee_id, created_by,
                   created_at, sprint_added_at, assigned_at, entered_in_progress_at, completed_at, rework_count)
VALUES (HEXTORAW('E000000000000000000000000000001E'), 'V13-83 OCI Foundations Associate course (Ana Paula)',
        'DONE', 'MEDIUM', HEXTORAW('F18FB987E9A04CA58213404D089F41AA'), HEXTORAW('A4F9BF0579724468B818665F2FC03AA1'),
        HEXTORAW('09F9156961144414AF1D9815FED84D5F'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'),
        TIMESTAMP '2026-03-02 09:00:00', TIMESTAMP '2026-03-02 09:00:00', TIMESTAMP '2026-03-02 09:00:00',
        TIMESTAMP '2026-03-02 10:00:00', TIMESTAMP '2026-03-04 16:00:00', 0);
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E000000000000000000000000000001E'), HEXTORAW('09F9156961144414AF1D9815FED84D5F'), NULL, 'TODO', 'WEB', TIMESTAMP '2026-03-02 09:00:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E000000000000000000000000000001E'), HEXTORAW('09F9156961144414AF1D9815FED84D5F'), 'TODO', 'IN_PROGRESS', 'WEB', TIMESTAMP '2026-03-02 10:00:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E000000000000000000000000000001E'), HEXTORAW('09F9156961144414AF1D9815FED84D5F'), 'IN_PROGRESS', 'DONE', 'WEB', TIMESTAMP '2026-03-04 16:00:00');
INSERT INTO task_work_logs (task_id, user_id, work_date, hours_worked) VALUES (HEXTORAW('E000000000000000000000000000001E'), HEXTORAW('09F9156961144414AF1D9815FED84D5F'), DATE '2026-03-04', 7.0);

INSERT INTO tasks (id, title, status, priority, project_id, sprint_id, assignee_id, created_by,
                   created_at, sprint_added_at, assigned_at, entered_in_progress_at, completed_at, rework_count)
VALUES (HEXTORAW('E000000000000000000000000000001F'), 'V13-84 Cloud Native Development badge assessment (Ana Paula)',
        'DONE', 'MEDIUM', HEXTORAW('F18FB987E9A04CA58213404D089F41AA'), HEXTORAW('A4F9BF0579724468B818665F2FC03AA1'),
        HEXTORAW('09F9156961144414AF1D9815FED84D5F'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'),
        TIMESTAMP '2026-03-04 16:00:00', TIMESTAMP '2026-03-04 16:00:00', TIMESTAMP '2026-03-04 16:00:00',
        TIMESTAMP '2026-03-05 09:00:00', TIMESTAMP '2026-03-06 15:00:00', 0);
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E000000000000000000000000000001F'), HEXTORAW('09F9156961144414AF1D9815FED84D5F'), NULL, 'TODO', 'WEB', TIMESTAMP '2026-03-04 16:00:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E000000000000000000000000000001F'), HEXTORAW('09F9156961144414AF1D9815FED84D5F'), 'TODO', 'IN_PROGRESS', 'WEB', TIMESTAMP '2026-03-05 09:00:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E000000000000000000000000000001F'), HEXTORAW('09F9156961144414AF1D9815FED84D5F'), 'IN_PROGRESS', 'DONE', 'WEB', TIMESTAMP '2026-03-06 15:00:00');
INSERT INTO task_work_logs (task_id, user_id, work_date, hours_worked) VALUES (HEXTORAW('E000000000000000000000000000001F'), HEXTORAW('09F9156961144414AF1D9815FED84D5F'), DATE '2026-03-06', 5.0);


-- Requirements tasks V13-86 through V13-93 (compressed — all DONE, short cycle times)
-- V13-86 | Define FRs and NFRs | Luis | DONE
INSERT INTO tasks (id, title, status, priority, project_id, sprint_id, assignee_id, created_by,
                   created_at, sprint_added_at, assigned_at, entered_in_progress_at, completed_at, rework_count)
VALUES (HEXTORAW('E0000000000000000000000000000020'), 'V13-86 Define functional and non-functional requirements',
        'DONE', 'HIGH', HEXTORAW('F18FB987E9A04CA58213404D089F41AA'), HEXTORAW('A4F9BF0579724468B818665F2FC03AA1'),
        HEXTORAW('D9664711BC1348ABA56BCA68B161244A'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'),
        TIMESTAMP '2026-03-02 08:00:00', TIMESTAMP '2026-03-02 08:00:00', TIMESTAMP '2026-03-02 08:00:00',
        TIMESTAMP '2026-03-02 09:00:00', TIMESTAMP '2026-03-10 16:00:00', 0);
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E0000000000000000000000000000020'), HEXTORAW('D9664711BC1348ABA56BCA68B161244A'), NULL, 'TODO', 'WEB', TIMESTAMP '2026-03-02 08:00:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E0000000000000000000000000000020'), HEXTORAW('D9664711BC1348ABA56BCA68B161244A'), 'TODO', 'IN_PROGRESS', 'WEB', TIMESTAMP '2026-03-02 09:00:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E0000000000000000000000000000020'), HEXTORAW('D9664711BC1348ABA56BCA68B161244A'), 'IN_PROGRESS', 'DONE', 'WEB', TIMESTAMP '2026-03-10 16:00:00');
INSERT INTO task_work_logs (task_id, user_id, work_date, hours_worked) VALUES (HEXTORAW('E0000000000000000000000000000020'), HEXTORAW('D9664711BC1348ABA56BCA68B161244A'), DATE '2026-03-10', 11.0);

-- V13-87 | FRs | Baltazar | DONE
INSERT INTO tasks (id, title, status, priority, project_id, sprint_id, assignee_id, created_by,
                   created_at, sprint_added_at, assigned_at, entered_in_progress_at, completed_at, rework_count)
VALUES (HEXTORAW('E0000000000000000000000000000021'), 'V13-87 Define Functional Requirements including User Management and Telegram Bot',
        'DONE', 'HIGH', HEXTORAW('F18FB987E9A04CA58213404D089F41AA'), HEXTORAW('A4F9BF0579724468B818665F2FC03AA1'),
        HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'),
        TIMESTAMP '2026-03-02 08:00:00', TIMESTAMP '2026-03-02 08:00:00', TIMESTAMP '2026-03-02 08:00:00',
        TIMESTAMP '2026-03-02 10:00:00', TIMESTAMP '2026-03-06 15:00:00', 0);
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E0000000000000000000000000000021'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), NULL, 'TODO', 'WEB', TIMESTAMP '2026-03-02 08:00:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E0000000000000000000000000000021'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), 'TODO', 'IN_PROGRESS', 'WEB', TIMESTAMP '2026-03-02 10:00:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E0000000000000000000000000000021'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), 'IN_PROGRESS', 'DONE', 'WEB', TIMESTAMP '2026-03-06 15:00:00');
INSERT INTO task_work_logs (task_id, user_id, work_date, hours_worked) VALUES (HEXTORAW('E0000000000000000000000000000021'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), DATE '2026-03-06', 7.0);

-- V13-88 | NFRs | jozefhdez | DONE
INSERT INTO tasks (id, title, status, priority, project_id, sprint_id, assignee_id, created_by,
                   created_at, sprint_added_at, assigned_at, entered_in_progress_at, completed_at, rework_count)
VALUES (HEXTORAW('E0000000000000000000000000000022'), 'V13-88 Establish Non-Functional Requirements focusing on OCI scalability and security',
        'DONE', 'HIGH', HEXTORAW('F18FB987E9A04CA58213404D089F41AA'), HEXTORAW('A4F9BF0579724468B818665F2FC03AA1'),
        HEXTORAW('DB5CABA59E764D2C83167B8578AB06DB'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'),
        TIMESTAMP '2026-03-02 08:00:00', TIMESTAMP '2026-03-02 08:00:00', TIMESTAMP '2026-03-02 08:00:00',
        TIMESTAMP '2026-03-03 09:00:00', TIMESTAMP '2026-03-07 14:00:00', 0);
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E0000000000000000000000000000022'), HEXTORAW('DB5CABA59E764D2C83167B8578AB06DB'), NULL, 'TODO', 'WEB', TIMESTAMP '2026-03-02 08:00:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E0000000000000000000000000000022'), HEXTORAW('DB5CABA59E764D2C83167B8578AB06DB'), 'TODO', 'IN_PROGRESS', 'WEB', TIMESTAMP '2026-03-03 09:00:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E0000000000000000000000000000022'), HEXTORAW('DB5CABA59E764D2C83167B8578AB06DB'), 'IN_PROGRESS', 'DONE', 'WEB', TIMESTAMP '2026-03-07 14:00:00');
INSERT INTO task_work_logs (task_id, user_id, work_date, hours_worked) VALUES (HEXTORAW('E0000000000000000000000000000022'), HEXTORAW('DB5CABA59E764D2C83167B8578AB06DB'), DATE '2026-03-07', 9.0);

-- V13-89 | System Constraints & API specs | Ana Paula | DONE
INSERT INTO tasks (id, title, status, priority, project_id, sprint_id, assignee_id, created_by,
                   created_at, sprint_added_at, assigned_at, entered_in_progress_at, completed_at, rework_count)
VALUES (HEXTORAW('E0000000000000000000000000000023'), 'V13-89 Document System Constraints and External Interface Requirements',
        'DONE', 'MEDIUM', HEXTORAW('F18FB987E9A04CA58213404D089F41AA'), HEXTORAW('A4F9BF0579724468B818665F2FC03AA1'),
        HEXTORAW('09F9156961144414AF1D9815FED84D5F'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'),
        TIMESTAMP '2026-03-05 09:00:00', TIMESTAMP '2026-03-05 09:00:00', TIMESTAMP '2026-03-05 09:00:00',
        TIMESTAMP '2026-03-05 10:00:00', TIMESTAMP '2026-03-09 15:00:00', 0);
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E0000000000000000000000000000023'), HEXTORAW('09F9156961144414AF1D9815FED84D5F'), NULL, 'TODO', 'WEB', TIMESTAMP '2026-03-05 09:00:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E0000000000000000000000000000023'), HEXTORAW('09F9156961144414AF1D9815FED84D5F'), 'TODO', 'IN_PROGRESS', 'WEB', TIMESTAMP '2026-03-05 10:00:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E0000000000000000000000000000023'), HEXTORAW('09F9156961144414AF1D9815FED84D5F'), 'IN_PROGRESS', 'DONE', 'WEB', TIMESTAMP '2026-03-09 15:00:00');
INSERT INTO task_work_logs (task_id, user_id, work_date, hours_worked) VALUES (HEXTORAW('E0000000000000000000000000000023'), HEXTORAW('09F9156961144414AF1D9815FED84D5F'), DATE '2026-03-09', 7.0);

-- V13-90 | Document data model | Baltazar | DONE
INSERT INTO tasks (id, title, status, priority, project_id, sprint_id, assignee_id, created_by,
                   created_at, sprint_added_at, assigned_at, entered_in_progress_at, completed_at, rework_count)
VALUES (HEXTORAW('E0000000000000000000000000000024'), 'V13-90 Document the data model and system behavior',
        'DONE', 'HIGH', HEXTORAW('F18FB987E9A04CA58213404D089F41AA'), HEXTORAW('A4F9BF0579724468B818665F2FC03AA1'),
        HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'),
        TIMESTAMP '2026-03-05 09:00:00', TIMESTAMP '2026-03-05 09:00:00', TIMESTAMP '2026-03-05 09:00:00',
        TIMESTAMP '2026-03-06 09:00:00', TIMESTAMP '2026-03-11 14:00:00', 0);
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E0000000000000000000000000000024'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), NULL, 'TODO', 'WEB', TIMESTAMP '2026-03-05 09:00:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E0000000000000000000000000000024'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), 'TODO', 'IN_PROGRESS', 'WEB', TIMESTAMP '2026-03-06 09:00:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E0000000000000000000000000000024'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), 'IN_PROGRESS', 'DONE', 'WEB', TIMESTAMP '2026-03-11 14:00:00');
INSERT INTO task_work_logs (task_id, user_id, work_date, hours_worked) VALUES (HEXTORAW('E0000000000000000000000000000024'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), DATE '2026-03-11', 6.0);

-- V13-91 ERD | V13-92 Sequence Diagrams | Ana Elena | DONE
INSERT INTO tasks (id, title, status, priority, project_id, sprint_id, assignee_id, created_by,
                   created_at, sprint_added_at, assigned_at, entered_in_progress_at, completed_at, rework_count)
VALUES (HEXTORAW('E0000000000000000000000000000025'), 'V13-91 Create Entity-Relationship Diagrams for the ATP schema',
        'DONE', 'HIGH', HEXTORAW('F18FB987E9A04CA58213404D089F41AA'), HEXTORAW('A4F9BF0579724468B818665F2FC03AA1'),
        HEXTORAW('E5E7D6DC9BA54E7A95B198EF1AA32060'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'),
        TIMESTAMP '2026-03-05 09:00:00', TIMESTAMP '2026-03-05 09:00:00', TIMESTAMP '2026-03-05 09:00:00',
        TIMESTAMP '2026-03-05 10:00:00', TIMESTAMP '2026-03-09 17:00:00', 0);
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E0000000000000000000000000000025'), HEXTORAW('E5E7D6DC9BA54E7A95B198EF1AA32060'), NULL, 'TODO', 'WEB', TIMESTAMP '2026-03-05 09:00:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E0000000000000000000000000000025'), HEXTORAW('E5E7D6DC9BA54E7A95B198EF1AA32060'), 'TODO', 'IN_PROGRESS', 'WEB', TIMESTAMP '2026-03-05 10:00:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E0000000000000000000000000000025'), HEXTORAW('E5E7D6DC9BA54E7A95B198EF1AA32060'), 'IN_PROGRESS', 'DONE', 'WEB', TIMESTAMP '2026-03-09 17:00:00');
INSERT INTO task_work_logs (task_id, user_id, work_date, hours_worked) VALUES (HEXTORAW('E0000000000000000000000000000025'), HEXTORAW('E5E7D6DC9BA54E7A95B198EF1AA32060'), DATE '2026-03-09', 7.0);

INSERT INTO tasks (id, title, status, priority, project_id, sprint_id, assignee_id, created_by,
                   created_at, sprint_added_at, assigned_at, entered_in_progress_at, completed_at, rework_count)
VALUES (HEXTORAW('E0000000000000000000000000000026'), 'V13-92 Map System Sequence Diagrams for core microservices workflows',
        'DONE', 'MEDIUM', HEXTORAW('F18FB987E9A04CA58213404D089F41AA'), HEXTORAW('A4F9BF0579724468B818665F2FC03AA1'),
        HEXTORAW('E5E7D6DC9BA54E7A95B198EF1AA32060'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'),
        TIMESTAMP '2026-03-09 09:00:00', TIMESTAMP '2026-03-09 09:00:00', TIMESTAMP '2026-03-09 09:00:00',
        TIMESTAMP '2026-03-09 10:00:00', TIMESTAMP '2026-03-12 15:00:00', 0);
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E0000000000000000000000000000026'), HEXTORAW('E5E7D6DC9BA54E7A95B198EF1AA32060'), NULL, 'TODO', 'WEB', TIMESTAMP '2026-03-09 09:00:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E0000000000000000000000000000026'), HEXTORAW('E5E7D6DC9BA54E7A95B198EF1AA32060'), 'TODO', 'IN_PROGRESS', 'WEB', TIMESTAMP '2026-03-09 10:00:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E0000000000000000000000000000026'), HEXTORAW('E5E7D6DC9BA54E7A95B198EF1AA32060'), 'IN_PROGRESS', 'DONE', 'WEB', TIMESTAMP '2026-03-12 15:00:00');
INSERT INTO task_work_logs (task_id, user_id, work_date, hours_worked) VALUES (HEXTORAW('E0000000000000000000000000000026'), HEXTORAW('E5E7D6DC9BA54E7A95B198EF1AA32060'), DATE '2026-03-12', 5.0);

-- V13-93 | Finalize SRS | Baltazar | DONE  ← SCOPE CREEP: added after sprint started
INSERT INTO tasks (id, title, status, priority, project_id, sprint_id, assignee_id, created_by,
                   created_at, sprint_added_at, assigned_at, entered_in_progress_at, completed_at, rework_count)
VALUES (
    HEXTORAW('E0000000000000000000000000000027'),
    'V13-93 Finalize the SRS Document and obtain stakeholder sign-off',
    NULL,
    'DONE', 'HIGH',
    HEXTORAW('F18FB987E9A04CA58213404D089F41AA'),
    HEXTORAW('A4F9BF0579724468B818665F2FC03AA1'),
    HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'),
    HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'),
    TIMESTAMP '2026-03-06 14:00:00',   -- created AFTER sprint start (Feb 23) → scope creep
    TIMESTAMP '2026-03-06 14:00:00',   -- sprint_added_at same day → creep
    TIMESTAMP '2026-03-06 14:00:00',
    TIMESTAMP '2026-03-09 09:00:00',
    TIMESTAMP '2026-03-13 16:00:00',
    0
);
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E0000000000000000000000000000027'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), NULL, 'TODO', 'WEB', TIMESTAMP '2026-03-06 14:00:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E0000000000000000000000000000027'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), 'TODO', 'IN_PROGRESS', 'WEB', TIMESTAMP '2026-03-09 09:00:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E0000000000000000000000000000027'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), 'IN_PROGRESS', 'DONE', 'WEB', TIMESTAMP '2026-03-13 16:00:00');
INSERT INTO task_work_logs (task_id, user_id, work_date, hours_worked) VALUES (HEXTORAW('E0000000000000000000000000000027'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), DATE '2026-03-13', 5.0);


-- Module tasks V13-95 to V13-106 (Sprint 1 — milestone deliverables, all DONE)
-- Assigned: V13-95 → Baltazar (was Unassigned), V13-103 → Baltazar, V13-106 → Baltazar

INSERT INTO tasks (id, title, status, priority, project_id, sprint_id, assignee_id, created_by, created_at, sprint_added_at, assigned_at, entered_in_progress_at, completed_at, rework_count)
VALUES (HEXTORAW('E0000000000000000000000000000028'), 'V13-95 M1 - Software Standards', 'DONE', 'MEDIUM', HEXTORAW('F18FB987E9A04CA58213404D089F41AA'), HEXTORAW('A4F9BF0579724468B818665F2FC03AA1'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), TIMESTAMP '2026-02-23 09:00:00', TIMESTAMP '2026-02-23 09:00:00', TIMESTAMP '2026-02-23 09:00:00', TIMESTAMP '2026-03-07 09:00:00', TIMESTAMP '2026-03-13 16:00:00', 0);
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E0000000000000000000000000000028'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), NULL, 'TODO', 'WEB', TIMESTAMP '2026-02-23 09:00:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E0000000000000000000000000000028'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), 'TODO', 'IN_PROGRESS', 'WEB', TIMESTAMP '2026-03-07 09:00:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E0000000000000000000000000000028'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), 'IN_PROGRESS', 'DONE', 'WEB', TIMESTAMP '2026-03-13 16:00:00');
INSERT INTO task_work_logs (task_id, user_id, work_date, hours_worked) VALUES (HEXTORAW('E0000000000000000000000000000028'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), DATE '2026-03-13', 3.0);

INSERT INTO tasks (id, title, status, priority, project_id, sprint_id, assignee_id, created_by, created_at, sprint_added_at, assigned_at, entered_in_progress_at, completed_at, rework_count)
VALUES (HEXTORAW('E0000000000000000000000000000029'), 'V13-96 M2 - Project Administration', 'DONE', 'MEDIUM', HEXTORAW('F18FB987E9A04CA58213404D089F41AA'), HEXTORAW('A4F9BF0579724468B818665F2FC03AA1'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), TIMESTAMP '2026-02-23 09:00:00', TIMESTAMP '2026-02-23 09:00:00', TIMESTAMP '2026-02-23 09:00:00', TIMESTAMP '2026-03-07 09:00:00', TIMESTAMP '2026-03-13 17:00:00', 0);
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E0000000000000000000000000000029'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), NULL, 'TODO', 'WEB', TIMESTAMP '2026-02-23 09:00:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E0000000000000000000000000000029'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), 'TODO', 'IN_PROGRESS', 'WEB', TIMESTAMP '2026-03-07 09:00:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E0000000000000000000000000000029'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), 'IN_PROGRESS', 'DONE', 'WEB', TIMESTAMP '2026-03-13 17:00:00');
INSERT INTO task_work_logs (task_id, user_id, work_date, hours_worked) VALUES (HEXTORAW('E0000000000000000000000000000029'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), DATE '2026-03-13', 2.0);

INSERT INTO tasks (id, title, status, priority, project_id, sprint_id, assignee_id, created_by, created_at, sprint_added_at, assigned_at, entered_in_progress_at, completed_at, rework_count)
VALUES (HEXTORAW('E000000000000000000000000000002A'), 'V13-97 M3 - Software Requirements', 'DONE', 'MEDIUM', HEXTORAW('F18FB987E9A04CA58213404D089F41AA'), HEXTORAW('A4F9BF0579724468B818665F2FC03AA1'), HEXTORAW('D9664711BC1348ABA56BCA68B161244A'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), TIMESTAMP '2026-02-23 09:00:00', TIMESTAMP '2026-02-23 09:00:00', TIMESTAMP '2026-02-23 09:00:00', TIMESTAMP '2026-03-08 09:00:00', TIMESTAMP '2026-03-13 17:00:00', 0);
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E000000000000000000000000000002A'), HEXTORAW('D9664711BC1348ABA56BCA68B161244A'), NULL, 'TODO', 'WEB', TIMESTAMP '2026-02-23 09:00:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E000000000000000000000000000002A'), HEXTORAW('D9664711BC1348ABA56BCA68B161244A'), 'TODO', 'IN_PROGRESS', 'WEB', TIMESTAMP '2026-03-08 09:00:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E000000000000000000000000000002A'), HEXTORAW('D9664711BC1348ABA56BCA68B161244A'), 'IN_PROGRESS', 'DONE', 'WEB', TIMESTAMP '2026-03-13 17:00:00');
INSERT INTO task_work_logs (task_id, user_id, work_date, hours_worked) VALUES (HEXTORAW('E000000000000000000000000000002A'), HEXTORAW('D9664711BC1348ABA56BCA68B161244A'), DATE '2026-03-13', 3.0);

INSERT INTO tasks (id, title, status, priority, project_id, sprint_id, assignee_id, created_by, created_at, sprint_added_at, assigned_at, entered_in_progress_at, completed_at, rework_count)
VALUES (HEXTORAW('E000000000000000000000000000002B'), 'V13-98 M4 - Software Quality', 'DONE', 'MEDIUM', HEXTORAW('F18FB987E9A04CA58213404D089F41AA'), HEXTORAW('A4F9BF0579724468B818665F2FC03AA1'), HEXTORAW('E5E7D6DC9BA54E7A95B198EF1AA32060'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), TIMESTAMP '2026-02-23 09:00:00', TIMESTAMP '2026-02-23 09:00:00', TIMESTAMP '2026-02-23 09:00:00', TIMESTAMP '2026-03-08 09:00:00', TIMESTAMP '2026-03-13 17:00:00', 0);
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E000000000000000000000000000002B'), HEXTORAW('E5E7D6DC9BA54E7A95B198EF1AA32060'), NULL, 'TODO', 'WEB', TIMESTAMP '2026-02-23 09:00:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E000000000000000000000000000002B'), HEXTORAW('E5E7D6DC9BA54E7A95B198EF1AA32060'), 'TODO', 'IN_PROGRESS', 'WEB', TIMESTAMP '2026-03-08 09:00:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E000000000000000000000000000002B'), HEXTORAW('E5E7D6DC9BA54E7A95B198EF1AA32060'), 'IN_PROGRESS', 'DONE', 'WEB', TIMESTAMP '2026-03-13 17:00:00');
INSERT INTO task_work_logs (task_id, user_id, work_date, hours_worked) VALUES (HEXTORAW('E000000000000000000000000000002B'), HEXTORAW('E5E7D6DC9BA54E7A95B198EF1AA32060'), DATE '2026-03-13', 2.0);

INSERT INTO tasks (id, title, status, priority, project_id, sprint_id, assignee_id, created_by, created_at, sprint_added_at, assigned_at, entered_in_progress_at, completed_at, rework_count)
VALUES (HEXTORAW('E000000000000000000000000000002C'), 'V13-99 M5 - Design & Architecture', 'DONE', 'MEDIUM', HEXTORAW('F18FB987E9A04CA58213404D089F41AA'), HEXTORAW('A4F9BF0579724468B818665F2FC03AA1'), HEXTORAW('09F9156961144414AF1D9815FED84D5F'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), TIMESTAMP '2026-02-23 09:00:00', TIMESTAMP '2026-02-23 09:00:00', TIMESTAMP '2026-02-23 09:00:00', TIMESTAMP '2026-03-09 09:00:00', TIMESTAMP '2026-03-13 17:00:00', 0);
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E000000000000000000000000000002C'), HEXTORAW('09F9156961144414AF1D9815FED84D5F'), NULL, 'TODO', 'WEB', TIMESTAMP '2026-02-23 09:00:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E000000000000000000000000000002C'), HEXTORAW('09F9156961144414AF1D9815FED84D5F'), 'TODO', 'IN_PROGRESS', 'WEB', TIMESTAMP '2026-03-09 09:00:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E000000000000000000000000000002C'), HEXTORAW('09F9156961144414AF1D9815FED84D5F'), 'IN_PROGRESS', 'DONE', 'WEB', TIMESTAMP '2026-03-13 17:00:00');
INSERT INTO task_work_logs (task_id, user_id, work_date, hours_worked) VALUES (HEXTORAW('E000000000000000000000000000002C'), HEXTORAW('09F9156961144414AF1D9815FED84D5F'), DATE '2026-03-13', 4.0);

INSERT INTO tasks (id, title, status, priority, project_id, sprint_id, assignee_id, created_by, created_at, sprint_added_at, assigned_at, entered_in_progress_at, completed_at, rework_count)
VALUES (HEXTORAW('E000000000000000000000000000002D'), 'V13-100 M6 - Advanced Web', 'DONE', 'MEDIUM', HEXTORAW('F18FB987E9A04CA58213404D089F41AA'), HEXTORAW('A4F9BF0579724468B818665F2FC03AA1'), HEXTORAW('DB5CABA59E764D2C83167B8578AB06DB'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), TIMESTAMP '2026-02-23 09:00:00', TIMESTAMP '2026-02-23 09:00:00', TIMESTAMP '2026-02-23 09:00:00', TIMESTAMP '2026-03-09 09:00:00', TIMESTAMP '2026-03-13 17:00:00', 0);
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E000000000000000000000000000002D'), HEXTORAW('DB5CABA59E764D2C83167B8578AB06DB'), NULL, 'TODO', 'WEB', TIMESTAMP '2026-02-23 09:00:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E000000000000000000000000000002D'), HEXTORAW('DB5CABA59E764D2C83167B8578AB06DB'), 'TODO', 'IN_PROGRESS', 'WEB', TIMESTAMP '2026-03-09 09:00:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E000000000000000000000000000002D'), HEXTORAW('DB5CABA59E764D2C83167B8578AB06DB'), 'IN_PROGRESS', 'DONE', 'WEB', TIMESTAMP '2026-03-13 17:00:00');
INSERT INTO task_work_logs (task_id, user_id, work_date, hours_worked) VALUES (HEXTORAW('E000000000000000000000000000002D'), HEXTORAW('DB5CABA59E764D2C83167B8578AB06DB'), DATE '2026-03-13', 4.0);

INSERT INTO tasks (id, title, status, priority, project_id, sprint_id, assignee_id, created_by, created_at, sprint_added_at, assigned_at, entered_in_progress_at, completed_at, rework_count)
VALUES (HEXTORAW('E000000000000000000000000000002E'), 'V13-101 M7 - Advanced Databases', 'DONE', 'MEDIUM', HEXTORAW('F18FB987E9A04CA58213404D089F41AA'), HEXTORAW('A4F9BF0579724468B818665F2FC03AA1'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), TIMESTAMP '2026-02-23 09:00:00', TIMESTAMP '2026-02-23 09:00:00', TIMESTAMP '2026-02-23 09:00:00', TIMESTAMP '2026-03-10 09:00:00', TIMESTAMP '2026-03-13 17:00:00', 0);
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E000000000000000000000000000002E'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), NULL, 'TODO', 'WEB', TIMESTAMP '2026-02-23 09:00:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E000000000000000000000000000002E'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), 'TODO', 'IN_PROGRESS', 'WEB', TIMESTAMP '2026-03-10 09:00:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E000000000000000000000000000002E'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), 'IN_PROGRESS', 'DONE', 'WEB', TIMESTAMP '2026-03-13 17:00:00');
INSERT INTO task_work_logs (task_id, user_id, work_date, hours_worked) VALUES (HEXTORAW('E000000000000000000000000000002E'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), DATE '2026-03-13', 2.0);

INSERT INTO tasks (id, title, status, priority, project_id, sprint_id, assignee_id, created_by, created_at, sprint_added_at, assigned_at, entered_in_progress_at, completed_at, rework_count)
VALUES (HEXTORAW('E000000000000000000000000000002F'), 'V13-102 M8 - Deployment & Closure', 'DONE', 'MEDIUM', HEXTORAW('F18FB987E9A04CA58213404D089F41AA'), HEXTORAW('A4F9BF0579724468B818665F2FC03AA1'), HEXTORAW('E5E7D6DC9BA54E7A95B198EF1AA32060'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), TIMESTAMP '2026-02-23 09:00:00', TIMESTAMP '2026-02-23 09:00:00', TIMESTAMP '2026-02-23 09:00:00', TIMESTAMP '2026-03-10 09:00:00', TIMESTAMP '2026-03-13 17:00:00', 0);
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E000000000000000000000000000002F'), HEXTORAW('E5E7D6DC9BA54E7A95B198EF1AA32060'), NULL, 'TODO', 'WEB', TIMESTAMP '2026-02-23 09:00:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E000000000000000000000000000002F'), HEXTORAW('E5E7D6DC9BA54E7A95B198EF1AA32060'), 'TODO', 'IN_PROGRESS', 'WEB', TIMESTAMP '2026-03-10 09:00:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E000000000000000000000000000002F'), HEXTORAW('E5E7D6DC9BA54E7A95B198EF1AA32060'), 'IN_PROGRESS', 'DONE', 'WEB', TIMESTAMP '2026-03-13 17:00:00');
INSERT INTO task_work_logs (task_id, user_id, work_date, hours_worked) VALUES (HEXTORAW('E000000000000000000000000000002F'), HEXTORAW('E5E7D6DC9BA54E7A95B198EF1AA32060'), DATE '2026-03-13', 2.0);

INSERT INTO tasks (id, title, status, priority, project_id, sprint_id, assignee_id, created_by, created_at, sprint_added_at, assigned_at, entered_in_progress_at, completed_at, rework_count)
VALUES (HEXTORAW('E0000000000000000000000000000030'), 'V13-103 M9 - OCI & DevOps', 'DONE', 'MEDIUM', HEXTORAW('F18FB987E9A04CA58213404D089F41AA'), HEXTORAW('A4F9BF0579724468B818665F2FC03AA1'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), TIMESTAMP '2026-02-23 09:00:00', TIMESTAMP '2026-02-23 09:00:00', TIMESTAMP '2026-02-23 09:00:00', TIMESTAMP '2026-03-11 09:00:00', TIMESTAMP '2026-03-13 17:00:00', 0);
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E0000000000000000000000000000030'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), NULL, 'TODO', 'WEB', TIMESTAMP '2026-02-23 09:00:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E0000000000000000000000000000030'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), 'TODO', 'IN_PROGRESS', 'WEB', TIMESTAMP '2026-03-11 09:00:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E0000000000000000000000000000030'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), 'IN_PROGRESS', 'DONE', 'WEB', TIMESTAMP '2026-03-13 17:00:00');
INSERT INTO task_work_logs (task_id, user_id, work_date, hours_worked) VALUES (HEXTORAW('E0000000000000000000000000000030'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), DATE '2026-03-13', 2.0);

INSERT INTO tasks (id, title, status, priority, project_id, sprint_id, assignee_id, created_by, created_at, sprint_added_at, assigned_at, entered_in_progress_at, completed_at, rework_count)
VALUES (HEXTORAW('E0000000000000000000000000000031'), 'V13-104 M10 - Linux Support', 'DONE', 'MEDIUM', HEXTORAW('F18FB987E9A04CA58213404D089F41AA'), HEXTORAW('A4F9BF0579724468B818665F2FC03AA1'), HEXTORAW('09F9156961144414AF1D9815FED84D5F'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), TIMESTAMP '2026-02-23 09:00:00', TIMESTAMP '2026-02-23 09:00:00', TIMESTAMP '2026-02-23 09:00:00', TIMESTAMP '2026-03-11 09:00:00', TIMESTAMP '2026-03-13 17:00:00', 0);
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E0000000000000000000000000000031'), HEXTORAW('09F9156961144414AF1D9815FED84D5F'), NULL, 'TODO', 'WEB', TIMESTAMP '2026-02-23 09:00:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E0000000000000000000000000000031'), HEXTORAW('09F9156961144414AF1D9815FED84D5F'), 'TODO', 'IN_PROGRESS', 'WEB', TIMESTAMP '2026-03-11 09:00:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E0000000000000000000000000000031'), HEXTORAW('09F9156961144414AF1D9815FED84D5F'), 'IN_PROGRESS', 'DONE', 'WEB', TIMESTAMP '2026-03-13 17:00:00');
INSERT INTO task_work_logs (task_id, user_id, work_date, hours_worked) VALUES (HEXTORAW('E0000000000000000000000000000031'), HEXTORAW('09F9156961144414AF1D9815FED84D5F'), DATE '2026-03-13', 3.0);

INSERT INTO tasks (id, title, status, priority, project_id, sprint_id, assignee_id, created_by, created_at, sprint_added_at, assigned_at, entered_in_progress_at, completed_at, rework_count)
VALUES (HEXTORAW('E0000000000000000000000000000032'), 'V13-105 M11 - Java Development', 'DONE', 'MEDIUM', HEXTORAW('F18FB987E9A04CA58213404D089F41AA'), HEXTORAW('A4F9BF0579724468B818665F2FC03AA1'), HEXTORAW('DB5CABA59E764D2C83167B8578AB06DB'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), TIMESTAMP '2026-02-23 09:00:00', TIMESTAMP '2026-02-23 09:00:00', TIMESTAMP '2026-02-23 09:00:00', TIMESTAMP '2026-03-11 09:00:00', TIMESTAMP '2026-03-13 17:00:00', 0);
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E0000000000000000000000000000032'), HEXTORAW('DB5CABA59E764D2C83167B8578AB06DB'), NULL, 'TODO', 'WEB', TIMESTAMP '2026-02-23 09:00:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E0000000000000000000000000000032'), HEXTORAW('DB5CABA59E764D2C83167B8578AB06DB'), 'TODO', 'IN_PROGRESS', 'WEB', TIMESTAMP '2026-03-11 09:00:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E0000000000000000000000000000032'), HEXTORAW('DB5CABA59E764D2C83167B8578AB06DB'), 'IN_PROGRESS', 'DONE', 'WEB', TIMESTAMP '2026-03-13 17:00:00');
INSERT INTO task_work_logs (task_id, user_id, work_date, hours_worked) VALUES (HEXTORAW('E0000000000000000000000000000032'), HEXTORAW('DB5CABA59E764D2C83167B8578AB06DB'), DATE '2026-03-13', 4.0);

INSERT INTO tasks (id, title, status, priority, project_id, sprint_id, assignee_id, created_by, created_at, sprint_added_at, assigned_at, entered_in_progress_at, completed_at, rework_count)
VALUES (HEXTORAW('E0000000000000000000000000000033'), 'V13-106 M12 - Challenge', 'DONE', 'MEDIUM', HEXTORAW('F18FB987E9A04CA58213404D089F41AA'), HEXTORAW('A4F9BF0579724468B818665F2FC03AA1'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), TIMESTAMP '2026-02-23 09:00:00', TIMESTAMP '2026-02-23 09:00:00', TIMESTAMP '2026-02-23 09:00:00', TIMESTAMP '2026-03-12 09:00:00', TIMESTAMP '2026-03-13 17:00:00', 0);
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E0000000000000000000000000000033'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), NULL, 'TODO', 'WEB', TIMESTAMP '2026-02-23 09:00:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E0000000000000000000000000000033'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), 'TODO', 'IN_PROGRESS', 'WEB', TIMESTAMP '2026-03-12 09:00:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E0000000000000000000000000000033'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), 'IN_PROGRESS', 'DONE', 'WEB', TIMESTAMP '2026-03-13 17:00:00');
INSERT INTO task_work_logs (task_id, user_id, work_date, hours_worked) VALUES (HEXTORAW('E0000000000000000000000000000033'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), DATE '2026-03-13', 2.0);


-- ============================================================
-- SPRINT 2 TASKS
-- Sprint ran 2026-03-23 → 2026-04-11 (19 days)
-- ============================================================

-- V13-122 | Normalized schema | Baltazar | DONE  (parent — BLOCKED scenario)
INSERT INTO tasks (id, title, description, status, priority, project_id, sprint_id, assignee_id, created_by,
                   created_at, sprint_added_at, assigned_at, entered_in_progress_at, completed_at, rework_count)
VALUES (
    HEXTORAW('E0000000000000000000000000000034'),
    'V13-122 Normalized schema',
    'As a dev, I need a normalised schema supporting projects, sprints, tasks, and members.',
    'DONE', 'HIGH',
    HEXTORAW('F18FB987E9A04CA58213404D089F41AA'), HEXTORAW('9E957AA9278043FDB4AAD86065F344F9'),
    HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'),
    TIMESTAMP '2026-03-23 08:00:00', TIMESTAMP '2026-03-23 08:00:00', TIMESTAMP '2026-03-23 08:00:00',
    TIMESTAMP '2026-03-23 09:00:00', TIMESTAMP '2026-04-04 17:00:00', 0
);
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E0000000000000000000000000000034'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), NULL, 'TODO', 'WEB', TIMESTAMP '2026-03-23 08:00:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E0000000000000000000000000000034'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), 'TODO', 'IN_PROGRESS', 'WEB', TIMESTAMP '2026-03-23 09:00:00');
-- BLOCKED: waiting for schema review from Luis
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E0000000000000000000000000000034'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), 'IN_PROGRESS', 'BLOCKED', 'WEB', TIMESTAMP '2026-03-26 15:00:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E0000000000000000000000000000034'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), 'BLOCKED', 'IN_PROGRESS', 'WEB', TIMESTAMP '2026-03-28 09:00:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E0000000000000000000000000000034'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), 'IN_PROGRESS', 'DONE', 'WEB', TIMESTAMP '2026-04-04 17:00:00');
INSERT INTO task_work_logs (task_id, user_id, work_date, hours_worked) VALUES (HEXTORAW('E0000000000000000000000000000034'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), DATE '2026-04-04', 11.0);

-- V13-126 subtask | Baltazar | DONE
INSERT INTO tasks (id, title, status, priority, project_id, sprint_id, assignee_id, created_by, created_at, sprint_added_at, assigned_at, entered_in_progress_at, completed_at, rework_count)
VALUES (HEXTORAW('E0000000000000000000000000000035'), 'V13-126 Create project, sprint, task, project_member tables', 'DONE', 'HIGH', HEXTORAW('F18FB987E9A04CA58213404D089F41AA'), HEXTORAW('9E957AA9278043FDB4AAD86065F344F9'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), TIMESTAMP '2026-03-23 08:00:00', TIMESTAMP '2026-03-23 08:00:00', TIMESTAMP '2026-03-23 08:00:00', TIMESTAMP '2026-03-23 09:30:00', TIMESTAMP '2026-03-24 16:00:00', 0);
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E0000000000000000000000000000035'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), NULL, 'TODO', 'WEB', TIMESTAMP '2026-03-23 08:00:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E0000000000000000000000000000035'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), 'TODO', 'IN_PROGRESS', 'WEB', TIMESTAMP '2026-03-23 09:30:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E0000000000000000000000000000035'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), 'IN_PROGRESS', 'DONE', 'WEB', TIMESTAMP '2026-03-24 16:00:00');
INSERT INTO task_work_logs (task_id, user_id, work_date, hours_worked) VALUES (HEXTORAW('E0000000000000000000000000000035'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), DATE '2026-03-24', 3.0);

-- V13-127 | Baltazar | DONE
INSERT INTO tasks (id, title, status, priority, project_id, sprint_id, assignee_id, created_by, created_at, sprint_added_at, assigned_at, entered_in_progress_at, completed_at, rework_count)
VALUES (HEXTORAW('E0000000000000000000000000000036'), 'V13-127 Add task_state_history table with source column', 'DONE', 'HIGH', HEXTORAW('F18FB987E9A04CA58213404D089F41AA'), HEXTORAW('9E957AA9278043FDB4AAD86065F344F9'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), TIMESTAMP '2026-03-24 16:00:00', TIMESTAMP '2026-03-24 16:00:00', TIMESTAMP '2026-03-24 16:00:00', TIMESTAMP '2026-03-25 09:00:00', TIMESTAMP '2026-03-25 15:00:00', 0);
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E0000000000000000000000000000036'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), NULL, 'TODO', 'WEB', TIMESTAMP '2026-03-24 16:00:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E0000000000000000000000000000036'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), 'TODO', 'IN_PROGRESS', 'WEB', TIMESTAMP '2026-03-25 09:00:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E0000000000000000000000000000036'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), 'IN_PROGRESS', 'DONE', 'WEB', TIMESTAMP '2026-03-25 15:00:00');
INSERT INTO task_work_logs (task_id, user_id, work_date, hours_worked) VALUES (HEXTORAW('E0000000000000000000000000000036'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), DATE '2026-03-25', 2.0);

-- V13-128 | Baltazar | DONE
INSERT INTO tasks (id, title, status, priority, project_id, sprint_id, assignee_id, created_by, created_at, sprint_added_at, assigned_at, entered_in_progress_at, completed_at, rework_count)
VALUES (HEXTORAW('E0000000000000000000000000000037'), 'V13-128 Add task_work_log table for effort tracking', 'DONE', 'MEDIUM', HEXTORAW('F18FB987E9A04CA58213404D089F41AA'), HEXTORAW('9E957AA9278043FDB4AAD86065F344F9'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), TIMESTAMP '2026-03-25 15:30:00', TIMESTAMP '2026-03-25 15:30:00', TIMESTAMP '2026-03-25 15:30:00', TIMESTAMP '2026-03-26 09:00:00', TIMESTAMP '2026-03-26 14:00:00', 0);
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E0000000000000000000000000000037'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), NULL, 'TODO', 'WEB', TIMESTAMP '2026-03-25 15:30:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E0000000000000000000000000000037'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), 'TODO', 'IN_PROGRESS', 'WEB', TIMESTAMP '2026-03-26 09:00:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E0000000000000000000000000000037'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), 'IN_PROGRESS', 'DONE', 'WEB', TIMESTAMP '2026-03-26 14:00:00');
INSERT INTO task_work_logs (task_id, user_id, work_date, hours_worked) VALUES (HEXTORAW('E0000000000000000000000000000037'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), DATE '2026-03-26', 1.0);

-- V13-129 | Baltazar | DONE
INSERT INTO tasks (id, title, status, priority, project_id, sprint_id, assignee_id, created_by, created_at, sprint_added_at, assigned_at, entered_in_progress_at, completed_at, rework_count)
VALUES (HEXTORAW('E0000000000000000000000000000038'), 'V13-129 Add telegram_link_code and bot_conversation tables', 'DONE', 'MEDIUM', HEXTORAW('F18FB987E9A04CA58213404D089F41AA'), HEXTORAW('9E957AA9278043FDB4AAD86065F344F9'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), TIMESTAMP '2026-03-26 14:30:00', TIMESTAMP '2026-03-26 14:30:00', TIMESTAMP '2026-03-26 14:30:00', TIMESTAMP '2026-03-27 09:00:00', TIMESTAMP '2026-03-27 14:00:00', 0);
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E0000000000000000000000000000038'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), NULL, 'TODO', 'WEB', TIMESTAMP '2026-03-26 14:30:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E0000000000000000000000000000038'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), 'TODO', 'IN_PROGRESS', 'WEB', TIMESTAMP '2026-03-27 09:00:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E0000000000000000000000000000038'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), 'IN_PROGRESS', 'DONE', 'WEB', TIMESTAMP '2026-03-27 14:00:00');
INSERT INTO task_work_logs (task_id, user_id, work_date, hours_worked) VALUES (HEXTORAW('E0000000000000000000000000000038'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), DATE '2026-03-27', 1.0);

-- V13-130 | Baltazar | DONE
INSERT INTO tasks (id, title, status, priority, project_id, sprint_id, assignee_id, created_by, created_at, sprint_added_at, assigned_at, entered_in_progress_at, completed_at, rework_count)
VALUES (HEXTORAW('E0000000000000000000000000000039'), 'V13-130 Write Flyway/Liquibase migration scripts', 'DONE', 'HIGH', HEXTORAW('F18FB987E9A04CA58213404D089F41AA'), HEXTORAW('9E957AA9278043FDB4AAD86065F344F9'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), TIMESTAMP '2026-03-27 14:30:00', TIMESTAMP '2026-03-27 14:30:00', TIMESTAMP '2026-03-27 14:30:00', TIMESTAMP '2026-03-28 09:00:00', TIMESTAMP '2026-04-01 15:00:00', 0);
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E0000000000000000000000000000039'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), NULL, 'TODO', 'WEB', TIMESTAMP '2026-03-27 14:30:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E0000000000000000000000000000039'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), 'TODO', 'IN_PROGRESS', 'WEB', TIMESTAMP '2026-03-28 09:00:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E0000000000000000000000000000039'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), 'IN_PROGRESS', 'DONE', 'WEB', TIMESTAMP '2026-04-01 15:00:00');
INSERT INTO task_work_logs (task_id, user_id, work_date, hours_worked) VALUES (HEXTORAW('E0000000000000000000000000000039'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), DATE '2026-04-01', 3.0);

-- V13-131 | Baltazar | DONE  ← SCOPE CREEP: added after sprint started
INSERT INTO tasks (id, title, status, priority, project_id, sprint_id, assignee_id, created_by, created_at, sprint_added_at, assigned_at, entered_in_progress_at, completed_at, rework_count)
VALUES (
    HEXTORAW('E000000000000000000000000000003A'),
    'V13-131 Seed dev data for local testing',
    NULL,
    'DONE', 'LOW',
    HEXTORAW('F18FB987E9A04CA58213404D089F41AA'), HEXTORAW('9E957AA9278043FDB4AAD86065F344F9'),
    HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'),
    TIMESTAMP '2026-03-30 10:00:00',  -- created after sprint start (March 23) → scope creep
    TIMESTAMP '2026-03-30 10:00:00',
    TIMESTAMP '2026-03-30 10:00:00',
    TIMESTAMP '2026-03-31 09:00:00',
    TIMESTAMP '2026-04-02 14:00:00',
    0
);
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E000000000000000000000000000003A'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), NULL, 'TODO', 'WEB', TIMESTAMP '2026-03-30 10:00:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E000000000000000000000000000003A'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), 'TODO', 'IN_PROGRESS', 'WEB', TIMESTAMP '2026-03-31 09:00:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E000000000000000000000000000003A'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), 'IN_PROGRESS', 'DONE', 'WEB', TIMESTAMP '2026-04-02 14:00:00');
INSERT INTO task_work_logs (task_id, user_id, work_date, hours_worked) VALUES (HEXTORAW('E000000000000000000000000000003A'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), DATE '2026-04-02', 2.0);


-- V13-123 | KPI persistence | Ana Paula | DONE
INSERT INTO tasks (id, title, description, status, priority, project_id, sprint_id, assignee_id, created_by, created_at, sprint_added_at, assigned_at, entered_in_progress_at, completed_at, rework_count)
VALUES (HEXTORAW('E000000000000000000000000000003B'), 'V13-123 KPI persistence', 'As a dev, I need sprint_kpi_snapshot to persist KPIs after data purge.', 'DONE', 'HIGH', HEXTORAW('F18FB987E9A04CA58213404D089F41AA'), HEXTORAW('9E957AA9278043FDB4AAD86065F344F9'), HEXTORAW('09F9156961144414AF1D9815FED84D5F'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), TIMESTAMP '2026-03-23 08:00:00', TIMESTAMP '2026-03-23 08:00:00', TIMESTAMP '2026-03-23 08:00:00', TIMESTAMP '2026-03-23 10:00:00', TIMESTAMP '2026-03-28 16:00:00', 0);
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E000000000000000000000000000003B'), HEXTORAW('09F9156961144414AF1D9815FED84D5F'), NULL, 'TODO', 'WEB', TIMESTAMP '2026-03-23 08:00:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E000000000000000000000000000003B'), HEXTORAW('09F9156961144414AF1D9815FED84D5F'), 'TODO', 'IN_PROGRESS', 'WEB', TIMESTAMP '2026-03-23 10:00:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E000000000000000000000000000003B'), HEXTORAW('09F9156961144414AF1D9815FED84D5F'), 'IN_PROGRESS', 'DONE', 'WEB', TIMESTAMP '2026-03-28 16:00:00');
INSERT INTO task_work_logs (task_id, user_id, work_date, hours_worked) VALUES (HEXTORAW('E000000000000000000000000000003B'), HEXTORAW('09F9156961144414AF1D9815FED84D5F'), DATE '2026-03-28', 4.5);

-- V13-132/133/134 subtasks (Ana Paula, quick turnaround)
INSERT INTO tasks (id, title, status, priority, project_id, sprint_id, assignee_id, created_by, created_at, sprint_added_at, assigned_at, entered_in_progress_at, completed_at, rework_count)
VALUES (HEXTORAW('E000000000000000000000000000003C'), 'V13-132 Create sprint_kpi_snapshot table', 'DONE', 'HIGH', HEXTORAW('F18FB987E9A04CA58213404D089F41AA'), HEXTORAW('9E957AA9278043FDB4AAD86065F344F9'), HEXTORAW('09F9156961144414AF1D9815FED84D5F'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), TIMESTAMP '2026-03-23 08:00:00', TIMESTAMP '2026-03-23 08:00:00', TIMESTAMP '2026-03-23 08:00:00', TIMESTAMP '2026-03-23 11:00:00', TIMESTAMP '2026-03-24 15:00:00', 0);
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E000000000000000000000000000003C'), HEXTORAW('09F9156961144414AF1D9815FED84D5F'), NULL, 'TODO', 'WEB', TIMESTAMP '2026-03-23 08:00:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E000000000000000000000000000003C'), HEXTORAW('09F9156961144414AF1D9815FED84D5F'), 'TODO', 'IN_PROGRESS', 'WEB', TIMESTAMP '2026-03-23 11:00:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E000000000000000000000000000003C'), HEXTORAW('09F9156961144414AF1D9815FED84D5F'), 'IN_PROGRESS', 'DONE', 'WEB', TIMESTAMP '2026-03-24 15:00:00');
INSERT INTO task_work_logs (task_id, user_id, work_date, hours_worked) VALUES (HEXTORAW('E000000000000000000000000000003C'), HEXTORAW('09F9156961144414AF1D9815FED84D5F'), DATE '2026-03-24', 2.5);

INSERT INTO tasks (id, title, status, priority, project_id, sprint_id, assignee_id, created_by, created_at, sprint_added_at, assigned_at, entered_in_progress_at, completed_at, rework_count)
VALUES (HEXTORAW('E000000000000000000000000000003D'), 'V13-133 Ensure KPI table excluded from nightly purge cascade', 'DONE', 'HIGH', HEXTORAW('F18FB987E9A04CA58213404D089F41AA'), HEXTORAW('9E957AA9278043FDB4AAD86065F344F9'), HEXTORAW('09F9156961144414AF1D9815FED84D5F'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), TIMESTAMP '2026-03-24 15:30:00', TIMESTAMP '2026-03-24 15:30:00', TIMESTAMP '2026-03-24 15:30:00', TIMESTAMP '2026-03-25 09:00:00', TIMESTAMP '2026-03-25 12:00:00', 0);
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E000000000000000000000000000003D'), HEXTORAW('09F9156961144414AF1D9815FED84D5F'), NULL, 'TODO', 'WEB', TIMESTAMP '2026-03-24 15:30:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E000000000000000000000000000003D'), HEXTORAW('09F9156961144414AF1D9815FED84D5F'), 'TODO', 'IN_PROGRESS', 'WEB', TIMESTAMP '2026-03-25 09:00:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E000000000000000000000000000003D'), HEXTORAW('09F9156961144414AF1D9815FED84D5F'), 'IN_PROGRESS', 'DONE', 'WEB', TIMESTAMP '2026-03-25 12:00:00');
INSERT INTO task_work_logs (task_id, user_id, work_date, hours_worked) VALUES (HEXTORAW('E000000000000000000000000000003D'), HEXTORAW('09F9156961144414AF1D9815FED84D5F'), DATE '2026-03-25', 1.0);

INSERT INTO tasks (id, title, status, priority, project_id, sprint_id, assignee_id, created_by, created_at, sprint_added_at, assigned_at, entered_in_progress_at, completed_at, rework_count)
VALUES (HEXTORAW('E000000000000000000000000000003E'), 'V13-134 Document KPI table in schema README', 'DONE', 'LOW', HEXTORAW('F18FB987E9A04CA58213404D089F41AA'), HEXTORAW('9E957AA9278043FDB4AAD86065F344F9'), HEXTORAW('09F9156961144414AF1D9815FED84D5F'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), TIMESTAMP '2026-03-25 13:00:00', TIMESTAMP '2026-03-25 13:00:00', TIMESTAMP '2026-03-25 13:00:00', TIMESTAMP '2026-03-26 09:00:00', TIMESTAMP '2026-03-26 12:00:00', 0);
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E000000000000000000000000000003E'), HEXTORAW('09F9156961144414AF1D9815FED84D5F'), NULL, 'TODO', 'WEB', TIMESTAMP '2026-03-25 13:00:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E000000000000000000000000000003E'), HEXTORAW('09F9156961144414AF1D9815FED84D5F'), 'TODO', 'IN_PROGRESS', 'WEB', TIMESTAMP '2026-03-26 09:00:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E000000000000000000000000000003E'), HEXTORAW('09F9156961144414AF1D9815FED84D5F'), 'IN_PROGRESS', 'DONE', 'WEB', TIMESTAMP '2026-03-26 12:00:00');
INSERT INTO task_work_logs (task_id, user_id, work_date, hours_worked) VALUES (HEXTORAW('E000000000000000000000000000003E'), HEXTORAW('09F9156961144414AF1D9815FED84D5F'), DATE '2026-03-26', 0.5);


-- V13-125 | Nightly purge | jozefhdez | DONE  (REWORK scenario)
INSERT INTO tasks (id, title, description, status, priority, project_id, sprint_id, assignee_id, created_by, created_at, sprint_added_at, assigned_at, entered_in_progress_at, completed_at, rework_count)
VALUES (HEXTORAW('E000000000000000000000000000003F'), 'V13-125 Nightly purge cron job', 'As a dev, I need the nightly purge cron job to delete records older than 365 days.', 'DONE', 'MEDIUM', HEXTORAW('F18FB987E9A04CA58213404D089F41AA'), HEXTORAW('9E957AA9278043FDB4AAD86065F344F9'), HEXTORAW('DB5CABA59E764D2C83167B8578AB06DB'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), TIMESTAMP '2026-03-23 08:00:00', TIMESTAMP '2026-03-23 08:00:00', TIMESTAMP '2026-03-23 08:00:00', TIMESTAMP '2026-03-24 09:00:00', TIMESTAMP '2026-04-07 16:00:00', 1);
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E000000000000000000000000000003F'), HEXTORAW('DB5CABA59E764D2C83167B8578AB06DB'), NULL, 'TODO', 'WEB', TIMESTAMP '2026-03-23 08:00:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E000000000000000000000000000003F'), HEXTORAW('DB5CABA59E764D2C83167B8578AB06DB'), 'TODO', 'IN_PROGRESS', 'WEB', TIMESTAMP '2026-03-24 09:00:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E000000000000000000000000000003F'), HEXTORAW('DB5CABA59E764D2C83167B8578AB06DB'), 'IN_PROGRESS', 'DONE', 'WEB', TIMESTAMP '2026-03-31 15:00:00');
-- Rework: tests failed in CI
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E000000000000000000000000000003F'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), 'DONE', 'IN_PROGRESS', 'WEB', TIMESTAMP '2026-04-01 09:00:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E000000000000000000000000000003F'), HEXTORAW('DB5CABA59E764D2C83167B8578AB06DB'), 'IN_PROGRESS', 'DONE', 'WEB', TIMESTAMP '2026-04-07 16:00:00');
INSERT INTO task_work_logs (task_id, user_id, work_date, hours_worked) VALUES (HEXTORAW('E000000000000000000000000000003F'), HEXTORAW('DB5CABA59E764D2C83167B8578AB06DB'), DATE '2026-04-07', 8.5);

-- V13-135/136/137/138 subtasks (jozefhdez)
INSERT INTO tasks (id, title, status, priority, project_id, sprint_id, assignee_id, created_by, created_at, sprint_added_at, assigned_at, entered_in_progress_at, completed_at, rework_count)
VALUES (HEXTORAW('E0000000000000000000000000000040'), 'V13-135 Implement scheduled cron job for purge', 'DONE', 'MEDIUM', HEXTORAW('F18FB987E9A04CA58213404D089F41AA'), HEXTORAW('9E957AA9278043FDB4AAD86065F344F9'), HEXTORAW('DB5CABA59E764D2C83167B8578AB06DB'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), TIMESTAMP '2026-03-23 08:00:00', TIMESTAMP '2026-03-23 08:00:00', TIMESTAMP '2026-03-23 08:00:00', TIMESTAMP '2026-03-24 10:00:00', TIMESTAMP '2026-03-26 14:00:00', 0);
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E0000000000000000000000000000040'), HEXTORAW('DB5CABA59E764D2C83167B8578AB06DB'), NULL, 'TODO', 'WEB', TIMESTAMP '2026-03-23 08:00:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E0000000000000000000000000000040'), HEXTORAW('DB5CABA59E764D2C83167B8578AB06DB'), 'TODO', 'IN_PROGRESS', 'WEB', TIMESTAMP '2026-03-24 10:00:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E0000000000000000000000000000040'), HEXTORAW('DB5CABA59E764D2C83167B8578AB06DB'), 'IN_PROGRESS', 'DONE', 'WEB', TIMESTAMP '2026-03-26 14:00:00');
INSERT INTO task_work_logs (task_id, user_id, work_date, hours_worked) VALUES (HEXTORAW('E0000000000000000000000000000040'), HEXTORAW('DB5CABA59E764D2C83167B8578AB06DB'), DATE '2026-03-26', 3.0);

INSERT INTO tasks (id, title, status, priority, project_id, sprint_id, assignee_id, created_by, created_at, sprint_added_at, assigned_at, entered_in_progress_at, completed_at, rework_count)
VALUES (HEXTORAW('E0000000000000000000000000000041'), 'V13-136 Implement dry-run log before deletion', 'DONE', 'MEDIUM', HEXTORAW('F18FB987E9A04CA58213404D089F41AA'), HEXTORAW('9E957AA9278043FDB4AAD86065F344F9'), HEXTORAW('DB5CABA59E764D2C83167B8578AB06DB'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), TIMESTAMP '2026-03-26 14:30:00', TIMESTAMP '2026-03-26 14:30:00', TIMESTAMP '2026-03-26 14:30:00', TIMESTAMP '2026-03-27 09:00:00', TIMESTAMP '2026-03-27 16:00:00', 0);
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E0000000000000000000000000000041'), HEXTORAW('DB5CABA59E764D2C83167B8578AB06DB'), NULL, 'TODO', 'WEB', TIMESTAMP '2026-03-26 14:30:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E0000000000000000000000000000041'), HEXTORAW('DB5CABA59E764D2C83167B8578AB06DB'), 'TODO', 'IN_PROGRESS', 'WEB', TIMESTAMP '2026-03-27 09:00:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E0000000000000000000000000000041'), HEXTORAW('DB5CABA59E764D2C83167B8578AB06DB'), 'IN_PROGRESS', 'DONE', 'WEB', TIMESTAMP '2026-03-27 16:00:00');
INSERT INTO task_work_logs (task_id, user_id, work_date, hours_worked) VALUES (HEXTORAW('E0000000000000000000000000000041'), HEXTORAW('DB5CABA59E764D2C83167B8578AB06DB'), DATE '2026-03-27', 1.0);

INSERT INTO tasks (id, title, status, priority, project_id, sprint_id, assignee_id, created_by, created_at, sprint_added_at, assigned_at, entered_in_progress_at, completed_at, rework_count)
VALUES (HEXTORAW('E0000000000000000000000000000042'), 'V13-137 Wrap deletion in transaction with rollback guard', 'DONE', 'HIGH', HEXTORAW('F18FB987E9A04CA58213404D089F41AA'), HEXTORAW('9E957AA9278043FDB4AAD86065F344F9'), HEXTORAW('DB5CABA59E764D2C83167B8578AB06DB'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), TIMESTAMP '2026-03-27 16:30:00', TIMESTAMP '2026-03-27 16:30:00', TIMESTAMP '2026-03-27 16:30:00', TIMESTAMP '2026-03-28 09:00:00', TIMESTAMP '2026-03-30 14:00:00', 0);
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E0000000000000000000000000000042'), HEXTORAW('DB5CABA59E764D2C83167B8578AB06DB'), NULL, 'TODO', 'WEB', TIMESTAMP '2026-03-27 16:30:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E0000000000000000000000000000042'), HEXTORAW('DB5CABA59E764D2C83167B8578AB06DB'), 'TODO', 'IN_PROGRESS', 'WEB', TIMESTAMP '2026-03-28 09:00:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E0000000000000000000000000000042'), HEXTORAW('DB5CABA59E764D2C83167B8578AB06DB'), 'IN_PROGRESS', 'DONE', 'WEB', TIMESTAMP '2026-03-30 14:00:00');
INSERT INTO task_work_logs (task_id, user_id, work_date, hours_worked) VALUES (HEXTORAW('E0000000000000000000000000000042'), HEXTORAW('DB5CABA59E764D2C83167B8578AB06DB'), DATE '2026-03-30', 2.5);

INSERT INTO tasks (id, title, status, priority, project_id, sprint_id, assignee_id, created_by, created_at, sprint_added_at, assigned_at, entered_in_progress_at, completed_at, rework_count)
VALUES (HEXTORAW('E0000000000000000000000000000043'), 'V13-138 Write unit tests for purge logic', 'DONE', 'MEDIUM', HEXTORAW('F18FB987E9A04CA58213404D089F41AA'), HEXTORAW('9E957AA9278043FDB4AAD86065F344F9'), HEXTORAW('DB5CABA59E764D2C83167B8578AB06DB'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), TIMESTAMP '2026-03-30 14:30:00', TIMESTAMP '2026-03-30 14:30:00', TIMESTAMP '2026-03-30 14:30:00', TIMESTAMP '2026-03-31 09:00:00', TIMESTAMP '2026-03-31 17:00:00', 0);
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E0000000000000000000000000000043'), HEXTORAW('DB5CABA59E764D2C83167B8578AB06DB'), NULL, 'TODO', 'WEB', TIMESTAMP '2026-03-30 14:30:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E0000000000000000000000000000043'), HEXTORAW('DB5CABA59E764D2C83167B8578AB06DB'), 'TODO', 'IN_PROGRESS', 'WEB', TIMESTAMP '2026-03-31 09:00:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E0000000000000000000000000000043'), HEXTORAW('DB5CABA59E764D2C83167B8578AB06DB'), 'IN_PROGRESS', 'DONE', 'WEB', TIMESTAMP '2026-03-31 17:00:00');
INSERT INTO task_work_logs (task_id, user_id, work_date, hours_worked) VALUES (HEXTORAW('E0000000000000000000000000000043'), HEXTORAW('DB5CABA59E764D2C83167B8578AB06DB'), DATE '2026-03-31', 1.0);


-- KPI tasks V13-140 to V13-158 (sprint 2) — abbreviated blocks

-- V13-140 Cycle time | jozefhdez
INSERT INTO tasks (id, title, description, status, priority, project_id, sprint_id, assignee_id, created_by, created_at, sprint_added_at, assigned_at, entered_in_progress_at, completed_at, rework_count)
VALUES (HEXTORAW('E0000000000000000000000000000044'), 'V13-140 KPI: Cycle time', 'As a PM, I want to see average cycle time per sprint.', 'DONE', 'HIGH', HEXTORAW('F18FB987E9A04CA58213404D089F41AA'), HEXTORAW('9E957AA9278043FDB4AAD86065F344F9'), HEXTORAW('DB5CABA59E764D2C83167B8578AB06DB'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), TIMESTAMP '2026-03-23 08:00:00', TIMESTAMP '2026-03-23 08:00:00', TIMESTAMP '2026-03-23 08:00:00', TIMESTAMP '2026-03-23 11:00:00', TIMESTAMP '2026-03-30 15:00:00', 0);
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E0000000000000000000000000000044'), HEXTORAW('DB5CABA59E764D2C83167B8578AB06DB'), NULL, 'TODO', 'WEB', TIMESTAMP '2026-03-23 08:00:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E0000000000000000000000000000044'), HEXTORAW('DB5CABA59E764D2C83167B8578AB06DB'), 'TODO', 'IN_PROGRESS', 'WEB', TIMESTAMP '2026-03-23 11:00:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E0000000000000000000000000000044'), HEXTORAW('DB5CABA59E764D2C83167B8578AB06DB'), 'IN_PROGRESS', 'DONE', 'WEB', TIMESTAMP '2026-03-30 15:00:00');
INSERT INTO task_work_logs (task_id, user_id, work_date, hours_worked) VALUES (HEXTORAW('E0000000000000000000000000000044'), HEXTORAW('DB5CABA59E764D2C83167B8578AB06DB'), DATE '2026-03-30', 4.0);

INSERT INTO tasks (id, title, status, priority, project_id, sprint_id, assignee_id, created_by, created_at, sprint_added_at, assigned_at, entered_in_progress_at, completed_at, rework_count)
VALUES (HEXTORAW('E0000000000000000000000000000045'), 'V13-144 Store entered_in_progress_at and completed_at on task', 'DONE', 'HIGH', HEXTORAW('F18FB987E9A04CA58213404D089F41AA'), HEXTORAW('9E957AA9278043FDB4AAD86065F344F9'), HEXTORAW('DB5CABA59E764D2C83167B8578AB06DB'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), TIMESTAMP '2026-03-23 08:00:00', TIMESTAMP '2026-03-23 08:00:00', TIMESTAMP '2026-03-23 08:00:00', TIMESTAMP '2026-03-23 11:30:00', TIMESTAMP '2026-03-25 14:00:00', 0);
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E0000000000000000000000000000045'), HEXTORAW('DB5CABA59E764D2C83167B8578AB06DB'), NULL, 'TODO', 'WEB', TIMESTAMP '2026-03-23 08:00:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E0000000000000000000000000000045'), HEXTORAW('DB5CABA59E764D2C83167B8578AB06DB'), 'TODO', 'IN_PROGRESS', 'WEB', TIMESTAMP '2026-03-23 11:30:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E0000000000000000000000000000045'), HEXTORAW('DB5CABA59E764D2C83167B8578AB06DB'), 'IN_PROGRESS', 'DONE', 'WEB', TIMESTAMP '2026-03-25 14:00:00');
INSERT INTO task_work_logs (task_id, user_id, work_date, hours_worked) VALUES (HEXTORAW('E0000000000000000000000000000045'), HEXTORAW('DB5CABA59E764D2C83167B8578AB06DB'), DATE '2026-03-25', 1.5);

INSERT INTO tasks (id, title, status, priority, project_id, sprint_id, assignee_id, created_by, created_at, sprint_added_at, assigned_at, entered_in_progress_at, completed_at, rework_count)
VALUES (HEXTORAW('E0000000000000000000000000000046'), 'V13-145 Write cycle time aggregation query', 'DONE', 'HIGH', HEXTORAW('F18FB987E9A04CA58213404D089F41AA'), HEXTORAW('9E957AA9278043FDB4AAD86065F344F9'), HEXTORAW('DB5CABA59E764D2C83167B8578AB06DB'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), TIMESTAMP '2026-03-25 14:30:00', TIMESTAMP '2026-03-25 14:30:00', TIMESTAMP '2026-03-25 14:30:00', TIMESTAMP '2026-03-26 09:00:00', TIMESTAMP '2026-03-28 16:00:00', 0);
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E0000000000000000000000000000046'), HEXTORAW('DB5CABA59E764D2C83167B8578AB06DB'), NULL, 'TODO', 'WEB', TIMESTAMP '2026-03-25 14:30:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E0000000000000000000000000000046'), HEXTORAW('DB5CABA59E764D2C83167B8578AB06DB'), 'TODO', 'IN_PROGRESS', 'WEB', TIMESTAMP '2026-03-26 09:00:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E0000000000000000000000000000046'), HEXTORAW('DB5CABA59E764D2C83167B8578AB06DB'), 'IN_PROGRESS', 'DONE', 'WEB', TIMESTAMP '2026-03-28 16:00:00');
INSERT INTO task_work_logs (task_id, user_id, work_date, hours_worked) VALUES (HEXTORAW('E0000000000000000000000000000046'), HEXTORAW('DB5CABA59E764D2C83167B8578AB06DB'), DATE '2026-03-28', 2.5);

INSERT INTO tasks (id, title, status, priority, project_id, sprint_id, assignee_id, created_by, created_at, sprint_added_at, assigned_at, entered_in_progress_at, completed_at, rework_count)
VALUES (HEXTORAW('E0000000000000000000000000000047'), 'V13-146 Expose cycle time via KPI endpoint', 'DONE', 'MEDIUM', HEXTORAW('F18FB987E9A04CA58213404D089F41AA'), HEXTORAW('9E957AA9278043FDB4AAD86065F344F9'), HEXTORAW('DB5CABA59E764D2C83167B8578AB06DB'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), TIMESTAMP '2026-03-28 16:30:00', TIMESTAMP '2026-03-28 16:30:00', TIMESTAMP '2026-03-28 16:30:00', TIMESTAMP '2026-03-30 09:00:00', TIMESTAMP '2026-03-30 15:00:00', 0);
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E0000000000000000000000000000047'), HEXTORAW('DB5CABA59E764D2C83167B8578AB06DB'), NULL, 'TODO', 'WEB', TIMESTAMP '2026-03-28 16:30:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E0000000000000000000000000000047'), HEXTORAW('DB5CABA59E764D2C83167B8578AB06DB'), 'TODO', 'IN_PROGRESS', 'WEB', TIMESTAMP '2026-03-30 09:00:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E0000000000000000000000000000047'), HEXTORAW('DB5CABA59E764D2C83167B8578AB06DB'), 'IN_PROGRESS', 'DONE', 'WEB', TIMESTAMP '2026-03-30 15:00:00');
INSERT INTO task_work_logs (task_id, user_id, work_date, hours_worked) VALUES (HEXTORAW('E0000000000000000000000000000047'), HEXTORAW('DB5CABA59E764D2C83167B8578AB06DB'), DATE '2026-03-30', 1.0);


-- V13-141 Effort logged | Ana Paula
INSERT INTO tasks (id, title, description, status, priority, project_id, sprint_id, assignee_id, created_by, created_at, sprint_added_at, assigned_at, entered_in_progress_at, completed_at, rework_count)
VALUES (HEXTORAW('E0000000000000000000000000000048'), 'V13-141 KPI: Effort logged', 'As a PM, I want to see effort logged vs planned.', 'DONE', 'HIGH', HEXTORAW('F18FB987E9A04CA58213404D089F41AA'), HEXTORAW('9E957AA9278043FDB4AAD86065F344F9'), HEXTORAW('09F9156961144414AF1D9815FED84D5F'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), TIMESTAMP '2026-03-23 08:00:00', TIMESTAMP '2026-03-23 08:00:00', TIMESTAMP '2026-03-23 08:00:00', TIMESTAMP '2026-03-24 09:00:00', TIMESTAMP '2026-03-31 14:00:00', 0);
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E0000000000000000000000000000048'), HEXTORAW('09F9156961144414AF1D9815FED84D5F'), NULL, 'TODO', 'WEB', TIMESTAMP '2026-03-23 08:00:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E0000000000000000000000000000048'), HEXTORAW('09F9156961144414AF1D9815FED84D5F'), 'TODO', 'IN_PROGRESS', 'WEB', TIMESTAMP '2026-03-24 09:00:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E0000000000000000000000000000048'), HEXTORAW('09F9156961144414AF1D9815FED84D5F'), 'IN_PROGRESS', 'DONE', 'WEB', TIMESTAMP '2026-03-31 14:00:00');
INSERT INTO task_work_logs (task_id, user_id, work_date, hours_worked) VALUES (HEXTORAW('E0000000000000000000000000000048'), HEXTORAW('09F9156961144414AF1D9815FED84D5F'), DATE '2026-03-31', 3.5);

INSERT INTO tasks (id, title, status, priority, project_id, sprint_id, assignee_id, created_by, created_at, sprint_added_at, assigned_at, entered_in_progress_at, completed_at, rework_count)
VALUES (HEXTORAW('E0000000000000000000000000000049'), 'V13-147 Write query summing work_log days per sprint', 'DONE', 'HIGH', HEXTORAW('F18FB987E9A04CA58213404D089F41AA'), HEXTORAW('9E957AA9278043FDB4AAD86065F344F9'), HEXTORAW('09F9156961144414AF1D9815FED84D5F'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), TIMESTAMP '2026-03-23 08:00:00', TIMESTAMP '2026-03-23 08:00:00', TIMESTAMP '2026-03-23 08:00:00', TIMESTAMP '2026-03-24 10:00:00', TIMESTAMP '2026-03-26 15:00:00', 0);
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E0000000000000000000000000000049'), HEXTORAW('09F9156961144414AF1D9815FED84D5F'), NULL, 'TODO', 'WEB', TIMESTAMP '2026-03-23 08:00:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E0000000000000000000000000000049'), HEXTORAW('09F9156961144414AF1D9815FED84D5F'), 'TODO', 'IN_PROGRESS', 'WEB', TIMESTAMP '2026-03-24 10:00:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E0000000000000000000000000000049'), HEXTORAW('09F9156961144414AF1D9815FED84D5F'), 'IN_PROGRESS', 'DONE', 'WEB', TIMESTAMP '2026-03-26 15:00:00');
INSERT INTO task_work_logs (task_id, user_id, work_date, hours_worked) VALUES (HEXTORAW('E0000000000000000000000000000049'), HEXTORAW('09F9156961144414AF1D9815FED84D5F'), DATE '2026-03-26', 2.5);

INSERT INTO tasks (id, title, status, priority, project_id, sprint_id, assignee_id, created_by, created_at, sprint_added_at, assigned_at, entered_in_progress_at, completed_at, rework_count)
VALUES (HEXTORAW('E000000000000000000000000000004A'), 'V13-148 Include planned_task_count in response', 'DONE', 'MEDIUM', HEXTORAW('F18FB987E9A04CA58213404D089F41AA'), HEXTORAW('9E957AA9278043FDB4AAD86065F344F9'), HEXTORAW('09F9156961144414AF1D9815FED84D5F'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), TIMESTAMP '2026-03-26 15:30:00', TIMESTAMP '2026-03-26 15:30:00', TIMESTAMP '2026-03-26 15:30:00', TIMESTAMP '2026-03-27 09:00:00', TIMESTAMP '2026-03-27 15:00:00', 0);
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E000000000000000000000000000004A'), HEXTORAW('09F9156961144414AF1D9815FED84D5F'), NULL, 'TODO', 'WEB', TIMESTAMP '2026-03-26 15:30:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E000000000000000000000000000004A'), HEXTORAW('09F9156961144414AF1D9815FED84D5F'), 'TODO', 'IN_PROGRESS', 'WEB', TIMESTAMP '2026-03-27 09:00:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E000000000000000000000000000004A'), HEXTORAW('09F9156961144414AF1D9815FED84D5F'), 'IN_PROGRESS', 'DONE', 'WEB', TIMESTAMP '2026-03-27 15:00:00');
INSERT INTO task_work_logs (task_id, user_id, work_date, hours_worked) VALUES (HEXTORAW('E000000000000000000000000000004A'), HEXTORAW('09F9156961144414AF1D9815FED84D5F'), DATE '2026-03-27', 1.0);

INSERT INTO tasks (id, title, status, priority, project_id, sprint_id, assignee_id, created_by, created_at, sprint_added_at, assigned_at, entered_in_progress_at, completed_at, rework_count)
VALUES (HEXTORAW('E000000000000000000000000000004B'), 'V13-149 Add effort data to KPI endpoint response', 'DONE', 'MEDIUM', HEXTORAW('F18FB987E9A04CA58213404D089F41AA'), HEXTORAW('9E957AA9278043FDB4AAD86065F344F9'), HEXTORAW('09F9156961144414AF1D9815FED84D5F'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), TIMESTAMP '2026-03-27 15:30:00', TIMESTAMP '2026-03-27 15:30:00', TIMESTAMP '2026-03-27 15:30:00', TIMESTAMP '2026-03-28 09:00:00', TIMESTAMP '2026-03-28 14:00:00', 0);
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E000000000000000000000000000004B'), HEXTORAW('09F9156961144414AF1D9815FED84D5F'), NULL, 'TODO', 'WEB', TIMESTAMP '2026-03-27 15:30:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E000000000000000000000000000004B'), HEXTORAW('09F9156961144414AF1D9815FED84D5F'), 'TODO', 'IN_PROGRESS', 'WEB', TIMESTAMP '2026-03-28 09:00:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E000000000000000000000000000004B'), HEXTORAW('09F9156961144414AF1D9815FED84D5F'), 'IN_PROGRESS', 'DONE', 'WEB', TIMESTAMP '2026-03-28 14:00:00');
INSERT INTO task_work_logs (task_id, user_id, work_date, hours_worked) VALUES (HEXTORAW('E000000000000000000000000000004B'), HEXTORAW('09F9156961144414AF1D9815FED84D5F'), DATE '2026-03-28', 0.5);


-- V13-142 Blocked tasks KPI | Luis
INSERT INTO tasks (id, title, description, status, priority, project_id, sprint_id, assignee_id, created_by, created_at, sprint_added_at, assigned_at, entered_in_progress_at, completed_at, rework_count)
VALUES (HEXTORAW('E000000000000000000000000000004C'), 'V13-142 KPI: Blocked tasks', 'As a PM, I want to see blocked tasks with live days-blocked counter.', 'DONE', 'HIGH', HEXTORAW('F18FB987E9A04CA58213404D089F41AA'), HEXTORAW('9E957AA9278043FDB4AAD86065F344F9'), HEXTORAW('D9664711BC1348ABA56BCA68B161244A'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), TIMESTAMP '2026-03-23 08:00:00', TIMESTAMP '2026-03-23 08:00:00', TIMESTAMP '2026-03-23 08:00:00', TIMESTAMP '2026-03-24 09:00:00', TIMESTAMP '2026-04-02 15:00:00', 0);
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E000000000000000000000000000004C'), HEXTORAW('D9664711BC1348ABA56BCA68B161244A'), NULL, 'TODO', 'WEB', TIMESTAMP '2026-03-23 08:00:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E000000000000000000000000000004C'), HEXTORAW('D9664711BC1348ABA56BCA68B161244A'), 'TODO', 'IN_PROGRESS', 'WEB', TIMESTAMP '2026-03-24 09:00:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E000000000000000000000000000004C'), HEXTORAW('D9664711BC1348ABA56BCA68B161244A'), 'IN_PROGRESS', 'DONE', 'WEB', TIMESTAMP '2026-04-02 15:00:00');
INSERT INTO task_work_logs (task_id, user_id, work_date, hours_worked) VALUES (HEXTORAW('E000000000000000000000000000004C'), HEXTORAW('D9664711BC1348ABA56BCA68B161244A'), DATE '2026-04-02', 5.0);

INSERT INTO tasks (id, title, status, priority, project_id, sprint_id, assignee_id, created_by, created_at, sprint_added_at, assigned_at, entered_in_progress_at, completed_at, rework_count) VALUES (HEXTORAW('E000000000000000000000000000004D'), 'V13-150 Store blocked_at on task', 'DONE', 'HIGH', HEXTORAW('F18FB987E9A04CA58213404D089F41AA'), HEXTORAW('9E957AA9278043FDB4AAD86065F344F9'), HEXTORAW('D9664711BC1348ABA56BCA68B161244A'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), TIMESTAMP '2026-03-23 08:00:00', TIMESTAMP '2026-03-23 08:00:00', TIMESTAMP '2026-03-23 08:00:00', TIMESTAMP '2026-03-24 10:00:00', TIMESTAMP '2026-03-25 16:00:00', 0);
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E000000000000000000000000000004D'), HEXTORAW('D9664711BC1348ABA56BCA68B161244A'), NULL, 'TODO', 'WEB', TIMESTAMP '2026-03-23 08:00:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E000000000000000000000000000004D'), HEXTORAW('D9664711BC1348ABA56BCA68B161244A'), 'TODO', 'IN_PROGRESS', 'WEB', TIMESTAMP '2026-03-24 10:00:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E000000000000000000000000000004D'), HEXTORAW('D9664711BC1348ABA56BCA68B161244A'), 'IN_PROGRESS', 'DONE', 'WEB', TIMESTAMP '2026-03-25 16:00:00');
INSERT INTO task_work_logs (task_id, user_id, work_date, hours_worked) VALUES (HEXTORAW('E000000000000000000000000000004D'), HEXTORAW('D9664711BC1348ABA56BCA68B161244A'), DATE '2026-03-25', 1.5);

INSERT INTO tasks (id, title, status, priority, project_id, sprint_id, assignee_id, created_by, created_at, sprint_added_at, assigned_at, entered_in_progress_at, completed_at, rework_count) VALUES (HEXTORAW('E000000000000000000000000000004E'), 'V13-151 Write query for currently blocked tasks with duration', 'DONE', 'HIGH', HEXTORAW('F18FB987E9A04CA58213404D089F41AA'), HEXTORAW('9E957AA9278043FDB4AAD86065F344F9'), HEXTORAW('D9664711BC1348ABA56BCA68B161244A'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), TIMESTAMP '2026-03-25 16:30:00', TIMESTAMP '2026-03-25 16:30:00', TIMESTAMP '2026-03-25 16:30:00', TIMESTAMP '2026-03-26 09:00:00', TIMESTAMP '2026-03-28 15:00:00', 0);
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E000000000000000000000000000004E'), HEXTORAW('D9664711BC1348ABA56BCA68B161244A'), NULL, 'TODO', 'WEB', TIMESTAMP '2026-03-25 16:30:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E000000000000000000000000000004E'), HEXTORAW('D9664711BC1348ABA56BCA68B161244A'), 'TODO', 'IN_PROGRESS', 'WEB', TIMESTAMP '2026-03-26 09:00:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E000000000000000000000000000004E'), HEXTORAW('D9664711BC1348ABA56BCA68B161244A'), 'IN_PROGRESS', 'DONE', 'WEB', TIMESTAMP '2026-03-28 15:00:00');
INSERT INTO task_work_logs (task_id, user_id, work_date, hours_worked) VALUES (HEXTORAW('E000000000000000000000000000004E'), HEXTORAW('D9664711BC1348ABA56BCA68B161244A'), DATE '2026-03-28', 2.0);


-- V13-152 | Expose blocked endpoint | Luis | DONE
INSERT INTO tasks (id, title, status, priority, project_id, sprint_id, assignee_id, created_by,
                   created_at, sprint_added_at, assigned_at, entered_in_progress_at, completed_at, rework_count)
VALUES (HEXTORAW('E000000000000000000000000000004F'),
        'V13-152 Expose blocked tasks via GET /sprints/{id}/blocked',
        'DONE', 'MEDIUM',
        HEXTORAW('F18FB987E9A04CA58213404D089F41AA'), HEXTORAW('9E957AA9278043FDB4AAD86065F344F9'),
        HEXTORAW('D9664711BC1348ABA56BCA68B161244A'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'),
        TIMESTAMP '2026-03-28 15:30:00', TIMESTAMP '2026-03-28 15:30:00', TIMESTAMP '2026-03-28 15:30:00',
        TIMESTAMP '2026-03-30 09:00:00', TIMESTAMP '2026-03-31 14:00:00', 0);
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at)
VALUES (HEXTORAW('E000000000000000000000000000004F'), HEXTORAW('D9664711BC1348ABA56BCA68B161244A'), NULL, 'TODO', 'WEB', TIMESTAMP '2026-03-28 15:30:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at)
VALUES (HEXTORAW('E000000000000000000000000000004F'), HEXTORAW('D9664711BC1348ABA56BCA68B161244A'), 'TODO', 'IN_PROGRESS', 'WEB', TIMESTAMP '2026-03-30 09:00:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at)
VALUES (HEXTORAW('E000000000000000000000000000004F'), HEXTORAW('D9664711BC1348ABA56BCA68B161244A'), 'IN_PROGRESS', 'DONE', 'WEB', TIMESTAMP '2026-03-31 14:00:00');
INSERT INTO task_work_logs (task_id, user_id, work_date, hours_worked) VALUES (HEXTORAW('E000000000000000000000000000004F'), HEXTORAW('D9664711BC1348ABA56BCA68B161244A'), DATE '2026-03-31', 1.0);


-- V13-153 | Unit tests for blocked KPI | Luis | DONE
INSERT INTO tasks (id, title, status, priority, project_id, sprint_id, assignee_id, created_by,
                   created_at, sprint_added_at, assigned_at, entered_in_progress_at, completed_at, rework_count)
VALUES (HEXTORAW('E0000000000000000000000000000050'),
        'V13-153 Write unit tests for blocked task KPI',
        'DONE', 'MEDIUM',
        HEXTORAW('F18FB987E9A04CA58213404D089F41AA'), HEXTORAW('9E957AA9278043FDB4AAD86065F344F9'),
        HEXTORAW('D9664711BC1348ABA56BCA68B161244A'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'),
        TIMESTAMP '2026-03-31 14:30:00', TIMESTAMP '2026-03-31 14:30:00', TIMESTAMP '2026-03-31 14:30:00',
        TIMESTAMP '2026-04-01 09:00:00', TIMESTAMP '2026-04-02 15:00:00', 0);
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at)
VALUES (HEXTORAW('E0000000000000000000000000000050'), HEXTORAW('D9664711BC1348ABA56BCA68B161244A'), NULL, 'TODO', 'WEB', TIMESTAMP '2026-03-31 14:30:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at)
VALUES (HEXTORAW('E0000000000000000000000000000050'), HEXTORAW('D9664711BC1348ABA56BCA68B161244A'), 'TODO', 'IN_PROGRESS', 'WEB', TIMESTAMP '2026-04-01 09:00:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at)
VALUES (HEXTORAW('E0000000000000000000000000000050'), HEXTORAW('D9664711BC1348ABA56BCA68B161244A'), 'IN_PROGRESS', 'DONE', 'WEB', TIMESTAMP '2026-04-02 15:00:00');
INSERT INTO task_work_logs (task_id, user_id, work_date, hours_worked) VALUES (HEXTORAW('E0000000000000000000000000000050'), HEXTORAW('D9664711BC1348ABA56BCA68B161244A'), DATE '2026-04-02', 1.5);


-- ---------------------------------------------------------------------------
-- V13-143 — Aging WIP KPI | Ana Paula | DONE
-- ---------------------------------------------------------------------------
INSERT INTO tasks (id, title, description, status, priority, project_id, sprint_id, assignee_id, created_by,
                   created_at, sprint_added_at, assigned_at, entered_in_progress_at, completed_at, rework_count)
VALUES (HEXTORAW('E0000000000000000000000000000051'),
        'V13-143 KPI: Aging WIP',
        'As a PM, I want to see aging WIP — tasks in progress > N days.',
        'DONE', 'HIGH',
        HEXTORAW('F18FB987E9A04CA58213404D089F41AA'), HEXTORAW('9E957AA9278043FDB4AAD86065F344F9'),
        HEXTORAW('09F9156961144414AF1D9815FED84D5F'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'),
        TIMESTAMP '2026-03-23 08:00:00', TIMESTAMP '2026-03-23 08:00:00', TIMESTAMP '2026-03-23 08:00:00',
        TIMESTAMP '2026-03-25 09:00:00', TIMESTAMP '2026-04-03 16:00:00', 0);
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at)
VALUES (HEXTORAW('E0000000000000000000000000000051'), HEXTORAW('09F9156961144414AF1D9815FED84D5F'), NULL, 'TODO', 'WEB', TIMESTAMP '2026-03-23 08:00:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at)
VALUES (HEXTORAW('E0000000000000000000000000000051'), HEXTORAW('09F9156961144414AF1D9815FED84D5F'), 'TODO', 'IN_PROGRESS', 'WEB', TIMESTAMP '2026-03-25 09:00:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at)
VALUES (HEXTORAW('E0000000000000000000000000000051'), HEXTORAW('09F9156961144414AF1D9815FED84D5F'), 'IN_PROGRESS', 'DONE', 'WEB', TIMESTAMP '2026-04-03 16:00:00');
INSERT INTO task_work_logs (task_id, user_id, work_date, hours_worked) VALUES (HEXTORAW('E0000000000000000000000000000051'), HEXTORAW('09F9156961144414AF1D9815FED84D5F'), DATE '2026-04-03', 2.5);


-- V13-154 | Filter IN_PROGRESS tasks by age | Ana Paula | DONE
INSERT INTO tasks (id, title, status, priority, project_id, sprint_id, assignee_id, created_by,
                   created_at, sprint_added_at, assigned_at, entered_in_progress_at, completed_at, rework_count)
VALUES (HEXTORAW('E0000000000000000000000000000052'),
        'V13-154 Write query filtering IN_PROGRESS tasks by entered_in_progress_at age',
        'DONE', 'HIGH',
        HEXTORAW('F18FB987E9A04CA58213404D089F41AA'), HEXTORAW('9E957AA9278043FDB4AAD86065F344F9'),
        HEXTORAW('09F9156961144414AF1D9815FED84D5F'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'),
        TIMESTAMP '2026-03-23 08:00:00', TIMESTAMP '2026-03-23 08:00:00', TIMESTAMP '2026-03-23 08:00:00',
        TIMESTAMP '2026-03-25 10:00:00', TIMESTAMP '2026-03-27 15:00:00', 0);
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at)
VALUES (HEXTORAW('E0000000000000000000000000000052'), HEXTORAW('09F9156961144414AF1D9815FED84D5F'), NULL, 'TODO', 'WEB', TIMESTAMP '2026-03-23 08:00:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at)
VALUES (HEXTORAW('E0000000000000000000000000000052'), HEXTORAW('09F9156961144414AF1D9815FED84D5F'), 'TODO', 'IN_PROGRESS', 'WEB', TIMESTAMP '2026-03-25 10:00:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at)
VALUES (HEXTORAW('E0000000000000000000000000000052'), HEXTORAW('09F9156961144414AF1D9815FED84D5F'), 'IN_PROGRESS', 'DONE', 'WEB', TIMESTAMP '2026-03-27 15:00:00');
INSERT INTO task_work_logs (task_id, user_id, work_date, hours_worked) VALUES (HEXTORAW('E0000000000000000000000000000052'), HEXTORAW('09F9156961144414AF1D9815FED84D5F'), DATE '2026-03-27', 2.0);


-- V13-155 | Configurable threshold | Ana Paula | DONE
INSERT INTO tasks (id, title, status, priority, project_id, sprint_id, assignee_id, created_by,
                   created_at, sprint_added_at, assigned_at, entered_in_progress_at, completed_at, rework_count)
VALUES (HEXTORAW('E0000000000000000000000000000053'),
        'V13-155 Make WIP aging threshold configurable via app property',
        'DONE', 'MEDIUM',
        HEXTORAW('F18FB987E9A04CA58213404D089F41AA'), HEXTORAW('9E957AA9278043FDB4AAD86065F344F9'),
        HEXTORAW('09F9156961144414AF1D9815FED84D5F'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'),
        TIMESTAMP '2026-03-27 15:30:00', TIMESTAMP '2026-03-27 15:30:00', TIMESTAMP '2026-03-27 15:30:00',
        TIMESTAMP '2026-03-28 09:00:00', TIMESTAMP '2026-03-30 12:00:00', 0);
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at)
VALUES (HEXTORAW('E0000000000000000000000000000053'), HEXTORAW('09F9156961144414AF1D9815FED84D5F'), NULL, 'TODO', 'WEB', TIMESTAMP '2026-03-27 15:30:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at)
VALUES (HEXTORAW('E0000000000000000000000000000053'), HEXTORAW('09F9156961144414AF1D9815FED84D5F'), 'TODO', 'IN_PROGRESS', 'WEB', TIMESTAMP '2026-03-28 09:00:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at)
VALUES (HEXTORAW('E0000000000000000000000000000053'), HEXTORAW('09F9156961144414AF1D9815FED84D5F'), 'IN_PROGRESS', 'DONE', 'WEB', TIMESTAMP '2026-03-30 12:00:00');
INSERT INTO task_work_logs (task_id, user_id, work_date, hours_worked) VALUES (HEXTORAW('E0000000000000000000000000000053'), HEXTORAW('09F9156961144414AF1D9815FED84D5F'), DATE '2026-03-30', 1.0);


-- V13-156 | Add aging WIP to KPI endpoint | Ana Paula | DONE
INSERT INTO tasks (id, title, status, priority, project_id, sprint_id, assignee_id, created_by,
                   created_at, sprint_added_at, assigned_at, entered_in_progress_at, completed_at, rework_count)
VALUES (HEXTORAW('E0000000000000000000000000000054'),
        'V13-156 Add aging WIP to KPI endpoint',
        'DONE', 'MEDIUM',
        HEXTORAW('F18FB987E9A04CA58213404D089F41AA'), HEXTORAW('9E957AA9278043FDB4AAD86065F344F9'),
        HEXTORAW('09F9156961144414AF1D9815FED84D5F'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'),
        TIMESTAMP '2026-03-30 12:30:00', TIMESTAMP '2026-03-30 12:30:00', TIMESTAMP '2026-03-30 12:30:00',
        TIMESTAMP '2026-03-31 09:00:00', TIMESTAMP '2026-04-03 16:00:00', 0);
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at)
VALUES (HEXTORAW('E0000000000000000000000000000054'), HEXTORAW('09F9156961144414AF1D9815FED84D5F'), NULL, 'TODO', 'WEB', TIMESTAMP '2026-03-30 12:30:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at)
VALUES (HEXTORAW('E0000000000000000000000000000054'), HEXTORAW('09F9156961144414AF1D9815FED84D5F'), 'TODO', 'IN_PROGRESS', 'WEB', TIMESTAMP '2026-03-31 09:00:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at)
VALUES (HEXTORAW('E0000000000000000000000000000054'), HEXTORAW('09F9156961144414AF1D9815FED84D5F'), 'IN_PROGRESS', 'DONE', 'WEB', TIMESTAMP '2026-04-03 16:00:00');
INSERT INTO task_work_logs (task_id, user_id, work_date, hours_worked) VALUES (HEXTORAW('E0000000000000000000000000000054'), HEXTORAW('09F9156961144414AF1D9815FED84D5F'), DATE '2026-04-03', 2.0);


-- ---------------------------------------------------------------------------
-- V13-157 — Personal Dashboard | Luis | DONE
-- ---------------------------------------------------------------------------
INSERT INTO tasks (id, title, description, status, priority, project_id, sprint_id, assignee_id, created_by,
                   created_at, sprint_added_at, assigned_at, entered_in_progress_at, completed_at, rework_count)
VALUES (HEXTORAW('E0000000000000000000000000000055'),
        'V13-157 Personal Dashboard',
        'As a developer, I want a personal dashboard showing open tasks and sprint health.',
        'DONE', 'HIGH',
        HEXTORAW('F18FB987E9A04CA58213404D089F41AA'), HEXTORAW('9E957AA9278043FDB4AAD86065F344F9'),
        HEXTORAW('D9664711BC1348ABA56BCA68B161244A'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'),
        TIMESTAMP '2026-03-23 08:00:00', TIMESTAMP '2026-03-23 08:00:00', TIMESTAMP '2026-03-23 08:00:00',
        TIMESTAMP '2026-03-26 09:00:00', TIMESTAMP '2026-04-08 16:00:00', 0);
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at)
VALUES (HEXTORAW('E0000000000000000000000000000055'), HEXTORAW('D9664711BC1348ABA56BCA68B161244A'), NULL, 'TODO', 'WEB', TIMESTAMP '2026-03-23 08:00:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at)
VALUES (HEXTORAW('E0000000000000000000000000000055'), HEXTORAW('D9664711BC1348ABA56BCA68B161244A'), 'TODO', 'IN_PROGRESS', 'WEB', TIMESTAMP '2026-03-26 09:00:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at)
VALUES (HEXTORAW('E0000000000000000000000000000055'), HEXTORAW('D9664711BC1348ABA56BCA68B161244A'), 'IN_PROGRESS', 'DONE', 'WEB', TIMESTAMP '2026-04-08 16:00:00');
INSERT INTO task_work_logs (task_id, user_id, work_date, hours_worked) VALUES (HEXTORAW('E0000000000000000000000000000055'), HEXTORAW('D9664711BC1348ABA56BCA68B161244A'), DATE '2026-04-08', 4.0);


-- V13-159 | Build dashboard layout | Luis | DONE
INSERT INTO tasks (id, title, status, priority, project_id, sprint_id, assignee_id, created_by,
                   created_at, sprint_added_at, assigned_at, entered_in_progress_at, completed_at, rework_count)
VALUES (HEXTORAW('E0000000000000000000000000000056'),
        'V13-159 Build dashboard layout component in React',
        'DONE', 'HIGH',
        HEXTORAW('F18FB987E9A04CA58213404D089F41AA'), HEXTORAW('9E957AA9278043FDB4AAD86065F344F9'),
        HEXTORAW('D9664711BC1348ABA56BCA68B161244A'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'),
        TIMESTAMP '2026-03-23 08:00:00', TIMESTAMP '2026-03-23 08:00:00', TIMESTAMP '2026-03-23 08:00:00',
        TIMESTAMP '2026-03-26 10:00:00', TIMESTAMP '2026-03-30 15:00:00', 0);
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at)
VALUES (HEXTORAW('E0000000000000000000000000000056'), HEXTORAW('D9664711BC1348ABA56BCA68B161244A'), NULL, 'TODO', 'WEB', TIMESTAMP '2026-03-23 08:00:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at)
VALUES (HEXTORAW('E0000000000000000000000000000056'), HEXTORAW('D9664711BC1348ABA56BCA68B161244A'), 'TODO', 'IN_PROGRESS', 'WEB', TIMESTAMP '2026-03-26 10:00:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at)
VALUES (HEXTORAW('E0000000000000000000000000000056'), HEXTORAW('D9664711BC1348ABA56BCA68B161244A'), 'IN_PROGRESS', 'DONE', 'WEB', TIMESTAMP '2026-03-30 15:00:00');
INSERT INTO task_work_logs (task_id, user_id, work_date, hours_worked) VALUES (HEXTORAW('E0000000000000000000000000000056'), HEXTORAW('D9664711BC1348ABA56BCA68B161244A'), DATE '2026-03-30', 3.0);


-- V13-160 | Fetch and display open tasks | Luis | DONE
INSERT INTO tasks (id, title, status, priority, project_id, sprint_id, assignee_id, created_by,
                   created_at, sprint_added_at, assigned_at, entered_in_progress_at, completed_at, rework_count)
VALUES (HEXTORAW('E0000000000000000000000000000057'),
        'V13-160 Fetch and display open tasks assigned to current user',
        'DONE', 'HIGH',
        HEXTORAW('F18FB987E9A04CA58213404D089F41AA'), HEXTORAW('9E957AA9278043FDB4AAD86065F344F9'),
        HEXTORAW('D9664711BC1348ABA56BCA68B161244A'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'),
        TIMESTAMP '2026-03-30 15:30:00', TIMESTAMP '2026-03-30 15:30:00', TIMESTAMP '2026-03-30 15:30:00',
        TIMESTAMP '2026-03-31 09:00:00', TIMESTAMP '2026-04-03 14:00:00', 0);
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at)
VALUES (HEXTORAW('E0000000000000000000000000000057'), HEXTORAW('D9664711BC1348ABA56BCA68B161244A'), NULL, 'TODO', 'WEB', TIMESTAMP '2026-03-30 15:30:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at)
VALUES (HEXTORAW('E0000000000000000000000000000057'), HEXTORAW('D9664711BC1348ABA56BCA68B161244A'), 'TODO', 'IN_PROGRESS', 'WEB', TIMESTAMP '2026-03-31 09:00:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at)
VALUES (HEXTORAW('E0000000000000000000000000000057'), HEXTORAW('D9664711BC1348ABA56BCA68B161244A'), 'IN_PROGRESS', 'DONE', 'WEB', TIMESTAMP '2026-04-03 14:00:00');
INSERT INTO task_work_logs (task_id, user_id, work_date, hours_worked) VALUES (HEXTORAW('E0000000000000000000000000000057'), HEXTORAW('D9664711BC1348ABA56BCA68B161244A'), DATE '2026-04-03', 2.0);


-- V13-161 | Sprint health metrics | Luis | DONE
INSERT INTO tasks (id, title, status, priority, project_id, sprint_id, assignee_id, created_by,
                   created_at, sprint_added_at, assigned_at, entered_in_progress_at, completed_at, rework_count)
VALUES (HEXTORAW('E0000000000000000000000000000058'),
        'V13-161 Show sprint health metrics (cycle time, blocked count)',
        'DONE', 'MEDIUM',
        HEXTORAW('F18FB987E9A04CA58213404D089F41AA'), HEXTORAW('9E957AA9278043FDB4AAD86065F344F9'),
        HEXTORAW('D9664711BC1348ABA56BCA68B161244A'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'),
        TIMESTAMP '2026-04-03 14:30:00', TIMESTAMP '2026-04-03 14:30:00', TIMESTAMP '2026-04-03 14:30:00',
        TIMESTAMP '2026-04-06 09:00:00', TIMESTAMP '2026-04-07 15:00:00', 0);
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at)
VALUES (HEXTORAW('E0000000000000000000000000000058'), HEXTORAW('D9664711BC1348ABA56BCA68B161244A'), NULL, 'TODO', 'WEB', TIMESTAMP '2026-04-03 14:30:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at)
VALUES (HEXTORAW('E0000000000000000000000000000058'), HEXTORAW('D9664711BC1348ABA56BCA68B161244A'), 'TODO', 'IN_PROGRESS', 'WEB', TIMESTAMP '2026-04-06 09:00:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at)
VALUES (HEXTORAW('E0000000000000000000000000000058'), HEXTORAW('D9664711BC1348ABA56BCA68B161244A'), 'IN_PROGRESS', 'DONE', 'WEB', TIMESTAMP '2026-04-07 15:00:00');
INSERT INTO task_work_logs (task_id, user_id, work_date, hours_worked) VALUES (HEXTORAW('E0000000000000000000000000000058'), HEXTORAW('D9664711BC1348ABA56BCA68B161244A'), DATE '2026-04-07', 1.5);


-- V13-162 | Responsive layout | Luis | DONE
INSERT INTO tasks (id, title, status, priority, project_id, sprint_id, assignee_id, created_by,
                   created_at, sprint_added_at, assigned_at, entered_in_progress_at, completed_at, rework_count)
VALUES (HEXTORAW('E0000000000000000000000000000059'),
        'V13-162 Add responsive layout to personal dashboard',
        'DONE', 'LOW',
        HEXTORAW('F18FB987E9A04CA58213404D089F41AA'), HEXTORAW('9E957AA9278043FDB4AAD86065F344F9'),
        HEXTORAW('D9664711BC1348ABA56BCA68B161244A'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'),
        TIMESTAMP '2026-04-07 15:30:00', TIMESTAMP '2026-04-07 15:30:00', TIMESTAMP '2026-04-07 15:30:00',
        TIMESTAMP '2026-04-08 09:00:00', TIMESTAMP '2026-04-08 16:00:00', 0);
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at)
VALUES (HEXTORAW('E0000000000000000000000000000059'), HEXTORAW('D9664711BC1348ABA56BCA68B161244A'), NULL, 'TODO', 'WEB', TIMESTAMP '2026-04-07 15:30:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at)
VALUES (HEXTORAW('E0000000000000000000000000000059'), HEXTORAW('D9664711BC1348ABA56BCA68B161244A'), 'TODO', 'IN_PROGRESS', 'WEB', TIMESTAMP '2026-04-08 09:00:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at)
VALUES (HEXTORAW('E0000000000000000000000000000059'), HEXTORAW('D9664711BC1348ABA56BCA68B161244A'), 'IN_PROGRESS', 'DONE', 'WEB', TIMESTAMP '2026-04-08 16:00:00');
INSERT INTO task_work_logs (task_id, user_id, work_date, hours_worked) VALUES (HEXTORAW('E0000000000000000000000000000059'), HEXTORAW('D9664711BC1348ABA56BCA68B161244A'), DATE '2026-04-08', 1.0);


-- ---------------------------------------------------------------------------
-- V13-158 — Live Charts Dashboard | Ana Elena | DONE
-- ---------------------------------------------------------------------------
INSERT INTO tasks (id, title, description, status, priority, project_id, sprint_id, assignee_id, created_by,
                   created_at, sprint_added_at, assigned_at, entered_in_progress_at, completed_at, rework_count)
VALUES (HEXTORAW('E000000000000000000000000000005A'),
        'V13-158 Live charts KPI dashboard',
        'As a PM, I want a KPI dashboard panel with live charts.',
        'DONE', 'HIGH',
        HEXTORAW('F18FB987E9A04CA58213404D089F41AA'), HEXTORAW('9E957AA9278043FDB4AAD86065F344F9'),
        HEXTORAW('E5E7D6DC9BA54E7A95B198EF1AA32060'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'),
        TIMESTAMP '2026-03-23 08:00:00', TIMESTAMP '2026-03-23 08:00:00', TIMESTAMP '2026-03-23 08:00:00',
        TIMESTAMP '2026-03-24 09:00:00', TIMESTAMP '2026-04-09 16:00:00', 0);
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at)
VALUES (HEXTORAW('E000000000000000000000000000005A'), HEXTORAW('E5E7D6DC9BA54E7A95B198EF1AA32060'), NULL, 'TODO', 'WEB', TIMESTAMP '2026-03-23 08:00:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at)
VALUES (HEXTORAW('E000000000000000000000000000005A'), HEXTORAW('E5E7D6DC9BA54E7A95B198EF1AA32060'), 'TODO', 'IN_PROGRESS', 'WEB', TIMESTAMP '2026-03-24 09:00:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at)
VALUES (HEXTORAW('E000000000000000000000000000005A'), HEXTORAW('E5E7D6DC9BA54E7A95B198EF1AA32060'), 'IN_PROGRESS', 'DONE', 'WEB', TIMESTAMP '2026-04-09 16:00:00');
INSERT INTO task_work_logs (task_id, user_id, work_date, hours_worked) VALUES (HEXTORAW('E000000000000000000000000000005A'), HEXTORAW('E5E7D6DC9BA54E7A95B198EF1AA32060'), DATE '2026-04-09', 5.5);


-- V13-163 | PM dashboard view | Ana Elena | DONE
INSERT INTO tasks (id, title, status, priority, project_id, sprint_id, assignee_id, created_by,
                   created_at, sprint_added_at, assigned_at, entered_in_progress_at, completed_at, rework_count)
VALUES (HEXTORAW('E000000000000000000000000000005B'),
        'V13-163 Create PM-specific dashboard view',
        'DONE', 'HIGH',
        HEXTORAW('F18FB987E9A04CA58213404D089F41AA'), HEXTORAW('9E957AA9278043FDB4AAD86065F344F9'),
        HEXTORAW('E5E7D6DC9BA54E7A95B198EF1AA32060'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'),
        TIMESTAMP '2026-03-23 08:00:00', TIMESTAMP '2026-03-23 08:00:00', TIMESTAMP '2026-03-23 08:00:00',
        TIMESTAMP '2026-03-24 10:00:00', TIMESTAMP '2026-03-27 16:00:00', 0);
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at)
VALUES (HEXTORAW('E000000000000000000000000000005B'), HEXTORAW('E5E7D6DC9BA54E7A95B198EF1AA32060'), NULL, 'TODO', 'WEB', TIMESTAMP '2026-03-23 08:00:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at)
VALUES (HEXTORAW('E000000000000000000000000000005B'), HEXTORAW('E5E7D6DC9BA54E7A95B198EF1AA32060'), 'TODO', 'IN_PROGRESS', 'WEB', TIMESTAMP '2026-03-24 10:00:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at)
VALUES (HEXTORAW('E000000000000000000000000000005B'), HEXTORAW('E5E7D6DC9BA54E7A95B198EF1AA32060'), 'IN_PROGRESS', 'DONE', 'WEB', TIMESTAMP '2026-03-27 16:00:00');
INSERT INTO task_work_logs (task_id, user_id, work_date, hours_worked) VALUES (HEXTORAW('E000000000000000000000000000005B'), HEXTORAW('E5E7D6DC9BA54E7A95B198EF1AA32060'), DATE '2026-03-27', 4.0);


-- V13-164 | Cycle time trend chart | Ana Elena | DONE
INSERT INTO tasks (id, title, status, priority, project_id, sprint_id, assignee_id, created_by,
                   created_at, sprint_added_at, assigned_at, entered_in_progress_at, completed_at, rework_count)
VALUES (HEXTORAW('E000000000000000000000000000005C'),
        'V13-164 Add cycle time trend chart',
        'DONE', 'HIGH',
        HEXTORAW('F18FB987E9A04CA58213404D089F41AA'), HEXTORAW('9E957AA9278043FDB4AAD86065F344F9'),
        HEXTORAW('E5E7D6DC9BA54E7A95B198EF1AA32060'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'),
        TIMESTAMP '2026-03-27 16:30:00', TIMESTAMP '2026-03-27 16:30:00', TIMESTAMP '2026-03-27 16:30:00',
        TIMESTAMP '2026-03-28 09:00:00', TIMESTAMP '2026-04-01 15:00:00', 0);
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at)
VALUES (HEXTORAW('E000000000000000000000000000005C'), HEXTORAW('E5E7D6DC9BA54E7A95B198EF1AA32060'), NULL, 'TODO', 'WEB', TIMESTAMP '2026-03-27 16:30:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at)
VALUES (HEXTORAW('E000000000000000000000000000005C'), HEXTORAW('E5E7D6DC9BA54E7A95B198EF1AA32060'), 'TODO', 'IN_PROGRESS', 'WEB', TIMESTAMP '2026-03-28 09:00:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at)
VALUES (HEXTORAW('E000000000000000000000000000005C'), HEXTORAW('E5E7D6DC9BA54E7A95B198EF1AA32060'), 'IN_PROGRESS', 'DONE', 'WEB', TIMESTAMP '2026-04-01 15:00:00');
INSERT INTO task_work_logs (task_id, user_id, work_date, hours_worked) VALUES (HEXTORAW('E000000000000000000000000000005C'), HEXTORAW('E5E7D6DC9BA54E7A95B198EF1AA32060'), DATE '2026-04-01', 3.0);


-- V13-165 | Blocked tasks list with counter | Ana Elena | DONE
INSERT INTO tasks (id, title, status, priority, project_id, sprint_id, assignee_id, created_by,
                   created_at, sprint_added_at, assigned_at, entered_in_progress_at, completed_at, rework_count)
VALUES (HEXTORAW('E000000000000000000000000000005D'),
        'V13-165 Add blocked tasks list with days-blocked counter',
        'DONE', 'HIGH',
        HEXTORAW('F18FB987E9A04CA58213404D089F41AA'), HEXTORAW('9E957AA9278043FDB4AAD86065F344F9'),
        HEXTORAW('E5E7D6DC9BA54E7A95B198EF1AA32060'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'),
        TIMESTAMP '2026-04-01 15:30:00', TIMESTAMP '2026-04-01 15:30:00', TIMESTAMP '2026-04-01 15:30:00',
        TIMESTAMP '2026-04-02 09:00:00', TIMESTAMP '2026-04-03 15:00:00', 0);
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at)
VALUES (HEXTORAW('E000000000000000000000000000005D'), HEXTORAW('E5E7D6DC9BA54E7A95B198EF1AA32060'), NULL, 'TODO', 'WEB', TIMESTAMP '2026-04-01 15:30:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at)
VALUES (HEXTORAW('E000000000000000000000000000005D'), HEXTORAW('E5E7D6DC9BA54E7A95B198EF1AA32060'), 'TODO', 'IN_PROGRESS', 'WEB', TIMESTAMP '2026-04-02 09:00:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at)
VALUES (HEXTORAW('E000000000000000000000000000005D'), HEXTORAW('E5E7D6DC9BA54E7A95B198EF1AA32060'), 'IN_PROGRESS', 'DONE', 'WEB', TIMESTAMP '2026-04-03 15:00:00');
INSERT INTO task_work_logs (task_id, user_id, work_date, hours_worked) VALUES (HEXTORAW('E000000000000000000000000000005D'), HEXTORAW('E5E7D6DC9BA54E7A95B198EF1AA32060'), DATE '2026-04-03', 2.5);


-- V13-166 | Aging WIP list | Ana Elena | DONE
INSERT INTO tasks (id, title, status, priority, project_id, sprint_id, assignee_id, created_by,
                   created_at, sprint_added_at, assigned_at, entered_in_progress_at, completed_at, rework_count)
VALUES (HEXTORAW('E000000000000000000000000000005E'),
        'V13-166 Add aging WIP list to dashboard',
        'DONE', 'MEDIUM',
        HEXTORAW('F18FB987E9A04CA58213404D089F41AA'), HEXTORAW('9E957AA9278043FDB4AAD86065F344F9'),
        HEXTORAW('E5E7D6DC9BA54E7A95B198EF1AA32060'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'),
        TIMESTAMP '2026-04-03 15:30:00', TIMESTAMP '2026-04-03 15:30:00', TIMESTAMP '2026-04-03 15:30:00',
        TIMESTAMP '2026-04-06 09:00:00', TIMESTAMP '2026-04-07 14:00:00', 0);
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at)
VALUES (HEXTORAW('E000000000000000000000000000005E'), HEXTORAW('E5E7D6DC9BA54E7A95B198EF1AA32060'), NULL, 'TODO', 'WEB', TIMESTAMP '2026-04-03 15:30:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at)
VALUES (HEXTORAW('E000000000000000000000000000005E'), HEXTORAW('E5E7D6DC9BA54E7A95B198EF1AA32060'), 'TODO', 'IN_PROGRESS', 'WEB', TIMESTAMP '2026-04-06 09:00:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at)
VALUES (HEXTORAW('E000000000000000000000000000005E'), HEXTORAW('E5E7D6DC9BA54E7A95B198EF1AA32060'), 'IN_PROGRESS', 'DONE', 'WEB', TIMESTAMP '2026-04-07 14:00:00');
INSERT INTO task_work_logs (task_id, user_id, work_date, hours_worked) VALUES (HEXTORAW('E000000000000000000000000000005E'), HEXTORAW('E5E7D6DC9BA54E7A95B198EF1AA32060'), DATE '2026-04-07', 2.0);


-- V13-167 | Wire up to KPI endpoints | Ana Elena | DONE
INSERT INTO tasks (id, title, status, priority, project_id, sprint_id, assignee_id, created_by,
                   created_at, sprint_added_at, assigned_at, entered_in_progress_at, completed_at, rework_count)
VALUES (HEXTORAW('E000000000000000000000000000005F'),
        'V13-167 Wire up dashboard to backend KPI endpoints',
        'DONE', 'HIGH',
        HEXTORAW('F18FB987E9A04CA58213404D089F41AA'), HEXTORAW('9E957AA9278043FDB4AAD86065F344F9'),
        HEXTORAW('E5E7D6DC9BA54E7A95B198EF1AA32060'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'),
        TIMESTAMP '2026-04-07 14:30:00', TIMESTAMP '2026-04-07 14:30:00', TIMESTAMP '2026-04-07 14:30:00',
        TIMESTAMP '2026-04-08 09:00:00', TIMESTAMP '2026-04-09 14:00:00', 0);
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at)
VALUES (HEXTORAW('E000000000000000000000000000005F'), HEXTORAW('E5E7D6DC9BA54E7A95B198EF1AA32060'), NULL, 'TODO', 'WEB', TIMESTAMP '2026-04-07 14:30:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at)
VALUES (HEXTORAW('E000000000000000000000000000005F'), HEXTORAW('E5E7D6DC9BA54E7A95B198EF1AA32060'), 'TODO', 'IN_PROGRESS', 'WEB', TIMESTAMP '2026-04-08 09:00:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at)
VALUES (HEXTORAW('E000000000000000000000000000005F'), HEXTORAW('E5E7D6DC9BA54E7A95B198EF1AA32060'), 'IN_PROGRESS', 'DONE', 'WEB', TIMESTAMP '2026-04-09 14:00:00');
INSERT INTO task_work_logs (task_id, user_id, work_date, hours_worked) VALUES (HEXTORAW('E000000000000000000000000000005F'), HEXTORAW('E5E7D6DC9BA54E7A95B198EF1AA32060'), DATE '2026-04-09', 2.0);


-- V13-168 | Auto-refresh every 60s | Ana Elena | DONE
INSERT INTO tasks (id, title, status, priority, project_id, sprint_id, assignee_id, created_by,
                   created_at, sprint_added_at, assigned_at, entered_in_progress_at, completed_at, rework_count)
VALUES (HEXTORAW('E0000000000000000000000000000060'),
        'V13-168 Auto-refresh dashboard every 60 seconds',
        'DONE', 'LOW',
        HEXTORAW('F18FB987E9A04CA58213404D089F41AA'), HEXTORAW('9E957AA9278043FDB4AAD86065F344F9'),
        HEXTORAW('E5E7D6DC9BA54E7A95B198EF1AA32060'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'),
        TIMESTAMP '2026-04-09 14:30:00', TIMESTAMP '2026-04-09 14:30:00', TIMESTAMP '2026-04-09 14:30:00',
        TIMESTAMP '2026-04-09 15:00:00', TIMESTAMP '2026-04-09 16:00:00', 0);
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at)
VALUES (HEXTORAW('E0000000000000000000000000000060'), HEXTORAW('E5E7D6DC9BA54E7A95B198EF1AA32060'), NULL, 'TODO', 'WEB', TIMESTAMP '2026-04-09 14:30:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at)
VALUES (HEXTORAW('E0000000000000000000000000000060'), HEXTORAW('E5E7D6DC9BA54E7A95B198EF1AA32060'), 'TODO', 'IN_PROGRESS', 'WEB', TIMESTAMP '2026-04-09 15:00:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at)
VALUES (HEXTORAW('E0000000000000000000000000000060'), HEXTORAW('E5E7D6DC9BA54E7A95B198EF1AA32060'), 'IN_PROGRESS', 'DONE', 'WEB', TIMESTAMP '2026-04-09 16:00:00');
INSERT INTO task_work_logs (task_id, user_id, work_date, hours_worked) VALUES (HEXTORAW('E0000000000000000000000000000060'), HEXTORAW('E5E7D6DC9BA54E7A95B198EF1AA32060'), DATE '2026-04-09', 1.0);


-- ---------------------------------------------------------------------------
-- Sprint 2 standalone module tasks (V13-307 to V13-313) — all DONE
-- ---------------------------------------------------------------------------
INSERT INTO tasks (id, title, status, priority, project_id, sprint_id, assignee_id, created_by, created_at, sprint_added_at, assigned_at, entered_in_progress_at, completed_at, rework_count)
VALUES (HEXTORAW('E0000000000000000000000000000061'), 'V13-307 M2 - Project Administration', 'DONE', 'MEDIUM', HEXTORAW('F18FB987E9A04CA58213404D089F41AA'), HEXTORAW('9E957AA9278043FDB4AAD86065F344F9'), HEXTORAW('E5E7D6DC9BA54E7A95B198EF1AA32060'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), TIMESTAMP '2026-03-23 08:00:00', TIMESTAMP '2026-03-23 08:00:00', TIMESTAMP '2026-03-23 08:00:00', TIMESTAMP '2026-04-07 09:00:00', TIMESTAMP '2026-04-10 17:00:00', 0);
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E0000000000000000000000000000061'), HEXTORAW('E5E7D6DC9BA54E7A95B198EF1AA32060'), NULL, 'TODO', 'WEB', TIMESTAMP '2026-03-23 08:00:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E0000000000000000000000000000061'), HEXTORAW('E5E7D6DC9BA54E7A95B198EF1AA32060'), 'TODO', 'IN_PROGRESS', 'WEB', TIMESTAMP '2026-04-07 09:00:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E0000000000000000000000000000061'), HEXTORAW('E5E7D6DC9BA54E7A95B198EF1AA32060'), 'IN_PROGRESS', 'DONE', 'WEB', TIMESTAMP '2026-04-10 17:00:00');
INSERT INTO task_work_logs (task_id, user_id, work_date, hours_worked) VALUES (HEXTORAW('E0000000000000000000000000000061'), HEXTORAW('E5E7D6DC9BA54E7A95B198EF1AA32060'), DATE '2026-04-10', 1.5);

INSERT INTO tasks (id, title, status, priority, project_id, sprint_id, assignee_id, created_by, created_at, sprint_added_at, assigned_at, entered_in_progress_at, completed_at, rework_count)
VALUES (HEXTORAW('E0000000000000000000000000000062'), 'V13-308 M3 - Software Requirements', 'DONE', 'MEDIUM', HEXTORAW('F18FB987E9A04CA58213404D089F41AA'), HEXTORAW('9E957AA9278043FDB4AAD86065F344F9'), HEXTORAW('E5E7D6DC9BA54E7A95B198EF1AA32060'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), TIMESTAMP '2026-03-23 08:00:00', TIMESTAMP '2026-03-23 08:00:00', TIMESTAMP '2026-03-23 08:00:00', TIMESTAMP '2026-04-07 09:00:00', TIMESTAMP '2026-04-10 17:00:00', 0);
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E0000000000000000000000000000062'), HEXTORAW('E5E7D6DC9BA54E7A95B198EF1AA32060'), NULL, 'TODO', 'WEB', TIMESTAMP '2026-03-23 08:00:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E0000000000000000000000000000062'), HEXTORAW('E5E7D6DC9BA54E7A95B198EF1AA32060'), 'TODO', 'IN_PROGRESS', 'WEB', TIMESTAMP '2026-04-07 09:00:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E0000000000000000000000000000062'), HEXTORAW('E5E7D6DC9BA54E7A95B198EF1AA32060'), 'IN_PROGRESS', 'DONE', 'WEB', TIMESTAMP '2026-04-10 17:00:00');
INSERT INTO task_work_logs (task_id, user_id, work_date, hours_worked) VALUES (HEXTORAW('E0000000000000000000000000000062'), HEXTORAW('E5E7D6DC9BA54E7A95B198EF1AA32060'), DATE '2026-04-10', 1.5);

INSERT INTO tasks (id, title, status, priority, project_id, sprint_id, assignee_id, created_by, created_at, sprint_added_at, assigned_at, entered_in_progress_at, completed_at, rework_count)
VALUES (HEXTORAW('E0000000000000000000000000000063'), 'V13-309 M5 - Design & Architecture', 'DONE', 'MEDIUM', HEXTORAW('F18FB987E9A04CA58213404D089F41AA'), HEXTORAW('9E957AA9278043FDB4AAD86065F344F9'), HEXTORAW('09F9156961144414AF1D9815FED84D5F'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), TIMESTAMP '2026-03-23 08:00:00', TIMESTAMP '2026-03-23 08:00:00', TIMESTAMP '2026-03-23 08:00:00', TIMESTAMP '2026-04-07 09:00:00', TIMESTAMP '2026-04-10 17:00:00', 0);
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E0000000000000000000000000000063'), HEXTORAW('09F9156961144414AF1D9815FED84D5F'), NULL, 'TODO', 'WEB', TIMESTAMP '2026-03-23 08:00:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E0000000000000000000000000000063'), HEXTORAW('09F9156961144414AF1D9815FED84D5F'), 'TODO', 'IN_PROGRESS', 'WEB', TIMESTAMP '2026-04-07 09:00:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E0000000000000000000000000000063'), HEXTORAW('09F9156961144414AF1D9815FED84D5F'), 'IN_PROGRESS', 'DONE', 'WEB', TIMESTAMP '2026-04-10 17:00:00');
INSERT INTO task_work_logs (task_id, user_id, work_date, hours_worked) VALUES (HEXTORAW('E0000000000000000000000000000063'), HEXTORAW('09F9156961144414AF1D9815FED84D5F'), DATE '2026-04-10', 2.0);

INSERT INTO tasks (id, title, status, priority, project_id, sprint_id, assignee_id, created_by, created_at, sprint_added_at, assigned_at, entered_in_progress_at, completed_at, rework_count)
VALUES (HEXTORAW('E0000000000000000000000000000064'), 'V13-310 M7 - Advanced Databases', 'DONE', 'MEDIUM', HEXTORAW('F18FB987E9A04CA58213404D089F41AA'), HEXTORAW('9E957AA9278043FDB4AAD86065F344F9'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), TIMESTAMP '2026-03-23 08:00:00', TIMESTAMP '2026-03-23 08:00:00', TIMESTAMP '2026-03-23 08:00:00', TIMESTAMP '2026-04-08 09:00:00', TIMESTAMP '2026-04-10 17:00:00', 0);
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E0000000000000000000000000000064'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), NULL, 'TODO', 'WEB', TIMESTAMP '2026-03-23 08:00:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E0000000000000000000000000000064'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), 'TODO', 'IN_PROGRESS', 'WEB', TIMESTAMP '2026-04-08 09:00:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E0000000000000000000000000000064'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), 'IN_PROGRESS', 'DONE', 'WEB', TIMESTAMP '2026-04-10 17:00:00');
INSERT INTO task_work_logs (task_id, user_id, work_date, hours_worked) VALUES (HEXTORAW('E0000000000000000000000000000064'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), DATE '2026-04-10', 2.0);

INSERT INTO tasks (id, title, status, priority, project_id, sprint_id, assignee_id, created_by, created_at, sprint_added_at, assigned_at, entered_in_progress_at, completed_at, rework_count)
VALUES (HEXTORAW('E0000000000000000000000000000065'), 'V13-311 M10 - Linux Support', 'DONE', 'MEDIUM', HEXTORAW('F18FB987E9A04CA58213404D089F41AA'), HEXTORAW('9E957AA9278043FDB4AAD86065F344F9'), HEXTORAW('D9664711BC1348ABA56BCA68B161244A'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), TIMESTAMP '2026-03-23 08:00:00', TIMESTAMP '2026-03-23 08:00:00', TIMESTAMP '2026-03-23 08:00:00', TIMESTAMP '2026-04-08 09:00:00', TIMESTAMP '2026-04-10 17:00:00', 0);
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E0000000000000000000000000000065'), HEXTORAW('D9664711BC1348ABA56BCA68B161244A'), NULL, 'TODO', 'WEB', TIMESTAMP '2026-03-23 08:00:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E0000000000000000000000000000065'), HEXTORAW('D9664711BC1348ABA56BCA68B161244A'), 'TODO', 'IN_PROGRESS', 'WEB', TIMESTAMP '2026-04-08 09:00:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E0000000000000000000000000000065'), HEXTORAW('D9664711BC1348ABA56BCA68B161244A'), 'IN_PROGRESS', 'DONE', 'WEB', TIMESTAMP '2026-04-10 17:00:00');
INSERT INTO task_work_logs (task_id, user_id, work_date, hours_worked) VALUES (HEXTORAW('E0000000000000000000000000000065'), HEXTORAW('D9664711BC1348ABA56BCA68B161244A'), DATE '2026-04-10', 1.5);

INSERT INTO tasks (id, title, status, priority, project_id, sprint_id, assignee_id, created_by, created_at, sprint_added_at, assigned_at, entered_in_progress_at, completed_at, rework_count)
VALUES (HEXTORAW('E0000000000000000000000000000066'), 'V13-312 M11 - Java Development', 'DONE', 'MEDIUM', HEXTORAW('F18FB987E9A04CA58213404D089F41AA'), HEXTORAW('9E957AA9278043FDB4AAD86065F344F9'), HEXTORAW('DB5CABA59E764D2C83167B8578AB06DB'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), TIMESTAMP '2026-03-23 08:00:00', TIMESTAMP '2026-03-23 08:00:00', TIMESTAMP '2026-03-23 08:00:00', TIMESTAMP '2026-04-09 09:00:00', TIMESTAMP '2026-04-10 17:00:00', 0);
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E0000000000000000000000000000066'), HEXTORAW('DB5CABA59E764D2C83167B8578AB06DB'), NULL, 'TODO', 'WEB', TIMESTAMP '2026-03-23 08:00:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E0000000000000000000000000000066'), HEXTORAW('DB5CABA59E764D2C83167B8578AB06DB'), 'TODO', 'IN_PROGRESS', 'WEB', TIMESTAMP '2026-04-09 09:00:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E0000000000000000000000000000066'), HEXTORAW('DB5CABA59E764D2C83167B8578AB06DB'), 'IN_PROGRESS', 'DONE', 'WEB', TIMESTAMP '2026-04-10 17:00:00');
INSERT INTO task_work_logs (task_id, user_id, work_date, hours_worked) VALUES (HEXTORAW('E0000000000000000000000000000066'), HEXTORAW('DB5CABA59E764D2C83167B8578AB06DB'), DATE '2026-04-10', 1.5);

INSERT INTO tasks (id, title, status, priority, project_id, sprint_id, assignee_id, created_by, created_at, sprint_added_at, assigned_at, entered_in_progress_at, completed_at, rework_count)
VALUES (HEXTORAW('E0000000000000000000000000000067'), 'V13-313 M12 - Challenge', 'DONE', 'MEDIUM', HEXTORAW('F18FB987E9A04CA58213404D089F41AA'), HEXTORAW('9E957AA9278043FDB4AAD86065F344F9'), HEXTORAW('E5E7D6DC9BA54E7A95B198EF1AA32060'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), TIMESTAMP '2026-03-23 08:00:00', TIMESTAMP '2026-03-23 08:00:00', TIMESTAMP '2026-03-23 08:00:00', TIMESTAMP '2026-04-09 09:00:00', TIMESTAMP '2026-04-10 17:00:00', 0);
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E0000000000000000000000000000067'), HEXTORAW('E5E7D6DC9BA54E7A95B198EF1AA32060'), NULL, 'TODO', 'WEB', TIMESTAMP '2026-03-23 08:00:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E0000000000000000000000000000067'), HEXTORAW('E5E7D6DC9BA54E7A95B198EF1AA32060'), 'TODO', 'IN_PROGRESS', 'WEB', TIMESTAMP '2026-04-09 09:00:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E0000000000000000000000000000067'), HEXTORAW('E5E7D6DC9BA54E7A95B198EF1AA32060'), 'IN_PROGRESS', 'DONE', 'WEB', TIMESTAMP '2026-04-10 17:00:00');
INSERT INTO task_work_logs (task_id, user_id, work_date, hours_worked) VALUES (HEXTORAW('E0000000000000000000000000000067'), HEXTORAW('E5E7D6DC9BA54E7A95B198EF1AA32060'), DATE '2026-04-10', 1.0);


-- ===========================================================================
-- SPRINT 3 TASKS
-- Sprint is ACTIVE: 2026-04-13 → 2026-04-25 (today is 2026-04-16)
-- Parent tasks are IN_PROGRESS; subtasks are TODO (unassigned per the .md)
-- This gives us aging WIP on the parents and a full TODO backlog on subtasks.
-- Parent tasks have assigned_at but delayed start → KPI-A2 (time-to-action).
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- V13-170 — OCI IAM Domain | Ana Paula | IN_PROGRESS (aging WIP)
-- ---------------------------------------------------------------------------
INSERT INTO tasks (id, title, description, status, priority, project_id, sprint_id, assignee_id, created_by,
                   created_at, sprint_added_at, assigned_at, entered_in_progress_at, rework_count)
VALUES (HEXTORAW('E0000000000000000000000000000068'),
        'V13-170 OCI IAM Domain',
        'As a DevOps engineer, I need an OCI IAM domain configured with OIDC for the web app.',
        'IN_PROGRESS', 'HIGH',
        HEXTORAW('F18FB987E9A04CA58213404D089F41AA'), HEXTORAW('99087F6CA1DC4845989F419A1D58B6DA'),
        HEXTORAW('09F9156961144414AF1D9815FED84D5F'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'),
        TIMESTAMP '2026-04-13 08:00:00', TIMESTAMP '2026-04-13 08:00:00',
        TIMESTAMP '2026-04-13 08:00:00',
        TIMESTAMP '2026-04-14 09:00:00',  -- started next day → slight time-to-action delay
        0);
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at)
VALUES (HEXTORAW('E0000000000000000000000000000068'), HEXTORAW('09F9156961144414AF1D9815FED84D5F'), NULL, 'TODO', 'WEB', TIMESTAMP '2026-04-13 08:00:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at)
VALUES (HEXTORAW('E0000000000000000000000000000068'), HEXTORAW('09F9156961144414AF1D9815FED84D5F'), 'TODO', 'IN_PROGRESS', 'WEB', TIMESTAMP '2026-04-14 09:00:00');
INSERT INTO task_work_logs (task_id, user_id, work_date, hours_worked) VALUES (HEXTORAW('E0000000000000000000000000000068'), HEXTORAW('09F9156961144414AF1D9815FED84D5F'), DATE '2026-04-14', 11.0);

-- V13-172/173/174/175 subtasks — TODO, unassigned
INSERT INTO tasks (id, title, status, priority, project_id, sprint_id, created_by, created_at, sprint_added_at, rework_count)
VALUES (HEXTORAW('E0000000000000000000000000000069'), 'V13-172 Create IAM domain in OCI console', 'TODO', 'HIGH', HEXTORAW('F18FB987E9A04CA58213404D089F41AA'), HEXTORAW('99087F6CA1DC4845989F419A1D58B6DA'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), TIMESTAMP '2026-04-13 08:00:00', TIMESTAMP '2026-04-13 08:00:00', 0);
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E0000000000000000000000000000069'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), NULL, 'TODO', 'WEB', TIMESTAMP '2026-04-13 08:00:00');

INSERT INTO tasks (id, title, status, priority, project_id, sprint_id, created_by, created_at, sprint_added_at, rework_count)
VALUES (HEXTORAW('E000000000000000000000000000006A'), 'V13-173 Register web app as confidential OIDC client', 'TODO', 'HIGH', HEXTORAW('F18FB987E9A04CA58213404D089F41AA'), HEXTORAW('99087F6CA1DC4845989F419A1D58B6DA'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), TIMESTAMP '2026-04-13 08:00:00', TIMESTAMP '2026-04-13 08:00:00', 0);
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E000000000000000000000000000006A'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), NULL, 'TODO', 'WEB', TIMESTAMP '2026-04-13 08:00:00');

INSERT INTO tasks (id, title, status, priority, project_id, sprint_id, created_by, created_at, sprint_added_at, rework_count)
VALUES (HEXTORAW('E000000000000000000000000000006B'), 'V13-174 Configure redirect URIs for local, staging, and prod', 'TODO', 'MEDIUM', HEXTORAW('F18FB987E9A04CA58213404D089F41AA'), HEXTORAW('99087F6CA1DC4845989F419A1D58B6DA'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), TIMESTAMP '2026-04-13 08:00:00', TIMESTAMP '2026-04-13 08:00:00', 0);
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E000000000000000000000000000006B'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), NULL, 'TODO', 'WEB', TIMESTAMP '2026-04-13 08:00:00');

INSERT INTO tasks (id, title, status, priority, project_id, sprint_id, created_by, created_at, sprint_added_at, rework_count)
VALUES (HEXTORAW('E000000000000000000000000000006C'), 'V13-175 Document client_id and discovery URL', 'TODO', 'LOW', HEXTORAW('F18FB987E9A04CA58213404D089F41AA'), HEXTORAW('99087F6CA1DC4845989F419A1D58B6DA'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), TIMESTAMP '2026-04-13 08:00:00', TIMESTAMP '2026-04-13 08:00:00', 0);
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E000000000000000000000000000006C'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), NULL, 'TODO', 'WEB', TIMESTAMP '2026-04-13 08:00:00');


-- ---------------------------------------------------------------------------
-- V13-171 — IAM Groups | Ana Paula | IN_PROGRESS (aging WIP)
-- ---------------------------------------------------------------------------
INSERT INTO tasks (id, title, description, status, priority, project_id, sprint_id, assignee_id, created_by,
                   created_at, sprint_added_at, assigned_at, entered_in_progress_at, rework_count)
VALUES (HEXTORAW('E000000000000000000000000000006D'),
        'V13-171 IAM Groups',
        'As a DevOps engineer, I need IAM groups for DEVELOPER and PROJECT_MANAGER roles.',
        'IN_PROGRESS', 'HIGH',
        HEXTORAW('F18FB987E9A04CA58213404D089F41AA'), HEXTORAW('99087F6CA1DC4845989F419A1D58B6DA'),
        HEXTORAW('09F9156961144414AF1D9815FED84D5F'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'),
        TIMESTAMP '2026-04-13 08:00:00', TIMESTAMP '2026-04-13 08:00:00',
        TIMESTAMP '2026-04-13 08:00:00',
        TIMESTAMP '2026-04-15 09:00:00',  -- 2-day delay → time-to-action signal
        0);
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at)
VALUES (HEXTORAW('E000000000000000000000000000006D'), HEXTORAW('09F9156961144414AF1D9815FED84D5F'), NULL, 'TODO', 'WEB', TIMESTAMP '2026-04-13 08:00:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at)
VALUES (HEXTORAW('E000000000000000000000000000006D'), HEXTORAW('09F9156961144414AF1D9815FED84D5F'), 'TODO', 'IN_PROGRESS', 'WEB', TIMESTAMP '2026-04-15 09:00:00');
INSERT INTO task_work_logs (task_id, user_id, work_date, hours_worked) VALUES (HEXTORAW('E000000000000000000000000000006D'), HEXTORAW('09F9156961144414AF1D9815FED84D5F'), DATE '2026-04-15', 4.0);

-- V13-176/177/178 subtasks — TODO, unassigned
INSERT INTO tasks (id, title, status, priority, project_id, sprint_id, created_by, created_at, sprint_added_at, rework_count)
VALUES (HEXTORAW('E000000000000000000000000000006E'), 'V13-176 Create DEVELOPER and PROJECT_MANAGER groups in IAM', 'TODO', 'HIGH', HEXTORAW('F18FB987E9A04CA58213404D089F41AA'), HEXTORAW('99087F6CA1DC4845989F419A1D58B6DA'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), TIMESTAMP '2026-04-13 08:00:00', TIMESTAMP '2026-04-13 08:00:00', 0);
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E000000000000000000000000000006E'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), NULL, 'TODO', 'WEB', TIMESTAMP '2026-04-13 08:00:00');

INSERT INTO tasks (id, title, status, priority, project_id, sprint_id, created_by, created_at, sprint_added_at, rework_count)
VALUES (HEXTORAW('E000000000000000000000000000006F'), 'V13-177 Add custom claims to ID token for group membership', 'TODO', 'HIGH', HEXTORAW('F18FB987E9A04CA58213404D089F41AA'), HEXTORAW('99087F6CA1DC4845989F419A1D58B6DA'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), TIMESTAMP '2026-04-13 08:00:00', TIMESTAMP '2026-04-13 08:00:00', 0);
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E000000000000000000000000000006F'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), NULL, 'TODO', 'WEB', TIMESTAMP '2026-04-13 08:00:00');

INSERT INTO tasks (id, title, status, priority, project_id, sprint_id, created_by, created_at, sprint_added_at, rework_count)
VALUES (HEXTORAW('E0000000000000000000000000000070'), 'V13-178 Test token claims with a test user', 'TODO', 'MEDIUM', HEXTORAW('F18FB987E9A04CA58213404D089F41AA'), HEXTORAW('99087F6CA1DC4845989F419A1D58B6DA'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), TIMESTAMP '2026-04-13 08:00:00', TIMESTAMP '2026-04-13 08:00:00', 0);
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E0000000000000000000000000000070'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), NULL, 'TODO', 'WEB', TIMESTAMP '2026-04-13 08:00:00');


-- ---------------------------------------------------------------------------
-- V13-180 — JWT Validation | jozefhdez | IN_PROGRESS (aging WIP + BLOCKED)
-- ---------------------------------------------------------------------------
INSERT INTO tasks (id, title, description, status, priority, project_id, sprint_id, assignee_id, created_by,
                   created_at, sprint_added_at, assigned_at, entered_in_progress_at, blocked_at, rework_count)
VALUES (HEXTORAW('E0000000000000000000000000000071'),
        'V13-180 Validation of JWT',
        'As a dev, I need Spring Boot to validate JWTs from OCI IAM on every request.',
        'BLOCKED', 'HIGH',
        HEXTORAW('F18FB987E9A04CA58213404D089F41AA'), HEXTORAW('99087F6CA1DC4845989F419A1D58B6DA'),
        HEXTORAW('DB5CABA59E764D2C83167B8578AB06DB'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'),
        TIMESTAMP '2026-04-13 08:00:00', TIMESTAMP '2026-04-13 08:00:00',
        TIMESTAMP '2026-04-13 08:00:00',
        TIMESTAMP '2026-04-13 10:00:00',
        TIMESTAMP '2026-04-15 14:00:00',  -- blocked waiting on IAM domain to be configured first
        0);
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at)
VALUES (HEXTORAW('E0000000000000000000000000000071'), HEXTORAW('DB5CABA59E764D2C83167B8578AB06DB'), NULL, 'TODO', 'WEB', TIMESTAMP '2026-04-13 08:00:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at)
VALUES (HEXTORAW('E0000000000000000000000000000071'), HEXTORAW('DB5CABA59E764D2C83167B8578AB06DB'), 'TODO', 'IN_PROGRESS', 'WEB', TIMESTAMP '2026-04-13 10:00:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at)
VALUES (HEXTORAW('E0000000000000000000000000000071'), HEXTORAW('DB5CABA59E764D2C83167B8578AB06DB'), 'IN_PROGRESS', 'BLOCKED', 'WEB', TIMESTAMP '2026-04-15 14:00:00');
INSERT INTO task_work_logs (task_id, user_id, work_date, hours_worked) VALUES (HEXTORAW('E0000000000000000000000000000071'), HEXTORAW('DB5CABA59E764D2C83167B8578AB06DB'), DATE '2026-04-13', 8.0);

-- V13-182/183/184/185 subtasks — TODO, unassigned
INSERT INTO tasks (id, title, status, priority, project_id, sprint_id, created_by, created_at, sprint_added_at, rework_count)
VALUES (HEXTORAW('E0000000000000000000000000000072'), 'V13-182 Add Spring Security + OAuth2 Resource Server dependency', 'TODO', 'HIGH', HEXTORAW('F18FB987E9A04CA58213404D089F41AA'), HEXTORAW('99087F6CA1DC4845989F419A1D58B6DA'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), TIMESTAMP '2026-04-13 08:00:00', TIMESTAMP '2026-04-13 08:00:00', 0);
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E0000000000000000000000000000072'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), NULL, 'TODO', 'WEB', TIMESTAMP '2026-04-13 08:00:00');

INSERT INTO tasks (id, title, status, priority, project_id, sprint_id, created_by, created_at, sprint_added_at, rework_count)
VALUES (HEXTORAW('E0000000000000000000000000000073'), 'V13-183 Configure jwks-uri pointing to OCI IAM JWKS endpoint', 'TODO', 'HIGH', HEXTORAW('F18FB987E9A04CA58213404D089F41AA'), HEXTORAW('99087F6CA1DC4845989F419A1D58B6DA'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), TIMESTAMP '2026-04-13 08:00:00', TIMESTAMP '2026-04-13 08:00:00', 0);
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E0000000000000000000000000000073'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), NULL, 'TODO', 'WEB', TIMESTAMP '2026-04-13 08:00:00');

INSERT INTO tasks (id, title, status, priority, project_id, sprint_id, created_by, created_at, sprint_added_at, rework_count)
VALUES (HEXTORAW('E0000000000000000000000000000074'), 'V13-184 Reject requests without valid Bearer token', 'TODO', 'HIGH', HEXTORAW('F18FB987E9A04CA58213404D089F41AA'), HEXTORAW('99087F6CA1DC4845989F419A1D58B6DA'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), TIMESTAMP '2026-04-13 08:00:00', TIMESTAMP '2026-04-13 08:00:00', 0);
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E0000000000000000000000000000074'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), NULL, 'TODO', 'WEB', TIMESTAMP '2026-04-13 08:00:00');

INSERT INTO tasks (id, title, status, priority, project_id, sprint_id, created_by, created_at, sprint_added_at, rework_count)
VALUES (HEXTORAW('E0000000000000000000000000000075'), 'V13-185 Write integration tests for auth rejection', 'TODO', 'MEDIUM', HEXTORAW('F18FB987E9A04CA58213404D089F41AA'), HEXTORAW('99087F6CA1DC4845989F419A1D58B6DA'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), TIMESTAMP '2026-04-13 08:00:00', TIMESTAMP '2026-04-13 08:00:00', 0);
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E0000000000000000000000000000075'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), NULL, 'TODO', 'WEB', TIMESTAMP '2026-04-13 08:00:00');


-- ---------------------------------------------------------------------------
-- V13-181 — RBAC | Luis | IN_PROGRESS
-- ---------------------------------------------------------------------------
INSERT INTO tasks (id, title, description, status, priority, project_id, sprint_id, assignee_id, created_by,
                   created_at, sprint_added_at, assigned_at, entered_in_progress_at, rework_count)
VALUES (HEXTORAW('E0000000000000000000000000000076'),
        'V13-181 Role Based Access Control',
        'Map IAM group claims to Spring Security authorities and protect PM-only endpoints.',
        'IN_PROGRESS', 'HIGH',
        HEXTORAW('F18FB987E9A04CA58213404D089F41AA'), HEXTORAW('99087F6CA1DC4845989F419A1D58B6DA'),
        HEXTORAW('D9664711BC1348ABA56BCA68B161244A'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'),
        TIMESTAMP '2026-04-13 08:00:00', TIMESTAMP '2026-04-13 08:00:00',
        TIMESTAMP '2026-04-13 08:00:00',
        TIMESTAMP '2026-04-13 11:00:00',
        0);
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at)
VALUES (HEXTORAW('E0000000000000000000000000000076'), HEXTORAW('D9664711BC1348ABA56BCA68B161244A'), NULL, 'TODO', 'WEB', TIMESTAMP '2026-04-13 08:00:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at)
VALUES (HEXTORAW('E0000000000000000000000000000076'), HEXTORAW('D9664711BC1348ABA56BCA68B161244A'), 'TODO', 'IN_PROGRESS', 'WEB', TIMESTAMP '2026-04-13 11:00:00');
INSERT INTO task_work_logs (task_id, user_id, work_date, hours_worked) VALUES (HEXTORAW('E0000000000000000000000000000076'), HEXTORAW('D9664711BC1348ABA56BCA68B161244A'), DATE '2026-04-13', 13.0);

-- V13-186/187/188/189 subtasks — TODO, unassigned
INSERT INTO tasks (id, title, status, priority, project_id, sprint_id, created_by, created_at, sprint_added_at, rework_count)
VALUES (HEXTORAW('E0000000000000000000000000000077'), 'V13-186 Map IAM group claims to Spring Security authorities', 'TODO', 'HIGH', HEXTORAW('F18FB987E9A04CA58213404D089F41AA'), HEXTORAW('99087F6CA1DC4845989F419A1D58B6DA'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), TIMESTAMP '2026-04-13 08:00:00', TIMESTAMP '2026-04-13 08:00:00', 0);
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E0000000000000000000000000000077'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), NULL, 'TODO', 'WEB', TIMESTAMP '2026-04-13 08:00:00');

INSERT INTO tasks (id, title, status, priority, project_id, sprint_id, created_by, created_at, sprint_added_at, rework_count)
VALUES (HEXTORAW('E0000000000000000000000000000078'), 'V13-187 Annotate PM-only endpoints with @PreAuthorize', 'TODO', 'HIGH', HEXTORAW('F18FB987E9A04CA58213404D089F41AA'), HEXTORAW('99087F6CA1DC4845989F419A1D58B6DA'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), TIMESTAMP '2026-04-13 08:00:00', TIMESTAMP '2026-04-13 08:00:00', 0);
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E0000000000000000000000000000078'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), NULL, 'TODO', 'WEB', TIMESTAMP '2026-04-13 08:00:00');

INSERT INTO tasks (id, title, status, priority, project_id, sprint_id, created_by, created_at, sprint_added_at, rework_count)
VALUES (HEXTORAW('E0000000000000000000000000000079'), 'V13-188 Write tests verifying developer cannot call PM endpoints', 'TODO', 'HIGH', HEXTORAW('F18FB987E9A04CA58213404D089F41AA'), HEXTORAW('99087F6CA1DC4845989F419A1D58B6DA'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), TIMESTAMP '2026-04-13 08:00:00', TIMESTAMP '2026-04-13 08:00:00', 0);
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E0000000000000000000000000000079'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), NULL, 'TODO', 'WEB', TIMESTAMP '2026-04-13 08:00:00');

INSERT INTO tasks (id, title, status, priority, project_id, sprint_id, created_by, created_at, sprint_added_at, rework_count)
VALUES (HEXTORAW('E000000000000000000000000000007A'), 'V13-189 Return 403 with clear error message on denial', 'TODO', 'MEDIUM', HEXTORAW('F18FB987E9A04CA58213404D089F41AA'), HEXTORAW('99087F6CA1DC4845989F419A1D58B6DA'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), TIMESTAMP '2026-04-13 08:00:00', TIMESTAMP '2026-04-13 08:00:00', 0);
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E000000000000000000000000000007A'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), NULL, 'TODO', 'WEB', TIMESTAMP '2026-04-13 08:00:00');


-- ---------------------------------------------------------------------------
-- V13-191 — Role Based Navigation | Ana Elena | IN_PROGRESS
-- ---------------------------------------------------------------------------
INSERT INTO tasks (id, title, description, status, priority, project_id, sprint_id, assignee_id, created_by,
                   created_at, sprint_added_at, assigned_at, entered_in_progress_at, rework_count)
VALUES (HEXTORAW('E000000000000000000000000000007B'),
        'V13-191 Role Based Navigation',
        'As a user, I am redirected to OCI IAM login when I open the app unauthenticated.',
        'IN_PROGRESS', 'HIGH',
        HEXTORAW('F18FB987E9A04CA58213404D089F41AA'), HEXTORAW('99087F6CA1DC4845989F419A1D58B6DA'),
        HEXTORAW('E5E7D6DC9BA54E7A95B198EF1AA32060'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'),
        TIMESTAMP '2026-04-13 08:00:00', TIMESTAMP '2026-04-13 08:00:00',
        TIMESTAMP '2026-04-13 08:00:00',
        TIMESTAMP '2026-04-13 09:00:00',
        0);
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at)
VALUES (HEXTORAW('E000000000000000000000000000007B'), HEXTORAW('E5E7D6DC9BA54E7A95B198EF1AA32060'), NULL, 'TODO', 'WEB', TIMESTAMP '2026-04-13 08:00:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at)
VALUES (HEXTORAW('E000000000000000000000000000007B'), HEXTORAW('E5E7D6DC9BA54E7A95B198EF1AA32060'), 'TODO', 'IN_PROGRESS', 'WEB', TIMESTAMP '2026-04-13 09:00:00');
INSERT INTO task_work_logs (task_id, user_id, work_date, hours_worked) VALUES (HEXTORAW('E000000000000000000000000000007B'), HEXTORAW('E5E7D6DC9BA54E7A95B198EF1AA32060'), DATE '2026-04-13', 12.0);

-- V13-193/194/195/196 subtasks — TODO, unassigned
INSERT INTO tasks (id, title, status, priority, project_id, sprint_id, created_by, created_at, sprint_added_at, rework_count)
VALUES (HEXTORAW('E000000000000000000000000000007C'), 'V13-193 Integrate OIDC client library (oidc-client-ts) in React', 'TODO', 'HIGH', HEXTORAW('F18FB987E9A04CA58213404D089F41AA'), HEXTORAW('99087F6CA1DC4845989F419A1D58B6DA'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), TIMESTAMP '2026-04-13 08:00:00', TIMESTAMP '2026-04-13 08:00:00', 0);
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E000000000000000000000000000007C'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), NULL, 'TODO', 'WEB', TIMESTAMP '2026-04-13 08:00:00');

INSERT INTO tasks (id, title, status, priority, project_id, sprint_id, created_by, created_at, sprint_added_at, rework_count)
VALUES (HEXTORAW('E000000000000000000000000000007D'), 'V13-194 Implement silent token renewal', 'TODO', 'HIGH', HEXTORAW('F18FB987E9A04CA58213404D089F41AA'), HEXTORAW('99087F6CA1DC4845989F419A1D58B6DA'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), TIMESTAMP '2026-04-13 08:00:00', TIMESTAMP '2026-04-13 08:00:00', 0);
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E000000000000000000000000000007D'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), NULL, 'TODO', 'WEB', TIMESTAMP '2026-04-13 08:00:00');

INSERT INTO tasks (id, title, status, priority, project_id, sprint_id, created_by, created_at, sprint_added_at, rework_count)
VALUES (HEXTORAW('E000000000000000000000000000007E'), 'V13-195 Store JWT in memory (not localStorage)', 'TODO', 'HIGH', HEXTORAW('F18FB987E9A04CA58213404D089F41AA'), HEXTORAW('99087F6CA1DC4845989F419A1D58B6DA'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), TIMESTAMP '2026-04-13 08:00:00', TIMESTAMP '2026-04-13 08:00:00', 0);
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E000000000000000000000000000007E'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), NULL, 'TODO', 'WEB', TIMESTAMP '2026-04-13 08:00:00');

INSERT INTO tasks (id, title, status, priority, project_id, sprint_id, created_by, created_at, sprint_added_at, rework_count)
VALUES (HEXTORAW('E000000000000000000000000000007F'), 'V13-196 Attach Bearer token to all API calls via Axios interceptor', 'TODO', 'MEDIUM', HEXTORAW('F18FB987E9A04CA58213404D089F41AA'), HEXTORAW('99087F6CA1DC4845989F419A1D58B6DA'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), TIMESTAMP '2026-04-13 08:00:00', TIMESTAMP '2026-04-13 08:00:00', 0);
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E000000000000000000000000000007F'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), NULL, 'TODO', 'WEB', TIMESTAMP '2026-04-13 08:00:00');


-- ---------------------------------------------------------------------------
-- V13-192 — Role Based Permissions | Ana Elena | IN_PROGRESS
-- ---------------------------------------------------------------------------
INSERT INTO tasks (id, title, description, status, priority, project_id, sprint_id, assignee_id, created_by,
                   created_at, sprint_added_at, assigned_at, entered_in_progress_at, rework_count)
VALUES (HEXTORAW('E0000000000000000000000000000080'),
        'V13-192 Role Based Permissions',
        'As a user, I see only UI elements my role permits.',
        'IN_PROGRESS', 'HIGH',
        HEXTORAW('F18FB987E9A04CA58213404D089F41AA'), HEXTORAW('99087F6CA1DC4845989F419A1D58B6DA'),
        HEXTORAW('E5E7D6DC9BA54E7A95B198EF1AA32060'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'),
        TIMESTAMP '2026-04-13 08:00:00', TIMESTAMP '2026-04-13 08:00:00',
        TIMESTAMP '2026-04-13 08:00:00',
        TIMESTAMP '2026-04-14 10:00:00',
        0);
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at)
VALUES (HEXTORAW('E0000000000000000000000000000080'), HEXTORAW('E5E7D6DC9BA54E7A95B198EF1AA32060'), NULL, 'TODO', 'WEB', TIMESTAMP '2026-04-13 08:00:00');
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at)
VALUES (HEXTORAW('E0000000000000000000000000000080'), HEXTORAW('E5E7D6DC9BA54E7A95B198EF1AA32060'), 'TODO', 'IN_PROGRESS', 'WEB', TIMESTAMP '2026-04-14 10:00:00');
INSERT INTO task_work_logs (task_id, user_id, work_date, hours_worked) VALUES (HEXTORAW('E0000000000000000000000000000080'), HEXTORAW('E5E7D6DC9BA54E7A95B198EF1AA32060'), DATE '2026-04-14', 7.0);

-- V13-197/198/199 subtasks — TODO, unassigned
INSERT INTO tasks (id, title, status, priority, project_id, sprint_id, created_by, created_at, sprint_added_at, rework_count)
VALUES (HEXTORAW('E0000000000000000000000000000081'), 'V13-197 Read role from JWT claims in React context', 'TODO', 'HIGH', HEXTORAW('F18FB987E9A04CA58213404D089F41AA'), HEXTORAW('99087F6CA1DC4845989F419A1D58B6DA'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), TIMESTAMP '2026-04-13 08:00:00', TIMESTAMP '2026-04-13 08:00:00', 0);
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E0000000000000000000000000000081'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), NULL, 'TODO', 'WEB', TIMESTAMP '2026-04-13 08:00:00');

INSERT INTO tasks (id, title, status, priority, project_id, sprint_id, created_by, created_at, sprint_added_at, rework_count)
VALUES (HEXTORAW('E0000000000000000000000000000082'), 'V13-198 Hide PM-only nav items for developer users', 'TODO', 'MEDIUM', HEXTORAW('F18FB987E9A04CA58213404D089F41AA'), HEXTORAW('99087F6CA1DC4845989F419A1D58B6DA'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), TIMESTAMP '2026-04-13 08:00:00', TIMESTAMP '2026-04-13 08:00:00', 0);
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E0000000000000000000000000000082'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), NULL, 'TODO', 'WEB', TIMESTAMP '2026-04-13 08:00:00');

INSERT INTO tasks (id, title, status, priority, project_id, sprint_id, created_by, created_at, sprint_added_at, rework_count)
VALUES (HEXTORAW('E0000000000000000000000000000083'), 'V13-199 Redirect unauthorized deep links back to dashboard', 'TODO', 'MEDIUM', HEXTORAW('F18FB987E9A04CA58213404D089F41AA'), HEXTORAW('99087F6CA1DC4845989F419A1D58B6DA'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), TIMESTAMP '2026-04-13 08:00:00', TIMESTAMP '2026-04-13 08:00:00', 0);
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E0000000000000000000000000000083'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), NULL, 'TODO', 'WEB', TIMESTAMP '2026-04-13 08:00:00');


-- ---------------------------------------------------------------------------
-- Sprint 3 standalone module tasks (V13-315 to V13-318) — all TODO
-- ---------------------------------------------------------------------------
INSERT INTO tasks (id, title, status, priority, project_id, sprint_id, assignee_id, created_by, created_at, sprint_added_at, assigned_at, rework_count)
VALUES (HEXTORAW('E0000000000000000000000000000084'), 'V13-315 M4 - Software Quality', 'TODO', 'MEDIUM', HEXTORAW('F18FB987E9A04CA58213404D089F41AA'), HEXTORAW('99087F6CA1DC4845989F419A1D58B6DA'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), TIMESTAMP '2026-04-13 08:00:00', TIMESTAMP '2026-04-13 08:00:00', TIMESTAMP '2026-04-13 08:00:00', 0);
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E0000000000000000000000000000084'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), NULL, 'TODO', 'WEB', TIMESTAMP '2026-04-13 08:00:00');

INSERT INTO tasks (id, title, status, priority, project_id, sprint_id, assignee_id, created_by, created_at, sprint_added_at, assigned_at, rework_count)
VALUES (HEXTORAW('E0000000000000000000000000000085'), 'V13-316 M9 - OCI/DevOps', 'TODO', 'MEDIUM', HEXTORAW('F18FB987E9A04CA58213404D089F41AA'), HEXTORAW('99087F6CA1DC4845989F419A1D58B6DA'), HEXTORAW('DB5CABA59E764D2C83167B8578AB06DB'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), TIMESTAMP '2026-04-13 08:00:00', TIMESTAMP '2026-04-13 08:00:00', TIMESTAMP '2026-04-13 08:00:00', 0);
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E0000000000000000000000000000085'), HEXTORAW('DB5CABA59E764D2C83167B8578AB06DB'), NULL, 'TODO', 'WEB', TIMESTAMP '2026-04-13 08:00:00');

INSERT INTO tasks (id, title, status, priority, project_id, sprint_id, assignee_id, created_by, created_at, sprint_added_at, assigned_at, rework_count)
VALUES (HEXTORAW('E0000000000000000000000000000086'), 'V13-318 M6 - Advanced Web', 'TODO', 'MEDIUM', HEXTORAW('F18FB987E9A04CA58213404D089F41AA'), HEXTORAW('99087F6CA1DC4845989F419A1D58B6DA'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), TIMESTAMP '2026-04-13 08:00:00', TIMESTAMP '2026-04-13 08:00:00', TIMESTAMP '2026-04-13 08:00:00', 0);
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E0000000000000000000000000000086'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), NULL, 'TODO', 'WEB', TIMESTAMP '2026-04-13 08:00:00');

INSERT INTO tasks (id, title, status, priority, project_id, sprint_id, assignee_id, created_by, created_at, sprint_added_at, assigned_at, rework_count)
VALUES (HEXTORAW('E0000000000000000000000000000087'), 'V13-319 M11 - Java Development', 'TODO', 'MEDIUM', HEXTORAW('F18FB987E9A04CA58213404D089F41AA'), HEXTORAW('99087F6CA1DC4845989F419A1D58B6DA'), HEXTORAW('D9664711BC1348ABA56BCA68B161244A'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), TIMESTAMP '2026-04-13 08:00:00', TIMESTAMP '2026-04-13 08:00:00', TIMESTAMP '2026-04-13 08:00:00', 0);
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E0000000000000000000000000000087'), HEXTORAW('D9664711BC1348ABA56BCA68B161244A'), NULL, 'TODO', 'WEB', TIMESTAMP '2026-04-13 08:00:00');

INSERT INTO tasks (id, title, status, priority, project_id, sprint_id, assignee_id, created_by, created_at, sprint_added_at, assigned_at, rework_count)
VALUES (HEXTORAW('E0000000000000000000000000000088'), 'V13-320 M1 - Software Standards', 'TODO', 'MEDIUM', HEXTORAW('F18FB987E9A04CA58213404D089F41AA'), HEXTORAW('99087F6CA1DC4845989F419A1D58B6DA'), HEXTORAW('E5E7D6DC9BA54E7A95B198EF1AA32060'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), TIMESTAMP '2026-04-13 08:00:00', TIMESTAMP '2026-04-13 08:00:00', TIMESTAMP '2026-04-13 08:00:00', 0);
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E0000000000000000000000000000088'), HEXTORAW('E5E7D6DC9BA54E7A95B198EF1AA32060'), NULL, 'TODO', 'WEB', TIMESTAMP '2026-04-13 08:00:00');

INSERT INTO tasks (id, title, status, priority, project_id, sprint_id, assignee_id, created_by, created_at, sprint_added_at, assigned_at, rework_count)
VALUES (HEXTORAW('E0000000000000000000000000000089'), 'V13-320 M2 - Project Administration', 'TODO', 'MEDIUM', HEXTORAW('F18FB987E9A04CA58213404D089F41AA'), HEXTORAW('99087F6CA1DC4845989F419A1D58B6DA'), HEXTORAW('09F9156961144414AF1D9815FED84D5F'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), TIMESTAMP '2026-04-13 08:00:00', TIMESTAMP '2026-04-13 08:00:00', TIMESTAMP '2026-04-13 08:00:00', 0);
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E0000000000000000000000000000089'), HEXTORAW('09F9156961144414AF1D9815FED84D5F'), NULL, 'TODO', 'WEB', TIMESTAMP '2026-04-13 08:00:00');

INSERT INTO tasks (id, title, status, priority, project_id, sprint_id, assignee_id, created_by, created_at, sprint_added_at, assigned_at, rework_count)
VALUES (HEXTORAW('E0000000000000000000000000000090'), 'V13-320 M2 - Deployment & Closure', 'TODO', 'MEDIUM', HEXTORAW('F18FB987E9A04CA58213404D089F41AA'), HEXTORAW('99087F6CA1DC4845989F419A1D58B6DA'), HEXTORAW('E5E7D6DC9BA54E7A95B198EF1AA32060'), HEXTORAW('94BCC8654A0F42839AE3696F1C5C964E'), TIMESTAMP '2026-04-13 08:00:00', TIMESTAMP '2026-04-13 08:00:00', TIMESTAMP '2026-04-13 08:00:00', 0);
INSERT INTO task_state_histories (task_id, changed_by, from_status, to_status, source, changed_at) VALUES (HEXTORAW('E0000000000000000000000000000089'), HEXTORAW('E5E7D6DC9BA54E7A95B198EF1AA32060'), NULL, 'TODO', 'WEB', TIMESTAMP '2026-04-13 08:00:00');

-- ===========================================================================
-- 6. UPDATE planned_task_count ON EACH SPRINT
--
-- Sprint 1: 46 tasks (all were in sprint at activation time on Feb 23,
--           except V13-93 which was scope creep added Mar 6 after activation)
-- Sprint 2: 47 tasks planned at activation (Mar 23),
--           V13-131 added Mar 30 as scope creep
-- Sprint 3: 35 tasks planned at activation (Apr 13, all added day 1)
-- ===========================================================================
UPDATE sprints
SET planned_task_count = 46
WHERE id = HEXTORAW('A4F9BF0579724468B818665F2FC03AA1');

UPDATE sprints
SET planned_task_count = 47
WHERE id = HEXTORAW('9E957AA9278043FDB4AAD86065F344F9');

UPDATE sprints
SET planned_task_count = 35
WHERE id = HEXTORAW('99087F6CA1DC4845989F419A1D58B6DA');


-- ===========================================================================
-- 7. RE-ENABLE the sprint count trigger
-- ===========================================================================
ALTER TRIGGER trg_task_sprint_count ENABLE;


-- ===========================================================================
-- 8. COMMIT
-- ===========================================================================
COMMIT;