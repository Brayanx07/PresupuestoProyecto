const COLOR_VERDE = '#2F7D5C';
const COLOR_ROJO = '#B0414E';
const COLOR_DORADO = '#C4A265';
const COLOR_MARINO = '#12263F';
const COLOR_MARINO_CLARO = '#4A749F';

const PALETA = ['#12263F', '#2B4E77', '#C4A265', '#2F7D5C', '#B0414E',
  '#6E7C8C', '#8A6D3B', '#4A749F', '#96705A', '#3F6B5E'];

let graficos = {};
let reporteActual = 'r1';

function dibujar(id, configuracion) {
  if (graficos[id]) {
    graficos[id].destroy();
  }

  graficos[id] = new Chart(document.getElementById(id), configuracion);
}

function mostrarReporte(nombre) {
  reporteActual = nombre;

  const reportes = document.querySelectorAll('.reporte');

  for (let i = 0; i < reportes.length; i++) {
    reportes[i].classList.remove('visible');
  }

  document.getElementById(nombre).classList.add('visible');

  const pestanas = document.querySelectorAll('.pestana');

  for (let i = 0; i < pestanas.length; i++) {
    pestanas[i].classList.remove('activa');

    if (pestanas[i].dataset.reporte === nombre) {
      pestanas[i].classList.add('activa');
    }
  }
}

function etiquetaPeriodo() {
  return NOMBRES_MES[mesActual - 1] + ' ' + anioActual;
}

