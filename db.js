const { Pool } = require('pg');

const pool = new Pool({
  user: 'victor',
  host: 'localhost',
  database: 'Prueba',
  password: 'after dark', // tiene espacio, y está bien ponerlo entre comillas
  port: 5432,
});

pool.connect()
  .then(() => console.log('✅ Conectado a PostgreSQL'))
  .catch(err => console.error('❌ Error de conexión:', err));

module.exports = pool;
