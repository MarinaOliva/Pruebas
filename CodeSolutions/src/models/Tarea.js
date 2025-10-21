const { v4: uuidv4 } = require('uuid');

const estadosValidos = ['Pendiente', 'En progreso', 'Finalizado', 'Eliminada'];

class Tarea {
  constructor(proyectoId, nombre, horasEstimadas = 0, horasRegistradas = 0, empleadosAsignados = [], estado = "Pendiente") {
    this.id = uuidv4();
    this.proyectoId = proyectoId;
    this.nombre = nombre?.trim();
    
    this.horasEstimadas = horasEstimadas;
    this.horasRegistradas = horasRegistradas;

    // Siempre array
    this.empleadosAsignados = Array.isArray(empleadosAsignados) ? empleadosAsignados : (empleadosAsignados ? [empleadosAsignados] : []);

    if (!estadosValidos.includes(estado)) {
      throw new Error(`Estado inválido: ${estado}. Estados permitidos: ${estadosValidos.join(", ")}`);
    }
    this.estado = estado;

    this.fechaCreacion = new Date().toISOString();
  }

  // Registrar más horas
  agregarHoras(horas) {
    if (horas <= 0) {
      throw new Error("Las horas deben ser mayores a 0");
    }
    this.horasRegistradas += horas;
  }

  // Cambiar estado
  actualizarEstado(nuevoEstado) {
    if (!estadosValidos.includes(nuevoEstado)) {
      throw new Error(`Estado inválido: ${nuevoEstado}. Estados permitidos: ${estadosValidos.join(", ")}`);
    }
    this.estado = nuevoEstado;
  }

  // Asignar o reasignar empleado
  asignarEmpleado(nuevoEmpleadoId) {
    this.empleadoId = nuevoEmpleadoId;
  }
}

module.exports = Tarea;
