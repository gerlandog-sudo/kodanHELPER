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

await client.connect();

// Check current constraint
const result = await client.query(`
  SELECT conname, pg_get_constraintdef(oid) as definition 
  FROM pg_constraint 
  WHERE conname = 'items_category_check'
`);

console.log('Current constraint:');
console.log(result.rows);

// Check what categories exist in the table
const categories = await client.query('SELECT DISTINCT category FROM items ORDER BY category');
console.log('\nCategories in table:');
console.log(categories.rows);

await client.end();
