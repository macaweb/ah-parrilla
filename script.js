// Resaltar la categoría seleccionada en el menú.
// El estado visual permanece mientras la persona navega por la página.
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
});
