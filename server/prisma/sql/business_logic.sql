-- Additional DB constraints not represented in Prisma schema
ALTER TABLE projects
  ADD CONSTRAINT IF NOT EXISTS chk_projects_dates
  CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date);

ALTER TABLE sprints
  ADD CONSTRAINT IF NOT EXISTS chk_sprints_dates
  CHECK (end_date >= start_date);

ALTER TABLE tasks
  ADD CONSTRAINT IF NOT EXISTS chk_tasks_story_point
  CHECK (story_point IS NULL OR story_point >= 0);

-- Sprint calendar index
CREATE INDEX IF NOT EXISTS idx_sprints_project_dates
  ON sprints (project_id, start_date, end_date);

-- Procedure: close sprint
CREATE OR REPLACE PROCEDURE sp_close_sprint(p_sprint_id BIGINT)
LANGUAGE plpgsql
AS $$
DECLARE
  v_status VARCHAR(20);
BEGIN
  SELECT status INTO v_status
  FROM sprints
  WHERE id = p_sprint_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Sprint % does not exist', p_sprint_id;
  END IF;

  IF v_status <> 'active' THEN
    RAISE EXCEPTION 'Sprint % is not active (current status: %)', p_sprint_id, v_status;
  END IF;

  UPDATE sprints
  SET status = 'closed'
  WHERE id = p_sprint_id;

  UPDATE tasks
  SET sprint_id = NULL
  WHERE sprint_id = p_sprint_id
    AND status <> 'done';
END;
$$;

-- Procedure: create release from sprint
CREATE OR REPLACE PROCEDURE sp_create_release_from_sprint(
  p_sprint_id BIGINT,
  p_version VARCHAR
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_project_id BIGINT;
  v_sprint_status VARCHAR(20);
BEGIN
  SELECT project_id, status
  INTO v_project_id, v_sprint_status
  FROM sprints
  WHERE id = p_sprint_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Sprint % does not exist', p_sprint_id;
  END IF;

  IF v_sprint_status <> 'closed' THEN
    RAISE EXCEPTION 'Sprint % must be closed before release creation', p_sprint_id;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM releases r
    WHERE r.project_id = v_project_id
      AND r.version = p_version
  ) THEN
    RAISE EXCEPTION 'Release version % already exists for project %', p_version, v_project_id;
  END IF;

  INSERT INTO releases(project_id, sprint_id, version, release_date, notes)
  VALUES(v_project_id, p_sprint_id, p_version, CURRENT_DATE, format('Auto-created from sprint %s', p_sprint_id));
END;
$$;

-- Trigger function for task history
CREATE OR REPLACE FUNCTION fn_log_task_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_actor BIGINT;
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    v_actor := NULLIF(current_setting('app.user_id', true), '')::BIGINT;
    IF v_actor IS NULL THEN
      v_actor := COALESCE(NEW.assignee_id, NEW.reporter_id);
    END IF;

    INSERT INTO task_history(task_id, changed_by, old_status, new_status, changed_at)
    VALUES(NEW.id, v_actor, OLD.status, NEW.status, now());
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_task_status_history ON tasks;

CREATE TRIGGER trg_task_status_history
AFTER UPDATE OF status ON tasks
FOR EACH ROW
EXECUTE FUNCTION fn_log_task_status_change();
