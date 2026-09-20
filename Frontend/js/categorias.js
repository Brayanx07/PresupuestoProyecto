async function cargarCategorias() {
  const contenedor = document.getElementById('catLista');

  if (arbolCategorias.length === 0) {
    contenedor.innerHTML = '<div class="vacio">Todavia no hay categorias</div>';
    return;
  }

  contenedor.innerHTML = '';

  for (let i = 0; i < arbolCategorias.length; i++) {
    const rama = arbolCategorias[i];
    const categoria = rama.categoria;

    const bloque = document.createElement('article');
    bloque.className = 'grupo';

    let subs = '';

    for (let j = 0; j < rama.subcategorias.length; j++) {
      const sub = rama.subcategorias[j];
      const marca = sub.ES_DEFECTO ? ' <span class="fija">por defecto</span>' : '';
      const apagada = sub.ACTIVA ? '' : ' inactiva';

      subs = subs +
        '<li class="ficha' + apagada + '">' +
        '<span>' + sub.NOMBRE_SUBCATEGORIA + marca + '</span>' +
        '<button class="boton-mini" data-sub="' + sub.ID_SUBCATEGORIA + '">Eliminar</button>' +
        '</li>';
    }

    bloque.innerHTML =
      '<header>' +
      '<span class="punto" style="background:' + (categoria.COLOR_HEX || '#999') + '"></span>' +
      '<h4>' + categoria.NOMBRE_CATEGORIA + '</h4>' +
      '<span class="insignia ' + categoria.TIPO_CATEGORIA + '">' + categoria.TIPO_CATEGORIA + '</span>' +
      '<button class="boton-mini" data-cat="' + categoria.ID_CATEGORIA + '">Eliminar categoria</button>' +
      '</header>' +
      '<ul class="fichas">' + subs + '</ul>';

    contenedor.appendChild(bloque);
  }

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
  await cargarListas();
  await cargarCategorias();
  await actualizarTodo();
}

async function eliminarCategoria(id) {
  if (!confirm('Eliminar esta categoria?')) {
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
  if (!confirm('Eliminar esta subcategoria?')) {
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
}
