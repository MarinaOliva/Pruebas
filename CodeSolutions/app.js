// Dependencias principales
const express = require('express');
const path = require('path');
const methodOverride = require('method-override');

const app = express();

// ======================
// Middlewares globales
// ======================

// Manejo de datos en formato JSON
app.use(express.json());

// Leer datos de formularios
app.use(express.urlencoded({ extended: true }));

// Soporte para PUT y DELETE en formularios
app.use(methodOverride('_method'));

// Carpeta pública para archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Registro de cada solicitud HTTP
const registro = require('./src/middlewares/registro');
app.use(registro);

// ======================
// Vistas
// ======================

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'src/views'));

// ======================
// Rutas
// ======================

const rutasPrincipales = require('./src/routes/index');
const rutasProyectos = require('./src/routes/proyectoRoutes');
const rutasEmpleados = require('./src/routes/empleadoRoutes');
const rutasTareas = require('./src/routes/tareaRoutes');
const rutasReportes = require('./src/routes/reporteRoutes');

// Rutas públicas
app.use('/', rutasPrincipales);

// Rutas del sistema
app.use('/proyectos', rutasProyectos);
app.use('/empleados', rutasEmpleados);
app.use('/tareas', rutasTareas);
app.use('/reportes', rutasReportes);

// ======================
// Manejo de errores
// ======================

// Página no encontrada (404)
app.use((req, res) => {
  res.status(404).render('error', {
    titulo: 'Página no encontrada',
    mensajeError: 'Lo sentimos, no se ha podido encontrar lo que busca'
  });
});

// Error interno del servidor (500)
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).render('error', {
    titulo: 'Error en el sistema',
    mensajeError: 'Ocurrió un problema. Por favor intente más tarde.'
  });
});

// ======================
// Inicio del servidor
// ======================
const PUERTO = process.env.PUERTO || 3000;

app.listen(PUERTO, () => {
  console.log(`\nServidor corriendo en: http://localhost:${PUERTO}`);
});
