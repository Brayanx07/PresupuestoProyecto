const express = require('express');
const bd = require('../db/conexion');
const { responderError } = require('../errores');

const rutas = express.Router();

rutas.post('/', async function (peticion, respuesta) {
  try {
    const datos = peticion.body;

    const resultado = await bd.ejecutar(
      'EXECUTE PROCEDURE SP_INSERTAR_SUBCATEGORIA(?, ?, ?, ?)',
      [
        datos.id_categoria,
        datos.nombre,
        datos.descripcion,
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
    const idCategoria = peticion.query.categoria;

    if (!idCategoria) {
      respuesta.status(400).json({ mensaje: 'Falta el parametro categoria' });
      return;
    }

    const filas = await bd.ejecutar(
      'SELECT * FROM SP_LISTAR_SUBCATEGORIAS_POR_CATEGORIA(?)',
      [idCategoria]
    );

    respuesta.json(filas);
  } catch (error) {
    respuesta.status(500).json({ mensaje: error.message });
  }
});

rutas.get('/:id', async function (peticion, respuesta) {
  try {
    const filas = await bd.ejecutar(
      'SELECT * FROM SP_CONSULTAR_SUBCATEGORIA(?)',
      [peticion.params.id]
    );

    if (filas.length === 0) {
      respuesta.status(404).json({ mensaje: 'No existe esa subcategoria' });
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
      'SELECT * FROM SP_CONSULTAR_SUBCATEGORIA(?)',
      [peticion.params.id]
    );

    if (existe.length === 0) {
      respuesta.status(404).json({ mensaje: 'No existe esa subcategoria' });
      return;
    }

    await bd.ejecutar(
      'EXECUTE PROCEDURE SP_ACTUALIZAR_SUBCATEGORIA(?, ?, ?, ?, ?)',
      [
        peticion.params.id,
        datos.nombre,
        datos.descripcion,
        datos.activa,
        datos.modificado_por
      ]
    );

    respuesta.json({ mensaje: 'Subcategoria actualizada' });
  } catch (error) {
    respuesta.status(500).json({ mensaje: error.message });
  }
});

rutas.delete('/:id', async function (peticion, respuesta) {
  try {
    const existe = await bd.ejecutar(
      'SELECT * FROM SP_CONSULTAR_SUBCATEGORIA(?)',
      [peticion.params.id]
    );

    if (existe.length === 0) {
      respuesta.status(404).json({ mensaje: 'No existe esa subcategoria' });
      return;
    }

    await bd.ejecutar('EXECUTE PROCEDURE SP_ELIMINAR_SUBCATEGORIA(?)', [peticion.params.id]);

    respuesta.json({ mensaje: 'Subcategoria eliminada' });
    } catch (error) {
    responderError(error, respuesta);
  }
});

module.exports = rutas;