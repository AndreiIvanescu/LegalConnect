import 'dotenv/config';
import pkg from 'pg';
const { Pool } = pkg;
import fs from 'fs';
import path from 'path';

// Connect to the database
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function createEnums() {
  console.log('Creating enums...');
  
  // Create enums for user roles, provider types, and job status
  await pool.query(`
    DO $$ 
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('client', 'provider');
      END IF;
      
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'provider_type') THEN
        CREATE TYPE provider_type AS ENUM ('notary', 'judicial_executor', 'lawyer', 'judge');
      END IF;
      
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'job_status') THEN
        CREATE TYPE job_status AS ENUM ('open', 'assigned', 'completed', 'cancelled');
      END IF;
    END $$;
  `);
  
  console.log('Enums created successfully');
}

async function createTables() {
  console.log('Creating tables...');
  
  // Create users table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      phone TEXT,
      role user_role NOT NULL DEFAULT 'client',
      avatar TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      city TEXT,
      country TEXT
    );
  `);
  
  // Create provider_profiles table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS provider_profiles (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      provider_type provider_type NOT NULL,
      education TEXT,
      graduation_year INTEGER,
      years_of_experience INTEGER,
      description TEXT,
      languages TEXT[],
      location TEXT,
      address TEXT,
      latitude REAL,
      longitude REAL,
      service_radius INTEGER,
      working_hours JSONB,
      is_24_7 BOOLEAN DEFAULT FALSE,
      is_top_rated BOOLEAN DEFAULT FALSE,
      completed_services INTEGER DEFAULT 0,
      image_url TEXT
    );
  `);
  
  // Create specializations table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS specializations (
      id SERIAL PRIMARY KEY,
      provider_id INTEGER NOT NULL REFERENCES provider_profiles(id),
      name TEXT NOT NULL
    );
  `);
  
  // Create services table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS services (
      id SERIAL PRIMARY KEY,
      provider_id INTEGER NOT NULL REFERENCES provider_profiles(id),
      title TEXT NOT NULL,
      description TEXT,
      price_type TEXT NOT NULL,
      price INTEGER,
      percentage_rate INTEGER,
      min_price INTEGER
    );
  `);
  
  // Create bookings table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS bookings (
      id SERIAL PRIMARY KEY,
      client_id INTEGER NOT NULL REFERENCES users(id),
      provider_id INTEGER NOT NULL REFERENCES provider_profiles(id),
      service_id INTEGER REFERENCES services(id),
      start_time TIMESTAMP NOT NULL,
      end_time TIMESTAMP,
      status TEXT NOT NULL DEFAULT 'pending',
      total_amount INTEGER,
      platform_fee INTEGER,
      notes TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);
  
  // Create reviews table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS reviews (
      id SERIAL PRIMARY KEY,
      booking_id INTEGER NOT NULL REFERENCES bookings(id),
      reviewer_id INTEGER NOT NULL REFERENCES users(id),
      reviewee_id INTEGER NOT NULL REFERENCES users(id),
      rating INTEGER NOT NULL,
      comment TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);
  
  // Create job_postings table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS job_postings (
      id SERIAL PRIMARY KEY,
      client_id INTEGER NOT NULL REFERENCES users(id),
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      provider_type provider_type NOT NULL,
      price_type TEXT NOT NULL,
      budget INTEGER,
      hourly_rate INTEGER,
      location TEXT,
      latitude REAL,
      longitude REAL,
      urgency TEXT,
      deadline TIMESTAMP,
      status job_status NOT NULL DEFAULT 'open',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `);
  
  // Create job_applications table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS job_applications (
      id SERIAL PRIMARY KEY,
      job_id INTEGER NOT NULL REFERENCES job_postings(id),
      provider_id INTEGER NOT NULL REFERENCES provider_profiles(id),
      cover_letter TEXT,
      proposed_price INTEGER,
      proposed_deadline TIMESTAMP,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);
  
  // Create messages table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS messages (
      id SERIAL PRIMARY KEY,
      sender_id INTEGER NOT NULL REFERENCES users(id),
      receiver_id INTEGER NOT NULL REFERENCES users(id),
      content TEXT NOT NULL,
      read BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);
  
  console.log('Tables created successfully');
}

async function main() {
  try {
    await createEnums();
    await createTables();
    console.log('Database setup completed successfully');
  } catch (error) {
    console.error('Error setting up database:', error);
  } finally {
    await pool.end();
  }
}

main();