const mongoose = require('mongoose');

const reporteSchema = new mongoose.Schema({
  tipo: {
    type: String,
    required: true
  },
  fechaGeneracion: {
    type: Date,
    default: Date.now
  },
  contenido: {
    type: Array, // guarda los objetos que se generan en generarHoras o generarAvance
    required: true
  }
});

module.exports = mongoose.model('Reporte', reporteSchema);
