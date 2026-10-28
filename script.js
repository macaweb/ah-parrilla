// Resaltar la categoría que se toca en el menú
document.querySelectorAll('.categorias a').forEach(enlace => {
    enlace.addEventListener('click', function () {
        document.querySelectorAll('.categorias a').forEach(item => {
            item.classList.remove('seleccionada');
        });

        this.classList.add('seleccionada');
    });
});
