function responderError(error, respuesta) {
  const texto = error.message;

  if (texto.startsWith('Exception')) {
    const partes = texto.split(', ');
    let mensaje = '';

    for (let i = 2; i < partes.length; i++) {
            if (partes[i].startsWith('At ')) {
        break;
      }

      if (mensaje !== '') {
        mensaje = mensaje + ', ';
      }

      mensaje = mensaje + partes[i];
    }

    respuesta.status(409).json({ mensaje: mensaje });
    return;
  }

  if (texto.indexOf('PRIMARY or UNIQUE KEY') >= 0) {
    respuesta.status(409).json({ mensaje: 'Ese registro ya existe' });
    return;
  }

  if (texto.indexOf('FOREIGN KEY') >= 0) {
    respuesta.status(409).json({ mensaje: 'No se puede completar la operacion porque hay registros relacionados' });
    return;
  }


  respuesta.status(500).json({ mensaje: texto });
}

module.exports = { responderError };