DROP TABLE IF EXISTS queue_tab;
DROP INDEX IF EXISTS arrival_timestamp_key;
DROP INDEX IF EXISTS departure_timestamp_key;
CREATE TABLE queue_tab (
    id SERIAL primary key,
    served BOOLEAN not null default false,
    arrival_timestamp INT not null,
    departure_timestamp INT not null
);
CREATE INDEX arrival_timestamp_key ON queue_tab (arrival_timestamp);
CREATE INDEX departure_timestamp_key ON queue_tab (departure_timestamp);

CREATE TABLE queue_lengths_tab (
    id SERIAL primary key,
    timestamp INT not null,
    length INT not null
);
CREATE INDEX timestamp_key ON queue_lengths_tab (timestamp);
CREATE INDEX length_key ON queue_lengths_tab (length);

DROP INDEX IF EXISTS timestamp_key;
DROP TABLE IF EXISTS error_tab;
CREATE TABLE error_tab (
    id SERIAL primary key,
    timestamp INT not null,
    status_code INT not null,
    payload TEXT not null
);

DROP TABLE IF EXISTS processing_time_tab;
CREATE TABLE processing_time_tab (
    id SERIAL primary key,
    duration INT not null,
    timestamp INT not null,
    request VARCHAR(10)
);

CREATE INDEX timestamp_key ON error_tab (timestamp);

