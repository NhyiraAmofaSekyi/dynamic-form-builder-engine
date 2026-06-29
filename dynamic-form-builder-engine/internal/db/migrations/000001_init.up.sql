-- Dynamic Form Builder Engine — initial schema.
-- Requires PostgreSQL 18+ (native uuidv7()).


CREATE TYPE user_role AS ENUM ('admin', 'user');
CREATE TYPE submission_status AS ENUM ('draft', 'submitted');


CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;


CREATE TABLE users (
                       id            uuid PRIMARY KEY DEFAULT uuidv7(),
                       email         text NOT NULL,
                       password_hash text NOT NULL,
                       role          user_role NOT NULL DEFAULT 'user',
                       first_name    text,
                       last_name     text,
                       created_at    timestamptz NOT NULL DEFAULT now(),
                       updated_at    timestamptz NOT NULL DEFAULT now(),
                       CONSTRAINT users_email_unique UNIQUE (email)
);

CREATE TRIGGER users_set_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =====================
-- forms
-- =====================
CREATE TABLE forms (
                       id                 uuid PRIMARY KEY DEFAULT uuidv7(),
                       user_id            uuid NOT NULL REFERENCES users(id),
                       name               text NOT NULL,
                       slug               text NOT NULL,
                       description        text,
                       current_version_id uuid,
                       created_at         timestamptz NOT NULL DEFAULT now(),
                       updated_at         timestamptz NOT NULL DEFAULT now(),
                       deleted_at         timestamptz,
                       CONSTRAINT forms_user_slug_unique UNIQUE (user_id, slug)
);

CREATE INDEX forms_user_id_idx ON forms (user_id);

CREATE TRIGGER forms_set_updated_at
    BEFORE UPDATE ON forms
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();


CREATE TABLE form_versions (
                               id                  uuid PRIMARY KEY DEFAULT uuidv7(),
                               form_id             uuid NOT NULL REFERENCES forms(id),
                               previous_version_id uuid REFERENCES form_versions(id),
                               version_ref         text,
                               schema_hash         text NOT NULL,
                               schema_json         jsonb NOT NULL,
                               change_summary      text,
                               created_by          uuid REFERENCES users(id),
                               created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX form_versions_form_id_idx ON form_versions (form_id);

ALTER TABLE forms
    ADD CONSTRAINT forms_current_version_fk
        FOREIGN KEY (current_version_id) REFERENCES form_versions(id);


CREATE TABLE form_submissions (
                                  id              uuid PRIMARY KEY DEFAULT uuidv7(),
                                  form_id         uuid NOT NULL REFERENCES forms(id),
                                  form_version_id uuid NOT NULL REFERENCES form_versions(id),
                                  submission_data jsonb NOT NULL,
                                  status          submission_status NOT NULL DEFAULT 'submitted',
                                  submitted_by    uuid REFERENCES users(id),  -- nullable: NULL = anonymous submission
                                  submitted_at    timestamptz,
                                  created_at      timestamptz NOT NULL DEFAULT now(),
                                  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX form_submissions_form_id_idx         ON form_submissions (form_id);
CREATE INDEX form_submissions_form_version_id_idx ON form_submissions (form_version_id);
CREATE INDEX form_submissions_form_version_idx    ON form_submissions (form_id, form_version_id);

CREATE TRIGGER form_submissions_set_updated_at
    BEFORE UPDATE ON form_submissions
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();