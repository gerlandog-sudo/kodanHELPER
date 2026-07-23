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

    // Step 1: Migrate data FIRST (before constraint)
    console.log('Step 1: Migrating categories...');
    const mappings = [
      { old: 'TASK', new: 'Tarea' },
      { old: 'IDEA', new: 'Idea' },
      { old: 'MEETING', new: 'Reunion' },
      { old: 'UNCATEGORIZED', new: 'Nota' }
    ];

    for (const { old, new: newCat } of mappings) {
      const result = await client.query(
        'UPDATE items SET category = $1 WHERE category = $2',
        [newCat, old]
      );
      console.log(`✓ Migrated ${old} -> ${newCat}: ${result.rowCount} items`);
    }

    // Step 2: Update constraint AFTER migration
    console.log('\nStep 2: Updating check constraint...');
    await client.query('ALTER TABLE items DROP CONSTRAINT IF EXISTS items_category_check;');
    await client.query(`
      ALTER TABLE items ADD CONSTRAINT items_category_check 
      CHECK (category IN ('Tarea', 'Idea', 'Reunion', 'Recordatorio', 'Nota', 'Investigar', 'Llamar'));
    `);
    console.log('✓ Constraint updated\n');

    // Step 3: Verify
    console.log('Step 3: Verifying...');
    const verifyResult = await client.query(
      'SELECT category, COUNT(*) as count FROM items GROUP BY category ORDER BY category'
    );
    console.log('\nFinal distribution:');
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
