


DROP EXTENSION IF EXISTS "uuid-ossp" CASCADE;

DROP TABLE IF EXISTS "users" CASCADE;
DROP TABLE IF EXISTS "sessions" CASCADE;


CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS users
(
    id         uuid DEFAULT uuid_generate_v4(),
    username VARCHAR NOT NULL,
    password  VARCHAR NOT NULL,

    PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS sessions (
    id uuid DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL,
    token uuid DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

INSERT INTO users (username, password) VALUES ('admin', 'admin');
