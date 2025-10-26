// Importación de módulos
const Proyecto = require('../models/Proyecto');
const Empleado = require('../models/Empleado');
const Tarea = require('../models/Tarea');

// Lista de estados válidos (coincide con el modelo)
const estadosValidos = ["Pendiente", "En progreso", "Finalizado", "Cancelado"];

// Exportación del controlador con operaciones CRUD
module.exports = {

  // Listar todos los proyectos (Función original - Sin cambios)
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

  // Mostrar formulario de creación (Función original - Sin cambios)
  mostrarFormularioCrear: async (req, res) => {
    try {
      const empleados = await Empleado.find().lean();
      res.render('proyectos/crear', { empleados, estadosValidos, datos: {} });
    } catch (error) {
      console.error('Error cargando empleados para crear proyecto:', error);
      res.render('proyectos/crear', { empleados: [], estadosValidos, datos: {} });
    }
  },

  // --- FUNCIÓN 'mostrarFormularioEditar' CORREGIDA ---
  // Carga la lista unificada de empleados (directos + tareas)
  mostrarFormularioEditar: async (req, res) => {
    try {
      const proyecto = await Proyecto.findById(req.params.id).lean();
      const empleados = await Empleado.find().lean();
      // ¡Necesitamos las tareas de ESTE proyecto!
      const tareas = await Tarea.find({ proyectoId: req.params.id }).lean();

      // --- Lógica de unificación (igual a 'listar') ---
      // IDs de empleados asignados manualmente
      const idsManual = proyecto.empleadosAsignados?.map(e => e.toString()) || [];
      // IDs de empleados de tareas de este proyecto
      const idsDeTareas = tareas
        .flatMap(t => t.empleadosAsignados?.map(e => e.toString()) || []);
      // Unir y eliminar duplicados
      const idsUnidos = [...new Set([...idsManual, ...idsDeTareas])];
      // --- FIN Lógica de unificación ---

      // Sobrescribimos 'empleadosAsignados' del proyecto SÓLO PARA LA VISTA
      // Le pasamos la lista de IDs unificados (como strings)
      // Tu PUG ya sabe comparar esto (con .map(String).includes(...) )
      const proyectoParaVista = {
        ...proyecto,
        empleadosAsignados: idsUnidos
      };

      res.render('proyectos/editar', {
        proyecto: proyectoParaVista, // Pasamos el proyecto modificado
        empleados,
        estadosValidos
      });

    } catch (error) {
      console.error('Error cargando formulario de edición:', error);
      // En caso de error, es mejor enviar un objeto 'proyecto' vacío o parcial
      const empleadosFallback = await Empleado.find().lean();
      res.render('proyectos/editar', { 
        proyecto: { ...req.body, _id: req.params.id, empleadosAsignados: [] }, // Objeto parcial
        empleados: empleadosFallback, 
        estadosValidos 
      });
    }
  },

  // Crear un nuevo proyecto (Función original - Sin cambios)
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

  // --- FUNCIÓN 'actualizar' CORREGIDA ---
  // Compara la lista nueva con la vieja y actualiza proyecto + tareas
  actualizar: async (req, res) => {
    const idProyecto = req.params.id;

    try {
      // --- 1. Obtener la NUEVA lista de IDs del formulario ---
      let idsNuevos = [];
      if (req.body.empleadosAsignados) {
        idsNuevos = Array.isArray(req.body.empleadosAsignados)
          ? req.body.empleadosAsignados
          : [req.body.empleadosAsignados];
      }
      // (Nos aseguramos de que sean strings para comparar)
      idsNuevos = idsNuevos.map(String);


      // --- 2. Obtener la VIEJA lista de IDs (la lógica de 'mostrarFormularioEditar') ---
      const proyectoActual = await Proyecto.findById(idProyecto); // Sin .lean()
      const tareas = await Tarea.find({ proyectoId: idProyecto }).lean();

      const idsManual = proyectoActual.empleadosAsignados?.map(e => e.toString()) || [];
      const idsDeTareas = tareas
        .flatMap(t => t.empleadosAsignados?.map(e => e.toString()) || []);
      const idsViejosUnidos = [...new Set([...idsManual, ...idsDeTareas])];


      // --- 3. Calcular diferencias ---
      
      // EMPLEADOS A QUITAR: Estaban en la vieja lista, pero no en la nueva
      const idsParaQuitar = idsViejosUnidos.filter(id => !idsNuevos.includes(id));

      // EMPLEADOS A AGREGAR: Están en la nueva lista, pero no estaban en la lista *manual*
      // (Solo los agregamos a la lista manual del proyecto)
      const idsParaAgregar = idsNuevos.filter(id => !idsManual.includes(id));


      // --- 4. Ejecutar acciones ---

      // Acción de QUITAR (Usamos la lógica de tu 'quitarEmpleado')
      if (idsParaQuitar.length > 0) {
        // Quitar de las tareas del proyecto
        await Tarea.updateMany(
          { proyectoId: idProyecto },
          { $pull: { empleadosAsignados: { $in: idsParaQuitar } } } // Quita todos los IDs
        );
      }
      
      // Acción de ACTUALIZAR el proyecto
      // La nueva lista de 'empleadosAsignados' del proyecto será:
      // Los que ya estaban MENOS los que quitamos, MAS los que agregamos.
      const idsManualActualizados = idsManual
          .filter(id => !idsParaQuitar.includes(id)) // Quita los desmarcados
          .concat(idsParaAgregar); // Añade los nuevos marcados
      
      // Eliminamos duplicados por si acaso
      const nuevaListaManual = [...new Set(idsManualActualizados)];
      
      // Actualizamos el proyecto con la info del body Y la nueva lista manual
      await Proyecto.findByIdAndUpdate(
        idProyecto,
        {
          nombre: req.body.nombre,
          descripcion: req.body.descripcion,
          cliente: req.body.cliente,
          estado: req.body.estado,
          empleadosAsignados: nuevaListaManual // La lista limpia
        },
        { new: true, runValidators: true }
      );

      res.redirect('/proyectos');

    } catch (error) {
      console.error('Error al actualizar proyecto:', error);
      // Recargamos los datos para la vista de error
      const empleados = await Empleado.find().lean();
      res.render('proyectos/editar', { 
        error: true, 
        proyecto: { ...req.body, _id: idProyecto }, // Reenviamos lo que mandó el user
        empleados, 
        estadosValidos 
      });
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