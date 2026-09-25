async function cargarCategorias() {
  const contenedor = document.getElementById('catLista');

  if (arbolCategorias.length === 0) {
    contenedor.innerHTML = '<div class="vacio">Todavia no hay categorias</div>';
    document.getElementById('catResumen').textContent = '';
    return;
  }

  const soloPresupuesto = document.getElementById('catFiltro').value === 'presupuesto';
  const montos = {};

  let asignadas = 0;

  if (presupuestoActual) {
    const detalles = await pedir('/detalles?presupuesto=' + presupuestoActual);

    for (let i = 0; i < detalles.length; i++) {
      montos[detalles[i].ID_SUBCATEGORIA] = detalles[i].MONTO_MENSUAL_ASIGNADO;
      asignadas = asignadas + 1;
    }
  }

  let bloques = '';
  let mostradas = 0;

  for (let i = 0; i < arbolCategorias.length; i++) {
    const rama = arbolCategorias[i];
    const categoria = rama.categoria;

    let fichas = '';
    let enPresupuesto = 0;

    for (let j = 0; j < rama.subcategorias.length; j++) {
      const sub = rama.subcategorias[j];
      const asignada = montos[sub.ID_SUBCATEGORIA] !== undefined;

      if (asignada) {
        enPresupuesto = enPresupuesto + 1;
      }

      if (soloPresupuesto && !asignada) {
        continue;
      }

      const marca = sub.ES_DEFECTO ? ' <span class="fija">por defecto</span>' : '';
      const apagada = sub.ACTIVA ? '' : ' inactiva';

      const monto = asignada
        ? '<span class="asignado">' + formatearMoneda(montos[sub.ID_SUBCATEGORIA]) + '</span>'
        : '';

      fichas = fichas +
        '<li class="ficha' + apagada + (asignada ? ' usada' : '') + '">' +
        '<span>' + escapar(sub.NOMBRE_SUBCATEGORIA) + marca + '</span>' +
        monto +
        '<button class="boton-mini" data-sub="' + sub.ID_SUBCATEGORIA + '">Eliminar</button>' +
        '</li>';
    }

    if (soloPresupuesto && enPresupuesto === 0) {
      continue;
    }

    mostradas = mostradas + 1;

    bloques = bloques +
      '<article class="grupo">' +
      '<header>' +
      '<span class="punto" style="background:' + escapar(categoria.COLOR_HEX || '#999999') + '"></span>' +
      '<h4>' + escapar(categoria.NOMBRE_CATEGORIA) + '</h4>' +
      '<span class="insignia ' + categoria.TIPO_CATEGORIA + '">' + categoria.TIPO_CATEGORIA + '</span>' +
      '<button class="boton-mini" data-cat="' + categoria.ID_CATEGORIA + '">Eliminar categoria</button>' +
      '</header>' +
      '<ul class="fichas">' + fichas + '</ul>' +
      '</article>';
  }

  if (mostradas === 0) {
    const presupuesto = buscarPresupuesto();
    const nombre = presupuesto ? presupuesto.NOMBRE_PRESUPUESTO : 'este presupuesto';

    contenedor.innerHTML =
      '<div class="vacio">' + escapar(nombre) + ' todavia no usa ninguna categoria. ' +
      'Asignale montos desde la pantalla Presupuesto y van a aparecer aca.</div>';
  } else {
    contenedor.innerHTML = bloques;
  }

  document.getElementById('catResumen').innerHTML =
    '<strong>' + asignadas + '</strong> subcategorias con monto asignado en este presupuesto';

  const botonesCat = contenedor.querySelectorAll('[data-cat]');

  for (let i = 0; i < botonesCat.length; i++) {
    botonesCat[i].addEventListener('click', function () {
      eliminarCategoria(this.dataset.cat);
    });
  }

  const botonesSub = contenedor.querySelectorAll('[data-sub]');

  for (let i = 0; i < botonesSub.length; i++) {
    botonesSub[i].addEventListener('click', function () {
      eliminarSubcategoria(this.dataset.sub);
    });
  }
}

async function refrescarCategorias() {
  await cargarArbol();
  await refrescar();
}

async function eliminarCategoria(id) {
  const aceptado = await confirmar(
    'Eliminar categoria',
    'Se elimina junto con su subcategoria por defecto. Si tiene movimientos o esta usada en algun presupuesto, la base lo va a impedir.',
    'Eliminar'
  );

  if (!aceptado) {
    return;
  }

  try {
    await borrar('/categorias/' + id);

    mostrarAviso('Categoria eliminada', 'exito');

    await refrescarCategorias();
  } catch (error) {
    mostrarAviso(error.message, 'error');
  }
}

async function eliminarSubcategoria(id) {
  const aceptado = await confirmar(
    'Eliminar subcategoria',
    'Si tiene transacciones o esta asignada a un presupuesto, la base lo va a impedir. En ese caso conviene desactivarla.',
    'Eliminar'
  );

  if (!aceptado) {
    return;
  }

  try {
    await borrar('/subcategorias/' + id);

    mostrarAviso('Subcategoria eliminada', 'exito');

    await refrescarCategorias();
  } catch (error) {
    mostrarAviso(error.message, 'error');
  }
}

async function guardarCategoria(evento) {
  evento.preventDefault();

  try {
    await enviar('/categorias', 'POST', {
      id_usuario: USUARIO,
      nombre: document.getElementById('ctNombre').value,
      descripcion: document.getElementById('ctDescripcion').value,
      tipo: document.getElementById('ctTipo').value,
      icono: null,
      color: document.getElementById('ctColor').value,
      orden: Number(document.getElementById('ctOrden').value),
      creado_por: USUARIO
    });

    mostrarAviso('Categoria creada con su subcategoria General', 'exito');

    document.getElementById('ctNombre').value = '';
    document.getElementById('ctDescripcion').value = '';

    await refrescarCategorias();
  } catch (error) {
    mostrarAviso(error.message, 'error');
  }
}

async function guardarSubcategoria(evento) {
  evento.preventDefault();

  try {
    await enviar('/subcategorias', 'POST', {
      id_categoria: Number(document.getElementById('scCategoria').value),
      nombre: document.getElementById('scNombre').value,
      descripcion: document.getElementById('scDescripcion').value,
      creado_por: USUARIO
    });

    mostrarAviso('Subcategoria creada', 'exito');

    document.getElementById('scNombre').value = '';
    document.getElementById('scDescripcion').value = '';

    await refrescarCategorias();
  } catch (error) {
    mostrarAviso(error.message, 'error');
  }
}

function conectarCategorias() {
  document.getElementById('formCategoria').addEventListener('submit', guardarCategoria);
  document.getElementById('formSubcategoria').addEventListener('submit', guardarSubcategoria);
  document.getElementById('catFiltro').addEventListener('change', cargarCategorias);
}
