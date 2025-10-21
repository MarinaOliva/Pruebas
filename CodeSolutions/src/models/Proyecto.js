// Importar herramienta para generar IDs únicos
const { v4: uuidv4 } = require('uuid');

// Lista de estados válidos para un proyecto
const estadosValidos = ["Pendiente", "En progreso", "Finalizado", "Cancelado"];

class Proyecto {
  constructor(nombre, descripcion, cliente, estado = "Pendiente", empleadosAsignados = []) {
    this.id = uuidv4();

    // Normalizamos strings
    this.nombre = nombre?.trim();
    this.descripcion = descripcion?.trim();
    this.cliente = cliente?.trim();

    // Validación de estado
    if (!estadosValidos.includes(estado)) {
      throw new Error(`Estado inválido: ${estado}. Estados permitidos: ${estadosValidos.join(", ")}`);
    }
    this.estado = estado;

    this.fechaCreacion = new Date().toISOString();

    // Lista de empleados asignados (se recibe desde el controller)
    this.empleadosAsignados = Array.isArray(empleadosAsignados) ? empleadosAsignados : [];
  }

  // Métodos útiles para cambiar estado
  actualizarEstado(nuevoEstado) {
    if (!estadosValidos.includes(nuevoEstado)) {
      throw new Error(`Estado inválido: ${nuevoEstado}. Estados permitidos: ${estadosValidos.join(", ")}`);
    }
    this.estado = nuevoEstado;
  }

  finalizar() {
    this.estado = "Finalizado";
  }

  pausar() {
    this.estado = "Cancelado";
  }

  // Métodos para manejar empleados asignados
  asignarEmpleado(idEmpleado) {
    if (!this.empleadosAsignados.includes(idEmpleado)) {
      this.empleadosAsignados.push(idEmpleado);
    }
  }

  quitarEmpleado(idEmpleado) {
    this.empleadosAsignados = this.empleadosAsignados.filter(id => id !== idEmpleado);
  }
}

module.exports = Proyecto;
