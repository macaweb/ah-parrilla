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

    // Menú lateral: abre, cierra y navega a cada sección.
    const botonMenu = document.getElementById('abrir-menu-lateral');
    const fondoMenu = document.getElementById('fondo-menu-lateral');
    const cerrarMenu = document.getElementById('cerrar-menu-lateral');
    const botonWhatsappFlotante = document.querySelector('.whatsapp-flotante-ah');
    function abrirMenu() {
        fondoMenu.hidden = false;
        botonWhatsappFlotante.hidden = true;
        botonMenu.setAttribute('aria-expanded', 'true');
        document.body.style.overflow = 'hidden';
        cerrarMenu.focus();
    }
    function cerrarMenuLateral() {
        fondoMenu.hidden = true;
        botonWhatsappFlotante.hidden = false;
        botonMenu.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
        botonMenu.focus();
    }
    botonMenu.addEventListener('click', abrirMenu);
    cerrarMenu.addEventListener('click', cerrarMenuLateral);
    fondoMenu.addEventListener('click', e => {
        if (e.target === fondoMenu) cerrarMenuLateral();
    });
    fondoMenu.querySelectorAll('a').forEach(enlace => enlace.addEventListener('click', () => {
        fondoMenu.hidden = true;
        botonWhatsappFlotante.hidden = false;
        botonMenu.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
    }));
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && !fondoMenu.hidden) cerrarMenuLateral();
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

    // Publica en la categoría Sopas las opciones concretas del día para compra individual.
    const listaSopasCategoria = document.querySelector('#sopas .lista-platos');
    const opcionesDiariasSopaCrema = [...document.querySelectorAll('.especial-dia .opcion-del-dia:not(.opcion-jugos-del-dia) .lista-opciones-dia')].filter(grupo => grupo.querySelectorAll('li').length > 1).flatMap(grupo => [...grupo.querySelectorAll('li')]);
    if (listaSopasCategoria) {
        opcionesDiariasSopaCrema.forEach(opcion => {
            const nombre = opcion.textContent.trim();
            if (!nombre) return;
            const articulo = document.createElement('article');
            articulo.className = 'plato-listado';
            const titulo = document.createElement('h3');
            titulo.textContent = nombre;
            articulo.appendChild(titulo);
            listaSopasCategoria.appendChild(articulo);
        });
    }

    // Añade botones solo donde el menú ya publica un precio.
    document.querySelectorAll('.categoria-menu .lista-platos .plato-listado').forEach(plato => {
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
        boton.addEventListener('click', () => {
            agregar(titulo, precio);
            confirmarAgregado(boton);
        });
        plato.appendChild(boton);
    });

    // Los sabores se seleccionan directamente desde sus etiquetas.
    const sabores = [...document.querySelectorAll('.lista-sabores span')];
    const jugos = document.querySelector('.sabores-jugos');
    if (jugos) {
        let saborElegido = '';
        let preparacionElegida = '';
        const listaSabores = jugos.querySelector('.lista-sabores');
        const selector = document.createElement('div');
        selector.className = 'selector-preparacion-jugo';
        selector.setAttribute('aria-label', 'Elige cómo quieres tu jugo');

        const tituloPreparacion = document.createElement('h4');
        tituloPreparacion.className = 'titulo-preparacion-jugo';
        tituloPreparacion.textContent = 'PREPARACIÓN:';

        const opcionesPreparacion = document.createElement('div');
        opcionesPreparacion.className = 'opciones-preparacion-jugo';
        [['6000','En agua · $6.000'],['9000','En leche · $9.000']].forEach(([value, texto]) => {
            const opcion = document.createElement('button');
            opcion.type = 'button';
            opcion.className = 'opcion-preparacion-jugo';
            opcion.textContent = texto;
            opcion.setAttribute('aria-pressed', 'false');
            opcion.addEventListener('click', () => {
                preparacionElegida = value;
                opcionesPreparacion.querySelectorAll('button').forEach(b => {
                    const activa = b === opcion;
                    b.classList.toggle('seleccionada', activa);
                    b.setAttribute('aria-pressed', String(activa));
                });
                opcionesPreparacion.classList.remove('falta-seleccion');
            });
            opcionesPreparacion.appendChild(opcion);
        });

        sabores.forEach(etiqueta => {
            const sabor = etiqueta.textContent.trim();
            const botonSabor = document.createElement('button');
            botonSabor.type = 'button';
            botonSabor.className = 'boton-sabor-jugo';
            botonSabor.textContent = sabor;
            botonSabor.setAttribute('aria-pressed', 'false');
            botonSabor.addEventListener('click', () => {
                saborElegido = sabor;
                listaSabores.querySelectorAll('button').forEach(b => {
                    const activo = b === botonSabor;
                    b.classList.toggle('seleccionado', activo);
                    b.setAttribute('aria-pressed', String(activo));
                });
                listaSabores.classList.remove('falta-seleccion');
            });
            etiqueta.replaceWith(botonSabor);
        });

        const botonJugo = document.createElement('button');
        botonJugo.type = 'button';
        botonJugo.className = 'boton-agregar boton-agregar-jugo';
        botonJugo.textContent = 'Agregar jugo +';
        botonJugo.addEventListener('click', () => {
            if (!saborElegido) {
                listaSabores.querySelector('button')?.focus();
                listaSabores.classList.add('falta-seleccion');
                return;
            }
            if (!preparacionElegida) {
                opcionesPreparacion.querySelector('button')?.focus();
                opcionesPreparacion.classList.add('falta-seleccion');
                return;
            }
            agregar('Jugo de ' + saborElegido + ' (' + (preparacionElegida === '6000' ? 'en agua' : 'en leche') + ')', Number(preparacionElegida));
            confirmarAgregado(botonJugo);
        });
        selector.append(tituloPreparacion, opcionesPreparacion, botonJugo);
        jugos.appendChild(selector);
    }

    // El especial incluye una sopa o crema y un jugo, sin cobros adicionales.
    const bloqueEspecial = document.querySelector('.especial-dia');
    if (bloqueEspecial) {
        const acompanamiento = document.getElementById('acompanamiento-especial');
        const jugoEspecial = document.getElementById('jugo-especial');
        const opcionesAcompanamiento = [
            ...bloqueEspecial.querySelectorAll('.opcion-del-dia:not(.opcion-jugos-del-dia) .lista-opciones-dia li')
        ];
        const opcionesJugo = [...bloqueEspecial.querySelectorAll('.opcion-jugos-del-dia .lista-opciones-dia li')];
        opcionesAcompanamiento.forEach(item => {
            const opcion = document.createElement('option');
            opcion.value = item.textContent.trim();
            opcion.textContent = item.textContent.trim();
            acompanamiento.appendChild(opcion);
        });
        opcionesJugo.forEach(item => {
            const opcion = document.createElement('option');
            opcion.value = item.textContent.trim();
            opcion.textContent = item.textContent.trim();
            jugoEspecial.appendChild(opcion);
        });
        document.getElementById('agregar-menu-especial').addEventListener('click', () => {
            if (!acompanamiento.value) { acompanamiento.focus(); return; }
            if (!jugoEspecial.value) { jugoEspecial.focus(); return; }
            const plato = bloqueEspecial.querySelector('.nombre-especial')?.textContent.trim() || 'Plato del día';
            const nombreMenu = 'Menú especial: ' + plato + ' + ' + acompanamiento.value + ' + ' + jugoEspecial.value;
            agregar(nombreMenu, 19000);
            confirmarAgregado(document.getElementById('agregar-menu-especial'));
        });
    }

    function confirmarAgregado(boton) {
        const textoOriginal = boton.dataset.textoOriginal || boton.textContent;
        boton.dataset.textoOriginal = textoOriginal;
        boton.textContent = '✓ ¡Agregado al carrito!';
        boton.classList.remove('confirmacion-agregado');
        void boton.offsetWidth;
        boton.classList.add('confirmacion-agregado');
        boton.setAttribute('aria-live', 'polite');
        if (boton._restaurarTexto) clearTimeout(boton._restaurarTexto);
        boton._restaurarTexto = setTimeout(() => {
            boton.textContent = textoOriginal;
            boton.classList.remove('confirmacion-agregado');
        }, 1400);
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
        const subtotal = productos.reduce((s, p) => s + p.precio * p.cantidad, 0);
        const total = cantidad > 0 ? subtotal + 2000 : 0;
        contadorEl.textContent = cantidad;
        botonCarrito.setAttribute('aria-label', 'Abrir carrito de pedidos. ' + cantidad + (cantidad === 1 ? ' producto' : ' productos'));
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
    function abrir() { fondo.hidden = false; botonCarrito.hidden = true; botonWhatsappFlotante.hidden = true; document.body.style.overflow = 'hidden'; document.getElementById('cerrar-carrito').focus(); }
    function cerrar() { fondo.hidden = true; botonCarrito.hidden = carrito.size === 0; botonWhatsappFlotante.hidden = false; document.body.style.overflow = ''; if (!botonCarrito.hidden) botonCarrito.focus(); }
    botonCarrito.addEventListener('click', abrir);
    document.getElementById('cerrar-carrito').addEventListener('click', cerrar);
    fondo.addEventListener('click', e => { if (e.target === fondo) cerrar(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && !fondo.hidden) cerrar(); });

    formulario.addEventListener('submit', e => {
        e.preventDefault();
        if (!carrito.size) return;
        const datos = new FormData(formulario);
        const productos = [...carrito.values()];
        const subtotal = productos.reduce((s, p) => s + p.precio * p.cantidad, 0);
        const total = subtotal + 2000;
        const lineas = [
            '*NUEVO PEDIDO — AH PARRILLA*',
            '',
            ...productos.map(p => '• ' + p.cantidad + ' × ' + p.nombre + ' — ' + formatoPrecio(p.precio * p.cantidad)),
            '',
            'Recipiente obligatorio: ' + formatoPrecio(2000),
            '*TOTAL: ' + formatoPrecio(total) + '*',
            '',
            '*DATOS DE ENTREGA*',
            'Nombre: ' + datos.get('nombre'),
            'Teléfono: ' + datos.get('telefono'),
            'Dirección: ' + datos.get('direccion'),
            'Método de pago: ' + datos.get('metodo_pago'),
            'Indicaciones: ' + (datos.get('observaciones') || 'Ninguna')
        ];
        window.open('https://wa.me/' + numeroWhatsApp + '?text=' + encodeURIComponent(lineas.join('\n')), '_blank', 'noopener');
    });
});
