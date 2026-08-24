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