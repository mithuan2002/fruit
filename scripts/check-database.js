
#!/usr/bin/env node

const postgres = require('postgres');

// Database health check for monitoring
async function checkDatabaseHealth() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL not found');
    process.exit(1);
  }

  try {
    const sql = postgres(databaseUrl, {
      ssl: process.env.NODE_ENV === 'production' ? 'require' : false,
      max: 1,
      connect_timeout: 10,
    });

    // Test basic connectivity
    await sql`SELECT 1 as test`;
    
    // Check critical tables
    const userCount = await sql`SELECT COUNT(*) as count FROM users`;
    const customerCount = await sql`SELECT COUNT(*) as count FROM customers`;
    const campaignCount = await sql`SELECT COUNT(*) as count FROM campaigns`;
    
    console.log('Database Status: ✅ HEALTHY');
    console.log(`Users: ${userCount[0].count}`);
    console.log(`Customers: ${customerCount[0].count}`);
    console.log(`Campaigns: ${campaignCount[0].count}`);
    
    await sql.end();
    process.exit(0);
    
  } catch (error) {
    console.error('Database Status: ❌ UNHEALTHY');
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkDatabaseHealth();
