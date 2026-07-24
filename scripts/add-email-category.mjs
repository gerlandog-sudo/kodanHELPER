import pg from 'pg';

const { Client } = pg;

const client = new Client({
  host: 'db.pozzbfpwxpgeflldfnmb.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'Alejandra_06130773',
  ssl: { rejectUnauthorized: false }
});

async function migrate() {
  try {
    await client.connect();
    console.log('Connected to Supabase PostgreSQL\n');

    // Step 1: Update check constraint to include 'Email'
    console.log('Step 1: Updating check constraint...');
    await client.query('ALTER TABLE items DROP CONSTRAINT IF EXISTS items_category_check;');
    await client.query(`
      ALTER TABLE items ADD CONSTRAINT items_category_check 
      CHECK (category IN ('Tarea', 'Idea', 'Reunion', 'Recordatorio', 'Nota', 'Investigar', 'Llamar', 'Email'));
    `);
    console.log('✓ Constraint updated to include Email\n');

    // Step 2: Verify
    console.log('Step 2: Verifying...');
    const verifyResult = await client.query(
      'SELECT category, COUNT(*) as count FROM items GROUP BY category ORDER BY category'
    );
    console.log('\nCurrent distribution:');
    verifyResult.rows.forEach(row => {
      console.log(`  ${row.category}: ${row.count}`);
    });

    console.log('\n✓ Migration completed successfully!');
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.end();
  }
}

migrate();
