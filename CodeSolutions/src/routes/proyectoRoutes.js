const express = require('express');
const router = express.Router();

// Traer el controlador de proyectos
const ProyectoController = require('../controllers/ProyectoController');

// Listar todos los proyectos
router.get('/', ProyectoController.listar);

// Mostrar formulario para crear un proyecto
router.get('/crear', ProyectoController.mostrarFormularioCrear);

// Guardar un proyecto nuevo
router.post('/crear', ProyectoController.crear);

// Mostrar formulario para editar un proyecto
router.get('/editar/:id', ProyectoController.mostrarFormularioEditar);

// Actualizar proyecto existente
router.put('/editar/:id', ProyectoController.actualizar);

// Eliminar proyecto (baja lógica)
router.delete('/eliminar/:id', ProyectoController.eliminar);

// Quitar un empleado de un proyecto
router.delete('/:idProyecto/empleados/:idEmpleado', ProyectoController.quitarEmpleado);

module.exports = router;
