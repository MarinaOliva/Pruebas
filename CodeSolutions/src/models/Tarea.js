const mongoose = require('mongoose');

const estadosValidos = ['Pendiente', 'En progreso', 'Finalizado', 'Eliminada'];

const tareaSchema = new mongoose.Schema({
  proyectoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Proyecto', // referencia al proyecto al que pertenece la tarea
    required: true
  },
  nombre: {
    type: String,
    required: true,
    trim: true
  },
  horasEstimadas: {
    type: Number,
    default: 0,
    min: 0
  },
  horasRegistradas: {
    type: Number,
    default: 0,
    min: 0
  },
  empleadosAsignados: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Empleado' // referencia a empleados asignados
    }
  ],
  estado: {
    type: String,
    enum: estadosValidos,
    default: 'Pendiente'
  },
  fechaCreacion: {
    type: Date,
    default: Date.now
  }
});

// ======================
// Métodos de instancia
// ======================

// Registrar más horas
tareaSchema.methods.agregarHoras = function (horas) {
  if (horas <= 0) {
    throw new Error('Las horas deben ser mayores a 0');
  }
  this.horasRegistradas += horas;
};

// Cambiar estado
tareaSchema.methods.actualizarEstado = function (nuevoEstado) {
  if (!estadosValidos.includes(nuevoEstado)) {
    throw new Error(`Estado inválido: ${nuevoEstado}. Estados permitidos: ${estadosValidos.join(', ')}`);
  }
  this.estado = nuevoEstado;
};

// Asignar empleado
tareaSchema.methods.asignarEmpleado = function (idEmpleado) {
  if (!this.empleadosAsignados.includes(idEmpleado)) {
    this.empleadosAsignados.push(idEmpleado);
  }
};

// Quitar empleado (por si después lo necesitás)
tareaSchema.methods.quitarEmpleado = function (idEmpleado) {
  this.empleadosAsignados = this.empleadosAsignados.filter(
    id => id.toString() !== idEmpleado.toString()
  );
};

// Exportar modelo
module.exports = mongoose.model('Tarea', tareaSchema);
