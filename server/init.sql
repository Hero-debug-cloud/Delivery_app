-- Enable PostGIS spatial database extensions
CREATE EXTENSION IF NOT EXISTS postgis;

-- Enable TimescaleDB time-series database extensions
CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;
