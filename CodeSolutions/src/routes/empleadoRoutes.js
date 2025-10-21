const express = require('express'); 
const router = express.Router();  

// Importar el controlador de empleados
const EmpleadoController = require('../controllers/EmpleadoController');

// Importar middleware de validación
const validarCampos = require('../middlewares/verificarDatos');

// Listar empleados (página principal)
router.get('/', EmpleadoController.listar);

// Mostrar formulario para agregar nuevo empleado
router.get('/crear', EmpleadoController.mostrarFormulario);

// Procesar formulario de nuevo empleado con validación
router.post('/crear', validarCampos, EmpleadoController.crear);

// Mostrar formulario para editar empleado
router.get('/editar/:id', EmpleadoController.mostrarFormularioEditar);

// Guardar cambios del empleado editado
router.put('/editar/:id', validarCampos, EmpleadoController.editar);

// Eliminar empleado
router.delete('/eliminar/:id', EmpleadoController.eliminar);

module.exports = router;
