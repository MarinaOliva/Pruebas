// Importar módulos necesarios
const fs = require('fs').promises;
const Empleado = require('../models/Empleado'); 

// Rutas de los archivos JSON
const path = require('path');
const archivoEmpleados = path.join(__dirname, '../data/empleados.json');
const archivoProyectos = path.join(__dirname, '../data/proyectos.json');
const archivoTareas = path.join(__dirname, '../data/tareas.json');


// Listado de roles y áreas válidas
const ROLES_VALIDOS = ['administrador', 'desarrollador', 'QA', 'DevOps', 'soporte', 'contador'];
const AREAS_VALIDAS = ['Desarrollo', 'Administración', 'Soporte', 'Contabilidad'];

// Función para leer empleados
const obtenerEmpleados = async () => {
    try {
        const datos = await fs.readFile(archivoEmpleados, 'utf8');
        return JSON.parse(datos);
    } catch {
        await fs.writeFile(archivoEmpleados, '[]');
        return [];
    }
};

// Función para leer proyectos
const obtenerProyectos = async () => {
    try {
        const datos = await fs.readFile(archivoProyectos, 'utf8');
        return JSON.parse(datos);
    } catch {
        await fs.writeFile(archivoProyectos, '[]');
        return [];
    }
};

// Función para leer tareas
const obtenerTareas = async () => {
    try {
        const datos = await fs.readFile(archivoTareas, 'utf8');
        return JSON.parse(datos);
    } catch {
        await fs.writeFile(archivoTareas, '[]');
        return [];
    }
};

// Función para guardar empleados
const guardarEmpleados = async (empleados) => {
    await fs.writeFile(archivoEmpleados, JSON.stringify(empleados, null, 2));
};

// Función para guardar proyectos
const guardarProyectos = async (proyectos) => {
    await fs.writeFile(archivoProyectos, JSON.stringify(proyectos, null, 2));
};

// Función para guardar tareas
const guardarTareas = async (tareas) => {
    await fs.writeFile(archivoTareas, JSON.stringify(tareas, null, 2));
};

module.exports = {

    // Listar todos los empleados
    listar: async (req, res) => {
        try {
            const empleados = await obtenerEmpleados();
            res.render('empleados/listar', { empleados });
        } catch (error) {
            console.error('Error en listar empleados:', error);
            res.status(500).send('Error al obtener los empleados');
        }
    },

    // Mostrar formulario para crear nuevo empleado
    mostrarFormulario: (req, res) => {
        res.render('empleados/crear');
    },

    // Crear un nuevo empleado
    crear: async (req, res) => {
        const { nombre, email, especialidad, area, rol, habilidades } = req.body;

        if (!ROLES_VALIDOS.includes(rol) || !AREAS_VALIDAS.includes(area)) {
            return res.render('empleados/crear', {
                error: true,
                mensaje: 'Rol o área inválida',
                datos: req.body
            });
        }

        try {
            const empleados = await obtenerEmpleados();
            const nuevoEmpleado = new Empleado(
                nombre,
                email,
                especialidad,
                area,
                rol,
                habilidades || []
            );

            empleados.push(nuevoEmpleado);
            await guardarEmpleados(empleados);
            res.redirect('/empleados');
        } catch {
            res.render('empleados/crear', {
                error: true,
                mensaje: 'Error al guardar el empleado',
                datos: req.body
            });
        }
    },

    // Mostrar formulario de edición de empleado
mostrarFormularioEditar: async (req, res) => {
  const empleadoId = req.params.id;
  try {
    const empleados = await obtenerEmpleados();
    const empleado = empleados.find(e => e.id === empleadoId);

    if (!empleado) {
      return res.status(404).render('error', {
        titulo: 'Empleado no encontrado',
        mensajeError: 'No existe un empleado con ese ID'
      });
    }

    res.render('empleados/editar', { empleado });
  } catch (error) {
    console.error(error);
    res.status(500).render('error', {
      titulo: 'Error',
      mensajeError: 'No se pudo cargar el formulario de edición'
    });
  }
},

    // Editar un empleado existente
    editar: async (req, res) => {
    const empleadoId = req.params.id;
    const { nombre, email, especialidad, area, rol, habilidades } = req.body;

    if (!ROLES_VALIDOS.includes(rol) || !AREAS_VALIDAS.includes(area)) {
        return res.render('empleados/editar', {
        error: true,
        mensaje: 'Rol o área inválida',
        empleado: { id: empleadoId, ...req.body, habilidades: (habilidades || '').split(',').map(h => h.trim()) }
        });
    }

    try {
        const empleados = await obtenerEmpleados();
        const index = empleados.findIndex(e => e.id === empleadoId);

        if (index === -1) {
        return res.status(404).render('error', {
            titulo: 'Empleado no encontrado',
            mensajeError: 'No existe un empleado con ese ID'
        });
        }

        // Actualizar datos del empleado
        empleados[index] = {
        ...empleados[index],
        nombre,
        email,
        especialidad,
        area,
        rol,
        habilidades: habilidades ? habilidades.split(',').map(h => h.trim()) : []
        };

        await guardarEmpleados(empleados);
        res.redirect('/empleados');
    } catch (error) {
        console.error(error);
        res.status(500).render('error', {
        titulo: 'Error',
        mensajeError: 'No se pudo guardar la edición del empleado'
        });
    }
    },


    // Eliminar un empleado de la empresa y desasignarlo de proyectos y tareas
    eliminar: async (req, res) => {
        const empleadoId = req.params.id;
        try {
            // Quitar del JSON de empleados
            const empleados = await obtenerEmpleados();
            const empleadosActualizados = empleados.filter(e => e.id !== empleadoId);
            await guardarEmpleados(empleadosActualizados);

            // Quitar de los proyectos
            const proyectos = await obtenerProyectos();
            const proyectosActualizados = proyectos.map(proy => {
                if (proy.empleadosAsignados) {
                    proy.empleadosAsignados = proy.empleadosAsignados.filter(id => id !== empleadoId);
                }
                return proy;
            });
            await guardarProyectos(proyectosActualizados);

            // Quitar de las tareas asignadas
            const tareas = await obtenerTareas();
            const tareasActualizadas = tareas.map(t => 
                t.empleadoId === empleadoId ? { ...t, empleadoId: null } : t
            );
            await guardarTareas(tareasActualizadas);

            res.redirect('/empleados');
        } catch (error) {
            console.error(error);
            res.status(500).render('error', { 
                titulo: 'Error', 
                mensajeError: 'No se pudo eliminar el empleado' 
            });
        }
    },

    // Quitar un empleado solo de un proyecto
    quitarDeProyecto: async (req, res) => {
        const { empleadoId, proyectoId } = req.params;
        try {
            const proyectos = await obtenerProyectos();
            const proyectosActualizados = proyectos.map(proy => {
                if (proy.id === proyectoId && proy.empleadosAsignados) {
                    proy.empleadosAsignados = proy.empleadosAsignados.filter(id => id !== empleadoId);
                }
                return proy;
            });
            await guardarProyectos(proyectosActualizados);

            // Quitar de las tareas del proyecto
            const tareas = await obtenerTareas();
            const tareasActualizadas = tareas.map(t => 
                t.proyectoId === proyectoId && t.empleadoId === empleadoId ? { ...t, empleadoId: null } : t
            );
            await guardarTareas(tareasActualizadas);

            res.redirect(`/proyectos/editar/${proyectoId}`);
        } catch (error) {
            console.error(error);
            res.status(500).render('error', { 
                titulo: 'Error', 
                mensajeError: 'No se pudo quitar al empleado del proyecto' 
            });
        }
    }
};
