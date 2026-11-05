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
    const enlacesMenuLateral = [...fondoMenu.querySelectorAll('.panel-menu-lateral > a')];
    const marcarEnlaceMenu = enlaceElegido => {
        enlacesMenuLateral.forEach(enlace => {
            const activo = enlace === enlaceElegido;
            enlace.classList.toggle('seleccionada', activo);
            if (activo) enlace.setAttribute('aria-current', 'location');
            else enlace.removeAttribute('aria-current');
        });
    };
    enlacesMenuLateral.forEach(enlace => {
        // Resalta en el mismo instante en que comienza el toque, sin esperar al click.
        enlace.addEventListener('pointerdown', () => marcarEnlaceMenu(enlace));
        enlace.addEventListener('click', () => {
            marcarEnlaceMenu(enlace);
            const enlaceCategoria = [...enlaces].find(item => item.getAttribute('href') === enlace.getAttribute('href'));
            if (enlaceCategoria) {
                enlaces.forEach(item => { item.classList.remove('seleccionada'); item.removeAttribute('aria-current'); });
                enlaceCategoria.classList.add('seleccionada');
                enlaceCategoria.setAttribute('aria-current', 'location');
            }
            fondoMenu.hidden = true;
            botonWhatsappFlotante.hidden = false;
            botonMenu.setAttribute('aria-expanded', 'false');
            document.body.style.overflow = '';
        });
    });

    // Mantiene marcada la categoría que está visible y retira el estado al salir de ella.
    if ('IntersectionObserver' in window) {
        const seccionesMenu = enlacesMenuLateral
            .map(enlace => document.querySelector(enlace.getAttribute('href')))
            .filter(Boolean);
        const observadorSecciones = new IntersectionObserver(registros => {
            const visibles = registros
                .filter(registro => registro.isIntersecting)
                .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
            if (visibles.length) {
                const idVisible = '#' + visibles[0].target.id;
                const enlaceVisible = enlacesMenuLateral.find(enlace => enlace.getAttribute('href') === idVisible);
                if (enlaceVisible) marcarEnlaceMenu(enlaceVisible);
            } else if (!seccionesMenu.some(seccion => {
                const rect = seccion.getBoundingClientRect();
                return rect.top < window.innerHeight * 0.45 && rect.bottom > window.innerHeight * 0.2;
            })) {
                marcarEnlaceMenu(null);
            }
        }, { rootMargin: '-18% 0px -62% 0px', threshold: [0, 0.1, 0.25, 0.5, 0.75] });
        seccionesMenu.forEach(seccion => observadorSecciones.observe(seccion));
    }
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && !fondoMenu.hidden) cerrarMenuLateral();
    });

    const numeroWhatsApp = '573018259210';
    const CLAVE_CARRITO = 'ahParrilla_carrito_v1';
    const carrito = new Map();

    // Recupera el pedido guardado y acepta también registros de versiones anteriores.
    function recuperarCarrito() {
        try {
            const guardado = localStorage.getItem(CLAVE_CARRITO);
            if (!guardado) return;
            const productos = JSON.parse(guardado);
            if (!Array.isArray(productos)) return;
            productos.forEach(producto => {
                if (!producto || typeof producto.nombre !== 'string' || !producto.nombre.trim()) return;
                const precio = Number(producto.precio);
                const recipiente = Number(producto.recipiente ?? 0);
                const cantidad = Number(producto.cantidad);
                if (Number.isFinite(precio) && precio >= 0 &&
                    Number.isFinite(recipiente) && recipiente >= 0 &&
                    Number.isInteger(cantidad) && cantidad > 0) {
                    carrito.set(producto.nombre, {
                        nombre: producto.nombre,
                        precio,
                        recipiente,
                        categoria: producto.categoria || '',
                        cantidad
                    });
                }
            });
        } catch (error) {
            console.warn('No se pudo recuperar el carrito guardado.', error);
        }
    }

    function guardarCarrito() {
        try {
            localStorage.setItem(CLAVE_CARRITO, JSON.stringify([...carrito.values()]));
            return true;
        } catch (error) {
            console.warn('El navegador no permitió guardar el carrito.', error);
            return false;
        }
    }

    recuperarCarrito();

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
        boton.className = 'boton-agregar boton-agregar-icono';
        boton.textContent = '+';
        boton.setAttribute('aria-label', 'Agregar ' + titulo + ' al pedido');
        const costoRecipiente = seccion.id === 'sopas' ? 1000 : ['desayunos', 'almuerzos', 'platos-fuertes'].includes(seccion.id) ? 2000 : 0;

        if (seccion.id === 'almuerzos') {
            // Evita que queden botones u opciones individuales junto a cada plato.
            plato.querySelectorAll('.boton-agregar, .selector-jugo-pedido, .selector-almuerzo-individual').forEach(elemento => elemento.remove());
            plato.classList.add('almuerzo-seleccionable');
            plato.tabIndex = 0;
            plato.setAttribute('role', 'button');
            plato.setAttribute('aria-pressed', 'false');
            plato.setAttribute('aria-label', 'Seleccionar almuerzo: ' + titulo);
            const seleccionarPlato = () => {
                document.querySelectorAll('#almuerzos .almuerzo-seleccionable').forEach(item => {
                    const activo = item === plato;
                    item.classList.toggle('almuerzo-elegido', activo);
                    item.setAttribute('aria-pressed', String(activo));
                });
                almuerzoElegido = { titulo, precio };
            };
            plato.addEventListener('click', seleccionarPlato);
            plato.addEventListener('keydown', evento => {
                if (evento.key === 'Enter' || evento.key === ' ') {
                    evento.preventDefault();
                    seleccionarPlato();
                }
            });
        } else {
            boton.addEventListener('click', () => {
                agregar(titulo, precio, costoRecipiente, seccion.id);
                confirmarAgregado(boton);
            });
            plato.appendChild(boton);
        }
    });

    // Selector único al final de la sección: primero se elige un plato y luego sus acompañantes.
    let almuerzoElegido = null;
    const seccionAlmuerzos = document.getElementById('almuerzos');
    const listaAlmuerzos = seccionAlmuerzos?.querySelector('.lista-platos');
    if (seccionAlmuerzos && listaAlmuerzos) {
        const selectorAlmuerzos = document.createElement('div');
        selectorAlmuerzos.className = 'selector-almuerzos';
        const tituloSelector = document.createElement('h3');
        tituloSelector.textContent = 'Completa tu almuerzo';
        const textoSelector = document.createElement('p');
        textoSelector.textContent = 'Después de elegir tu plato de la lista, selecciona los acompañantes:';
        const grupoSopas = document.createElement('label');
        grupoSopas.textContent = 'Sopa o crema (obligatoria)';
        const selectSopas = document.createElement('select');
        selectSopas.setAttribute('aria-label', 'Selecciona una sopa o crema para el almuerzo');
        const grupoJugos = document.createElement('label');
        grupoJugos.textContent = 'Jugos (obligatorio)';
        const selectJugos = document.createElement('select');
        selectJugos.setAttribute('aria-label', 'Selecciona un jugo para el almuerzo');

        const agregarPlaceholder = (select, texto) => {
            const opcion = document.createElement('option');
            opcion.value = '';
            opcion.textContent = texto;
            select.appendChild(opcion);
        };
        agregarPlaceholder(selectSopas, 'Selecciona una opción');
        agregarPlaceholder(selectJugos, 'Selecciona una opción');

        const especialDelDia = document.querySelector('.especial-dia');
        const opcionesSopas = especialDelDia
            ? [...especialDelDia.querySelectorAll('.opcion-del-dia:not(.opcion-jugos-del-dia) .lista-opciones-dia li')]
            : [...document.querySelectorAll('#sopas .lista-platos h3')];
        const opcionesJugos = especialDelDia
            ? [...especialDelDia.querySelectorAll('.opcion-jugos-del-dia .lista-opciones-dia li')]
            : [...document.querySelectorAll('.lista-sabores span')];

        opcionesSopas.forEach(item => {
            const valor = item.textContent.trim();
            if (!valor) return;
            const opcion = document.createElement('option');
            opcion.value = valor;
            opcion.textContent = valor;
            selectSopas.appendChild(opcion);
        });
        opcionesJugos.forEach(item => {
            const valor = item.textContent.trim();
            if (!valor) return;
            const opcion = document.createElement('option');
            opcion.value = valor;
            opcion.textContent = valor;
            selectJugos.appendChild(opcion);
        });

        const botonAgregarAlmuerzo = document.createElement('button');
        botonAgregarAlmuerzo.type = 'button';
        botonAgregarAlmuerzo.className = 'boton-agregar boton-agregar-almuerzo';
        botonAgregarAlmuerzo.textContent = 'Agregar +';
        botonAgregarAlmuerzo.addEventListener('click', () => {
            if (!almuerzoElegido) {
                listaAlmuerzos.querySelector('.almuerzo-seleccionable')?.focus();
                return;
            }
            if (!selectSopas.value) {
                selectSopas.focus();
                return;
            }
            if (!selectJugos.value) {
                selectJugos.focus();
                return;
            }
            const nombrePedido = almuerzoElegido.titulo + ' + ' + selectSopas.value + ' + ' + selectJugos.value;
            agregar(nombrePedido, almuerzoElegido.precio, 2000, 'almuerzos');
            confirmarAgregado(botonAgregarAlmuerzo);
        });
        selectorAlmuerzos.append(tituloSelector, textoSelector, grupoSopas, selectSopas, grupoJugos, selectJugos, botonAgregarAlmuerzo);
        // Un solo bloque de opciones, inmediatamente después de la lista de platos.
        listaAlmuerzos.insertAdjacentElement('afterend', selectorAlmuerzos);
        // Limpia cualquier control antiguo que pudiera haber quedado dentro de las tarjetas.
        listaAlmuerzos.querySelectorAll('.boton-agregar, .selector-jugo-pedido, .selector-almuerzo-individual, select').forEach(elemento => elemento.remove());
    }

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
        botonJugo.textContent = 'Agregar';
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
            agregar('Jugo de ' + saborElegido + ' (' + (preparacionElegida === '6000' ? 'en agua' : 'en leche') + ')', Number(preparacionElegida), 0, 'jugos');
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
            agregar(nombreMenu, 19000, 2000, 'especiales');
            confirmarAgregado(document.getElementById('agregar-menu-especial'));
        });
    }

    function confirmarAgregado(boton) {
        const textoOriginal = boton.dataset.textoOriginal || boton.textContent;
        boton.dataset.textoOriginal = textoOriginal;
        const esBotonIcono = boton.classList.contains('boton-agregar-icono');
        boton.textContent = esBotonIcono ? '✓' : '✓ ¡Agregado al carrito!';
        boton.classList.remove('confirmacion-agregado');
        void boton.offsetWidth;
        boton.classList.add('confirmacion-agregado');
        boton.setAttribute('aria-live', 'polite');
        if (boton._restaurarTexto) clearTimeout(boton._restaurarTexto);
        boton._restaurarTexto = setTimeout(() => {
            boton.textContent = esBotonIcono ? '+' : textoOriginal;
            boton.classList.remove('confirmacion-agregado');
        }, 1400);
    }

    function agregar(nombre, precio, recipiente = 0, categoria = 'productos') {
        const existente = carrito.get(nombre);
        carrito.set(nombre, { nombre, precio, recipiente, categoria, cantidad: (existente?.cantidad || 0) + 1 });
        renderizar();
        botonCarrito.hidden = false;
    }
    function renderizar() {
        const productos = [...carrito.values()];
        // Guarda inmediatamente cada cambio del pedido en este dispositivo.
        guardarCarrito();
        const cantidad = productos.reduce((s, p) => s + p.cantidad, 0);
        const subtotal = productos.reduce((s, p) => s + p.precio * p.cantidad, 0);
        const totalRecipientes = productos.reduce((s, p) => s + p.recipiente * p.cantidad, 0);
        const totalBase = subtotal + totalRecipientes;
        const total = totalBase;
        const detalleRecipientes = document.getElementById('total-recipientes');
        if (detalleRecipientes) detalleRecipientes.textContent = formatoPrecio(totalRecipientes);
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
        // El acceso flotante solo se muestra fuera del panel "Tu pedido".
        botonCarrito.hidden = cantidad === 0 || !fondo.hidden;
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
        const totalRecipientes = productos.reduce((s, p) => s + p.recipiente * p.cantidad, 0);
        const totalBase = subtotal + totalRecipientes;
        const total = totalBase;
        const lineas = [
            '*NUEVO PEDIDO — AH PARRILLA*',
            '',
            ...productos.map(p => {
                const cantidad = p.cantidad;
                const nombre = p.nombre;
                let detalle;
                const categoria = p.categoria || (nombre.startsWith('Menú especial:') ? 'especiales' :
                    [...document.querySelectorAll('.categoria-menu')].find(seccion =>
                        [...seccion.querySelectorAll('.plato-listado h3')].some(titulo => titulo.textContent.trim() === nombre)
                    )?.id || 'productos');
                switch (categoria) {
                    case 'almuerzos':
                        detalle = cantidad + (cantidad === 1 ? ' almuerzo de ' : ' almuerzos de ') + nombre;
                        break;
                    case 'desayunos':
                        detalle = cantidad + (cantidad === 1 ? ' desayuno: ' : ' desayunos: ') + nombre;
                        break;
                    case 'platos-fuertes':
                        detalle = cantidad + (cantidad === 1 ? ' plato fuerte: ' : ' platos fuertes: ') + nombre;
                        break;
                    case 'sopas':
                        detalle = cantidad + (cantidad === 1 ? ' unidad de ' : ' unidades de ') + nombre;
                        break;
                    case 'jugos':
                        detalle = cantidad + (cantidad === 1 ? ' jugo: ' : ' jugos: ') + nombre;
                        break;
                    case 'especiales':
                        detalle = cantidad + (cantidad === 1 ? ' menú especial: ' : ' menús especiales: ') + nombre.replace(/^Menú especial:\s*/i, '');
                        break;
                    case 'bebidas':
                        detalle = cantidad + (cantidad === 1 ? ' bebida: ' : ' bebidas: ') + nombre;
                        break;
                    default:
                        detalle = cantidad + (cantidad === 1 ? ' unidad de ' : ' unidades de ') + nombre;
                }
                return '• *' + detalle + '* — ' + formatoPrecio(p.precio * cantidad);
            }),
            '',
            'Recipientes: ' + formatoPrecio(totalRecipientes),
            '*TOTAL: ' + formatoPrecio(total) + '*',
            '',
            '*DATOS DE ENTREGA*',
            'Nombre: ' + datos.get('nombre'),
            'Teléfono: ' + datos.get('telefono'),
            'Dirección: ' + datos.get('direccion'),
            'Barrio: ' + datos.get('barrio'),
            'Indicaciones: ' + (datos.get('observaciones') || 'Ninguna'),
            'Método de pago: ' + datos.get('metodo_pago')
        ];
        window.open('https://wa.me/' + numeroWhatsApp + '?text=' + encodeURIComponent(lineas.join('\n')), '_blank', 'noopener');
    });

    // Muestra inmediatamente los productos recuperados al cargar la página.
    renderizar();

    // Prepara una copia local de la página y sus recursos para poder abrirla sin internet.
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./sw.js').catch(error => {
                console.warn('No se pudo activar el modo sin conexión.', error);
            });
        });
    }
});
