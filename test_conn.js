const { Client } = require('pg');

async function test() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'ganesha1234',
    database: 'renewserv'
  });
  
  try {
    await client.connect();
    console.log("Connected successfully to database 'renewserv' with password 'ganesha1234'!");
    await client.end();
  } catch (err) {
    console.error("Connection failed:", err);
  }
}

test();
