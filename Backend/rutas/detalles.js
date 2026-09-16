const express = require('express');
const bd = require('../db/conexion');
const { responderError } = require('../errores');

const rutas = express.Router();

rutas.post('/', async function (peticion, respuesta) {
  try {
    const datos = peticion.body;

    const resultado = await bd.ejecutar(
      'EXECUTE PROCEDURE SP_INSERTAR_PRESUPUESTO_DETALLE(?, ?, ?, ?, ?)',
      [
        datos.id_presupuesto,
        datos.id_subcategoria,
        datos.monto,
        datos.observaciones,
        datos.creado_por
      ]
    );

    await bd.ejecutar(
      'EXECUTE PROCEDURE SP_RECALCULAR_TOTALES_PRESUPUESTO(?)',
      [datos.id_presupuesto]
    );

    respuesta.status(201).json({ id: resultado.NUEVO_ID });
  } catch (error) {
    responderError(error, respuesta);
  }
});

rutas.get('/', async function (peticion, respuesta) {
  try {
    const idPresupuesto = peticion.query.presupuesto;

    if (!idPresupuesto) {
      respuesta.status(400).json({ mensaje: 'Falta el parametro presupuesto' });
      return;
    }

    const filas = await bd.ejecutar(
      'SELECT * FROM SP_LISTAR_DETALLES_PRESUPUESTO(?)',
      [idPresupuesto]
    );

    respuesta.json(filas);
  } catch (error) {
    responderError(error, respuesta);
  }
});

rutas.get('/:id', async function (peticion, respuesta) {
  try {
    const filas = await bd.ejecutar(
      'SELECT * FROM SP_CONSULTAR_PRESUPUESTO_DETALLE(?)',
      [peticion.params.id]
    );

    if (filas.length === 0) {
      respuesta.status(404).json({ mensaje: 'No existe ese detalle' });
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
      'SELECT * FROM SP_CONSULTAR_PRESUPUESTO_DETALLE(?)',
      [peticion.params.id]
    );

    if (existe.length === 0) {
      respuesta.status(404).json({ mensaje: 'No existe ese detalle' });
      return;
    }

    await bd.ejecutar(
      'EXECUTE PROCEDURE SP_ACTUALIZAR_PRESUPUESTO_DETALLE(?, ?, ?, ?)',
      [
        peticion.params.id,
        datos.monto,
        datos.observaciones,
        datos.modificado_por
      ]
    );

    await bd.ejecutar(
      'EXECUTE PROCEDURE SP_RECALCULAR_TOTALES_PRESUPUESTO(?)',
      [existe[0].ID_PRESUPUESTO]
    );

    respuesta.json({ mensaje: 'Detalle actualizado' });
  } catch (error) {
    responderError(error, respuesta);
  }
});

rutas.delete('/:id', async function (peticion, respuesta) {
  try {
    const existe = await bd.ejecutar(
      'SELECT * FROM SP_CONSULTAR_PRESUPUESTO_DETALLE(?)',
      [peticion.params.id]
    );

    if (existe.length === 0) {
      respuesta.status(404).json({ mensaje: 'No existe ese detalle' });
      return;
    }

    const idPresupuesto = existe[0].ID_PRESUPUESTO;

    await bd.ejecutar(
      'EXECUTE PROCEDURE SP_ELIMINAR_PRESUPUESTO_DETALLE(?)',
      [peticion.params.id]
    );

    await bd.ejecutar(
      'EXECUTE PROCEDURE SP_RECALCULAR_TOTALES_PRESUPUESTO(?)',
      [idPresupuesto]
    );

    respuesta.json({ mensaje: 'Detalle eliminado' });
  } catch (error) {
    responderError(error, respuesta);
  }
});

module.exports = rutas;