/**
 * Simple migration runner
 * Executes SQL files in order
 */
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const config = {
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
  database: process.env.POSTGRES_DB || 'retail_brain',
  user: process.env.POSTGRES_USER || 'retail_brain_user',
  password: process.env.POSTGRES_PASSWORD || 'retail_brain_pass',
};

async function runMigrations() {
  const client = new Client(config);
  
  try {
    await client.connect();
    console.log('✓ Connected to database');
    
    const migrationsDir = __dirname;
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql') && f !== 'init.sql')
      .sort();
    
    console.log(`\nRunning ${files.length} migrations...\n`);
    
    for (const file of files) {
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');
      
      console.log(`→ Running ${file}...`);
      await client.query(sql);
      console.log(`  ✓ ${file} completed`);
    }
    
    console.log('\n✓ All migrations completed successfully\n');
  } catch (error) {
    console.error('✗ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigrations();

