// Importamos Express para crear las rutas
const express = require('express');
const router = express.Router(); 

// Ruta principal de la aplicación
router.get('/', (req, res) => {
  // Mostramos la página de inicio con título de la página y mensaje de bienvenida
  res.render('index', {
    titulo: 'Inicio - Code Solutions',
    mensaje: 'Bienvenido al sistema de gestión' 
  });
});

// Hacemos que estas rutas estén disponibles para el archivo principal
module.exports = router;
