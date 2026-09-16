const firebird = require('node-firebird');
require('dotenv').config();

const opciones = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_RUTA,
  user: process.env.DB_USUARIO,
  password: process.env.DB_PASSWORD,
  lowercase_keys: false
};

function ejecutar(sql, parametros) {
  return new Promise(function (resolve, reject) {
    firebird.attach(opciones, function (error, bd) {
      if (error) {
        reject(error);
        return;
      }

      bd.query(sql, parametros, function (error, resultado) {
        bd.detach();

        if (error) {
          reject(error);
          return;
        }

        resolve(resultado);
      });
    });
  });
}

module.exports = { ejecutar };