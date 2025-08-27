
#!/usr/bin/env node

const postgres = require('postgres');
const fs = require('fs');
const path = require('path');

// Database setup script for Fruitbox
async function setupDatabase() {
  console.log('🚀 Setting up Fruitbox database...');
  
  // Check for DATABASE_URL
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL environment variable is required');
    process.exit(1);
  }

  try {
    // Connect to database
    const sql = postgres(databaseUrl, {
      ssl: process.env.NODE_ENV === 'production' ? 'require' : false,
      max: 1,
    });

    console.log('📝 Running database migration...');
    
    // Read and execute migration file
    const migrationPath = path.join(__dirname, '../migrations/0001_initial_setup.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Split by statements and execute
    const statements = migrationSQL.split(';').filter(stmt => stmt.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        await sql.unsafe(statement);
      }
    }

    console.log('✅ Database migration completed successfully!');
    
    // Test connection
    const result = await sql`SELECT COUNT(*) as table_count 
                            FROM information_schema.tables 
                            WHERE table_schema = 'public'`;
    
    console.log(`📊 Created ${result[0].table_count} tables`);
    
    // Close connection
    await sql.end();
    
    console.log('🎉 Database setup complete! Ready to run the application.');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  setupDatabase();
}

module.exports = { setupDatabase };
