function actualizarTipo() {
  const selector = document.getElementById('txSubcategoria');
  const elegida = selector.options[selector.selectedIndex];

  if (elegida) {
    document.getElementById('txTipo').value = elegida.dataset.tipo;
  }
}

function ajustarFormulario() {
  const permitido = dentroDeVigencia();
  const formulario = document.getElementById('formTransaccion');
  const nota = document.getElementById('txFueraVigencia');

  if (permitido) {
    formulario.classList.remove('bloqueado');
    nota.style.display = 'none';
  } else {
    formulario.classList.add('bloqueado');
    nota.style.display = 'block';
  }
}

async function cargarTransacciones() {
  ajustarFormulario();

  const tipo = document.getElementById('txFiltroTipo').value;

  let ruta = '/transacciones?presupuesto=' + presupuestoActual +
    '&anio=' + anioActual +
    '&mes=' + mesActual;

  if (tipo !== '') {
    ruta = ruta + '&tipo=' + tipo;
  }

  const lista = await pedir(ruta);
  const contenedor = document.getElementById('txTabla');

  if (lista.length === 0) {
    contenedor.innerHTML = '<div class="vacio">No hay movimientos en este periodo</div>';
    document.getElementById('txResumen').textContent = '';
    return;
  }

  let total = 0;
  let filas = '';

  for (let i = 0; i < lista.length; i++) {
    const t = lista[i];

    total = total + Number(t.MONTO);

    filas = filas +
      '<tr>' +
      '<td>' + formatearFecha(t.FECHA) + '</td>' +
      '<td>' + t.DESCRIPCION + '</td>' +
      '<td>' + t.NOMBRE_SUBCATEGORIA + '</td>' +
      '<td>' + t.NOMBRE_CATEGORIA + '</td>' +
      '<td><span class="insignia ' + t.TIPO_TRANSACCION + '">' + t.TIPO_TRANSACCION + '</span></td>' +
      '<td class="numero">' + formatearMoneda(t.MONTO) + '</td>' +
      '<td class="numero"><button class="boton-mini" data-id="' + t.ID_TRANSACCION + '">Eliminar</button></td>' +
      '</tr>';
  }

  contenedor.innerHTML =
    '<table>' +
    '<thead><tr>' +
    '<th>Fecha</th><th>Descripcion</th><th>Subcategoria</th><th>Categoria</th>' +
    '<th>Tipo</th><th class="numero">Monto</th><th></th>' +
    '</tr></thead>' +
    '<tbody>' + filas + '</tbody>' +
    '</table>';

  document.getElementById('txResumen').innerHTML =
    lista.length + ' movimientos &nbsp;&middot;&nbsp; <strong>' + formatearMoneda(total) + '</strong>';

  const botones = contenedor.querySelectorAll('.boton-mini');

  for (let i = 0; i < botones.length; i++) {
    botones[i].addEventListener('click', function () {
      eliminarTransaccion(this.dataset.id);
    });
  }
}

async function eliminarTransaccion(id) {
  if (!confirm('Eliminar esta transaccion?')) {
    return;
  }

  try {
    await borrar('/transacciones/' + id);

    mostrarAviso('Transaccion eliminada', 'exito');

    await actualizarTodo();
  } catch (error) {
    mostrarAviso(error.message, 'error');
  }
}

async function guardarTransaccion(evento) {
  evento.preventDefault();

  try {
    const cuerpo = {
      id_usuario: USUARIO,
      id_presupuesto: presupuestoActual,
      anio: anioActual,
      mes: mesActual,
      id_subcategoria: Number(document.getElementById('txSubcategoria').value),
      tipo: document.getElementById('txTipo').value,
      descripcion: document.getElementById('txDescripcion').value,
      monto: Number(document.getElementById('txMonto').value),
      fecha: document.getElementById('txFecha').value,
      metodo_pago: document.getElementById('txMetodo').value,
      creado_por: USUARIO
    };

    const respuesta = await enviar('/transacciones/completa', 'POST', cuerpo);

    if (respuesta.advertencia) {
      mostrarAviso(respuesta.advertencia, 'error');
    } else {
      mostrarAviso('Transaccion registrada', 'exito');
    }

    document.getElementById('txDescripcion').value = '';
    document.getElementById('txMonto').value = '';

    await actualizarTodo();
  } catch (error) {
    mostrarAviso(error.message, 'error');
  }
}

function conectarTransacciones() {
  document.getElementById('formTransaccion').addEventListener('submit', guardarTransaccion);
  document.getElementById('txSubcategoria').addEventListener('change', actualizarTipo);
  document.getElementById('txFiltroTipo').addEventListener('change', cargarTransacciones);
}
