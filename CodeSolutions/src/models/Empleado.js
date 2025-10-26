// src/models/Empleado.js
const mongoose = require('mongoose');

// Listas de valores válidos
const rolesValidos = ["administrador", "desarrollador", "QA", "DevOps", "soporte", "contador"];
const areasValidas = ["Desarrollo", "Administración", "Soporte", "Contabilidad"];

// Definir el esquema
const empleadoSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    unique: true // aseguramos que no haya emails duplicados
  },
  especialidad: {
    type: String,
    trim: true
  },
  area: {
    type: String,
    enum: areasValidas,
    required: true
  },
  rol: {
    type: String,
    enum: rolesValidos,
    required: true
  },
  habilidades: {
    type: [String],
    default: []
  },
  estaActivo: {
    type: Boolean,
    default: true
  },
  fechaCreacion: {
    type: Date,
    default: Date.now
  }
});

// Métodos de instancia (similar a tus métodos de clase)
empleadoSchema.methods.activar = function() {
  this.estaActivo = true;
};

empleadoSchema.methods.desactivar = function() {
  this.estaActivo = false;
};

empleadoSchema.methods.actualizarHabilidades = function(nuevasHabilidades) {
  this.habilidades = [...this.habilidades, ...nuevasHabilidades];
};

// Exportar modelo
module.exports = mongoose.model('Empleado', empleadoSchema);
