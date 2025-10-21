const fs = require('fs').promises;
const Tarea = require('../models/Tarea');
const path = require('path');

// Archivos JSON
const archivoTareas = path.join(__dirname, '../data/tareas.json');
const archivoEmpleados = path.join(__dirname, '../data/empleados.json');
const archivoProyectos = path.join(__dirname, '../data/proyectos.json');

// Lista de estados válidos para tareas
const estadosValidos = ['Pendiente', 'En progreso', 'Finalizado', 'Eliminada'];

// Función para leer datos almacenados en un archivo JSON
async function leerDatos(archivo) {
  try {
    const datos = await fs.readFile(archivo, 'utf8');
    return JSON.parse(datos);
  } catch {
    await fs.writeFile(archivo, '[]');
    return [];
  }
}

// Función para guardar tareas
async function guardarTareas(tareas) {
  await fs.writeFile(archivoTareas, JSON.stringify(tareas, null, 2));
}

module.exports = {
  // Listar todas las tareas
  listar: async (req, res) => {
    try {
      const tareas = await leerDatos(archivoTareas);
      const empleados = await leerDatos(archivoEmpleados);
      const proyectos = await leerDatos(archivoProyectos);

      // Normalizar empleadosAsignados siempre como array
      const tareasNormalizadas = tareas.map(t => ({
        ...t,
        empleadosAsignados: Array.isArray(t.empleadosAsignados) ? t.empleadosAsignados : []
      }));

      // Ordenar: primero Pendiente/En progreso, al final Finalizado/Eliminada
      tareasNormalizadas.sort((a, b) => {
        const prioridad = { 'Pendiente': 1, 'En progreso': 2, 'Finalizado': 3, 'Eliminada': 3 };
        // Si ambos tienen la misma prioridad, ordenar por fecha de creación
        if ((prioridad[a.estado] || 99) === (prioridad[b.estado] || 99)) {
          return new Date(a.fechaCreacion) - new Date(b.fechaCreacion);
        }
        return (prioridad[a.estado] || 99) - (prioridad[b.estado] || 99);
      });

      res.render('tareas/listar', { tareas: tareasNormalizadas, empleados, proyectos, estadosValidos });
    } catch (error) {
      console.error('Error listando tareas:', error);
      res.status(500).render('tareas/listar', { tareas: [], empleados: [], proyectos: [], estadosValidos });
    }
  },

  // Mostrar formulario de creación
  mostrarFormularioCrear: async (req, res) => {
    const empleados = await leerDatos(archivoEmpleados);
    const proyectos = await leerDatos(archivoProyectos);
    res.render('tareas/crear', { empleados, proyectos, estadosValidos });
  },

  // Mostrar formulario de edición
  mostrarFormularioEditar: async (req, res) => {
    const tareas = await leerDatos(archivoTareas);
    const empleados = await leerDatos(archivoEmpleados);
    const proyectos = await leerDatos(archivoProyectos);

    const tarea = tareas.find(t => t.id === req.params.id);
    if (!tarea) return res.status(404).render('error', { mensajeError: 'Tarea no encontrada' });

    res.render('tareas/editar', { tarea, empleados, proyectos, estadosValidos });
  },

  // Crear una nueva tarea
  crear: async (req, res) => {
    const { proyectoId, nombre, horasEstimadas, horasRegistradas, estado, empleadosAsignados } = req.body;
    try {
      const tareas = await leerDatos(archivoTareas);

      // Asegurarse de que empleadosAsignados sea un array
      const empleadosArray = empleadosAsignados
        ? Array.isArray(empleadosAsignados) ? empleadosAsignados : [empleadosAsignados]
        : [];

      const nuevaTarea = new Tarea(
        proyectoId,
        nombre,
        parseFloat(horasEstimadas) || 0,
        parseFloat(horasRegistradas) || 0,
        empleadosArray,
        estado || 'Pendiente'
      );

      tareas.push(nuevaTarea);
      await guardarTareas(tareas);
      res.redirect('/tareas');
    } catch (error) {
      console.error('Error creando tarea:', error.message);
      console.error(error.stack);

      const empleados = await leerDatos(archivoEmpleados);
      const proyectos = await leerDatos(archivoProyectos);
      res.render('tareas/crear', {
        error: true,
        datos: req.body,
        empleados,
        proyectos,
        estadosValidos
      });
    }
  },

  // Actualizar tarea
  actualizar: async (req, res) => {
    try {
      const tareas = await leerDatos(archivoTareas);

      const empleadosArray = req.body.empleadosAsignados
        ? Array.isArray(req.body.empleadosAsignados) ? req.body.empleadosAsignados : [req.body.empleadosAsignados]
        : [];

      const tareasActualizadas = tareas.map(t =>
        t.id === req.params.id
          ? {
              ...t,
              nombre: req.body.nombre,
              proyectoId: req.body.proyectoId,
              horasEstimadas: parseFloat(req.body.horasEstimadas) || 0,
              horasRegistradas: parseFloat(req.body.horasRegistradas) || 0,
              estado: req.body.estado,
              empleadosAsignados: empleadosArray
            }
          : t
      );

      await guardarTareas(tareasActualizadas);
      res.redirect('/tareas');
    } catch (error) {
      console.error('Error actualizando tarea:', error);
      const empleados = await leerDatos(archivoEmpleados);
      const proyectos = await leerDatos(archivoProyectos);
      res.render('tareas/editar', { error: true, tarea: req.body, empleados, proyectos, estadosValidos });
    }
  },

  // Cambiar estado de la tarea
  cambiarEstado: async (req, res) => {
    try {
      const tareas = await leerDatos(archivoTareas);
      const tareasActualizadas = tareas.map(t =>
        t.id === req.params.id ? { ...t, estado: req.body.estado } : t
      );
      await guardarTareas(tareasActualizadas);
      res.redirect('/tareas');
    } catch (error) {
      console.error('Error cambiando estado de la tarea:', error);
      res.status(500).redirect('/tareas');
    }
  },

  // Eliminar tarea (baja lógica)
  eliminar: async (req, res) => {
    try {
      const tareas = await leerDatos(archivoTareas);
      const tareasActualizadas = tareas.map(t =>
        t.id === req.params.id ? { ...t, estado: 'Eliminada' } : t
      );
      await guardarTareas(tareasActualizadas);
      res.redirect('/tareas');
    } catch (error) {
      console.error('Error eliminando tarea:', error);
      res.status(500).redirect('/tareas');
    }
  }
};
