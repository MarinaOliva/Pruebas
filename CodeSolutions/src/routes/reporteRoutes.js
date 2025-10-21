const express = require('express');
const router = express.Router();

const ReporteController = require('../controllers/ReporteController');

// Página principal de reportes (menú)
router.get('/', (req, res) => {
  const opciones = [
    { nombre: 'Horas trabajadas', url: '/reportes/horas' },
    { nombre: 'Avance de proyectos', url: '/reportes/avance' },
    { nombre: 'Historial', url: '/reportes/historial' }
  ];

  // Este console.log sirve para ver si la ruta se ejecuta
  console.log('Renderizando menú con opciones:', opciones);

  res.render('reportes/menu', { titulo: 'Reportes', opciones });
});


// Generar reporte de horas trabajadas por empleado
router.get('/horas', ReporteController.generarHoras);

// Generar reporte de avance de proyectos
router.get('/avance', ReporteController.generarAvance);

// Ver historial de reportes generados
router.get('/historial', ReporteController.historial);

// Ver detalle de un reporte específico
router.get('/detalle/:id', ReporteController.verDetalle);

module.exports = router;
