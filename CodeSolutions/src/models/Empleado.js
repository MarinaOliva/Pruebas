// Importar la herramienta para generar IDs únicos
const { v4: uuidv4 } = require('uuid');

// Definimos listas de valores válidos
const rolesValidos = ["administrador", "desarrollador", "QA", "DevOps", "soporte", "contador"];
const areasValidas = ["Desarrollo", "Administración", "Soporte", "Contabilidad"];

// Plantilla para crear empleados
class Empleado {
  constructor(nombre, email, especialidad, area, rol, habilidades = []) {
    this.id = uuidv4();                // identificador único
    this.nombre = nombre?.trim();      // nombre del empleado
    this.email = email?.trim();        // correo
    this.especialidad = especialidad?.trim();  // Frontend - React, Backend - Node.js, etc.

    // Validaciones de rol y área
    if (!rolesValidos.includes(rol)) {
      throw new Error(`Rol inválido: ${rol}. Roles permitidos: ${rolesValidos.join(", ")}`);
    }
    if (!areasValidas.includes(area)) {
      throw new Error(`Área inválida: ${area}. Áreas permitidas: ${areasValidas.join(", ")}`);
    }

    this.area = area;                  
    this.rol = rol;                    

    this.habilidades = habilidades;    // array de skills (opcional)
    this.estaActivo = true;            // estado activo por defecto
    this.fechaCreacion = new Date().toISOString(); // fecha de alta
  }

  // Métodos útiles
  activar() {
    this.estaActivo = true;
  }

  desactivar() {
    this.estaActivo = false;
  }

  actualizarHabilidades(nuevasHabilidades) {
    this.habilidades = [...this.habilidades, ...nuevasHabilidades];
  }
}

// Exportar el modelo (para que pueda ser usado en otros archivos)
module.exports = Empleado;
