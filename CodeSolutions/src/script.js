// src/migrarDatosCorregido.js
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

// Modelos
const Empleado = require('./models/Empleado');
const Proyecto = require('./models/Proyecto');
const Tarea = require('./models/Tarea');

const MONGO_URI = 'mongodb://localhost:27017/code_solutions';

async function conectarDB() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Conectado a MongoDB');
  } catch (err) {
    console.error('Error de conexión:', err.message);
    process.exit(1);
  }
}

function leerJSON(archivo) {
  const filePath = path.join(__dirname, 'data', archivo);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  if (!Array.isArray(data)) throw new Error(`${archivo} no contiene un array`);
  return data;
}

async function migrar() {
  await conectarDB();

  // 1️⃣ Empleados
  const dataEmpleados = leerJSON('empleados.json').map(({ id, ...rest }) => rest);
  await Empleado.deleteMany({});
  const empleados = await Empleado.insertMany(dataEmpleados);

  // Usar email como clave temporal
  const mapEmpleados = {};
  empleados.forEach(e => mapEmpleados[e.email] = e._id);

  console.log(`Empleados importados (${empleados.length})`);

  // 2️⃣ Proyectos
  const dataProyectos = leerJSON('proyectos.json').map(({ id, empleadosAsignados = [], ...rest }) => ({
    ...rest,
    empleadosAsignados: empleadosAsignados.map(email => mapEmpleados[email]).filter(Boolean)
  }));

  await Proyecto.deleteMany({});
  const proyectos = await Proyecto.insertMany(dataProyectos);

  // Usar nombre del proyecto como clave temporal
  const mapProyectos = {};
  proyectos.forEach(p => mapProyectos[p.nombre] = p._id);

  console.log(`Proyectos importados (${proyectos.length})`);

  // 3️⃣ Tareas
  const dataTareas = leerJSON('tareas.json').map(({ id, proyectoNombre, empleadosAsignados = [], ...rest }) => ({
    ...rest,
    proyectoId: mapProyectos[proyectoNombre] || null,
    empleadosAsignados: empleadosAsignados.map(email => mapEmpleados[email]).filter(Boolean)
  }));

  await Tarea.deleteMany({});
  const tareas = await Tarea.insertMany(dataTareas);

  console.log(`Tareas importadas (${tareas.length})`);

  console.log('\n🎉 Migración completa y correcta.');
  mongoose.connection.close();
}

migrar();
