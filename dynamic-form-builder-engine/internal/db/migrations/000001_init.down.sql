DROP TABLE IF EXISTS form_submissions;
ALTER TABLE IF EXISTS forms DROP CONSTRAINT IF EXISTS forms_current_version_fk;
DROP TABLE IF EXISTS form_versions;
DROP TABLE IF EXISTS forms;
DROP TABLE IF EXISTS users;
DROP FUNCTION IF EXISTS set_updated_at();
DROP TYPE IF EXISTS submission_status;
DROP TYPE IF EXISTS user_role;