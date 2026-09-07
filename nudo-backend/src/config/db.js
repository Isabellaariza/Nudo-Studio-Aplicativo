import pg from 'pg';
import dotenv from 'dotenv';

// Cargar las variables de entorno del archivo .env
dotenv.config();

const { Pool } = pg;

// Crear un pool de conexiones usando la URL de Neon
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Probar la conexión ejecutando una consulta de prueba real al arrancar
pool.connect(async (err, client, release) => {
  if (err) {
    return console.error('❌ Error al conectar a la base de datos de Neon:', err.stack);
  }
  
  try {
    // Le hace una consulta rápida a Postgres para verificar que responda de verdad
    const res = await client.query('SELECT NOW()');
    console.log('✨ ¡Conexión exitosa a la base de datos de Neon! 🪢');
    console.log('⏰ Hora del servidor Postgres:', res.rows[0].now);

    // ── Migraciones automáticas ──────────────────────────────────────────
    await client.query(`ALTER TABLE clientes ADD COLUMN IF NOT EXISTS direccion TEXT`);
    console.log('✅ clientes.direccion verificada');

    await client.query(`ALTER TABLE estudiantes DROP COLUMN IF EXISTS fecha_nacimiento`);
    console.log('✅ estudiantes.fecha_nacimiento eliminada');

    await client.query(`ALTER TABLE matricula DROP COLUMN IF EXISTS nombre_taller`);
    console.log('✅ matricula.nombre_taller eliminada');

    await client.query(`ALTER TABLE talleres DROP COLUMN IF EXISTS cupos`);
    await client.query(`ALTER TABLE programacion_talleres DROP COLUMN IF EXISTS cupos`);
    console.log('✅ columna cupos eliminada de talleres y programacion_talleres (si existía)');

    // Eliminar tablas que no se usan en la aplicación
    await client.query(`DROP TABLE IF EXISTS roles_permisos CASCADE`);
    await client.query(`DROP TABLE IF EXISTS permisos CASCADE`);
    await client.query(`DROP TABLE IF EXISTS producto_insumos CASCADE`);
    await client.query(`DROP TABLE IF EXISTS detalles_produccion CASCADE`);
    await client.query(`DROP TABLE IF EXISTS detalle_talleres CASCADE`);
    console.log('✅ Tablas sin uso eliminadas (roles_permisos, permisos, producto_insumos, detalles_produccion, detalle_talleres)');

    // Eliminar columnas sin uso
    await client.query(`ALTER TABLE categoria_insumos DROP COLUMN IF EXISTS total_insumos`);
    await client.query(`ALTER TABLE categoria_productos DROP COLUMN IF EXISTS total_productos`);
    console.log('✅ Columnas sin uso eliminadas (total_insumos, total_productos)');
  } catch (queryErr) {
    console.error('❌ Error al ejecutar la consulta de prueba:', queryErr);
  } finally {
    // Siempre liberamos el cliente para que vuelva al pool
    release();
  }
});

// Cerrar el pool de conexiones limpiamente si el proceso termina (Ctrl + C)
process.on('SIGINT', async () => {
  await pool.end();
  console.log('🔌 Conexiones de la base de datos cerradas.');
  process.exit(0);
});

// Exportamos el pool para usarlo en tus rutas o controladores cuando hagas consultas
export default pool;