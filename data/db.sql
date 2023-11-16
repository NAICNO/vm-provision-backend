-- Enable pgcrypto extension for UUID generation
CREATE
EXTENSION IF NOT EXISTS pgcrypto;

-- users table with user_type
CREATE TABLE users
(
    user_id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email      TEXT NOT NULL UNIQUE,
    username   TEXT NOT NULL UNIQUE,
    password   TEXT NOT NULL,
    first_name TEXT NOT NULL,
    last_name  TEXT NOT NULL,
    user_type  TEXT NOT NULL    DEFAULT 'User',
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- vm_templates table
CREATE TABLE vm_templates
(
    template_id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_name TEXT NOT NULL UNIQUE,
    cpu           INT  NOT NULL,
    ram           INT  NOT NULL,
    storage       INT  NOT NULL,
    os            TEXT NOT NULL,
    description   TEXT,
    created_at    TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- virtual_machines table with template_id reference
CREATE TABLE virtual_machines
(
    vm_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID REFERENCES users (user_id) ON DELETE CASCADE,
    template_id UUID REFERENCES vm_templates (template_id) ON DELETE SET NULL,
    vm_name     TEXT NOT NULL,
    created_at  TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- vm_events table
CREATE TABLE vm_events
(
    event_id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vm_id       UUID REFERENCES virtual_machines (vm_id) ON DELETE CASCADE,
    event_type  TEXT NOT NULL,
    description TEXT,
    timestamp   TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- user_activity table
CREATE TABLE user_activity
(
    activity_id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       UUID REFERENCES users (user_id) ON DELETE CASCADE,
    vm_id         UUID REFERENCES virtual_machines (vm_id) ON DELETE SET NULL,
    activity_type TEXT NOT NULL,
    description   TEXT,
    timestamp     TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
