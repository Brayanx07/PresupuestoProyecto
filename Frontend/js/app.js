const USUARIO = 1;

const NOMBRES_MES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

let presupuestoActual = null;
let anioActual = 2026;
let mesActual = 1;
let listaPresupuestos = [];
let arbolCategorias = [];

function formatearMoneda(monto) {
  const numero = Number(monto) || 0;

  return 'L ' + numero.toLocaleString('es-HN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function formatearFecha(valor) {
  const fecha = new Date(valor);

  return fecha.getDate() + ' de ' + NOMBRES_MES[fecha.getMonth()].toLowerCase();
}

function mostrarAviso(texto, tipo) {
  const aviso = document.getElementById('aviso');

  aviso.textContent = texto;
  aviso.className = 'aviso ' + tipo;

  setTimeout(function () {
    aviso.className = 'aviso';
  }, 5000);
}

function mostrarSeccion(nombre) {
  const secciones = document.querySelectorAll('.seccion');

  for (let i = 0; i < secciones.length; i++) {
    secciones[i].classList.remove('visible');
  }

  document.getElementById(nombre).classList.add('visible');

  const opciones = document.querySelectorAll('.opcion');

  for (let i = 0; i < opciones.length; i++) {
    opciones[i].classList.remove('activa');

    if (opciones[i].dataset.seccion === nombre) {
      opciones[i].classList.add('activa');
    }
  }
}

function actualizarPeriodo() {
  document.getElementById('periodoTexto').textContent =
    NOMBRES_MES[mesActual - 1] + ' ' + anioActual;
}

async function cargarPresupuestos() {
  listaPresupuestos = await pedir('/presupuestos?usuario=' + USUARIO);

  const selector = document.getElementById('selectorPresupuesto');

  selector.innerHTML = '';

  for (let i = 0; i < listaPresupuestos.length; i++) {
    const opcion = document.createElement('option');

    opcion.value = listaPresupuestos[i].ID_PRESUPUESTO;
    opcion.textContent = listaPresupuestos[i].NOMBRE_PRESUPUESTO;

    selector.appendChild(opcion);
  }

  if (listaPresupuestos.length > 0) {
    presupuestoActual = Number(selector.value);
    acomodarPeriodo();
  }
}

function buscarPresupuesto() {
  for (let i = 0; i < listaPresupuestos.length; i++) {
    if (listaPresupuestos[i].ID_PRESUPUESTO === presupuestoActual) {
      return listaPresupuestos[i];
    }
  }

  return null;
}

function acomodarPeriodo() {
  const presupuesto = buscarPresupuesto();

  if (!presupuesto) {
    return;
  }

  anioActual = presupuesto.ANIO_INICIO;
  mesActual = presupuesto.MES_INICIO;

  document.getElementById('selectorAnio').value = anioActual;
  document.getElementById('selectorMes').value = mesActual;
}

function dentroDeVigencia() {
  const presupuesto = buscarPresupuesto();

  if (!presupuesto) {
    return false;
  }

  const actual = (anioActual * 12) + mesActual;
  const desde = (presupuesto.ANIO_INICIO * 12) + presupuesto.MES_INICIO;
  const hasta = (presupuesto.ANIO_FIN * 12) + presupuesto.MES_FIN;

  return actual >= desde && actual <= hasta;
}

async function cargarArbol() {
  arbolCategorias = [];

  const categorias = await pedir('/categorias?usuario=' + USUARIO);

  for (let i = 0; i < categorias.length; i++) {
    const subcategorias = await pedir('/subcategorias?categoria=' + categorias[i].ID_CATEGORIA);

    arbolCategorias.push({
      categoria: categorias[i],
      subcategorias: subcategorias
    });
  }
}

function llenarSubcategorias(id) {
  const selector = document.getElementById(id);

  if (!selector) {
    return;
  }

  selector.innerHTML = '';

  for (let i = 0; i < arbolCategorias.length; i++) {
    const rama = arbolCategorias[i];

    if (rama.subcategorias.length === 0) {
      continue;
    }

    const grupo = document.createElement('optgroup');
    grupo.label = rama.categoria.NOMBRE_CATEGORIA;

    for (let j = 0; j < rama.subcategorias.length; j++) {
      const opcion = document.createElement('option');

      opcion.value = rama.subcategorias[j].ID_SUBCATEGORIA;
      opcion.textContent = rama.subcategorias[j].NOMBRE_SUBCATEGORIA;
      opcion.dataset.tipo = rama.categoria.TIPO_CATEGORIA;

      grupo.appendChild(opcion);
    }

    selector.appendChild(grupo);
  }
}

function llenarCategorias(id) {
  const selector = document.getElementById(id);

  if (!selector) {
    return;
  }

  selector.innerHTML = '';

  for (let i = 0; i < arbolCategorias.length; i++) {
    const opcion = document.createElement('option');

    opcion.value = arbolCategorias[i].categoria.ID_CATEGORIA;
    opcion.textContent = arbolCategorias[i].categoria.NOMBRE_CATEGORIA;

    selector.appendChild(opcion);
  }
}

async function cargarListas() {
  await cargarArbol();

  llenarSubcategorias('txSubcategoria');
  llenarSubcategorias('dtSubcategoria');
  llenarSubcategorias('obSubcategoria');
  llenarCategorias('scCategoria');

  actualizarTipo();
}

async function cargarBalance() {
  const datos = await pedir('/reportes/balance?usuario=' + USUARIO +
    '&presupuesto=' + presupuestoActual +
    '&anio=' + anioActual +
    '&mes=' + mesActual);

  document.getElementById('kpiIngresos').textContent = formatearMoneda(datos.TOTAL_INGRESOS);
  document.getElementById('kpiGastos').textContent = formatearMoneda(datos.TOTAL_GASTOS);
  document.getElementById('kpiAhorro').textContent = formatearMoneda(datos.TOTAL_AHORROS);
  document.getElementById('kpiBalance').textContent = formatearMoneda(datos.BALANCE_FINAL);
}

function textoObligacion(obligacion) {
  if (obligacion.ESTADO_PAGO === 'pagado' && obligacion.FECHA_ULTIMO_PAGO) {
    return 'Pagado el ' + formatearFecha(obligacion.FECHA_ULTIMO_PAGO);
  }

  if (obligacion.ALERTA) {
    return obligacion.ALERTA;
  }

  return 'Vence el ' + obligacion.DIA_VENCIMIENTO + ' de ' + NOMBRES_MES[mesActual - 1].toLowerCase();
}

async function cargarAlertas() {
  const lista = await pedir('/reportes/obligaciones?usuario=' + USUARIO +
    '&presupuesto=' + presupuestoActual +
    '&anio=' + anioActual +
    '&mes=' + mesActual);

  const contenedor = document.getElementById('listaAlertas');

  contenedor.innerHTML = '';

  if (lista.length === 0) {
    contenedor.innerHTML = '<div class="vacio">No hay obligaciones vigentes</div>';
    return;
  }

  for (let i = 0; i < lista.length; i++) {
    const obligacion = lista[i];

    const fila = document.createElement('div');
    fila.className = 'alerta';

    const marca = document.createElement('span');
    marca.className = 'marca-estado ' + obligacion.ESTADO_PAGO;

    const nombre = document.createElement('span');
    nombre.className = 'alerta-nombre';
    nombre.textContent = obligacion.NOMBRE_OBLIGACION;

    const detalle = document.createElement('span');
    detalle.className = 'alerta-detalle';
    detalle.textContent = textoObligacion(obligacion);

    const monto = document.createElement('span');
    monto.className = 'alerta-monto';
    monto.textContent = formatearMoneda(obligacion.MONTO_FIJO_MENSUAL);

    fila.appendChild(marca);
    fila.appendChild(nombre);
    fila.appendChild(detalle);
    fila.appendChild(monto);

    contenedor.appendChild(fila);
  }
}

async function actualizarTodo() {
  try {
    actualizarPeriodo();

    if (!presupuestoActual) {
      return;
    }

    await cargarBalance();
    await cargarAlertas();
    await cargarTransacciones();
    await cargarDetalles();
    await cargarObligaciones();
  } catch (error) {
    mostrarAviso(error.message, 'error');
  }
}

function conectarEventos() {
  const opciones = document.querySelectorAll('.opcion');

  for (let i = 0; i < opciones.length; i++) {
    opciones[i].addEventListener('click', function () {
      mostrarSeccion(this.dataset.seccion);
    });
  }

  document.getElementById('selectorPresupuesto').addEventListener('change', function () {
    presupuestoActual = Number(this.value);
    acomodarPeriodo();
    actualizarTodo();
  });

  document.getElementById('selectorAnio').addEventListener('change', function () {
    anioActual = Number(this.value);
    actualizarTodo();
  });

  document.getElementById('selectorMes').addEventListener('change', function () {
    mesActual = Number(this.value);
    actualizarTodo();
  });

  conectarTransacciones();
  conectarPresupuesto();
  conectarObligaciones();
  conectarCategorias();
}

async function iniciar() {
  try {
    conectarEventos();
    await cargarPresupuestos();
    await cargarListas();
    await cargarCategorias();
    await actualizarTodo();
  } catch (error) {
    mostrarAviso(error.message, 'error');
  }
}

iniciar();
