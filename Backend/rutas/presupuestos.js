const express = require('express');
const bd = require('../db/conexion');
const { responderError } = require('../errores');

const rutas = express.Router();

rutas.post('/', async function (peticion, respuesta) {
  try {
    const datos = peticion.body;

    const resultado = await bd.ejecutar(
      'EXECUTE PROCEDURE SP_INSERTAR_PRESUPUESTO(?, ?, ?, ?, ?, ?, ?)',
      [
        datos.id_usuario,
        datos.nombre,
        datos.anio_inicio,
        datos.mes_inicio,
        datos.anio_fin,
        datos.mes_fin,
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
    const estado = peticion.query.estado || null;

    if (!idUsuario) {
      respuesta.status(400).json({ mensaje: 'Falta el parametro usuario' });
      return;
    }

    const filas = await bd.ejecutar(
  'SELECT * FROM SP_LISTAR_PRESUPUESTOS_USUARIO(?, ?)',
  [idUsuario, estado]
);

    respuesta.json(filas);
  } catch (error) {
    respuesta.status(500).json({ mensaje: error.message });
  }
});

rutas.get('/:id', async function (peticion, respuesta) {
  try {
    const filas = await bd.ejecutar(
      'SELECT * FROM SP_CONSULTAR_PRESUPUESTO(?)',
      [peticion.params.id]
    );

    if (filas.length === 0) {
      respuesta.status(404).json({ mensaje: 'No existe ese presupuesto' });
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
      'SELECT * FROM SP_CONSULTAR_PRESUPUESTO(?)',
      [peticion.params.id]
    );

    if (existe.length === 0) {
      respuesta.status(404).json({ mensaje: 'No existe ese presupuesto' });
      return;
    }

    await bd.ejecutar(
      'EXECUTE PROCEDURE SP_ACTUALIZAR_PRESUPUESTO(?, ?, ?, ?, ?, ?, ?, ?)',
      [
        peticion.params.id,
        datos.nombre,
        datos.anio_inicio,
        datos.mes_inicio,
        datos.anio_fin,
        datos.mes_fin,
        datos.estado,
        datos.modificado_por
      ]
    );

    respuesta.json({ mensaje: 'Presupuesto actualizado' });
  } catch (error) {
    respuesta.status(500).json({ mensaje: error.message });
  }
});

rutas.delete('/:id', async function (peticion, respuesta) {
  try {
    const existe = await bd.ejecutar(
      'SELECT * FROM SP_CONSULTAR_PRESUPUESTO(?)',
      [peticion.params.id]
    );

    if (existe.length === 0) {
      respuesta.status(404).json({ mensaje: 'No existe ese presupuesto' });
      return;
    }

    await bd.ejecutar('EXECUTE PROCEDURE SP_ELIMINAR_PRESUPUESTO(?)', [peticion.params.id]);

    respuesta.json({ mensaje: 'Presupuesto eliminado' });
    } catch (error) {
    responderError(error, respuesta);
  }
});

rutas.post('/completo', async function (peticion, respuesta) {
  try {
    const datos = peticion.body;

    const resultado = await bd.ejecutar(
      'EXECUTE PROCEDURE SP_CREAR_PRESUPUESTO_COMPLETO(?, ?, ?, ?, ?, ?, ?)',
      [
        datos.id_usuario,
        datos.nombre,
        datos.anio_inicio,
        datos.mes_inicio,
        datos.anio_fin,
        datos.mes_fin,
        datos.creado_por
      ]
    );

    const idNuevo = resultado.NUEVO_ID;

    if (datos.detalles) {
      for (let i = 0; i < datos.detalles.length; i++) {
        const detalle = datos.detalles[i];

        await bd.ejecutar(
          'EXECUTE PROCEDURE SP_INSERTAR_PRESUPUESTO_DETALLE(?, ?, ?, ?, ?)',
          [
            idNuevo,
            detalle.id_subcategoria,
            detalle.monto,
            detalle.observaciones,
            datos.creado_por
          ]
        );
      }

      await bd.ejecutar(
        'EXECUTE PROCEDURE SP_RECALCULAR_TOTALES_PRESUPUESTO(?)',
        [idNuevo]
      );
    }

    respuesta.status(201).json({ id: idNuevo });
  } catch (error) {
    responderError(error, respuesta);
  }
});

rutas.post('/:id/cerrar', async function (peticion, respuesta) {
  try {
    const modificadoPor = peticion.body.modificado_por;

    if (!modificadoPor) {
      respuesta.status(400).json({ mensaje: 'Falta modificado_por' });
      return;
    }

    const existe = await bd.ejecutar(
      'SELECT * FROM SP_CONSULTAR_PRESUPUESTO(?)',
      [peticion.params.id]
    );

    if (existe.length === 0) {
      respuesta.status(404).json({ mensaje: 'No existe ese presupuesto' });
      return;
    }

    const filas = await bd.ejecutar(
      'SELECT * FROM SP_CERRAR_PRESUPUESTO(?, ?)',
      [peticion.params.id, modificadoPor]
    );

    respuesta.json(filas[0]);
  } catch (error) {
    responderError(error, respuesta);
  }
});


module.exports = rutas;