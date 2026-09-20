const URL_API = 'http://localhost:3000';

async function pedir(ruta) {
  const respuesta = await fetch(URL_API + ruta);
  const datos = await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(datos.mensaje);
  }

  return datos;
}

async function enviar(ruta, metodo, cuerpo) {
  const respuesta = await fetch(URL_API + ruta, {
    method: metodo,
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(cuerpo)
  });

  const datos = await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(datos.mensaje);
  }

  return datos;
}

async function borrar(ruta) {
  const respuesta = await fetch(URL_API + ruta, {
    method: 'DELETE'
  });

  const datos = await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(datos.mensaje);
  }

  return datos;
}