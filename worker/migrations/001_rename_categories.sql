-- Migración de categorías: valores viejos (inglés) → nuevos (español)
-- Ejecutar en Supabase SQL Editor

UPDATE items SET category = 'Tarea' WHERE category = 'TASK';
UPDATE items SET category = 'Idea' WHERE category = 'IDEA';
UPDATE items SET category = 'Reunion' WHERE category = 'MEETING';
UPDATE items SET category = 'Nota' WHERE category = 'UNCATEGORIZED';

-- Verificar resultado
SELECT category, COUNT(*) FROM items GROUP BY category ORDER BY category;
