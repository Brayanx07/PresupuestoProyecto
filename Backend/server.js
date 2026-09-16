const express = require('express');
const cors = require('cors');
require('dotenv').config();

const bd = require('./db/conexion');
const rutasCategorias = require('./rutas/categorias');
const rutasSubcategorias = require('./rutas/subcategorias');
const rutasUsuarios = require('./rutas/usuarios');
const rutasPresupuestos = require('./rutas/presupuestos');

const app = express();

app.use(cors());
app.use(express.json());
app.use('/categorias', rutasCategorias);
app.use('/subcategorias', rutasSubcategorias);
app.use('/usuarios', rutasUsuarios);
app.use('/presupuestos', rutasPresupuestos);


app.get('/prueba', async function (peticion, respuesta) {
  try {
    const filas = await bd.ejecutar('SELECT NOMBRES, APELLIDOS FROM USUARIO', []);
    respuesta.json(filas);
  } catch (error) {
    respuesta.status(500).json({ mensaje: error.message });
  }
});

const puerto = process.env.PUERTO;

app.listen(puerto, function () {
  console.log('Servidor corriendo en el puerto ' + puerto);
});