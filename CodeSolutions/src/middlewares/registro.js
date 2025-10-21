// Registra información básica de cada solicitud

module.exports = (req, res, next) => {
  // Crear un mensaje con fecha, hora, método HTTP y URL solicitada
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  
  // Continuar con la siguiente función en la cadena de middlewares
  next();
};
