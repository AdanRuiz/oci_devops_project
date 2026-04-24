-- =============================================================================
-- Erase all data from the database (child tables first to respect FK constraints)
-- =============================================================================

DELETE FROM task_assignment_histories;
DELETE FROM task_state_histories;
DELETE FROM task_work_logs;
DELETE FROM sprint_kpi_snapshots;
DELETE FROM bot_conversations;
DELETE FROM telegram_link_codes;
DELETE FROM tasks;
DELETE FROM invitations;
DELETE FROM project_members;
DELETE FROM sprints;
DELETE FROM projects;
DELETE FROM users;

COMMIT;
