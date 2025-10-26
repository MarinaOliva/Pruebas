// Importar módulos y modelos
const Reporte = require('../models/Reporte');
const Tarea = require('../models/Tarea');
const Empleado = require('../models/Empleado');
const Proyecto = require('../models/Proyecto');

// Controlador de reportes
module.exports = {

  // Reporte 1: Horas trabajadas por empleado
  generarHoras: async (req, res) => {
    try {
      const [tareas, empleados] = await Promise.all([
        Tarea.find().lean(),
        Empleado.find().lean()
      ]);

      const contenido = empleados.map(emp => {
        const tareasEmpleado = tareas.filter(t => 
          t.empleadosAsignados?.some(id => id.toString() === emp._id.toString())
        );

        return {
          empleadoId: emp._id,
          nombreEmpleado: emp.nombre,
          horasRegistradasTotales: tareasEmpleado.reduce((sum, t) => sum + (t.horasRegistradas || 0), 0),
          tareas: tareasEmpleado.map(t => ({
            tareaId: t._id,
            nombreTarea: t.nombre,
            horasRegistradas: t.horasRegistradas || 0
          }))
        };
      });

      const reporte = new Reporte({
        tipo: "Horas trabajadas por empleado",
        fechaGeneracion: new Date(),
        contenido
      });

      await reporte.save();
      res.render('reportes/listar', { titulo: 'Reporte de Horas', reporte });

    } catch (error) {
      console.error('Error generando reporte de horas:', error);
      res.status(500).render('error', { 
        titulo: 'Error', 
        mensajeError: 'No se pudo generar el reporte de horas' 
      });
    }
  },

  // Reporte 2: Avance de proyectos
  generarAvance: async (req, res) => {
    try {
      const [tareas, proyectos] = await Promise.all([
        Tarea.find().lean(),
        Proyecto.find().lean()
      ]);

      const contenido = proyectos.map(proy => {
        const tareasProyecto = tareas.filter(t => t.proyectoId?.toString() === proy._id.toString());
        const finalizadas = tareasProyecto.filter(t => t.estado === "Finalizado").length;

        return {
          proyectoId: proy._id,
          nombreProyecto: proy.nombre,
          totalTareas: tareasProyecto.length,
          tareasFinalizadas: finalizadas,
          porcentajeAvance: tareasProyecto.length > 0
            ? Math.round((finalizadas / tareasProyecto.length) * 100)
            : 0
        };
      });

      const reporte = new Reporte({
        tipo: "Avance de proyectos",
        fechaGeneracion: new Date(),
        contenido
      });

      await reporte.save();
      res.render('reportes/listar', { titulo: 'Reporte de Avance', reporte });

    } catch (error) {
      console.error('Error generando reporte de avance:', error);
      res.status(500).render('error', { 
        titulo: 'Error', 
        mensajeError: 'No se pudo generar el reporte de avance' 
      });
    }
  },

  // Historial de reportes
  historial: async (req, res) => {
    try {
      const reportes = await Reporte.find().sort({ fechaGeneracion: -1 }).lean();
      res.render('reportes/historial', { titulo: 'Historial de Reportes', reportes });
    } catch (error) {
      console.error('Error cargando historial de reportes:', error);
      res.status(500).render('error', { 
        titulo: 'Error', 
        mensajeError: 'No se pudo cargar el historial de reportes' 
      });
    }
  },

  // Ver un reporte en detalle
  verDetalle: async (req, res) => {
    try {
      const reporte = await Reporte.findById(req.params.id).lean();

      if (!reporte) {
        return res.status(404).render('error', { 
          titulo: 'No encontrado', 
          mensajeError: 'El reporte no existe' 
        });
      }

      res.render('reportes/listar', { 
        titulo: `Detalle de ${reporte.tipo}`, 
        reporte 
      });

    } catch (error) {
      console.error('Error mostrando detalle del reporte:', error);
      res.status(500).render('error', { 
        titulo: 'Error', 
        mensajeError: 'No se pudo mostrar el detalle del reporte' 
      });
    }
  }
};
