let detalleEditando = null;

function mostrarCabecera() {
  const presupuesto = buscarPresupuesto();

  if (!presupuesto) {
    return;
  }

  document.getElementById('pjNombre').textContent = presupuesto.NOMBRE_PRESUPUESTO;

  document.getElementById('pjVigencia').textContent =
    'Vigente de ' + NOMBRES_MES[presupuesto.MES_INICIO - 1] + ' ' + presupuesto.ANIO_INICIO +
    ' a ' + NOMBRES_MES[presupuesto.MES_FIN - 1] + ' ' + presupuesto.ANIO_FIN +
    ' · ' + presupuesto.ESTADO_PRESUPUESTO;
}

function limpiarFormularioDetalle() {
  detalleEditando = null;

  document.getElementById('dtMonto').value = '';
  document.getElementById('dtObservaciones').value = '';
  document.getElementById('dtSubcategoria').disabled = false;
  document.getElementById('dtBoton').textContent = 'Agregar renglon';
  document.getElementById('dtCancelar').style.display = 'none';
}

function llenarDisponibles(usadas) {
  const selector = document.getElementById('dtSubcategoria');

  selector.innerHTML = '';

  for (let i = 0; i < arbolCategorias.length; i++) {
    const rama = arbolCategorias[i];
    const grupo = document.createElement('optgroup');

    grupo.label = rama.categoria.NOMBRE_CATEGORIA;

    let agregadas = 0;

    for (let j = 0; j < rama.subcategorias.length; j++) {
      const sub = rama.subcategorias[j];

      if (usadas.indexOf(sub.ID_SUBCATEGORIA) >= 0) {
        continue;
      }

      const opcion = document.createElement('option');

      opcion.value = sub.ID_SUBCATEGORIA;
      opcion.textContent = sub.NOMBRE_SUBCATEGORIA;

      grupo.appendChild(opcion);
      agregadas = agregadas + 1;
    }

    if (agregadas > 0) {
      selector.appendChild(grupo);
    }
  }

  const vacio = selector.options.length === 0;

  document.getElementById('dtBoton').disabled = vacio;

  if (vacio) {
    const opcion = document.createElement('option');

    opcion.textContent = 'Todas las subcategorias ya estan asignadas';

    selector.appendChild(opcion);
  }
}

function prepararEdicion(detalle) {
  detalleEditando = Number(detalle.ID_DETALLE);

  const selector = document.getElementById('dtSubcategoria');

  let existe = false;

  for (let i = 0; i < selector.options.length; i++) {
    if (Number(selector.options[i].value) === detalle.ID_SUBCATEGORIA) {
      existe = true;
    }
  }

  if (!existe) {
    const opcion = document.createElement('option');

    opcion.value = detalle.ID_SUBCATEGORIA;
    opcion.textContent = detalle.NOMBRE_SUBCATEGORIA;

    selector.appendChild(opcion);
  }

  selector.value = detalle.ID_SUBCATEGORIA;
  selector.disabled = true;

  document.getElementById('dtBoton').disabled = false;
  document.getElementById('dtMonto').value = detalle.MONTO_MENSUAL_ASIGNADO;
  document.getElementById('dtObservaciones').value = detalle.OBSERVACIONES || '';
  document.getElementById('dtBoton').textContent = 'Guardar cambios';
  document.getElementById('dtCancelar').style.display = 'inline-block';
}

async function cargarDetalles() {
  mostrarCabecera();

  const detalles = await pedir('/detalles?presupuesto=' + presupuestoActual);
  const cumplimiento = await pedir('/reportes/cumplimiento?presupuesto=' + presupuestoActual +
    '&anio=' + anioActual + '&mes=' + mesActual);

  const contenedor = document.getElementById('dtTabla');

  const usadas = [];

  for (let i = 0; i < detalles.length; i++) {
    usadas.push(detalles[i].ID_SUBCATEGORIA);
  }

  llenarDisponibles(usadas);

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
      '<td>' + escapar(detalle.NOMBRE_SUBCATEGORIA) + '</td>' +
      '<td>' + escapar(detalle.NOMBRE_CATEGORIA) + '</td>' +
      '<td>' + escapar(detalle.OBSERVACIONES) + '</td>' +
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
  const aceptado = await confirmar(
    'Eliminar renglon',
    'Se quita el monto asignado a esa subcategoria. Las transacciones ya registradas no se tocan.',
    'Eliminar'
  );

  if (!aceptado) {
    return;
  }

  try {
    await borrar('/detalles/' + id);

    mostrarAviso('Renglon eliminado', 'exito');

    limpiarFormularioDetalle();
    await cargarPresupuestos();
    await refrescar();
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
    await refrescar();
  } catch (error) {
    mostrarAviso(error.message, 'error');
  }
}

function alternarFormularioPresupuesto() {
  document.getElementById('formPresupuesto').classList.toggle('oculto');
}

async function crearPresupuesto(evento) {
  evento.preventDefault();

  try {
    const respuesta = await enviar('/presupuestos/completo', 'POST', {
      id_usuario: USUARIO,
      nombre: document.getElementById('pjNombreNuevo').value,
      anio_inicio: Number(document.getElementById('pjAnioInicio').value),
      mes_inicio: Number(document.getElementById('pjMesInicio').value),
      anio_fin: Number(document.getElementById('pjAnioFin').value),
      mes_fin: Number(document.getElementById('pjMesFin').value),
      creado_por: USUARIO
    });

    mostrarAviso('Presupuesto creado, ahora cargale sus renglones', 'exito');

    document.getElementById('pjNombreNuevo').value = '';
    document.getElementById('formPresupuesto').classList.add('oculto');

    await cargarPresupuestos();

    presupuestoActual = Number(respuesta.id);
    document.getElementById('selectorPresupuesto').value = presupuestoActual;

    acomodarPeriodo();
    await refrescar();
  } catch (error) {
    mostrarAviso(error.message, 'error');
  }
}

async function eliminarPresupuesto() {
  const presupuesto = buscarPresupuesto();

  if (!presupuesto) {
    return;
  }

  const aceptado = await confirmar(
    'Eliminar presupuesto',
    'Se eliminara "' + presupuesto.NOMBRE_PRESUPUESTO + '" con todos sus renglones. ' +
    'Si tiene transacciones registradas la base lo va a impedir.',
    'Eliminar'
  );

  if (!aceptado) {
    return;
  }

  try {
    await borrar('/presupuestos/' + presupuestoActual);

    mostrarAviso('Presupuesto eliminado', 'exito');

    await cargarPresupuestos();
    await refrescar();
  } catch (error) {
    mostrarAviso(error.message, 'error');
  }
}

function conectarPresupuesto() {
  document.getElementById('formDetalle').addEventListener('submit', guardarDetalle);
  document.getElementById('dtCancelar').addEventListener('click', limpiarFormularioDetalle);

  document.getElementById('formPresupuesto').addEventListener('submit', crearPresupuesto);
  document.getElementById('pjNuevo').addEventListener('click', alternarFormularioPresupuesto);
  document.getElementById('pjCancelar').addEventListener('click', alternarFormularioPresupuesto);
  document.getElementById('pjEliminar').addEventListener('click', eliminarPresupuesto);

  llenarMeses('pjMesInicio');
  llenarMeses('pjMesFin');
  limpiarFormularioDetalle();
}
