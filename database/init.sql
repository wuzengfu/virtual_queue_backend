DROP TABLE IF EXISTS queue_tab;
DROP INDEX IF EXISTS arrival_timestamp_key;
CREATE TABLE queue_tab (
    id SERIAL primary key,
    served BOOLEAN not null default false,
    arrival_timestamp INT not null
);
CREATE INDEX arrival_timestamp_key ON queue_tab (arrival_timestamp);

DROP INDEX IF EXISTS timestamp_key;
DROP TABLE IF EXISTS error_tab;
CREATE TABLE error_tab (
    id SERIAL primary key,
    timestamp INT not null,
    status_code INT not null,
    payload TEXT not null
);
CREATE INDEX timestamp_key ON error_tab (timestamp);

