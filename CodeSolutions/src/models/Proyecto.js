const mongoose = require('mongoose');

// Lista de estados válidos
const estadosValidos = ["Pendiente", "En progreso", "Finalizado", "Cancelado"];

// Definir el esquema
const proyectoSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true,
    trim: true
  },
  descripcion: {
    type: String,
    trim: true
  },
  cliente: {
    type: String,
    trim: true
  },
  estado: {
    type: String,
    enum: estadosValidos,
    default: "Pendiente"
  },
  fechaCreacion: {
    type: Date,
    default: Date.now
  },
  empleadosAsignados: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Empleado'  // referencia al modelo Empleado
    }
  ]
});

// ======================
// Métodos de instancia
// ======================

// Cambiar estado con validación
proyectoSchema.methods.actualizarEstado = function (nuevoEstado) {
  if (!estadosValidos.includes(nuevoEstado)) {
    throw new Error(`Estado inválido: ${nuevoEstado}. Estados permitidos: ${estadosValidos.join(", ")}`);
  }
  this.estado = nuevoEstado;
};

// Finalizar proyecto
proyectoSchema.methods.finalizar = function () {
  this.estado = "Finalizado";
};

// Cancelar proyecto
proyectoSchema.methods.pausar = function () {
  this.estado = "Cancelado";
};

// Asignar empleado
proyectoSchema.methods.asignarEmpleado = function (idEmpleado) {
  if (!this.empleadosAsignados.includes(idEmpleado)) {
    this.empleadosAsignados.push(idEmpleado);
  }
};

// Quitar empleado
proyectoSchema.methods.quitarEmpleado = function (idEmpleado) {
  this.empleadosAsignados = this.empleadosAsignados.filter(id => id.toString() !== idEmpleado.toString());
};

// Exportar modelo
module.exports = mongoose.model('Proyecto', proyectoSchema);
