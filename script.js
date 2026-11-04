// Navegación de categorías y pedidos por WhatsApp.
document.addEventListener('DOMContentLoaded', () => {
    const enlaces = document.querySelectorAll('.categorias a');
    enlaces.forEach(enlace => enlace.addEventListener('click', () => {
        enlaces.forEach(item => { item.classList.remove('seleccionada'); item.removeAttribute('aria-current'); });
        enlace.classList.add('seleccionada');
        enlace.setAttribute('aria-current', 'location');
    }));
    document.addEventListener('click', evento => {
        if (!evento.target.closest('.categorias a')) {
            enlaces.forEach(enlace => { enlace.classList.remove('seleccionada'); enlace.removeAttribute('aria-current'); });
            if (document.activeElement?.matches('.categorias a')) document.activeElement.blur();
        }
    });

    const numeroWhatsApp = '573018259210';
    const carrito = new Map();
    const botonCarrito = document.getElementById('abrir-carrito');
    const fondo = document.getElementById('carrito-fondo');
    const itemsEl = document.getElementById('carrito-items');
    const vacioEl = document.getElementById('carrito-vacio');
    const contadorEl = document.getElementById('carrito-contador');
    const totalEl = document.getElementById('carrito-total');
    const formulario = document.getElementById('formulario-pedido');
    const formatoPrecio = valor => '$' + valor.toLocaleString('es-CO');

    // Añade botones solo donde el menú ya publica un precio.
    document.querySelectorAll('.categoria-menu .plato-listado').forEach(plato => {
        const titulo = plato.querySelector('h3')?.textContent.trim();
        const seccion = plato.closest('.categoria-menu');
        if (!titulo || !seccion) return;
        let precio = Number((plato.querySelector('strong')?.textContent || '').replace(/[^0-9]/g, ''));
        if (!precio && seccion.id === 'almuerzos') precio = 20000;
        if (!precio && seccion.id === 'sopas') precio = 8000;
        if (!precio) return;
        const boton = document.createElement('button');
        boton.type = 'button';
        boton.className = 'boton-agregar';
        boton.textContent = 'Agregar +';
        boton.setAttribute('aria-label', 'Agregar ' + titulo + ' al pedido');
        boton.addEventListener('click', () => agregar(titulo, precio));
        plato.appendChild(boton);
    });

    // Los jugos se agregan con sabor y preparación elegidos.
    const sabores = [...document.querySelectorAll('.lista-sabores span')].map(el => el.textContent.trim());
    const jugos = document.querySelector('.sabores-jugos');
    if (jugos) {
        const opciones = document.createElement('div');
        opciones.className = 'selector-jugo-pedido';
        const labelSabor = document.createElement('label');
        labelSabor.htmlFor = 'sabor-jugo';
        labelSabor.textContent = 'Sabor';
        const saborSelect = document.createElement('select');
        saborSelect.id = 'sabor-jugo';
        const placeholder = document.createElement('option');
        placeholder.value = '';
        placeholder.textContent = 'Elige un sabor';
        saborSelect.appendChild(placeholder);
        sabores.forEach(s => {
            const option = document.createElement('option');
            option.value = s;
            option.textContent = s;
            saborSelect.appendChild(option);
        });
        const labelTipo = document.createElement('label');
        labelTipo.htmlFor = 'tipo-jugo';
        labelTipo.textContent = 'Preparación';
        const tipoSelect = document.createElement('select');
        tipoSelect.id = 'tipo-jugo';
        [['6000','En agua · $6.000'],['9000','En leche · $9.000']].forEach(([value,texto]) => {
            const option = document.createElement('option');
            option.value = value;
            option.textContent = texto;
            tipoSelect.appendChild(option);
        });
        const botonJugo = document.createElement('button');
        botonJugo.type = 'button';
        botonJugo.className = 'boton-agregar';
        botonJugo.textContent = 'Agregar jugo +';
        botonJugo.addEventListener('click', () => {
            if (!saborSelect.value) { saborSelect.focus(); return; }
            agregar('Jugo de ' + saborSelect.value + ' (' + (tipoSelect.value === '6000' ? 'en agua' : 'en leche') + ')', Number(tipoSelect.value));
        });
        opciones.append(labelSabor, saborSelect, labelTipo, tipoSelect, botonJugo);
        jugos.appendChild(opciones);
    }

    function agregar(nombre, precio) {
        const existente = carrito.get(nombre);
        carrito.set(nombre, { nombre, precio, cantidad: (existente?.cantidad || 0) + 1 });
        renderizar();
        botonCarrito.hidden = false;
    }
    function renderizar() {
        const productos = [...carrito.values()];
        const cantidad = productos.reduce((s, p) => s + p.cantidad, 0);
        const total = productos.reduce((s, p) => s + p.precio * p.cantidad, 0);
        contadorEl.textContent = cantidad;
        totalEl.textContent = formatoPrecio(total);
        vacioEl.hidden = productos.length > 0;
        itemsEl.replaceChildren();
        productos.forEach(p => {
            const item = document.createElement('article');
            item.className = 'item-carrito';
            const info = document.createElement('div');
            const nombre = document.createElement('h4'); nombre.textContent = p.nombre;
            const precio = document.createElement('small'); precio.textContent = formatoPrecio(p.precio) + ' c/u';
            info.append(nombre, precio);
            const subtotal = document.createElement('strong'); subtotal.textContent = formatoPrecio(p.precio * p.cantidad);
            const controles = document.createElement('div'); controles.className = 'controles-cantidad';
            const menos = document.createElement('button'); menos.type = 'button'; menos.textContent = '−'; menos.setAttribute('aria-label','Restar uno');
            menos.addEventListener('click', () => cambiar(p.nombre, -1));
            const numero = document.createElement('span'); numero.textContent = p.cantidad;
            const mas = document.createElement('button'); mas.type = 'button'; mas.textContent = '+'; mas.setAttribute('aria-label','Agregar uno');
            mas.addEventListener('click', () => cambiar(p.nombre, 1));
            const quitar = document.createElement('button'); quitar.type = 'button'; quitar.className = 'quitar-item'; quitar.textContent = 'Quitar';
            quitar.addEventListener('click', () => { carrito.delete(p.nombre); renderizar(); });
            controles.append(menos, numero, mas, quitar);
            info.append(controles); item.append(info, subtotal); itemsEl.append(item);
        });
        botonCarrito.hidden = cantidad === 0;
        formulario.hidden = cantidad === 0;
    }
    function cambiar(nombre, delta) {
        const p = carrito.get(nombre); if (!p) return;
        p.cantidad += delta;
        if (p.cantidad <= 0) carrito.delete(nombre);
        renderizar();
    }
    function abrir() { fondo.hidden = false; document.body.style.overflow = 'hidden'; document.getElementById('cerrar-carrito').focus(); }
    function cerrar() { fondo.hidden = true; document.body.style.overflow = ''; botonCarrito.focus(); }
    botonCarrito.addEventListener('click', abrir);
    document.getElementById('cerrar-carrito').addEventListener('click', cerrar);
    fondo.addEventListener('click', e => { if (e.target === fondo) cerrar(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && !fondo.hidden) cerrar(); });

    formulario.addEventListener('submit', e => {
        e.preventDefault();
        if (!carrito.size) return;
        const datos = new FormData(formulario);
        const productos = [...carrito.values()];
        const total = productos.reduce((s, p) => s + p.precio * p.cantidad, 0);
        const lineas = [
            '*NUEVO PEDIDO — AH PARRILLA*',
            '',
            ...productos.map(p => '• ' + p.cantidad + ' × ' + p.nombre + ' — ' + formatoPrecio(p.precio * p.cantidad)),
            '',
            '*TOTAL: ' + formatoPrecio(total) + '*',
            '',
            '*DATOS DE ENTREGA*',
            'Nombre: ' + datos.get('nombre'),
            'Teléfono: ' + datos.get('telefono'),
            'Dirección: ' + datos.get('direccion'),
            'Indicaciones: ' + (datos.get('observaciones') || 'Ninguna')
        ];
        window.open('https://wa.me/' + numeroWhatsApp + '?text=' + encodeURIComponent(lineas.join('\n')), '_blank', 'noopener');
    });
});
