const express = require('express');
const router = express.Router();

// Importar el controlador de tareas
const TareaController = require('../controllers/TareaController');

// Listar todas las tareas
router.get('/', TareaController.listar);

// Mostrar formulario para crear nueva tarea
router.get('/crear', TareaController.mostrarFormularioCrear);

// Guardar una nueva tarea
router.post('/crear', TareaController.crear);

// Mostrar formulario para editar tarea
router.get('/editar/:id', TareaController.mostrarFormularioEditar);

// Guardar los cambios de la tarea editada
router.put('/editar/:id', TareaController.actualizar);

// Eliminar una tarea
router.delete('/eliminar/:id', TareaController.eliminar);

// Cambiar el estado de una tarea
router.put('/estado/:id', TareaController.cambiarEstado);

module.exports = router;
