const express = require('express');
const bd = require('../db/conexion');
const { responderError } = require('../errores');

const rutas = express.Router();

rutas.post('/', async function (peticion, respuesta) {
  try {
    const datos = peticion.body;

    const resultado = await bd.ejecutar(
      'EXECUTE PROCEDURE SP_INSERTAR_OBLIGACION(?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        datos.id_usuario,
        datos.id_subcategoria,
        datos.nombre,
        datos.descripcion,
        datos.monto,
        datos.dia_vencimiento,
        datos.fecha_inicio,
        datos.fecha_finalizacion,
        datos.creado_por
      ]
    );

    respuesta.status(201).json({ id: resultado.NUEVO_ID });
  } catch (error) {
    responderError(error, respuesta);
  }
});

rutas.get('/', async function (peticion, respuesta) {
  try {
    const idUsuario = peticion.query.usuario;

    if (!idUsuario) {
      respuesta.status(400).json({ mensaje: 'Falta el parametro usuario' });
      return;
    }

    let vigente = null;

    if (peticion.query.vigente === 'true') {
      vigente = true;
    }

    if (peticion.query.vigente === 'false') {
      vigente = false;
    }

    const filas = await bd.ejecutar(
      'SELECT * FROM SP_LISTAR_OBLIGACIONES_USUARIO(?, ?)',
      [idUsuario, vigente]
    );

    respuesta.json(filas);
  } catch (error) {
    responderError(error, respuesta);
  }
});

rutas.get('/:id', async function (peticion, respuesta) {
  try {
    const filas = await bd.ejecutar(
      'SELECT * FROM SP_CONSULTAR_OBLIGACION(?)',
      [peticion.params.id]
    );

    if (filas.length === 0) {
      respuesta.status(404).json({ mensaje: 'No existe esa obligacion' });
      return;
    }

    respuesta.json(filas[0]);
  } catch (error) {
    responderError(error, respuesta);
  }
});

rutas.put('/:id', async function (peticion, respuesta) {
  try {
    const datos = peticion.body;

    const existe = await bd.ejecutar(
      'SELECT * FROM SP_CONSULTAR_OBLIGACION(?)',
      [peticion.params.id]
    );

    if (existe.length === 0) {
      respuesta.status(404).json({ mensaje: 'No existe esa obligacion' });
      return;
    }

    await bd.ejecutar(
      'EXECUTE PROCEDURE SP_ACTUALIZAR_OBLIGACION(?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        peticion.params.id,
        datos.id_subcategoria,
        datos.nombre,
        datos.descripcion,
        datos.monto,
        datos.dia_vencimiento,
        datos.fecha_inicio,
        datos.fecha_finalizacion,
        datos.modificado_por
      ]
    );

    respuesta.json({ mensaje: 'Obligacion actualizada' });
  } catch (error) {
    responderError(error, respuesta);
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
      'SELECT * FROM SP_CONSULTAR_OBLIGACION(?)',
      [peticion.params.id]
    );

    if (existe.length === 0) {
      respuesta.status(404).json({ mensaje: 'No existe esa obligacion' });
      return;
    }

    await bd.ejecutar(
      'EXECUTE PROCEDURE SP_ELIMINAR_OBLIGACION(?, ?)',
      [peticion.params.id, modificadoPor]
    );

    respuesta.json({ mensaje: 'Obligacion desactivada' });
  } catch (error) {
    responderError(error, respuesta);
  }
});

module.exports = rutas;