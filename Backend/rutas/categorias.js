const express = require('express');
const bd = require('../db/conexion');

const rutas = express.Router();

rutas.post('/', async function (peticion, respuesta) {
  try {
    const datos = peticion.body;

    const resultado = await bd.ejecutar(
      'EXECUTE PROCEDURE SP_INSERTAR_CATEGORIA(?, ?, ?, ?, ?, ?, ?, ?)',
      [
        datos.id_usuario,
        datos.nombre,
        datos.descripcion,
        datos.tipo,
        datos.icono,
        datos.color,
        datos.orden,
        datos.creado_por
      ]
    );

    respuesta.status(201).json({ id: resultado.NUEVO_ID });
  } catch (error) {
    respuesta.status(500).json({ mensaje: error.message });
  }
});

rutas.get('/', async function (peticion, respuesta) {
  try {
    const idUsuario = peticion.query.usuario;
    const tipo = peticion.query.tipo || null;

    if (!idUsuario) {
      respuesta.status(400).json({ mensaje: 'Falta el parametro usuario' });
      return;
    }

    const filas = await bd.ejecutar('SELECT * FROM SP_LISTAR_CATEGORIAS(?, ?)', [idUsuario, tipo]);

    respuesta.json(filas);
  } catch (error) {
    respuesta.status(500).json({ mensaje: error.message });
  }
});

rutas.get('/:id', async function (peticion, respuesta) {
  try {
    const filas = await bd.ejecutar('SELECT * FROM SP_CONSULTAR_CATEGORIA(?)', [peticion.params.id]);

    if (filas.length === 0) {
      respuesta.status(404).json({ mensaje: 'No existe esa categoria' });
      return;
    }

    respuesta.json(filas[0]);
  } catch (error) {
    respuesta.status(500).json({ mensaje: error.message });
  }
});

rutas.put('/:id', async function (peticion, respuesta) {
  try {
    const datos = peticion.body;

    const existe = await bd.ejecutar(
      'SELECT * FROM SP_CONSULTAR_CATEGORIA(?)',
      [peticion.params.id]
    );

    if (existe.length === 0) {
      respuesta.status(404).json({ mensaje: 'No existe esa categoria' });
      return;
    }

    await bd.ejecutar(
      'EXECUTE PROCEDURE SP_ACTUALIZAR_CATEGORIA(?, ?, ?, ?, ?, ?, ?)',
      [
        peticion.params.id,
        datos.nombre,
        datos.descripcion,
        datos.icono,
        datos.color,
        datos.orden,
        datos.modificado_por
      ]
    );

    respuesta.json({ mensaje: 'Categoria actualizada' });
  } catch (error) {
    respuesta.status(500).json({ mensaje: error.message });
  }
});

rutas.delete('/:id', async function (peticion, respuesta) {
  try {
    const existe = await bd.ejecutar(
      'SELECT * FROM SP_CONSULTAR_CATEGORIA(?)',
      [peticion.params.id]
    );

    if (existe.length === 0) {
      respuesta.status(404).json({ mensaje: 'No existe esa categoria' });
      return;
    }

    await bd.ejecutar('EXECUTE PROCEDURE SP_ELIMINAR_CATEGORIA(?)', [peticion.params.id]);

    respuesta.json({ mensaje: 'Categoria eliminada' });
  } catch (error) {
    respuesta.status(500).json({ mensaje: error.message });
  }
});

module.exports = rutas;