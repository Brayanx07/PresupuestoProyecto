const USUARIO = 1;

let presupuestoActual = null;
let anioActual = 2026;
let mesActual = 1;
let listaPresupuestos = [];
let arbolCategorias = [];
let seccionActual = 'inicio';
let resolverModal = null;

const CARGADORES = {
  inicio: cargarInicio,
  transacciones: cargarTransacciones,
  presupuesto: cargarDetalles,
  obligaciones: cargarObligaciones,
  categorias: cargarCategorias,
  reportes: cargarReportes
};

function confirmar(titulo, mensaje, textoBoton) {
  document.getElementById('modalTitulo').textContent = titulo;
  document.getElementById('modalMensaje').textContent = mensaje;
  document.getElementById('modalConfirmar').textContent = textoBoton;
  document.getElementById('modal').classList.add('visible');

  return new Promise(function (resolver) {
    resolverModal = resolver;
  });
}

function cerrarModal(respuesta) {
  document.getElementById('modal').classList.remove('visible');

  if (resolverModal) {
    resolverModal(respuesta);
    resolverModal = null;
  }
}

function conectarModal() {
  document.getElementById('modalCancelar').addEventListener('click', function () {
    cerrarModal(false);
  });

  document.getElementById('modalConfirmar').addEventListener('click', function () {
    cerrarModal(true);
  });

  document.getElementById('modal').addEventListener('click', function (evento) {
    if (evento.target === this) {
      cerrarModal(false);
    }
  });

  document.addEventListener('keydown', function (evento) {
    if (evento.key === 'Escape' && resolverModal) {
      cerrarModal(false);
    }
  });
}

function mostrarAviso(texto, tipo) {
  const aviso = document.getElementById('aviso');

  aviso.textContent = texto;
  aviso.className = 'aviso ' + tipo;

  setTimeout(function () {
    aviso.className = 'aviso';
  }, 5000);
}

function actualizarPeriodo() {
  document.getElementById('periodoTexto').textContent =
    NOMBRES_MES[mesActual - 1] + ' ' + anioActual;
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

  acomodarRango();
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
  } else {
    presupuestoActual = null;
  }
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

  llenarSubcategorias('txSubcategoria');
  llenarSubcategorias('obSubcategoria');
  llenarCategorias('scCategoria');

  actualizarTipo();
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

async function cargarInicio() {
  const datos = await pedir('/reportes/balance?usuario=' + USUARIO +
    '&presupuesto=' + presupuestoActual +
    '&anio=' + anioActual +
    '&mes=' + mesActual);

  document.getElementById('kpiIngresos').textContent = formatearMoneda(datos.TOTAL_INGRESOS);
  document.getElementById('kpiGastos').textContent = formatearMoneda(datos.TOTAL_GASTOS);
  document.getElementById('kpiAhorro').textContent = formatearMoneda(datos.TOTAL_AHORROS);
  document.getElementById('kpiBalance').textContent = formatearMoneda(datos.BALANCE_FINAL);

  const lista = await pedir('/reportes/obligaciones?usuario=' + USUARIO +
    '&presupuesto=' + presupuestoActual +
    '&anio=' + anioActual +
    '&mes=' + mesActual);

  const contenedor = document.getElementById('listaAlertas');

  if (lista.length === 0) {
    contenedor.innerHTML = '<div class="vacio">No hay obligaciones vigentes</div>';
    return;
  }

  let bloques = '';

  for (let i = 0; i < lista.length; i++) {
    const o = lista[i];

    bloques = bloques +
      '<div class="alerta">' +
      '<span class="marca-estado ' + o.ESTADO_PAGO + '"></span>' +
      '<span class="alerta-nombre">' + escapar(o.NOMBRE_OBLIGACION) + '</span>' +
      '<span class="alerta-detalle">' + textoObligacion(o) + '</span>' +
      '<span class="alerta-monto">' + formatearMoneda(o.MONTO_FIJO_MENSUAL) + '</span>' +
      '</div>';
  }

  contenedor.innerHTML = bloques;
}

async function refrescar() {
  try {
    actualizarPeriodo();

    if (!presupuestoActual) {
      return;
    }

    await CARGADORES[seccionActual]();
  } catch (error) {
    mostrarAviso(error.message, 'error');
  }
}

function mostrarSeccion(nombre) {
  seccionActual = nombre;

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

  refrescar();
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
    refrescar();
  });

  document.getElementById('selectorAnio').addEventListener('change', function () {
    anioActual = Number(this.value);
    refrescar();
  });

  document.getElementById('selectorMes').addEventListener('change', function () {
    mesActual = Number(this.value);
    refrescar();
  });

  conectarModal();
  conectarTransacciones();
  conectarPresupuesto();
  conectarObligaciones();
  conectarCategorias();
  conectarReportes();
}

async function iniciar() {
  try {
    conectarEventos();
    await cargarPresupuestos();
    await cargarArbol();
    await refrescar();
  } catch (error) {
    mostrarAviso(error.message, 'error');
  }
}

iniciar();
