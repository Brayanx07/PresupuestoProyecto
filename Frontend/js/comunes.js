const NOMBRES_MES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

function formatearMoneda(monto) {
  const numero = Number(monto) || 0;

  return 'L ' + numero.toLocaleString('es-HN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function formatearFecha(valor) {
  if (!valor) {
    return '';
  }

  const fecha = new Date(valor);

  return fecha.getDate() + ' de ' + NOMBRES_MES[fecha.getMonth()].toLowerCase();
}

function escapar(texto) {
  if (texto === null || texto === undefined) {
    return '';
  }

  return String(texto)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
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

function llenarMeses(id) {
  const selector = document.getElementById(id);

  if (!selector) {
    return;
  }

  selector.innerHTML = '';

  for (let i = 0; i < NOMBRES_MES.length; i++) {
    const opcion = document.createElement('option');

    opcion.value = i + 1;
    opcion.textContent = NOMBRES_MES[i];

    selector.appendChild(opcion);
  }
}

function fechaDelMes(dia) {
  const ultimoDia = new Date(anioActual, mesActual, 0).getDate();
  const diaUsado = Math.min(dia, ultimoDia);

  const mes = mesActual < 10 ? '0' + mesActual : String(mesActual);
  const texto = diaUsado < 10 ? '0' + diaUsado : String(diaUsado);

  return anioActual + '-' + mes + '-' + texto;
}

function tipoDeSubcategoria(idSubcategoria) {
  for (let i = 0; i < arbolCategorias.length; i++) {
    const rama = arbolCategorias[i];

    for (let j = 0; j < rama.subcategorias.length; j++) {
      if (rama.subcategorias[j].ID_SUBCATEGORIA === idSubcategoria) {
        return rama.categoria.TIPO_CATEGORIA;
      }
    }
  }

  return 'gasto';
}

function textoObligacion(obligacion) {
  if (obligacion.ESTADO_PAGO === 'pagado') {
    const fecha = formatearFecha(obligacion.FECHA_ULTIMO_PAGO);

    return fecha === '' ? 'Pagado' : 'Pagado el ' + fecha;
  }

  if (obligacion.DIAS_PARA_VENCER < 0) {
    return 'Vencio hace ' + Math.abs(obligacion.DIAS_PARA_VENCER) + ' dias';
  }

  if (obligacion.DIAS_PARA_VENCER === 0) {
    return 'Vence hoy';
  }

  return 'Faltan ' + obligacion.DIAS_PARA_VENCER + ' dias';
}
