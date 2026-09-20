let detalleEditando = null;

function limpiarFormularioDetalle() {
  detalleEditando = null;

  document.getElementById('dtMonto').value = '';
  document.getElementById('dtObservaciones').value = '';
  document.getElementById('dtSubcategoria').disabled = false;
  document.getElementById('dtBoton').textContent = 'Agregar renglon';
  document.getElementById('dtCancelar').style.display = 'none';
}

function prepararEdicion(detalle) {
  detalleEditando = Number(detalle.ID_DETALLE);

  document.getElementById('dtSubcategoria').value = detalle.ID_SUBCATEGORIA;
  document.getElementById('dtSubcategoria').disabled = true;
  document.getElementById('dtMonto').value = detalle.MONTO_MENSUAL_ASIGNADO;
  document.getElementById('dtObservaciones').value = detalle.OBSERVACIONES || '';
  document.getElementById('dtBoton').textContent = 'Guardar cambios';
  document.getElementById('dtCancelar').style.display = 'inline-block';
}

function claseSemaforo(porcentaje) {
  if (porcentaje > 100) {
    return 'rojo';
  }

  if (porcentaje >= 80) {
    return 'ambar';
  }

  return 'verde';
}

async function cargarDetalles() {
  const detalles = await pedir('/detalles?presupuesto=' + presupuestoActual);
  const cumplimiento = await pedir('/reportes/cumplimiento?presupuesto=' + presupuestoActual +
    '&anio=' + anioActual + '&mes=' + mesActual);

  const contenedor = document.getElementById('dtTabla');

  if (detalles.length === 0) {
    contenedor.innerHTML = '<div class="vacio">Este presupuesto todavia no tiene renglones</div>';
    document.getElementById('dtResumen').textContent = '';
    return;
  }

  let totalAsignado = 0;
  let totalEjecutado = 0;
  let filas = '';

  for (let i = 0; i < detalles.length; i++) {
    const detalle = detalles[i];

    let ejecutado = 0;
    let porcentaje = 0;

    for (let j = 0; j < cumplimiento.length; j++) {
      if (cumplimiento[j].ID_SUBCATEGORIA === detalle.ID_SUBCATEGORIA) {
        ejecutado = Number(cumplimiento[j].MONTO_EJECUTADO);
        porcentaje = Number(cumplimiento[j].PORCENTAJE);
      }
    }

    totalAsignado = totalAsignado + Number(detalle.MONTO_MENSUAL_ASIGNADO);
    totalEjecutado = totalEjecutado + ejecutado;

    filas = filas +
      '<tr>' +
      '<td>' + detalle.NOMBRE_SUBCATEGORIA + '</td>' +
      '<td>' + detalle.NOMBRE_CATEGORIA + '</td>' +
      '<td>' + (detalle.OBSERVACIONES || '') + '</td>' +
      '<td class="numero">' + formatearMoneda(detalle.MONTO_MENSUAL_ASIGNADO) + '</td>' +
      '<td class="numero">' + formatearMoneda(ejecutado) + '</td>' +
      '<td class="numero"><span class="semaforo ' + claseSemaforo(porcentaje) + '">' +
      porcentaje.toFixed(1) + '%</span></td>' +
      '<td class="numero">' +
      '<button class="boton-mini claro" data-editar="' + detalle.ID_DETALLE + '">Editar</button> ' +
      '<button class="boton-mini" data-borrar="' + detalle.ID_DETALLE + '">Eliminar</button>' +
      '</td>' +
      '</tr>';
  }

  contenedor.innerHTML =
    '<table>' +
    '<thead><tr>' +
    '<th>Subcategoria</th><th>Categoria</th><th>Observaciones</th>' +
    '<th class="numero">Asignado</th><th class="numero">Ejecutado</th>' +
    '<th class="numero">Ejecucion</th><th></th>' +
    '</tr></thead>' +
    '<tbody>' + filas + '</tbody>' +
    '</table>';

  document.getElementById('dtResumen').innerHTML =
    'Asignado <strong>' + formatearMoneda(totalAsignado) + '</strong>' +
    ' &nbsp;&middot;&nbsp; Ejecutado <strong>' + formatearMoneda(totalEjecutado) + '</strong>';

  const botonesEditar = contenedor.querySelectorAll('[data-editar]');

  for (let i = 0; i < botonesEditar.length; i++) {
    botonesEditar[i].addEventListener('click', function () {
      const id = Number(this.dataset.editar);

      for (let j = 0; j < detalles.length; j++) {
        if (detalles[j].ID_DETALLE === id) {
          prepararEdicion(detalles[j]);
        }
      }
    });
  }

  const botonesBorrar = contenedor.querySelectorAll('[data-borrar]');

  for (let i = 0; i < botonesBorrar.length; i++) {
    botonesBorrar[i].addEventListener('click', function () {
      eliminarDetalle(this.dataset.borrar);
    });
  }
}

async function eliminarDetalle(id) {
  if (!confirm('Eliminar este renglon del presupuesto?')) {
    return;
  }

  try {
    await borrar('/detalles/' + id);

    mostrarAviso('Renglon eliminado', 'exito');

    limpiarFormularioDetalle();
    await cargarPresupuestos();
    await actualizarTodo();
  } catch (error) {
    mostrarAviso(error.message, 'error');
  }
}

async function guardarDetalle(evento) {
  evento.preventDefault();

  try {
    if (detalleEditando) {
      await enviar('/detalles/' + detalleEditando, 'PUT', {
        monto: Number(document.getElementById('dtMonto').value),
        observaciones: document.getElementById('dtObservaciones').value,
        modificado_por: USUARIO
      });

      mostrarAviso('Renglon actualizado', 'exito');
    } else {
      await enviar('/detalles', 'POST', {
        id_presupuesto: presupuestoActual,
        id_subcategoria: Number(document.getElementById('dtSubcategoria').value),
        monto: Number(document.getElementById('dtMonto').value),
        observaciones: document.getElementById('dtObservaciones').value,
        creado_por: USUARIO
      });

      mostrarAviso('Renglon agregado', 'exito');
    }

    limpiarFormularioDetalle();
    await cargarPresupuestos();
    await actualizarTodo();
  } catch (error) {
    mostrarAviso(error.message, 'error');
  }
}

function conectarPresupuesto() {
  document.getElementById('formDetalle').addEventListener('submit', guardarDetalle);
  document.getElementById('dtCancelar').addEventListener('click', limpiarFormularioDetalle);

  limpiarFormularioDetalle();
}
