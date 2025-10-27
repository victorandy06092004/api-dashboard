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
        u.id,
        u.nombre, 
        u.gmail, 
        u.estado, 
        u.id_rol,
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

// 🟡 Obtener un usuario por ID (para edición)
app.get('/api/usuarios/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const query = `
      SELECT 
        u.id,
        u.nombre,
        u.gmail,
        u.contrasena,
        u.estado,
        u.id_rol,
        r.nombre AS rol
      FROM usuarios u
      INNER JOIN rol r ON u.id_rol = r.id_rol
      WHERE u.id = $1;
    `;
    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error al obtener usuario:', error);
    res.status(500).json({ mensaje: 'Error al obtener usuario' });
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

// 🟢 Editar usuario (PUT)
app.put('/api/usuarios/:id', async (req, res) => {
  const { id } = req.params;
  const { nombre, gmail, contrasena, id_rol, estado } = req.body;

  if (!nombre || !gmail || !contrasena || !id_rol) {
    return res.status(400).json({ mensaje: "Todos los campos son obligatorios" });
  }

  try {
    // Verificar si el correo ya existe en otro usuario
    const existe = await pool.query(
      'SELECT * FROM usuarios WHERE gmail = $1 AND id != $2',
      [gmail, id]
    );
    if (existe.rows.length > 0) {
      return res.status(400).json({ mensaje: "El correo ya está registrado por otro usuario" });
    }

    // Actualizar el usuario
    const resultado = await pool.query(
      `UPDATE usuarios
       SET nombre = $1, gmail = $2, contrasena = $3, id_rol = $4, estado = $5
       WHERE id = $6
       RETURNING id, nombre, gmail, id_rol, estado`,
      [nombre, gmail, contrasena, id_rol, estado, id]
    );

    if (resultado.rowCount === 0) {
      return res.status(404).json({ mensaje: "Usuario no encontrado" });
    }

    res.json({
      mensaje: "Usuario actualizado correctamente",
      usuario: resultado.rows[0]
    });

  } catch (error) {
    console.error("Error al actualizar usuario:", error);
    res.status(500).json({ mensaje: "Error al actualizar usuario" });
  }
});

// 🟥 Eliminar usuario (DELETE)
app.delete('/api/usuarios/:id', async (req, res) => {
  const { id } = req.params;

  try {
    // Verificar si el usuario existe
    const existe = await pool.query('SELECT * FROM usuarios WHERE id = $1', [id]);
    if (existe.rows.length === 0) {
      return res.status(404).json({ mensaje: "Usuario no encontrado" });
    }

    // Eliminar usuario
    await pool.query('DELETE FROM usuarios WHERE id = $1', [id]);

    res.json({ mensaje: "Usuario eliminado correctamente" });
  } catch (error) {
    console.error("Error al eliminar usuario:", error);
    res.status(500).json({ mensaje: "Error al eliminar usuario" });
  }
});

// 🟢 Listar roles
app.get('/api/roles', async (req, res) => {
  try {
    const result = await pool.query('SELECT id_rol, nombre FROM rol ORDER BY id_rol ASC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener roles:', error);
    res.status(500).json({ mensaje: 'Error al obtener los roles' });
  }
});

// Iniciar servidor
const PORT = 3000;
app.use(express.static('public'));
// 🔽 esta línea siempre debe ser la última
app.listen(PORT, () => {
  console.log(`🚀 Servidor ejecutándose en http://localhost:${PORT}`);
});
