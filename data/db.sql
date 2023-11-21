-- Enable pgcrypto extension for UUID generation
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- user_profile table with user_type
CREATE TABLE user_profile
(
    user_id    UUID PRIMARY KEY            DEFAULT gen_random_uuid(),
    email      TEXT NOT NULL UNIQUE,
    username   TEXT NOT NULL UNIQUE,
    password   TEXT NOT NULL,
    first_name TEXT NOT NULL,
    last_name  TEXT NOT NULL,
    user_type  TEXT NOT NULL               DEFAULT 'User',
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- vm_template table
CREATE TABLE vm_template
(
    template_id   UUID PRIMARY KEY            DEFAULT gen_random_uuid(),
    template_name TEXT NOT NULL UNIQUE,
    cpu           INT  NOT NULL,
    ram           INT  NOT NULL,
    storage       INT  NOT NULL,
    os            TEXT NOT NULL,
    description   TEXT,
    created_at    TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- virtual_machine table with template_id reference
CREATE TABLE virtual_machine
(
    vm_id        UUID PRIMARY KEY            DEFAULT gen_random_uuid(),
    user_id      UUID REFERENCES user_profile (user_id) ON DELETE CASCADE,
    template_id  UUID REFERENCES vm_template (template_id) ON DELETE SET NULL,
    vm_name      TEXT NOT NULL,
    ipv4_address TEXT,
    ipv6_address TEXT,
    status       TEXT,
    created_at   TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- vm_event table
CREATE TABLE vm_event
(
    event_id    UUID PRIMARY KEY            DEFAULT gen_random_uuid(),
    vm_id       UUID REFERENCES virtual_machine (vm_id) ON DELETE CASCADE,
    event_type  TEXT NOT NULL,
    description TEXT,
    timestamp   TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- user_activity table
CREATE TABLE user_activity
(
    activity_id   UUID PRIMARY KEY            DEFAULT gen_random_uuid(),
    user_id       TEXT,
    vm_id         TEXT,
    activity_type TEXT NOT NULL,
    description   TEXT,
    timestamp     TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
