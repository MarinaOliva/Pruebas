const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/code_solutions', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Conectado exitosamente a MongoDB');
  } catch (err) {
    console.error('Ha ocurrido un error al conectar a MongoDB:', err.message);
    process.exit(1); // detiene la app si la conexión falla
  }
};

module.exports = connectDB;
