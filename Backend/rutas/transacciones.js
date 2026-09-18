const express = require('express');
const bd = require('../db/conexion');
const { responderError } = require('../errores');

const rutas = express.Router();

rutas.post('/', async function (peticion, respuesta) {
  try {
    const datos = peticion.body;

    const resultado = await bd.ejecutar(
      'EXECUTE PROCEDURE SP_INSERTAR_TRANSACCION(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        datos.id_usuario,
        datos.id_presupuesto,
        datos.anio,
        datos.mes,
        datos.id_subcategoria,
        datos.id_obligacion,
        datos.tipo,
        datos.descripcion,
        datos.monto,
        datos.fecha,
        datos.metodo_pago,
        datos.num_factura,
        datos.observaciones,
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
    const idPresupuesto = peticion.query.presupuesto;

    if (!idPresupuesto) {
      respuesta.status(400).json({ mensaje: 'Falta el parametro presupuesto' });
      return;
    }

    const anio = peticion.query.anio || null;
    const mes = peticion.query.mes || null;
    const idSubcategoria = peticion.query.subcategoria || null;
    const tipo = peticion.query.tipo || null;

    const filas = await bd.ejecutar(
      'SELECT * FROM SP_LISTAR_TRANSACCIONES_PRESUPUESTO(?, ?, ?, ?, ?)',
      [idPresupuesto, anio, mes, idSubcategoria, tipo]
    );

    respuesta.json(filas);
  } catch (error) {
    responderError(error, respuesta);
  }
});

rutas.get('/:id', async function (peticion, respuesta) {
  try {
    const filas = await bd.ejecutar(
      'SELECT * FROM SP_CONSULTAR_TRANSACCION(?)',
      [peticion.params.id]
    );

    if (filas.length === 0) {
      respuesta.status(404).json({ mensaje: 'No existe esa transaccion' });
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
      'SELECT * FROM SP_CONSULTAR_TRANSACCION(?)',
      [peticion.params.id]
    );

    if (existe.length === 0) {
      respuesta.status(404).json({ mensaje: 'No existe esa transaccion' });
      return;
    }

    await bd.ejecutar(
      'EXECUTE PROCEDURE SP_ACTUALIZAR_TRANSACCION(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        peticion.params.id,
        datos.anio,
        datos.mes,
        datos.id_subcategoria,
        datos.tipo,
        datos.descripcion,
        datos.monto,
        datos.fecha,
        datos.metodo_pago,
        datos.num_factura,
        datos.observaciones,
        datos.modificado_por
      ]
    );

    respuesta.json({ mensaje: 'Transaccion actualizada' });
  } catch (error) {
    responderError(error, respuesta);
  }
});

rutas.delete('/:id', async function (peticion, respuesta) {
  try {
    const existe = await bd.ejecutar(
      'SELECT * FROM SP_CONSULTAR_TRANSACCION(?)',
      [peticion.params.id]
    );

    if (existe.length === 0) {
      respuesta.status(404).json({ mensaje: 'No existe esa transaccion' });
      return;
    }

    await bd.ejecutar(
      'EXECUTE PROCEDURE SP_ELIMINAR_TRANSACCION(?)',
      [peticion.params.id]
    );

    respuesta.json({ mensaje: 'Transaccion eliminada' });
  } catch (error) {
    responderError(error, respuesta);
  }
});

rutas.post('/completa', async function (peticion, respuesta) {
  try {
    const datos = peticion.body;

    const resultado = await bd.ejecutar(
      'EXECUTE PROCEDURE SP_REGISTRAR_TRANSACCION_COMPLETA(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        datos.id_usuario,
        datos.id_presupuesto,
        datos.anio,
        datos.mes,
        datos.id_subcategoria,
        datos.tipo,
        datos.descripcion,
        datos.monto,
        datos.fecha,
        datos.metodo_pago,
        datos.creado_por
      ]
    );

    respuesta.status(201).json({
      id: resultado.NUEVO_ID,
      advertencia: resultado.ADVERTENCIA
    });
  } catch (error) {
    responderError(error, respuesta);
  }
});

module.exports = rutas;


