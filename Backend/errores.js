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

  respuesta.status(500).json({ mensaje: texto });
}

module.exports = { responderError };