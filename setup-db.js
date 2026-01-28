#!/usr/bin/env node

const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'gamevault'
};

function executeSQL(file) {
  return new Promise((resolve, reject) => {
    const filePath = path.join(__dirname, file);
    const env = Object.assign({}, process.env);
    env.PGPASSWORD = dbConfig.password;
    
    // Read SQL file
    const sql = fs.readFileSync(filePath, 'utf8');
    
    // Execute SQL
    const cmd = `psql -h ${dbConfig.host} -p ${dbConfig.port} -U ${dbConfig.user} -d ${dbConfig.database} -f "${filePath}"`;
    
    exec(cmd, { env }, (error, stdout, stderr) => {
      if (error && !stderr.includes('already exists')) {
        console.error(`❌ Error executing ${file}:`, error.message);
        reject(error);
      } else {
        console.log(`✅ ${file} executed successfully`);
        resolve(stdout);
      }
    });
  });
}

async function setupDatabase() {
  try {
    console.log('🎮 GameVault Database Setup');
    console.log('=============================\n');
    
    // Check if database exists, if not create it
    const createDbCmd = `psql -h ${dbConfig.host} -p ${dbConfig.port} -U ${dbConfig.user} -c "CREATE DATABASE ${dbConfig.database};"`;
    const env = Object.assign({}, process.env);
    env.PGPASSWORD = dbConfig.password;
    
    console.log('📦 Creating database (if not exists)...');
    await new Promise((resolve) => {
      exec(createDbCmd, { env }, (error, stdout, stderr) => {
        if (error && !stderr.includes('already exists')) {
          console.log('Database creation note:', stderr.substring(0, 100));
        }
        resolve();
      });
    });
    
    // Execute schema
    console.log('📋 Executing schema.sql...');
    await executeSQL('database/schema.sql');
    
    // Execute seed
    console.log('🌱 Executing seed.sql...');
    await executeSQL('database/seed.sql');
    
    console.log('\n✅ Database setup completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    process.exit(1);
  }
}

setupDatabase();
