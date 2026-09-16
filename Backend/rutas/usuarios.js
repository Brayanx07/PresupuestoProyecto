const express = require('express');
const bd = require('../db/conexion');
const { responderError } = require('../errores');

const rutas = express.Router();

rutas.post('/', async function (peticion, respuesta) {
  try {
    const datos = peticion.body;

    const resultado = await bd.ejecutar(
      'EXECUTE PROCEDURE SP_INSERTAR_USUARIO(?, ?, ?, ?, ?)',
      [
        datos.nombres,
        datos.apellidos,
        datos.correo,
        datos.salario,
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
    const filas = await bd.ejecutar('SELECT * FROM SP_LISTAR_USUARIOS', []);

    respuesta.json(filas);
  } catch (error) {
    respuesta.status(500).json({ mensaje: error.message });
  }
});

rutas.get('/:id', async function (peticion, respuesta) {
  try {
    const filas = await bd.ejecutar(
      'SELECT * FROM SP_CONSULTAR_USUARIO(?)',
      [peticion.params.id]
    );

    if (filas.length === 0) {
      respuesta.status(404).json({ mensaje: 'No existe ese usuario' });
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
      'SELECT * FROM SP_CONSULTAR_USUARIO(?)',
      [peticion.params.id]
    );

    if (existe.length === 0) {
      respuesta.status(404).json({ mensaje: 'No existe ese usuario' });
      return;
    }

    await bd.ejecutar(
      'EXECUTE PROCEDURE SP_ACTUALIZAR_USUARIO(?, ?, ?, ?, ?, ?)',
      [
        peticion.params.id,
        datos.nombres,
        datos.apellidos,
        datos.correo,
        datos.salario,
        datos.modificado_por
      ]
    );

    respuesta.json({ mensaje: 'Usuario actualizado' });
  } catch (error) {
    respuesta.status(500).json({ mensaje: error.message });
  }
});

rutas.delete('/:id', async function (peticion, respuesta) {
  try {
    const modificadoPor = peticion.query.modificado_por;

    if (!modificadoPor) {
      respuesta.status(400).json({ mensaje: 'Falta el parametro modificado_por' });
      return;
    }

    const existe = await bd.ejecutar(
      'SELECT * FROM SP_CONSULTAR_USUARIO(?)',
      [peticion.params.id]
    );

    if (existe.length === 0) {
      respuesta.status(404).json({ mensaje: 'No existe ese usuario' });
      return;
    }

    await bd.ejecutar(
      'EXECUTE PROCEDURE SP_ELIMINAR_USUARIO(?, ?)',
      [peticion.params.id, modificadoPor]
    );

    respuesta.json({ mensaje: 'Usuario desactivado' });
    } catch (error) {
    responderError(error, respuesta);
  }
});

module.exports = rutas;