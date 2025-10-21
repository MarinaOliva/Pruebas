document.addEventListener('DOMContentLoaded', () => {

  // Confirmación antes de eliminar empleados o proyectos
  const botonesEliminar = document.querySelectorAll('.btn-eliminar');

  botonesEliminar.forEach(boton => {
    boton.addEventListener('click', (e) => {
      const confirmacion = confirm('¿Está seguro que desea eliminar? Esta acción no se puede deshacer.');
      if (!confirmacion) {
        e.preventDefault();
      }
    });
  });

  // Expandir / contraer detalles de empleados/proyectos
const botonesExpandir = document.querySelectorAll('.expand-btn');
botonesExpandir.forEach(btn => {
  btn.addEventListener('click', () => {
    const id = btn.dataset.id;
    const detalle = document.getElementById(`detalle-${id}`);
    if (detalle) {
      detalle.style.display = detalle.style.display === 'none' ? 'table-row' : 'none';
    }
  });
});


});
