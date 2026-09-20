function estadoTexto(obligacion) {
  if (obligacion.ESTADO_PAGO === 'pagado') {
    return 'Pagado el ' + formatearFecha(obligacion.FECHA_ULTIMO_PAGO);
  }

  if (obligacion.DIAS_PARA_VENCER < 0) {
    return 'Vencio hace ' + Math.abs(obligacion.DIAS_PARA_VENCER) + ' dias';
  }

  if (obligacion.DIAS_PARA_VENCER === 0) {
    return 'Vence hoy';
  }

  return 'Faltan ' + obligacion.DIAS_PARA_VENCER + ' dias';
}

async function cargarObligaciones() {
  const estado = document.getElementById('obFiltroEstado').value;

  let ruta = '/reportes/obligaciones?usuario=' + USUARIO +
    '&presupuesto=' + presupuestoActual +
    '&anio=' + anioActual +
    '&mes=' + mesActual;

  if (estado !== '') {
    ruta = ruta + '&estado=' + estado;
  }

  const lista = await pedir(ruta);
  const contenedor = document.getElementById('obTabla');

  if (lista.length === 0) {
    contenedor.innerHTML = '<div class="vacio">No hay obligaciones para mostrar</div>';
    document.getElementById('obResumen').textContent = '';
    return;
  }

  let pagadas = 0;
  let pendientes = 0;
  let vencidas = 0;
  let filas = '';

  for (let i = 0; i < lista.length; i++) {
    const o = lista[i];

    if (o.ESTADO_PAGO === 'pagado') {
      pagadas = pagadas + 1;
    } else if (o.ESTADO_PAGO === 'vencido') {
      vencidas = vencidas + 1;
    } else {
      pendientes = pendientes + 1;
    }

    filas = filas +
      '<tr>' +
      '<td><span class="marca-estado ' + o.ESTADO_PAGO + '"></span> ' + o.NOMBRE_OBLIGACION + '</td>' +
      '<td>' + o.NOMBRE_CATEGORIA + '</td>' +
      '<td class="numero">' + formatearMoneda(o.MONTO_FIJO_MENSUAL) + '</td>' +
      '<td class="numero">' + o.DIA_VENCIMIENTO + '</td>' +
      '<td><span class="insignia estado-' + o.ESTADO_PAGO + '">' + o.ESTADO_PAGO + '</span></td>' +
      '<td>' + estadoTexto(o) + '</td>' +
      '<td class="numero"><button class="boton-mini" data-id="' + o.ID_OBLIGACION + '">Desactivar</button></td>' +
      '</tr>';
  }

  contenedor.innerHTML =
    '<table>' +
    '<thead><tr>' +
    '<th>Obligacion</th><th>Categoria</th><th class="numero">Monto</th>' +
    '<th class="numero">Dia</th><th>Estado</th><th>Detalle</th><th></th>' +
    '</tr></thead>' +
    '<tbody>' + filas + '</tbody>' +
    '</table>';

  document.getElementById('obResumen').innerHTML =
    '<strong>' + pagadas + '</strong> pagadas &nbsp;&middot;&nbsp; ' +
    '<strong>' + pendientes + '</strong> pendientes &nbsp;&middot;&nbsp; ' +
    '<strong>' + vencidas + '</strong> vencidas';

  const botones = contenedor.querySelectorAll('.boton-mini');

  for (let i = 0; i < botones.length; i++) {
    botones[i].addEventListener('click', function () {
      desactivarObligacion(this.dataset.id);
    });
  }
}

async function desactivarObligacion(id) {
  if (!confirm('Desactivar esta obligacion? Dejara de aparecer pero no se borra el historial.')) {
    return;
  }

  try {
    await borrar('/obligaciones/' + id + '?modificado_por=' + USUARIO);

    mostrarAviso('Obligacion desactivada', 'exito');

    await actualizarTodo();
  } catch (error) {
    mostrarAviso(error.message, 'error');
  }
}

async function guardarObligacion(evento) {
  evento.preventDefault();

  try {
    await enviar('/obligaciones', 'POST', {
      id_usuario: USUARIO,
      id_subcategoria: Number(document.getElementById('obSubcategoria').value),
      nombre: document.getElementById('obNombre').value,
      descripcion: document.getElementById('obDescripcion').value,
      monto: Number(document.getElementById('obMonto').value),
      dia_vencimiento: Number(document.getElementById('obDia').value),
      fecha_inicio: document.getElementById('obInicio').value,
      fecha_finalizacion: null,
      creado_por: USUARIO
    });

    mostrarAviso('Obligacion creada', 'exito');

    document.getElementById('obNombre').value = '';
    document.getElementById('obDescripcion').value = '';
    document.getElementById('obMonto').value = '';
    document.getElementById('obDia').value = '';

    await actualizarTodo();
  } catch (error) {
    mostrarAviso(error.message, 'error');
  }
}

function conectarObligaciones() {
  document.getElementById('formObligacion').addEventListener('submit', guardarObligacion);
  document.getElementById('obFiltroEstado').addEventListener('change', cargarObligaciones);
}
