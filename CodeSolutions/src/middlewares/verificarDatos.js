// Validar datos enviados en formularios
module.exports = (req, res, next) => {
  
  // Solo se aplica en métodos que envían datos
  if (req.method === 'POST' || req.method === 'PUT') {
    const { nombre, email } = req.body;

    // Validar que nombre y email no estén vacíos
    if (!nombre || nombre.trim() === '' || 
        !email || email.trim() === '') {
      return res.status(400).render('error', {
        titulo: 'Datos inválidos',
        mensajeError: 'El nombre y el email son obligatorios. Completa el formulario.'
      });
    }
  }

  // Si todo está bien, continuar
  next();
};