async function reporteBalance() {
  const anioDesde = Number(document.getElementById('r1AnioDesde').value);
  const mesDesde = Number(document.getElementById('r1MesDesde').value);
  const anioHasta = Number(document.getElementById('r1AnioHasta').value);
  const mesHasta = Number(document.getElementById('r1MesHasta').value);

  const lista = await pedir('/reportes/balance-rango?usuario=' + USUARIO +
    '&presupuesto=' + presupuestoActual +
    '&anio_desde=' + anioDesde + '&mes_desde=' + mesDesde +
    '&anio_hasta=' + anioHasta + '&mes_hasta=' + mesHasta);

  const etiquetas = [];
  const ingresos = [];
  const gastos = [];
  const ahorros = [];
  const balances = [];

  let filas = '';

  for (let i = 0; i < lista.length; i++) {
    const m = lista[i];

    etiquetas.push(NOMBRES_MES[m.MES - 1] + ' ' + m.ANIO);
    ingresos.push(Number(m.TOTAL_INGRESOS));
    gastos.push(Number(m.TOTAL_GASTOS));
    ahorros.push(Number(m.TOTAL_AHORROS));
    balances.push(Number(m.BALANCE_FINAL));

    filas = filas +
      '<tr>' +
      '<td>' + NOMBRES_MES[m.MES - 1] + ' ' + m.ANIO + '</td>' +
      '<td class="numero">' + formatearMoneda(m.TOTAL_INGRESOS) + '</td>' +
      '<td class="numero">' + formatearMoneda(m.TOTAL_GASTOS) + '</td>' +
      '<td class="numero">' + formatearMoneda(m.TOTAL_AHORROS) + '</td>' +
      '<td class="numero"><strong>' + formatearMoneda(m.BALANCE_FINAL) + '</strong></td>' +
      '</tr>';
  }

  document.getElementById('r1Tabla').innerHTML =
    '<table><thead><tr><th>Periodo</th>' +
    '<th class="numero">Ingresos</th><th class="numero">Gastos</th>' +
    '<th class="numero">Ahorro</th><th class="numero">Balance</th>' +
    '</tr></thead><tbody>' + filas + '</tbody></table>';

  dibujar('r1Grafico', {
    type: 'bar',
    data: {
      labels: etiquetas,
      datasets: [
        { label: 'Ingresos', data: ingresos, backgroundColor: COLOR_VERDE },
        { label: 'Gastos', data: gastos, backgroundColor: COLOR_ROJO },
        { label: 'Ahorro', data: ahorros, backgroundColor: COLOR_DORADO },
        {
          label: 'Balance',
          data: balances,
          type: 'line',
          borderColor: COLOR_MARINO,
          backgroundColor: COLOR_MARINO,
          borderWidth: 2,
          tension: 0.3
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom' } }
    }
  });
}

async function reporteGastosCategoria() {
  document.getElementById('r2Subtitulo').textContent =
    'Porcentaje del gasto total de ' + etiquetaPeriodo();

  const lista = await pedir('/reportes/gastos-categoria?usuario=' + USUARIO +
    '&presupuesto=' + presupuestoActual +
    '&anio=' + anioActual + '&mes=' + mesActual);

  const contenedor = document.getElementById('r2Tabla');

  if (lista.length === 0) {
    contenedor.innerHTML = '<div class="vacio">No hay gastos en este periodo</div>';

    if (graficos['r2Grafico']) {
      graficos['r2Grafico'].destroy();
      graficos['r2Grafico'] = null;
    }

    return;
  }

  const etiquetas = [];
  const montos = [];
  const colores = [];

  let filas = '';
  let total = 0;

  for (let i = 0; i < lista.length; i++) {
    const c = lista[i];

    etiquetas.push(c.NOMBRE_CATEGORIA);
    montos.push(Number(c.MONTO_GASTADO));
    colores.push(PALETA[i % PALETA.length]);

    total = total + Number(c.MONTO_GASTADO);

    filas = filas +
      '<tr>' +
      '<td><span class="punto" style="background:' + PALETA[i % PALETA.length] + '"></span> ' +
      escapar(c.NOMBRE_CATEGORIA) + '</td>' +
      '<td class="numero">' + formatearMoneda(c.MONTO_GASTADO) + '</td>' +
      '<td class="numero">' + Number(c.PORCENTAJE).toFixed(1) + '%</td>' +
      '<td class="numero">' + c.CANTIDAD_TRANSACCIONES + '</td>' +
      '</tr>';
  }

  contenedor.innerHTML =
    '<table><thead><tr><th>Categoria</th>' +
    '<th class="numero">Monto</th><th class="numero">Porcentaje</th>' +
    '<th class="numero">Movimientos</th>' +
    '</tr></thead><tbody>' + filas + '</tbody>' +
    '<tfoot><tr><td>Total</td><td class="numero">' + formatearMoneda(total) +
    '</td><td class="numero">100%</td><td></td></tr></tfoot></table>';

  dibujar('r2Grafico', {
    type: 'doughnut',
    data: {
      labels: etiquetas,
      datasets: [{ data: montos, backgroundColor: colores, borderWidth: 2, borderColor: '#FFFFFF' }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom' } }
    }
  });
}

async function reporteCumplimiento() {
  document.getElementById('r3Subtitulo').textContent =
    'Planificado contra ejecutado en ' + etiquetaPeriodo();

  const tipo = document.getElementById('r3Tipo').value;

  let ruta = '/reportes/cumplimiento?presupuesto=' + presupuestoActual +
    '&anio=' + anioActual + '&mes=' + mesActual;

  if (tipo !== '') {
    ruta = ruta + '&tipo=' + tipo;
  }

  const lista = await pedir(ruta);
  const contenedor = document.getElementById('r3Tabla');

  if (lista.length === 0) {
    contenedor.innerHTML = '<div class="vacio">Este presupuesto no tiene renglones</div>';

    if (graficos['r3Grafico']) {
      graficos['r3Grafico'].destroy();
      graficos['r3Grafico'] = null;
    }

    return;
  }

  const etiquetas = [];
  const presupuestado = [];
  const ejecutado = [];

  let filas = '';
  let categoriaPrevia = null;
  let subtotalAsignado = 0;
  let subtotalEjecutado = 0;

  for (let i = 0; i < lista.length; i++) {
    const r = lista[i];

    if (categoriaPrevia !== null && r.NOMBRE_CATEGORIA !== categoriaPrevia) {
      filas = filas + filaSubtotal(categoriaPrevia, subtotalAsignado, subtotalEjecutado);
      subtotalAsignado = 0;
      subtotalEjecutado = 0;
    }

    categoriaPrevia = r.NOMBRE_CATEGORIA;
    subtotalAsignado = subtotalAsignado + Number(r.MONTO_PRESUPUESTADO);
    subtotalEjecutado = subtotalEjecutado + Number(r.MONTO_EJECUTADO);

    etiquetas.push(r.NOMBRE_SUBCATEGORIA);
    presupuestado.push(Number(r.MONTO_PRESUPUESTADO));
    ejecutado.push(Number(r.MONTO_EJECUTADO));

    filas = filas +
      '<tr>' +
      '<td>' + escapar(r.NOMBRE_SUBCATEGORIA) + '</td>' +
      '<td>' + escapar(r.NOMBRE_CATEGORIA) + '</td>' +
      '<td class="numero">' + formatearMoneda(r.MONTO_PRESUPUESTADO) + '</td>' +
      '<td class="numero">' + formatearMoneda(r.MONTO_EJECUTADO) + '</td>' +
      '<td class="numero">' + formatearMoneda(r.DIFERENCIA) + '</td>' +
      '<td class="numero"><span class="semaforo ' + claseSemaforo(Number(r.PORCENTAJE)) + '">' +
      Number(r.PORCENTAJE).toFixed(1) + '%</span></td>' +
      '</tr>';
  }

  if (categoriaPrevia !== null) {
    filas = filas + filaSubtotal(categoriaPrevia, subtotalAsignado, subtotalEjecutado);
  }

  contenedor.innerHTML =
    '<table><thead><tr>' +
    '<th>Subcategoria</th><th>Categoria</th>' +
    '<th class="numero">Presupuestado</th><th class="numero">Ejecutado</th>' +
    '<th class="numero">Diferencia</th><th class="numero">Ejecucion</th>' +
    '</tr></thead><tbody>' + filas + '</tbody></table>';

  dibujar('r3Grafico', {
    type: 'bar',
    data: {
      labels: etiquetas,
      datasets: [
        { label: 'Presupuestado', data: presupuestado, backgroundColor: COLOR_MARINO_CLARO },
        { label: 'Ejecutado', data: ejecutado, backgroundColor: COLOR_DORADO }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom' } }
    }
  });
}

function filaSubtotal(categoria, asignado, ejecutado) {
  let porcentaje = 0;

  if (asignado > 0) {
    porcentaje = (ejecutado / asignado) * 100;
  }

  return '<tr class="subtotal">' +
    '<td colspan="2">Total ' + escapar(categoria) + '</td>' +
    '<td class="numero">' + formatearMoneda(asignado) + '</td>' +
    '<td class="numero">' + formatearMoneda(ejecutado) + '</td>' +
    '<td class="numero">' + formatearMoneda(asignado - ejecutado) + '</td>' +
    '<td class="numero">' + porcentaje.toFixed(1) + '%</td>' +
    '</tr>';
}

async function reporteObligaciones() {
  document.getElementById('r4Subtitulo').textContent =
    'Cumplimiento de pagos fijos en ' + etiquetaPeriodo();

  const lista = await pedir('/reportes/obligaciones?usuario=' + USUARIO +
    '&presupuesto=' + presupuestoActual +
    '&anio=' + anioActual + '&mes=' + mesActual);

  const contenedor = document.getElementById('r4Tabla');

  if (lista.length === 0) {
    contenedor.innerHTML = '<div class="vacio">No hay obligaciones vigentes</div>';

    if (graficos['r4Grafico']) {
      graficos['r4Grafico'].destroy();
      graficos['r4Grafico'] = null;
    }

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
      '<td>' + escapar(o.NOMBRE_OBLIGACION) + '</td>' +
      '<td>' + escapar(o.NOMBRE_CATEGORIA) + '</td>' +
      '<td class="numero">' + formatearMoneda(o.MONTO_FIJO_MENSUAL) + '</td>' +
      '<td class="numero">' + o.DIA_VENCIMIENTO + '</td>' +
      '<td><span class="insignia estado-' + o.ESTADO_PAGO + '">' + o.ESTADO_PAGO + '</span></td>' +
      '<td>' + textoObligacion(o) + '</td>' +
      '</tr>';
  }

  contenedor.innerHTML =
    '<table><thead><tr>' +
    '<th>Obligacion</th><th>Categoria</th><th class="numero">Monto</th>' +
    '<th class="numero">Dia</th><th>Estado</th><th>Detalle</th>' +
    '</tr></thead><tbody>' + filas + '</tbody></table>';

  dibujar('r4Grafico', {
    type: 'doughnut',
    data: {
      labels: ['Pagadas', 'Pendientes', 'Vencidas'],
      datasets: [{
        data: [pagadas, pendientes, vencidas],
        backgroundColor: [COLOR_VERDE, COLOR_DORADO, COLOR_ROJO],
        borderWidth: 2,
        borderColor: '#FFFFFF'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom' } }
    }
  });
}

async function cargarReportes() {
  if (!presupuestoActual) {
    return;
  }

  await reporteBalance();
  await reporteGastosCategoria();
  await reporteCumplimiento();
  await reporteObligaciones();
}

function acomodarRango() {
  const presupuesto = buscarPresupuesto();

  if (!presupuesto) {
    return;
  }

  document.getElementById('r1AnioDesde').value = presupuesto.ANIO_INICIO;
  document.getElementById('r1MesDesde').value = presupuesto.MES_INICIO;
  document.getElementById('r1AnioHasta').value = presupuesto.ANIO_FIN;
  document.getElementById('r1MesHasta').value = presupuesto.MES_FIN;
}

function conectarReportes() {
  const pestanas = document.querySelectorAll('.pestana');

  for (let i = 0; i < pestanas.length; i++) {
    pestanas[i].addEventListener('click', function () {
      mostrarReporte(this.dataset.reporte);
    });
  }

  document.getElementById('r1Actualizar').addEventListener('click', async function () {
    try {
      await reporteBalance();
    } catch (error) {
      mostrarAviso(error.message, 'error');
    }
  });

  document.getElementById('r3Tipo').addEventListener('change', async function () {
    try {
      await reporteCumplimiento();
    } catch (error) {
      mostrarAviso(error.message, 'error');
    }
  });

  document.getElementById('rpImprimir').addEventListener('click', function () {
    window.print();
  });

  llenarMeses('r1MesDesde');
  llenarMeses('r1MesHasta');
}
