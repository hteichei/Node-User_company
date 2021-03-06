drop database if exists "usercompany_db";
create database "usercompany_db";
\c "usercompany_db";

CREATE TABLE companies (id SERIAL PRIMARY KEY, 
handle TEXT UNIQUE, 
password TEXT NOT NULL, 
name TEXT, logo TEXT );

CREATE TABLE jobs (id SERIAL PRIMARY KEY, 
title TEXT, salary TEXT, 
equity FLOAT, 
company_handle TEXT NOT NULL REFERENCES companies(handle) ON DELETE CASCADE
);

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  photo TEXT,
  current_company TEXT REFERENCES companies (handle) ON DELETE SET NULL
);

CREATE TABLE jobs_users (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL REFERENCES users (username) ON DELETE CASCADE,
  job_id INTEGER NOT NULL REFERENCES jobs (id) ON DELETE CASCADE
);

-- psql < schema.sql