let obligacionPagando = null;

function botonesFila(obligacion) {
  const desactivar = '<button class="boton-mini" data-desactivar="' +
    obligacion.ID_OBLIGACION + '">Desactivar</button>';

  if (obligacion.ESTADO_PAGO === 'pagado') {
    return desactivar;
  }

  return '<button class="boton-mini claro" data-pagar="' +
    obligacion.ID_OBLIGACION + '">Pagar</button> ' + desactivar;
}

async function abrirPago(id) {
  if (!dentroDeVigencia()) {
    mostrarAviso('El mes elegido esta fuera de la vigencia del presupuesto', 'error');
    return;
  }

  try {
    const obligacion = await pedir('/obligaciones/' + id);

    obligacionPagando = obligacion;

    document.getElementById('pagoDetalle').textContent =
      obligacion.NOMBRE_OBLIGACION + ' · ' + obligacion.NOMBRE_SUBCATEGORIA +
      ' · vence el dia ' + obligacion.DIA_VENCIMIENTO;

    document.getElementById('pagoMonto').value = obligacion.MONTO_FIJO_MENSUAL;
    document.getElementById('pagoFecha').value = fechaDelMes(obligacion.DIA_VENCIMIENTO);

    document.getElementById('modalPago').classList.add('visible');
  } catch (error) {
    mostrarAviso(error.message, 'error');
  }
}

function cerrarPago() {
  document.getElementById('modalPago').classList.remove('visible');
  obligacionPagando = null;
}

async function confirmarPago() {
  if (!obligacionPagando) {
    return;
  }

  try {
    await enviar('/transacciones', 'POST', {
      id_usuario: USUARIO,
      id_presupuesto: presupuestoActual,
      anio: anioActual,
      mes: mesActual,
      id_subcategoria: obligacionPagando.ID_SUBCATEGORIA,
      id_obligacion: obligacionPagando.ID_OBLIGACION,
      tipo: tipoDeSubcategoria(obligacionPagando.ID_SUBCATEGORIA),
      descripcion: 'Pago de ' + obligacionPagando.NOMBRE_OBLIGACION,
      monto: Number(document.getElementById('pagoMonto').value),
      fecha: document.getElementById('pagoFecha').value,
      metodo_pago: document.getElementById('pagoMetodo').value,
      num_factura: null,
      observaciones: null,
      creado_por: USUARIO
    });

    cerrarPago();
    mostrarAviso('Pago registrado', 'exito');

    await refrescar();
  } catch (error) {
    mostrarAviso(error.message, 'error');
  }
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
      '<td><span class="marca-estado ' + o.ESTADO_PAGO + '"></span>' +
      escapar(o.NOMBRE_OBLIGACION) + '</td>' +
      '<td>' + escapar(o.NOMBRE_CATEGORIA) + '</td>' +
      '<td class="numero">' + formatearMoneda(o.MONTO_FIJO_MENSUAL) + '</td>' +
      '<td class="numero">' + o.DIA_VENCIMIENTO + '</td>' +
      '<td><span class="insignia estado-' + o.ESTADO_PAGO + '">' + o.ESTADO_PAGO + '</span></td>' +
      '<td>' + textoObligacion(o) + '</td>' +
      '<td class="numero">' + botonesFila(o) + '</td>' +
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

  const botonesPagar = contenedor.querySelectorAll('[data-pagar]');

  for (let i = 0; i < botonesPagar.length; i++) {
    botonesPagar[i].addEventListener('click', function () {
      abrirPago(this.dataset.pagar);
    });
  }

  const botonesBaja = contenedor.querySelectorAll('[data-desactivar]');

  for (let i = 0; i < botonesBaja.length; i++) {
    botonesBaja[i].addEventListener('click', function () {
      desactivarObligacion(this.dataset.desactivar);
    });
  }
}

async function desactivarObligacion(id) {
  const aceptado = await confirmar(
    'Desactivar obligacion',
    'Deja de aparecer en los listados y en las alertas, pero el registro y sus pagos se conservan.',
    'Desactivar'
  );

  if (!aceptado) {
    return;
  }

  try {
    await borrar('/obligaciones/' + id + '?modificado_por=' + USUARIO);

    mostrarAviso('Obligacion desactivada', 'exito');

    await refrescar();
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

    await refrescar();
  } catch (error) {
    mostrarAviso(error.message, 'error');
  }
}

function conectarObligaciones() {
  document.getElementById('formObligacion').addEventListener('submit', guardarObligacion);
  document.getElementById('obFiltroEstado').addEventListener('change', cargarObligaciones);

  document.getElementById('pagoConfirmar').addEventListener('click', confirmarPago);
  document.getElementById('pagoCancelar').addEventListener('click', cerrarPago);

  document.getElementById('modalPago').addEventListener('click', function (evento) {
    if (evento.target === this) {
      cerrarPago();
    }
  });
}
