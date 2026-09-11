import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.connect(async (err, client, release) => {
  if (err) {
    return console.error('❌ Error al conectar a la base de datos:', err.stack);
  }

  try {
    const res = await client.query('SELECT NOW()');
    console.log('✨ Conexión a PostgreSQL verificada');
    console.log('⏰ Hora del servidor Postgres:', res.rows[0].now);
  } catch (queryErr) {
    console.error('❌ Error al ejecutar la consulta de prueba:', queryErr);
  } finally {
    release();
  }
});

process.on('SIGINT', async () => {
  await pool.end();
  console.log('🔌 Conexiones de la base de datos cerradas.');
  process.exit(0);
});

export default pool;
