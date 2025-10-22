const express = require('express');
const cors = require('cors');
const pool = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

// Ruta para listar los usuarios con su rol
app.get('/api/usuarios', async (req, res) => {
  try {
    const query = `
      SELECT 
        u.nombre, 
        u.gmail, 
        u.estado, 
        r.nombre AS rol
      FROM usuarios u
      INNER JOIN rol r ON u.id_rol = r.id_rol
      ORDER BY u.id;
    `;

    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error('Error en la consulta:', err);
    res.status(500).json({ error: 'Error al obtener los usuarios' });
  }
});

// Agregar nuevo usuario
app.post('/api/usuarios', async (req, res) => {
  const { nombre, gmail, contrasena, estado = true, id_rol } = req.body;

  try {
    // Verificar si el correo ya existe
    const existe = await pool.query('SELECT * FROM usuarios WHERE gmail = $1', [gmail]);
    if (existe.rows.length > 0) {
      return res.status(400).json({ mensaje: 'El correo ya está registrado.' });
    }

    // Insertar usuario y devolver el id generado
    const resultado = await pool.query(
      `INSERT INTO usuarios (nombre, gmail, contrasena, estado, id_rol)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, nombre, gmail, estado, id_rol`,
      [nombre, gmail, contrasena, estado, id_rol]
    );

    res.status(201).json({
      mensaje: 'Usuario agregado correctamente',
      usuario: resultado.rows[0]
    });

  } catch (error) {
    console.error('Error al agregar usuario:', error);
    res.status(500).json({ mensaje: 'Error al agregar usuario' });
  }
});

// Iniciar servidor
const PORT = 3000;
app.use(express.static('public'));
// 🔽 esta línea siempre debe ser la última
app.listen(PORT, () => {
  console.log(`🚀 Servidor ejecutándose en http://localhost:${PORT}`);
});
