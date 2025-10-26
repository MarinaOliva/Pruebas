const Tarea = require('../models/Tarea');
const Empleado = require('../models/Empleado');
const Proyecto = require('../models/Proyecto');

// Lista de estados válidos para tareas
const estadosValidos = ['Pendiente', 'En progreso', 'Finalizado', 'Eliminada'];

module.exports = {
  // Listar todas las tareas
  listar: async (req, res) => {
    try {
      // Obtener tareas con referencias a empleados y proyecto
      const tareas = await Tarea.find()
        .populate('empleadosAsignados', 'nombre rol')
        .populate('proyectoId', 'nombre')
        .lean();

      // Ordenar: primero Pendiente/En progreso, al final Finalizado/Eliminada
      const prioridad = { 'Pendiente': 1, 'En progreso': 2, 'Finalizado': 3, 'Eliminada': 3 };
      tareas.sort((a, b) => {
        if ((prioridad[a.estado] || 99) === (prioridad[b.estado] || 99)) {
          return new Date(a.fechaCreacion) - new Date(b.fechaCreacion);
        }
        return (prioridad[a.estado] || 99) - (prioridad[b.estado] || 99);
      });

      // Obtener empleados y proyectos para los select del formulario
      const empleados = await Empleado.find().lean();
      const proyectos = await Proyecto.find().lean();

      res.render('tareas/listar', { tareas, empleados, proyectos, estadosValidos });
    } catch (error) {
      console.error('Error listando tareas:', error);
      res.status(500).render('tareas/listar', { tareas: [], empleados: [], proyectos: [], estadosValidos });
    }
  },

  // Mostrar formulario de creación
  mostrarFormularioCrear: async (req, res) => {
    try {
      const empleados = await Empleado.find().lean();
      const proyectos = await Proyecto.find().lean();
      res.render('tareas/crear', { empleados, proyectos, estadosValidos });
    } catch (error) {
      console.error('Error mostrando formulario de creación:', error);
      res.status(500).render('error', { mensajeError: 'No se pudo cargar el formulario' });
    }
  },

  // Mostrar formulario de edición
  mostrarFormularioEditar: async (req, res) => {
    try {
      const tarea = await Tarea.findById(req.params.id)
        .populate('empleadosAsignados')
        .populate('proyectoId')
        .lean();

      if (!tarea) return res.status(404).render('error', { mensajeError: 'Tarea no encontrada' });

      const empleados = await Empleado.find().lean();
      const proyectos = await Proyecto.find().lean();

      res.render('tareas/editar', { tarea, empleados, proyectos, estadosValidos });
    } catch (error) {
      console.error('Error mostrando formulario de edición:', error);
      res.status(500).render('error', { mensajeError: 'Error al cargar la tarea' });
    }
  },

  // Crear una nueva tarea
  crear: async (req, res) => {
    try {
      const { proyectoId, nombre, horasEstimadas, horasRegistradas, estado, empleadosAsignados } = req.body;

      // Asegurarse de que empleadosAsignados sea un array
      const empleadosArray = empleadosAsignados
        ? Array.isArray(empleadosAsignados) ? empleadosAsignados : [empleadosAsignados]
        : [];

      // Crear nueva tarea en Mongo
      const nuevaTarea = new Tarea({
        proyectoId,
        nombre,
        horasEstimadas: parseFloat(horasEstimadas) || 0,
        horasRegistradas: parseFloat(horasRegistradas) || 0,
        empleadosAsignados: empleadosArray,
        estado: estado || 'Pendiente'
      });

      await nuevaTarea.save();
      res.redirect('/tareas');
    } catch (error) {
      console.error('Error creando tarea:', error);
      const empleados = await Empleado.find().lean();
      const proyectos = await Proyecto.find().lean();
      res.render('tareas/crear', { error: true, datos: req.body, empleados, proyectos, estadosValidos });
    }
  },

  // Actualizar tarea
  actualizar: async (req, res) => {
    try {
      const { nombre, proyectoId, horasEstimadas, horasRegistradas, estado, empleadosAsignados } = req.body;

      const empleadosArray = empleadosAsignados
        ? Array.isArray(empleadosAsignados) ? empleadosAsignados : [empleadosAsignados]
        : [];

      await Tarea.findByIdAndUpdate(req.params.id, {
        nombre,
        proyectoId,
        horasEstimadas: parseFloat(horasEstimadas) || 0,
        horasRegistradas: parseFloat(horasRegistradas) || 0,
        estado,
        empleadosAsignados: empleadosArray
      });

      res.redirect('/tareas');
    } catch (error) {
      console.error('Error actualizando tarea:', error);
      const empleados = await Empleado.find().lean();
      const proyectos = await Proyecto.find().lean();
      res.render('tareas/editar', { error: true, tarea: req.body, empleados, proyectos, estadosValidos });
    }
  },

  // Cambiar estado de la tarea
  cambiarEstado: async (req, res) => {
    try {
      await Tarea.findByIdAndUpdate(req.params.id, { estado: req.body.estado });
      res.redirect('/tareas');
    } catch (error) {
      console.error('Error cambiando estado de la tarea:', error);
      res.status(500).redirect('/tareas');
    }
  },

  // Eliminar tarea (baja lógica)
  eliminar: async (req, res) => {
    try {
      await Tarea.findByIdAndUpdate(req.params.id, { estado: 'Eliminada' });
      res.redirect('/tareas');
    } catch (error) {
      console.error('Error eliminando tarea:', error);
      res.status(500).redirect('/tareas');
    }
  }
};
