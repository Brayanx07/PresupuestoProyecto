const express = require('express');
const bd = require('../db/conexion');
const { responderError } = require('../errores');

const rutas = express.Router();

rutas.get('/balance', async function (peticion, respuesta) {
  try {
    const usuario = peticion.query.usuario;
    const presupuesto = peticion.query.presupuesto;
    const anio = peticion.query.anio;
    const mes = peticion.query.mes;

    if (!usuario || !presupuesto || !anio || !mes) {
      respuesta.status(400).json({ mensaje: 'Faltan parametros: usuario, presupuesto, anio, mes' });
      return;
    }

    const filas = await bd.ejecutar(
      'SELECT * FROM SP_CALCULAR_BALANCE_MENSUAL(?, ?, ?, ?)',
      [usuario, presupuesto, anio, mes]
    );

    respuesta.json(filas[0]);
  } catch (error) {
    responderError(error, respuesta);
  }
});

rutas.get('/balance-rango', async function (peticion, respuesta) {
  try {
    const usuario = peticion.query.usuario;
    const presupuesto = peticion.query.presupuesto;
    const anioDesde = Number(peticion.query.anio_desde);
    const mesDesde = Number(peticion.query.mes_desde);
    const anioHasta = Number(peticion.query.anio_hasta);
    const mesHasta = Number(peticion.query.mes_hasta);

    if (!usuario || !presupuesto || !anioDesde || !mesDesde || !anioHasta || !mesHasta) {
      respuesta.status(400).json({ mensaje: 'Faltan parametros: usuario, presupuesto, anio_desde, mes_desde, anio_hasta, mes_hasta' });
      return;
    }

    const desde = (anioDesde * 12) + mesDesde;
    const hasta = (anioHasta * 12) + mesHasta;

    if (desde > hasta) {
      respuesta.status(400).json({ mensaje: 'El periodo inicial es mayor que el final' });
      return;
    }

    const meses = [];

    for (let periodo = desde; periodo <= hasta; periodo++) {
      const anio = Math.floor((periodo - 1) / 12);
      const mes = periodo - (anio * 12);

      const filas = await bd.ejecutar(
        'SELECT * FROM SP_CALCULAR_BALANCE_MENSUAL(?, ?, ?, ?)',
        [usuario, presupuesto, anio, mes]
      );

      meses.push({
        ANIO: anio,
        MES: mes,
        TOTAL_INGRESOS: filas[0].TOTAL_INGRESOS,
        TOTAL_GASTOS: filas[0].TOTAL_GASTOS,
        TOTAL_AHORROS: filas[0].TOTAL_AHORROS,
        BALANCE_FINAL: filas[0].BALANCE_FINAL
      });
    }

    respuesta.json(meses);
  } catch (error) {
    responderError(error, respuesta);
  }
});

rutas.get('/obligaciones', async function (peticion, respuesta) {
  try {
    const usuario = peticion.query.usuario;
    const anio = peticion.query.anio;
    const mes = peticion.query.mes;
    const presupuesto = peticion.query.presupuesto;

    if (!usuario || !anio || !mes || !presupuesto) {
      respuesta.status(400).json({ mensaje: 'Faltan parametros: usuario, anio, mes, presupuesto' });
      return;
    }

    const filas = await bd.ejecutar(
      'SELECT * FROM SP_PROCESAR_OBLIGACIONES_MES(?, ?, ?, ?)',
      [usuario, anio, mes, presupuesto]
    );

    respuesta.json(filas);
  } catch (error) {
    responderError(error, respuesta);
  }
});

rutas.get('/categoria', async function (peticion, respuesta) {
  try {
    const categoria = peticion.query.categoria;
    const presupuesto = peticion.query.presupuesto;
    const anio = peticion.query.anio;
    const mes = peticion.query.mes;

    if (!categoria || !presupuesto || !anio || !mes) {
      respuesta.status(400).json({ mensaje: 'Faltan parametros: categoria, presupuesto, anio, mes' });
      return;
    }

    const filas = await bd.ejecutar(
      'SELECT * FROM SP_OBTENER_RESUMEN_CATEGORIA_MES(?, ?, ?, ?)',
      [categoria, presupuesto, anio, mes]
    );

    respuesta.json(filas[0]);
  } catch (error) {
    responderError(error, respuesta);
  }
});

rutas.get('/subcategoria', async function (peticion, respuesta) {
  try {
    const subcategoria = peticion.query.subcategoria;
    const presupuesto = peticion.query.presupuesto;
    const anio = peticion.query.anio;
    const mes = peticion.query.mes;

    if (!subcategoria || !presupuesto || !anio || !mes) {
      respuesta.status(400).json({ mensaje: 'Faltan parametros: subcategoria, presupuesto, anio, mes' });
      return;
    }

    const ejecutado = await bd.ejecutar(
      'SELECT * FROM SP_CALCULAR_MONTO_EJECUTADO_MES(?, ?, ?, ?)',
      [subcategoria, presupuesto, anio, mes]
    );

    const porcentaje = await bd.ejecutar(
      'SELECT * FROM SP_CALCULAR_PORCENTAJE_EJECUCION_MES(?, ?, ?, ?)',
      [subcategoria, presupuesto, anio, mes]
    );

    respuesta.json({
      MONTO_EJECUTADO: ejecutado[0].MONTO_EJECUTADO,
      PORCENTAJE: porcentaje[0].PORCENTAJE
    });
  } catch (error) {
    responderError(error, respuesta);
  }
});

rutas.get('/gastos-categoria', async function (peticion, respuesta) {
  try {
    const usuario = peticion.query.usuario;
    const presupuesto = peticion.query.presupuesto;
    const anio = peticion.query.anio;
    const mes = peticion.query.mes;

    if (!usuario || !presupuesto || !anio || !mes) {
      respuesta.status(400).json({ mensaje: 'Faltan parametros: usuario, presupuesto, anio, mes' });
      return;
    }

    const filas = await bd.ejecutar(
      'SELECT * FROM SP_REPORTE_GASTOS_CATEGORIA(?, ?, ?, ?)',
      [usuario, presupuesto, anio, mes]
    );

    respuesta.json(filas);
  } catch (error) {
    responderError(error, respuesta);
  }
});

module.exports = rutas;