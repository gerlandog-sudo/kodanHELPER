import pg from 'pg';

const { Client } = pg;

const client = new Client({
  host: 'db.pozzbfpwxpgeflldfnmb.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'Alejandra_06130773',
  ssl: { rejectUnauthorized: false },
});

const SCHEMA_SQL = `
-- Extensiones
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- RAW INPUTS: Capturas brutas (inmutable, solo inserts)
-- ============================================================
CREATE TABLE IF NOT EXISTS raw_inputs (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES auth.users(id),
  type          VARCHAR(10) NOT NULL CHECK (type IN ('audio', 'text')),
  content_url   TEXT,
  content_text  TEXT,
  status        VARCHAR(20) NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'processing', 'processed', 'failed')),
  error_message TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ITEMS: Entidades procesadas por IA
-- ============================================================
CREATE TABLE IF NOT EXISTS items (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  raw_input_id  UUID REFERENCES raw_inputs(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES auth.users(id),
  category      VARCHAR(20) NOT NULL
                CHECK (category IN ('TASK', 'IDEA', 'MEETING', 'UNCATEGORIZED')),
  title         VARCHAR(255) NOT NULL,
  summary       TEXT,
  metadata      JSONB DEFAULT '{}'::jsonb,
  status        VARCHAR(20) NOT NULL DEFAULT 'inbox'
                CHECK (status IN ('inbox', 'actioned', 'archived')),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ÍNDICES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_raw_inputs_user_id ON raw_inputs(user_id);
CREATE INDEX IF NOT EXISTS idx_raw_inputs_status ON raw_inputs(status);
CREATE INDEX IF NOT EXISTS idx_items_user_id ON items(user_id);
CREATE INDEX IF NOT EXISTS idx_items_category ON items(category);
CREATE INDEX IF NOT EXISTS idx_items_status ON items(status);
CREATE INDEX IF NOT EXISTS idx_items_created_at ON items(created_at DESC);

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE raw_inputs ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;

-- Políticas (usar IF NOT EXISTS via DO block para evitar errores si ya existen)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'users_see_own_raw_inputs'
  ) THEN
    CREATE POLICY "users_see_own_raw_inputs" ON raw_inputs
      FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'users_see_own_items'
  ) THEN
    CREATE POLICY "users_see_own_items" ON items
      FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

-- ============================================================
-- REALTIME
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE items;
ALTER PUBLICATION supabase_realtime ADD TABLE raw_inputs;

-- ============================================================
-- STORAGE RLS (para bucket audio-uploads)
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'users_upload_own_audio'
  ) THEN
    CREATE POLICY "users_upload_own_audio"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
      bucket_id = 'audio-uploads' AND
      auth.uid()::text = (storage.foldername(name))[1]
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'users_read_own_audio'
  ) THEN
    CREATE POLICY "users_read_own_audio"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (
      bucket_id = 'audio-uploads' AND
      auth.uid()::text = (storage.foldername(name))[1]
    );
  END IF;
END $$;
`;

try {
  console.log('Conectando a Supabase PostgreSQL...');
  await client.connect();
  console.log('✅ Conexión exitosa!\n');

  console.log('Ejecutando schema SQL...');
  await client.query(SCHEMA_SQL);
  console.log('✅ Schema ejecutado correctamente!\n');

  // Verificar tablas
  console.log('Verificando tablas creadas:');
  const tables = await client.query(`
    SELECT table_name FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    ORDER BY table_name;
  `);
  tables.rows.forEach(row => console.log(`  - ${row.table_name}`));

  // Verificar índices
  console.log('\nVerificando índices:');
  const indexes = await client.query(`
    SELECT indexname FROM pg_indexes 
    WHERE schemaname = 'public' AND tablename IN ('raw_inputs', 'items')
    ORDER BY indexname;
  `);
  indexes.rows.forEach(row => console.log(`  - ${row.indexname}`));

  // Verificar RLS
  console.log('\nVerificando RLS habilitado:');
  const rls = await client.query(`
    SELECT tablename, rowsecurity 
    FROM pg_tables 
    WHERE schemaname = 'public' AND tablename IN ('raw_inputs', 'items');
  `);
  rls.rows.forEach(row => console.log(`  - ${row.tablename}: RLS = ${row.rowsecurity}`));

  // Verificar políticas
  console.log('\nVerificando políticas RLS:');
  const policies = await client.query(`
    SELECT tablename, policyname FROM pg_policies 
    WHERE schemaname = 'public' ORDER BY tablename, policyname;
  `);
  policies.rows.forEach(row => console.log(`  - ${row.tablename}: ${row.policyname}`));

  // Verificar Realtime
  console.log('\nVerificando Realtime publication:');
  const realtime = await client.query(`
    SELECT tablename FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
  `);
  realtime.rows.forEach(row => console.log(`  - ${row.tablename}`));

  console.log('\n✅ Todo verificado correctamente!');

} catch (err) {
  console.error('❌ Error:', err.message);
  if (err.detail) console.error('   Detalle:', err.detail);
} finally {
  await client.end();
}