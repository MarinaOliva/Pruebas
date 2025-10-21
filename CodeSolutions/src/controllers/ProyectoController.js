// Importación de módulos
const fs = require('fs').promises; 
const path = require('path');
const Proyecto = require('../models/Proyecto'); 

// Rutas de los archivos JSON
const archivoProyectos = path.join(__dirname, '../data/proyectos.json');
const archivoTareas = path.join(__dirname, '../data/tareas.json');
const archivoEmpleados = path.join(__dirname, '../data/empleados.json');

// Lista de estados válidos (coincide con el modelo)
const estadosValidos = ["Pendiente", "En progreso", "Finalizado", "Cancelado"];

// Función para obtener todos los proyectos
const obtenerProyectos = async () => {
  try {
    const datos = await fs.readFile(archivoProyectos, 'utf8');
    const proyectos = JSON.parse(datos);
    return proyectos.filter(p => p?.nombre); 
  } catch (error) {
    console.error('Error leyendo proyectos:', error);
    await fs.writeFile(archivoProyectos, '[]');
    return [];
  }
};

// Función para guardar proyectos en el JSON
const guardarProyectos = async (proyectos) => {
  await fs.writeFile(archivoProyectos, JSON.stringify(proyectos, null, 2));
};

// Función para leer tareas
const obtenerTareas = async () => {
  try {
    const datos = await fs.readFile(archivoTareas, 'utf8');
    return JSON.parse(datos);
  } catch (error) {
    console.error('Error leyendo tareas:', error);
    await fs.writeFile(archivoTareas, '[]');
    return [];
  }
};

// Función para guardar tareas
const guardarTareas = async (tareas) => {
  await fs.writeFile(archivoTareas, JSON.stringify(tareas, null, 2));
};

// Función para leer empleados
const obtenerEmpleados = async () => {
  try {
    const datos = await fs.readFile(archivoEmpleados, 'utf8');
    return JSON.parse(datos);
  } catch (error) {
    console.error('Error leyendo empleados:', error);
    await fs.writeFile(archivoEmpleados, '[]');
    return [];
  }
};

// Exportación del controlador con operaciones CRUD
module.exports = {
 // Listar todos los proyectos
listar: async (req, res) => {
  try {
    const proyectos = await obtenerProyectos();
    const empleados = await obtenerEmpleados();
    const tareas = await obtenerTareas();

    const proyectosConNombres = proyectos
      .filter(p => p.estado !== 'Cancelado' && p.estado !== 'Finalizado')
      .map(proyecto => {
        // IDs de empleados asignados manualmente
        const idsManual = proyecto.empleadosAsignados || [];
        // IDs de empleados de tareas de este proyecto
        const idsDeTareas = tareas
          .filter(t => t.proyectoId === proyecto.id)
          .flatMap(t => t.empleadosAsignados || []);
        // Unir y eliminar duplicados
        const idsUnidos = [...new Set([...idsManual, ...idsDeTareas])];
        //Obtener objetos de empleados
        const empleadosAsignados = empleados
          .filter(e => idsUnidos.includes(e.id))
          .map(e => ({ nombre: e.nombre, rol: e.rol, id: e.id }));

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
      const empleados = await obtenerEmpleados();
      res.render('proyectos/crear', { empleados, estadosValidos, datos: {} });
    } catch (error) {
      console.error('Error cargando empleados para crear proyecto:', error);
      res.render('proyectos/crear', { empleados: [], estadosValidos, datos: {} });
    }
  },

  // Mostrar formulario de edición con los datos del proyecto
  mostrarFormularioEditar: async (req, res) => {
    try {
      const proyectos = await obtenerProyectos();
      const proyecto = proyectos.find(p => p.id === req.params.id);

      const empleados = await obtenerEmpleados();
      res.render('proyectos/editar', { proyecto, empleados, estadosValidos });
    } catch (error) {
      console.error('Error cargando formulario de edición:', error);
      res.render('proyectos/editar', { proyecto: null, empleados: [], estadosValidos });
    }
  },

  // Crear un nuevo proyecto
  crear: async (req, res) => {
    try {
      const proyectos = await obtenerProyectos();

      // Normalizamos los empleados asignados (checkboxes)
      let empleadosAsignados = [];
      if (req.body.empleadosAsignados) {
        empleadosAsignados = Array.isArray(req.body.empleadosAsignados)
          ? req.body.empleadosAsignados
          : [req.body.empleadosAsignados];
      }

      const nuevoProyecto = new Proyecto(
        req.body.nombre,
        req.body.descripcion,
        req.body.cliente,
        req.body.estado || 'Pendiente',
        empleadosAsignados
      );

      proyectos.push(nuevoProyecto);
      await guardarProyectos(proyectos);

      console.log('Proyecto creado correctamente:', nuevoProyecto); // para debug
      res.redirect('/proyectos');
    } catch (error) {
      console.error('Error al crear proyecto:', error); // para debug
      const empleados = await obtenerEmpleados();
      res.render('proyectos/crear', { error: true, datos: req.body, empleados, estadosValidos });
    }
  },

  // Actualizar un proyecto existente
  actualizar: async (req, res) => {
    try {
      const proyectos = await obtenerProyectos();

      // Normalizamos los empleados asignados (checkboxes)
      let empleadosAsignados = [];
      if (req.body.empleadosAsignados) {
        empleadosAsignados = Array.isArray(req.body.empleadosAsignados)
          ? req.body.empleadosAsignados
          : [req.body.empleadosAsignados];
      }

      const actualizados = proyectos.map(p =>
        p.id === req.params.id
          ? {
              ...p,
              nombre: req.body.nombre || p.nombre,
              descripcion: req.body.descripcion || p.descripcion,
              cliente: req.body.cliente || p.cliente,
              estado: req.body.estado || p.estado,
              empleadosAsignados
            }
          : p
      );

      await guardarProyectos(actualizados);
      res.redirect('/proyectos');
    } catch (error) {
      console.error('Error al actualizar proyecto:', error);
      const empleados = await obtenerEmpleados();
      res.render('proyectos/editar', { error: true, proyecto: req.body, empleados, estadosValidos });
    }
  },

  // Eliminar un proyecto (baja lógica)
  eliminar: async (req, res) => {
    try {
      const proyectos = await obtenerProyectos();
      const actualizados = proyectos.map(p =>
        p.id === req.params.id ? { ...p, estado: 'Cancelado' } : p
      );
      await guardarProyectos(actualizados);
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
      const proyectos = await obtenerProyectos();
      const proyecto = proyectos.find(p => p.id === idProyecto);
      if (!proyecto) return res.status(404).send('Proyecto no encontrado');

      // Quitar del proyecto
      proyecto.empleadosAsignados = proyecto.empleadosAsignados?.filter(eId => eId !== idEmpleado) || [];
      await guardarProyectos(proyectos);

      // Quitar de las tareas del proyecto
      const tareas = await obtenerTareas();
      const tareasActualizadas = tareas.map(t =>
        t.proyectoId === idProyecto && t.empleadoId === idEmpleado
          ? { ...t, empleadoId: null }
          : t
      );
      await guardarTareas(tareasActualizadas);

      res.redirect(`/proyectos/editar/${idProyecto}`);
    } catch (error) {
      console.error('Error al quitar empleado del proyecto:', error);
      res.status(500).send('Error al quitar empleado del proyecto');
    }
  }
};
