// Importación de módulos
const Proyecto = require('../models/Proyecto');
const Empleado = require('../models/Empleado');
const Tarea = require('../models/Tarea');

// Lista de estados válidos (coincide con el modelo)
const estadosValidos = ["Pendiente", "En progreso", "Finalizado", "Cancelado"];

// Exportación del controlador con operaciones CRUD
module.exports = {

  // Listar todos los proyectos
  listar: async (req, res) => {
    try {
      const proyectos = await Proyecto.find({ estado: { $nin: ['Cancelado', 'Finalizado'] } }).lean();
      const empleados = await Empleado.find().lean();
      const tareas = await Tarea.find().lean();

      const proyectosConNombres = proyectos.map(proyecto => {
        // IDs de empleados asignados manualmente
        const idsManual = proyecto.empleadosAsignados?.map(e => e.toString()) || [];
        // IDs de empleados de tareas de este proyecto
        const idsDeTareas = tareas
          .filter(t => t.proyectoId?.toString() === proyecto._id.toString())
          .flatMap(t => t.empleadosAsignados?.map(e => e.toString()) || []);
        // Unir y eliminar duplicados
        const idsUnidos = [...new Set([...idsManual, ...idsDeTareas])];
        // Obtener objetos de empleados
        const empleadosAsignados = empleados
          .filter(e => idsUnidos.includes(e._id.toString()))
          .map(e => ({ nombre: e.nombre, rol: e.rol, id: e._id }));

        return { ...proyecto, empleadosAsignados };
      });

      res.render('proyectos/listar', { proyectos: proyectosConNombres });
    } catch (error) {
      console.error('Error listando proyectos:', error);
      res.render('proyectos/listar', { proyectos: [] });
    }
  },

  // Mostrar formulario de creación
  mostrarFormularioCrear: async (req, res) => {
    try {
      const empleados = await Empleado.find().lean();
      res.render('proyectos/crear', { empleados, estadosValidos, datos: {} });
    } catch (error) {
      console.error('Error cargando empleados para crear proyecto:', error);
      res.render('proyectos/crear', { empleados: [], estadosValidos, datos: {} });
    }
  },

  // Mostrar formulario de edición con los datos del proyecto
  mostrarFormularioEditar: async (req, res) => {
    try {
      const proyecto = await Proyecto.findById(req.params.id).lean();
      const empleados = await Empleado.find().lean();
      res.render('proyectos/editar', { proyecto, empleados, estadosValidos });
    } catch (error) {
      console.error('Error cargando formulario de edición:', error);
      res.render('proyectos/editar', { proyecto: null, empleados: [], estadosValidos });
    }
  },

  // Crear un nuevo proyecto
  crear: async (req, res) => {
    try {
      // Normalizamos los empleados asignados (checkboxes)
      let empleadosAsignados = [];
      if (req.body.empleadosAsignados) {
        empleadosAsignados = Array.isArray(req.body.empleadosAsignados)
          ? req.body.empleadosAsignados
          : [req.body.empleadosAsignados];
      }

      const nuevoProyecto = new Proyecto({
        nombre: req.body.nombre,
        descripcion: req.body.descripcion,
        cliente: req.body.cliente,
        estado: req.body.estado || 'Pendiente',
        empleadosAsignados
      });

      await nuevoProyecto.save();

      console.log('Proyecto creado correctamente:', nuevoProyecto);
      res.redirect('/proyectos');
    } catch (error) {
      console.error('Error al crear proyecto:', error);
      const empleados = await Empleado.find().lean();
      res.render('proyectos/crear', { error: true, datos: req.body, empleados, estadosValidos });
    }
  },

  // Actualizar un proyecto existente
  actualizar: async (req, res) => {
    try {
      // Normalizamos los empleados asignados (checkboxes)
      let empleadosAsignados = [];
      if (req.body.empleadosAsignados) {
        empleadosAsignados = Array.isArray(req.body.empleadosAsignados)
          ? req.body.empleadosAsignados
          : [req.body.empleadosAsignados];
      }

      await Proyecto.findByIdAndUpdate(
        req.params.id,
        {
          nombre: req.body.nombre,
          descripcion: req.body.descripcion,
          cliente: req.body.cliente,
          estado: req.body.estado,
          empleadosAsignados
        },
        { new: true, runValidators: true }
      );

      res.redirect('/proyectos');
    } catch (error) {
      console.error('Error al actualizar proyecto:', error);
      const empleados = await Empleado.find().lean();
      res.render('proyectos/editar', { error: true, proyecto: req.body, empleados, estadosValidos });
    }
  },

  // Eliminar un proyecto (baja lógica)
  eliminar: async (req, res) => {
    try {
      await Proyecto.findByIdAndUpdate(req.params.id, { estado: 'Cancelado' });
      res.redirect('/proyectos');
    } catch (error) {
      console.error('Error al eliminar proyecto:', error);
      res.status(500).redirect('/proyectos');
    }
  },

  // Quitar un empleado de un proyecto y de sus tareas
  quitarEmpleado: async (req, res) => {
    const { idProyecto, idEmpleado } = req.params;
    try {
      const proyecto = await Proyecto.findById(idProyecto);
      if (!proyecto) return res.status(404).send('Proyecto no encontrado');

      // Quitar del proyecto
      proyecto.empleadosAsignados = proyecto.empleadosAsignados.filter(
        eId => eId.toString() !== idEmpleado
      );
      await proyecto.save();

      // Quitar de las tareas del proyecto
      await Tarea.updateMany(
        { proyectoId: idProyecto },
        { $pull: { empleadosAsignados: idEmpleado } }
      );

      res.redirect(`/proyectos/editar/${idProyecto}`);
    } catch (error) {
      console.error('Error al quitar empleado del proyecto:', error);
      res.status(500).send('Error al quitar empleado del proyecto');
    }
  }
};
