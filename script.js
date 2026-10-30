// Resaltar la categoría seleccionada mientras se usa el menú.
document.addEventListener('DOMContentLoaded', () => {
    const enlaces = document.querySelectorAll('.categorias a');

    enlaces.forEach(enlace => {
        enlace.addEventListener('click', () => {
            enlaces.forEach(item => {
                item.classList.remove('seleccionada');
                item.removeAttribute('aria-current');
            });

            enlace.classList.add('seleccionada');
            enlace.setAttribute('aria-current', 'location');
        });
    });

    // Quitar el resaltado al tocar o hacer clic fuera de los botones.
    document.addEventListener('click', evento => {
        if (!evento.target.closest('.categorias a')) {
            enlaces.forEach(enlace => {
                enlace.classList.remove('seleccionada');
                enlace.removeAttribute('aria-current');
            });

            if (document.activeElement && document.activeElement.matches('.categorias a')) {
                document.activeElement.blur();
            }
        }
    });
});
