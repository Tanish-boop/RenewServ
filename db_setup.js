const { Client } = require('pg');
const { execSync } = require('child_process');

async function setup() {
  console.log("Setting up PostgreSQL database...");
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'ganesha1234',
    database: 'postgres'
  });

  try {
    await client.connect();
    
    // Check if renewserv database exists
    const res = await client.query("SELECT 1 FROM pg_database WHERE datname='renewserv'");
    if (res.rowCount === 0) {
      console.log("Creating database 'renewserv'...");
      await client.query("CREATE DATABASE renewserv");
      console.log("Database 'renewserv' created successfully!");
    } else {
      console.log("Database 'renewserv' already exists.");
    }
    await client.end();

    console.log("Running Prisma schema migrations to sync the tables...");
    execSync('npx prisma db push --skip-generate', { stdio: 'inherit' });
    console.log("Database setup successfully completed!");
  } catch (err) {
    console.error("Database setup failed:", err);
  }
}

setup();
