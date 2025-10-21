const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');
const path = require('path');

// Archivos JSON
const archivoEmpleados = path.join(__dirname, '../data/empleados.json');
const archivoProyectos = path.join(__dirname, '../data/proyectos.json');
const archivoTareas = path.join(__dirname, '../data/tareas.json');
const archivoReportes = path.join(__dirname, '../data/reportes.json');


// Leer JSON
async function leerJSON(archivo) {
  try {
    const datos = await fs.readFile(archivo, 'utf8');
    return JSON.parse(datos);
  } catch {
    await fs.writeFile(archivo, '[]');
    return [];
  }
}

// Guardar un nuevo reporte
async function guardarReporte(reporte) {
  const reportes = await leerJSON(archivoReportes);
  reportes.push(reporte);
  await fs.writeFile(archivoReportes, JSON.stringify(reportes, null, 2));
}

// Controlador de reportes
module.exports = {
  // Reporte 1: Horas trabajadas por empleado
  generarHoras: async (req, res) => {
    try {
      const [tareas, empleados] = await Promise.all([
        leerJSON(archivoTareas),
        leerJSON(archivoEmpleados)
      ]);

      const contenido = empleados.map(emp => {
        const tareasEmpleado = tareas.filter(t => t.empleadosAsignados?.includes(emp.id));
        return {
          empleadoId: emp.id,
          nombreEmpleado: emp.nombre,
          horasRegistradasTotales: tareasEmpleado.reduce((sum, t) => sum + parseInt(t.horasRegistradas || 0), 0),
          tareas: tareasEmpleado.map(t => ({
            tareaId: t.id,
            nombreTarea: t.nombre,
            horasRegistradas: parseInt(t.horasRegistradas || 0)
          }))
        };
      });

      const reporte = {
        id: uuidv4(),
        tipo: "Horas trabajadas por empleado",
        fechaGeneracion: new Date().toISOString(),
        contenido
      };

      await guardarReporte(reporte);
      res.render('reportes/listar', { titulo: 'Reporte de Horas', reporte });

    } catch (error) {
      console.error(error);
      res.status(500).render('error', { titulo: 'Error', mensajeError: 'No se pudo generar el reporte de horas' });
    }
  },

  // Reporte 2: Avance de proyectos
  generarAvance: async (req, res) => {
    try {
      const [tareas, proyectos] = await Promise.all([
        leerJSON(archivoTareas),
        leerJSON(archivoProyectos)
      ]);

      const contenido = proyectos.map(proy => {
        const tareasProyecto = tareas.filter(t => t.proyectoId === proy.id);
        const finalizadas = tareasProyecto.filter(t => t.estado === "Finalizado").length;

        return {
          proyectoId: proy.id,
          nombreProyecto: proy.nombre,
          totalTareas: tareasProyecto.length,
          tareasFinalizadas: finalizadas,
          porcentajeAvance: tareasProyecto.length > 0
            ? Math.round((finalizadas / tareasProyecto.length) * 100)
            : 0
        };
      });

      const reporte = {
        id: uuidv4(),
        tipo: "Avance de proyectos",
        fechaGeneracion: new Date().toISOString(),
        contenido
      };

      await guardarReporte(reporte);
      res.render('reportes/listar', { titulo: 'Reporte de Avance', reporte });

    } catch (error) {
      console.error(error);
      res.status(500).render('error', { titulo: 'Error', mensajeError: 'No se pudo generar el reporte de avance' });
    }
  },

  // Historial de reportes
  historial: async (req, res) => {
    try {
      const reportes = await leerJSON(archivoReportes);
      res.render('reportes/historial', { titulo: 'Historial de Reportes', reportes });
    } catch (error) {
      console.error(error);
      res.status(500).render('error', { titulo: 'Error', mensajeError: 'No se pudo cargar el historial de reportes' });
    }
  },

  // Ver un reporte en detalle
  verDetalle: async (req, res) => {
    try {
      const reportes = await leerJSON(archivoReportes);
      const reporte = reportes.find(r => r.id === req.params.id);

      if (!reporte) {
        return res.status(404).render('error', { titulo: 'No encontrado', mensajeError: 'Reporte no existe' });
      }

      res.render('reportes/listar', { titulo: `Detalle de ${reporte.tipo}`, reporte });

    } catch (error) {
      console.error(error);
      res.status(500).render('error', { titulo: 'Error', mensajeError: 'No se pudo mostrar el detalle del reporte' });
    }
  }
};
