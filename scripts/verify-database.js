
#!/usr/bin/env node

const postgres = require('postgres');

// Database verification script
async function verifyDatabase() {
  console.log('🔍 Verifying database setup...');
  
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL environment variable is required');
    return false;
  }

  try {
    const sql = postgres(databaseUrl, {
      ssl: process.env.NODE_ENV === 'production' ? 'require' : false,
      max: 1,
    });

    // Check all required tables exist
    const requiredTables = [
      'users', 'customers', 'campaigns', 'products', 'coupons', 
      'referrals', 'whatsapp_messages', 'point_tiers', 'sales', 
      'sale_items', 'points_transactions', 'rewards', 
      'reward_redemptions', 'system_config', 'sessions'
    ];

    const tablesResult = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    
    const existingTables = tablesResult.map(row => row.table_name);
    const missingTables = requiredTables.filter(table => !existingTables.includes(table));
    
    if (missingTables.length > 0) {
      console.error(`❌ Missing tables: ${missingTables.join(', ')}`);
      await sql.end();
      return false;
    }

    // Check foreign key constraints
    const constraintsResult = await sql`
      SELECT COUNT(*) as constraint_count
      FROM information_schema.table_constraints 
      WHERE table_schema = 'public' 
      AND constraint_type = 'FOREIGN KEY'
    `;

    // Check indexes
    const indexesResult = await sql`
      SELECT COUNT(*) as index_count
      FROM pg_indexes 
      WHERE schemaname = 'public'
    `;

    // Check system config
    const configResult = await sql`
      SELECT COUNT(*) as config_count
      FROM system_config
    `;

    console.log('✅ Database verification passed!');
    console.log(`📊 Tables: ${existingTables.length}`);
    console.log(`🔗 Foreign keys: ${constraintsResult[0].constraint_count}`);
    console.log(`📇 Indexes: ${indexesResult[0].index_count}`);
    console.log(`⚙️  System configs: ${configResult[0].config_count}`);

    await sql.end();
    return true;

  } catch (error) {
    console.error('❌ Database verification failed:', error.message);
    return false;
  }
}

// Run if called directly
if (require.main === module) {
  verifyDatabase().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = { verifyDatabase };
