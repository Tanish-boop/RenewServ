const { Client } = require('pg');

const passwords = [
  'postgres', 'admin', 'root', 'password', 'tanish', 'tanish@1234', 'ganesha1234', 'ganesha',
  'tanish1234', 'postgres1234', 'root1234', 'admin1234', 'tanishthakare', 'tanish714', '123456',
  '1234', 'root@123', 'postgres@123', 'admin@123', 'tanishthakare714', 'ihmtxdvxywqoapjv',
  'supersecretkey123456789', 'ganesha@1234', 'ganesha123', 'tanish@123', 'postgres@1234', 'admin@1234'
];

async function testPassword(password) {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: password,
    database: 'postgres'
  });
  
  try {
    await client.connect();
    await client.end();
    return true;
  } catch (err) {
    return false;
  }
}

async function run() {
  console.log("Starting database password probe...");
  for (const password of passwords) {
    const success = await testPassword(password);
    if (success) {
      console.log(`\n>>> SUCCESS! Correct password found: "${password}" <<<\n`);
      process.exit(0);
    }
  }
  console.log("Probe complete. No matching password found.");
  process.exit(1);
}

run();
