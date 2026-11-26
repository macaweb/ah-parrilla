// Navegación de categorías y pedidos por WhatsApp.
document.addEventListener('DOMContentLoaded', () => {
    const enlaces = [...document.querySelectorAll('.categorias a')];

    // Menú lateral: abre, cierra y navega a cada sección.
    const botonMenu = document.getElementById('abrir-menu-lateral');
    const fondoMenu = document.getElementById('fondo-menu-lateral');
    const cerrarMenu = document.getElementById('cerrar-menu-lateral');
    const botonWhatsappFlotante = document.querySelector('.whatsapp-flotante-ah');
    let temporizadorCierreMenu = null;
    let finalizarCierreMenu = null;

    function abrirMenu() {
        // Cancela cualquier cierre anterior si el usuario vuelve a abrir enseguida.
        if (temporizadorCierreMenu !== null) {
            window.clearTimeout(temporizadorCierreMenu);
            temporizadorCierreMenu = null;
        }
        if (finalizarCierreMenu) {
            fondoMenu.removeEventListener('animationend', finalizarCierreMenu);
            finalizarCierreMenu = null;
        }
        fondoMenu.classList.remove('menu-cerrando');
        fondoMenu.hidden = false;

        // Reinicia las animaciones de entrada para que los enlaces sigan visibles
        // cada vez que se vuelve a abrir el menú lateral.
        const panelMenu = fondoMenu.querySelector('.panel-menu-lateral');
        const enlacesVisiblesMenu = [...fondoMenu.querySelectorAll('.panel-menu-lateral > a')];
        [panelMenu, ...enlacesVisiblesMenu].filter(Boolean).forEach(elemento => {
            elemento.style.animation = 'none';
        });
        void fondoMenu.offsetWidth;
        [panelMenu, ...enlacesVisiblesMenu].filter(Boolean).forEach(elemento => {
            elemento.style.removeProperty('animation');
        });

        botonWhatsappFlotante.hidden = true;
        botonMenu.setAttribute('aria-expanded', 'true');
        document.body.style.overflow = 'hidden';
        actualizarCategoriaVisible();
        cerrarMenu.focus();
    }
    function cerrarMenuLateral(devolverFoco = true) {
        if (fondoMenu.hidden || fondoMenu.classList.contains('menu-cerrando')) return;
        fondoMenu.classList.add('menu-cerrando');
        botonMenu.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
        botonWhatsappFlotante.hidden = false;
        if (devolverFoco) botonMenu.focus();

        finalizarCierreMenu = evento => {
            if (evento && evento.target !== fondoMenu) return;
            // Un cierre viejo nunca debe ocultar el menú si ya se volvió a abrir.
            if (!fondoMenu.classList.contains('menu-cerrando')) return;
            fondoMenu.hidden = true;
            fondoMenu.classList.remove('menu-cerrando');
            fondoMenu.removeEventListener('animationend', finalizarCierreMenu);
            finalizarCierreMenu = null;
            if (temporizadorCierreMenu !== null) {
                window.clearTimeout(temporizadorCierreMenu);
                temporizadorCierreMenu = null;
            }
        };
        fondoMenu.addEventListener('animationend', finalizarCierreMenu);
        // Respaldo para navegadores que no disparen animationend.
        temporizadorCierreMenu = window.setTimeout(() => finalizarCierreMenu(), 360);
    }
    botonMenu.addEventListener('click', abrirMenu);
    cerrarMenu.addEventListener('click', cerrarMenuLateral);
    fondoMenu.addEventListener('click', e => {
        if (e.target === fondoMenu) cerrarMenuLateral();
    });
    const enlacesMenuLateral = [...fondoMenu.querySelectorAll('.panel-menu-lateral > a')];
    const marcarEnlaceMenu = enlaceElegido => {
        const destino = enlaceElegido?.getAttribute('href');
        enlacesMenuLateral.forEach(enlace => {
            const activo = enlace === enlaceElegido;
            enlace.classList.toggle('seleccionada', activo);
            if (activo) enlace.setAttribute('aria-current', 'location');
            else enlace.removeAttribute('aria-current');
        });
        enlaces.forEach(enlace => {
            const activo = enlace.getAttribute('href') === destino;
            enlace.classList.toggle('seleccionada', activo);
            if (activo) enlace.setAttribute('aria-current', 'location');
            else enlace.removeAttribute('aria-current');
        });
    };

    let temporizadorDestacado = null;
    const navegarASeccion = (enlace, desdeLateral = false) => {
        const destino = document.querySelector(enlace.getAttribute('href'));
        if (!destino) return;
        if (desdeLateral) cerrarMenuLateral(false);
        const enlaceLateral = enlacesMenuLateral.find(item => item.getAttribute('href') === enlace.getAttribute('href'));
        marcarEnlaceMenu(enlaceLateral || enlace);

        destino.classList.remove('navegacion-destacada');
        void destino.offsetWidth;
        destino.classList.add('navegacion-destacada');
        if (temporizadorDestacado !== null) window.clearTimeout(temporizadorDestacado);
        temporizadorDestacado = window.setTimeout(() => {
            destino.classList.remove('navegacion-destacada');
            temporizadorDestacado = null;
        }, 1450);

        destino.scrollIntoView({
            behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
            block: 'start'
        });
    };

    enlacesMenuLateral.forEach(enlace => {
        enlace.addEventListener('click', evento => {
            evento.preventDefault();
            navegarASeccion(enlace, true);
        });
    });
    enlaces.forEach(enlace => {
        enlace.addEventListener('click', evento => {
            evento.preventDefault();
            navegarASeccion(enlace, false);
        });
    });

    // Aparición progresiva de fotos, platos y sabores al entrar en pantalla.
    const elementosConEntrada = document.querySelectorAll(
        '.imagen-categoria, .lista-platos .plato-listado, .lista-sabores span'
    );
    if ('IntersectionObserver' in window) {
        const observadorEntrada = new IntersectionObserver((entradas, observador) => {
            entradas.forEach(entrada => {
                if (!entrada.isIntersecting) return;
                entrada.target.classList.add('elemento-visible');
                observador.unobserve(entrada.target);
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -35px 0px' });
        elementosConEntrada.forEach(elemento => {
            elemento.classList.add('elemento-con-entrada');
            observadorEntrada.observe(elemento);
        });
    } else {
        elementosConEntrada.forEach(elemento => elemento.classList.add('elemento-visible'));
    }

    // Mantiene sincronizada la categoría activa con la sección que está viendo la persona.
    const seccionesMenu = enlacesMenuLateral
        .map(enlace => document.querySelector(enlace.getAttribute('href')))
        .filter(Boolean);

    function actualizarCategoriaVisible() {
        if (!seccionesMenu.length) return;
        const lineaLectura = Math.min(window.innerHeight * 0.32, 260);
        const seccionesActivas = seccionesMenu.filter(seccion => {
            const rect = seccion.getBoundingClientRect();
            return rect.top <= lineaLectura && rect.bottom > lineaLectura;
        });
        const seccionActual = seccionesActivas[seccionesActivas.length - 1];

        if (seccionActual) {
            const enlaceActual = enlacesMenuLateral.find(
                enlace => enlace.getAttribute('href') === '#' + seccionActual.id
            );
            if (enlaceActual) marcarEnlaceMenu(enlaceActual);
        }
    }

    // Al abrir la barra, conserva la categoría correspondiente a la posición actual.
    window.addEventListener('scroll', actualizarCategoriaVisible, { passive: true });
    window.addEventListener('resize', actualizarCategoriaVisible);
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

    // Los almuerzos se eligen primero; el pedido se agrega con sus acompañamientos.
    let almuerzoElegido = null;
    document.querySelectorAll('.categoria-menu .lista-platos .plato-listado').forEach(plato => {
        const titulo = plato.querySelector('h3')?.textContent.trim();
        const seccion = plato.closest('.categoria-menu');
        if (!titulo || !seccion) return;
        let precio = Number((plato.querySelector('strong')?.textContent || '').replace(/[^0-9]/g, ''));
        if (!precio && seccion.id === 'almuerzos') precio = 20000;
        if (!precio && seccion.id === 'sopas') precio = 8000;
        if (!precio) return;

        if (seccion.id === 'almuerzos') {
            plato.classList.add('almuerzo-seleccionable');
            plato.setAttribute('role', 'button');
            plato.setAttribute('tabindex', '0');
            plato.setAttribute('aria-label', 'Seleccionar almuerzo: ' + titulo);
            const seleccionarAlmuerzo = () => {
                almuerzoElegido = { titulo, precio, elemento: plato };
                seccion.querySelectorAll('.plato-listado.almuerzo-seleccionable').forEach(item => {
                    item.classList.toggle('almuerzo-elegido', item === plato);
                    item.setAttribute('aria-pressed', item === plato ? 'true' : 'false');
                });
                const aviso = seccion.querySelector('.aviso-plato-almuerzo');
                if (aviso) aviso.hidden = true;
            };
            plato.addEventListener('click', seleccionarAlmuerzo);
            plato.addEventListener('keydown', evento => {
                if (evento.key === 'Enter' || evento.key === ' ') {
                    evento.preventDefault();
                    seleccionarAlmuerzo();
                }
            });
            return;
        }

        const boton = document.createElement('button');
        boton.type = 'button';
        boton.className = 'boton-agregar boton-agregar-icono';
        boton.textContent = '+';
        boton.setAttribute('aria-label', 'Agregar ' + titulo + ' al pedido');
        const costoRecipiente = seccion.id === 'sopas' ? 1000 : ['desayunos', 'platos-fuertes'].includes(seccion.id) ? 2000 : 0;
        boton.addEventListener('click', () => {
            agregar(titulo, precio, costoRecipiente, seccion.id);
            confirmarAgregado(boton);
        });
        plato.appendChild(boton);
    });

    // Selectores visuales por botones para almuerzos y especial del día.
    const crearGrupoOpciones = (contenedor, titulo, valores) => {
        const grupo = document.createElement('div');
        grupo.className = 'grupo-opciones-pedido';
        const encabezado = document.createElement('h4');
        encabezado.textContent = titulo;
        const botones = document.createElement('div');
        botones.className = 'opciones-botones-pedido';
        botones.setAttribute('role', 'group');
        botones.setAttribute('aria-label', titulo);
        let elegido = '';

        // Fríjoles siempre ocupa el botón inferior centrado.
        const ordenados = [...valores].sort((a, b) => {
            const esFrijolesA = /fr[ií]joles/i.test(a);
            const esFrijolesB = /fr[ií]joles/i.test(b);
            return Number(esFrijolesA) - Number(esFrijolesB);
        });

        ordenados.forEach(valor => {
            const opcion = document.createElement('button');
            opcion.type = 'button';
            opcion.className = 'opcion-pedido-boton';
            opcion.textContent = valor;
            opcion.setAttribute('aria-pressed', 'false');
            if (/fr[ií]joles/i.test(valor)) opcion.classList.add('opcion-frijoles');
            opcion.addEventListener('click', () => {
                elegido = valor;
                botones.querySelectorAll('.opcion-pedido-boton').forEach(boton => {
                    const activa = boton === opcion;
                    boton.classList.toggle('seleccionada', activa);
                    boton.setAttribute('aria-pressed', String(activa));
                });
                botones.classList.remove('falta-seleccion');
            });
            botones.appendChild(opcion);
        });

        grupo.append(encabezado, botones);
        contenedor.appendChild(grupo);
        return {
            elemento: grupo,
            get valor() { return elegido; },
            enfocar() {
                botones.classList.add('falta-seleccion');
                botones.querySelector('.opcion-pedido-boton')?.focus();
            }
        };
    };

    // Opciones del especial: ahora viven directamente en el JavaScript;
    // ya no dependen de listas duplicadas en el HTML.
    const opcionesSopasEspecial = ['Fríjoles', 'Sopa de lentejas', 'Crema de auyama'];
    const opcionesBebidasEspecial = ['Claro', 'Guarapo', 'Jugo de guayaba', 'Jugo de maracuyá'];

    // ALMUERZOS: primero se elige el plato y luego sus dos acompañamientos.
    const seccionAlmuerzos = document.getElementById('almuerzos');
    const listaAlmuerzos = seccionAlmuerzos?.querySelector('.lista-platos');
    if (seccionAlmuerzos && listaAlmuerzos) {
        const selectorAlmuerzos = document.createElement('div');
        selectorAlmuerzos.className = 'selector-almuerzos';
        const tituloSelector = document.createElement('h3');
        tituloSelector.textContent = 'Completa tu almuerzo';
        const avisoPlato = document.createElement('p');
        avisoPlato.className = 'aviso-plato-almuerzo';
        avisoPlato.textContent = 'Debes seleccionar un plato de almuerzo antes de agregarlo al pedido.';
        avisoPlato.setAttribute('role', 'alert');
        avisoPlato.hidden = true;
        const textoSelector = document.createElement('p');
        textoSelector.textContent = 'Después de elegir tu plato de la lista, selecciona los acompañantes:';
        const grupoSopas = document.createElement('div');
        grupoSopas.className = 'grupo-opciones-contenedor grupo-sopas-acompanamiento';
        const grupoBebidas = document.createElement('div');
        grupoBebidas.className = 'grupo-opciones-contenedor grupo-bebidas-acompanamiento';
        const selectorSopas = crearGrupoOpciones(grupoSopas, 'Sopa o crema (obligatoria)', opcionesSopasEspecial);
        const selectorBebidas = crearGrupoOpciones(grupoBebidas, 'Jugo o bebida (obligatorio)', opcionesBebidasEspecial);

        const botonAgregarAlmuerzo = document.createElement('button');
        botonAgregarAlmuerzo.type = 'button';
        botonAgregarAlmuerzo.className = 'boton-agregar boton-agregar-almuerzo';
        botonAgregarAlmuerzo.textContent = 'Agregar +';
        botonAgregarAlmuerzo.addEventListener('click', () => {
            if (!almuerzoElegido) {
                avisoPlato.hidden = false;
                listaAlmuerzos.querySelector('.almuerzo-seleccionable')?.focus();
                return;
            }
            if (!selectorSopas.valor) {
                selectorSopas.enfocar();
                return;
            }
            if (!selectorBebidas.valor) {
                selectorBebidas.enfocar();
                return;
            }
            const nombrePedido = almuerzoElegido.titulo + ' + ' + selectorSopas.valor + ' + ' + selectorBebidas.valor;
            agregar(nombrePedido, almuerzoElegido.precio, 2000, 'almuerzos');
            confirmarAgregado(botonAgregarAlmuerzo);
        });
        selectorAlmuerzos.append(tituloSelector, avisoPlato, textoSelector, grupoSopas, grupoBebidas, botonAgregarAlmuerzo);
        listaAlmuerzos.insertAdjacentElement('afterend', selectorAlmuerzos);
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
        botonJugo.textContent = 'Agregar +';
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

    // Menús desplegables personalizados: conserva el valor en el select original.
    function enfocarSelector(select) {
        const control = select.closest('.selector-personalizado')?.querySelector('.selector-personalizado-control');
        if (control) control.focus();
        else select.focus();
    }

    function personalizarDesplegable(select) {
        if (!select || select.dataset.personalizado === 'true') return;
        select.dataset.personalizado = 'true';

        const contenedor = document.createElement('div');
        contenedor.className = 'selector-personalizado';
        select.parentNode.insertBefore(contenedor, select);
        contenedor.appendChild(select);

        select.classList.add('selector-personalizado-nativo');
        select.tabIndex = -1;
        select.setAttribute('aria-hidden', 'true');

        const control = document.createElement('button');
        control.type = 'button';
        control.className = 'selector-personalizado-control';
        control.setAttribute('aria-haspopup', 'listbox');
        control.setAttribute('aria-expanded', 'false');
        control.setAttribute('aria-label', select.getAttribute('aria-label') || 'Abrir opciones');

        const flecha = document.createElement('span');
        flecha.className = 'selector-personalizado-flecha';
        flecha.setAttribute('aria-hidden', 'true');
        flecha.textContent = '⌄';
        const texto = document.createElement('span');
        texto.className = 'selector-personalizado-texto';
        control.append(texto, flecha);

        const lista = document.createElement('div');
        lista.className = 'selector-personalizado-lista';
        lista.setAttribute('role', 'listbox');
        lista.hidden = true;
        contenedor.append(control, lista);

        const actualizarTexto = () => {
            const opcion = select.options[select.selectedIndex];
            texto.textContent = opcion ? opcion.textContent : 'Selecciona una opción';
            lista.querySelectorAll('[role="option"]').forEach(item => {
                item.setAttribute('aria-selected', String(item.dataset.value === select.value));
            });
        };

        const esMetodoPago = select.name === 'metodo_pago';
        const limpiarPosicionFlotante = () => {
            if (!esMetodoPago) return;
            lista.style.position = '';
            lista.style.left = '';
            lista.style.right = '';
            lista.style.top = '';
            lista.style.bottom = '';
            lista.style.width = '';
            lista.style.maxHeight = '';
            lista.style.overflowY = '';
        };

        const cerrar = (devolverFoco = false) => {
            lista.hidden = true;
            contenedor.classList.remove('selector-personalizado-abierto');
            control.setAttribute('aria-expanded', 'false');
            limpiarPosicionFlotante();
            if (devolverFoco) control.focus();
        };

        const abrir = () => {
            document.querySelectorAll('.selector-personalizado-abierto').forEach(abierto => {
                if (abierto !== contenedor) {
                    abierto.classList.remove('selector-personalizado-abierto');
                    const otraLista = abierto.querySelector('.selector-personalizado-lista');
                    otraLista.hidden = true;
                    otraLista.style.position = '';
                    otraLista.style.left = '';
                    otraLista.style.right = '';
                    otraLista.style.top = '';
                    otraLista.style.bottom = '';
                    otraLista.style.width = '';
                    otraLista.style.maxHeight = '';
                    abierto.querySelector('.selector-personalizado-control').setAttribute('aria-expanded', 'false');
                }
            });
            lista.hidden = false;
            contenedor.classList.add('selector-personalizado-abierto');
            control.setAttribute('aria-expanded', 'true');

            // El menú de pago flota sobre el formulario y nunca obliga a desplazar toda la página.
            if (esMetodoPago) {
                const rect = control.getBoundingClientRect();
                const margen = 12;
                const espacioAbajo = Math.max(0, window.innerHeight - rect.bottom - 12);
                const espacioArriba = Math.max(0, rect.top - 12);
                const altoDeseado = Math.min(lista.scrollHeight, window.innerHeight - margen * 2);
                const abrirArriba = espacioAbajo < altoDeseado && espacioArriba > espacioAbajo;
                const altoDisponible = Math.max(100, abrirArriba ? espacioArriba - 7 : espacioAbajo - 7);
                lista.style.position = 'fixed';
                lista.style.left = rect.left + 'px';
                lista.style.right = 'auto';
                lista.style.width = rect.width + 'px';
                lista.style.maxHeight = Math.min(altoDeseado, altoDisponible) + 'px';
                lista.style.overflowY = 'auto';
                lista.style.top = abrirArriba ? 'auto' : (rect.bottom + 7) + 'px';
                lista.style.bottom = abrirArriba ? (window.innerHeight - rect.top + 7) + 'px' : 'auto';
            }
        };

        [...select.options].forEach((opcion, indice) => {
            // Los textos de ayuda nunca deben aparecer dentro de la lista desplegada.
            const textoOpcion = opcion.textContent.trim().toLocaleLowerCase('es');
            if (
                opcion.disabled ||
                opcion.value.trim() === '' ||
                textoOpcion === 'selecciona una opción' ||
                textoOpcion === 'seleccione una opción'
            ) return;
            const item = document.createElement('button');
            item.type = 'button';
            item.className = 'selector-personalizado-opcion';
            item.textContent = opcion.textContent;
            item.dataset.value = opcion.value;
            item.setAttribute('role', 'option');
            item.setAttribute('aria-selected', String(opcion.value === select.value));
            item.disabled = opcion.disabled || opcion.value === '';
            item.addEventListener('click', () => {
                // Resalta la opción inmediatamente, antes de cerrar el desplegable.
                lista.querySelectorAll('.selector-personalizado-opcion').forEach(opcionLista => {
                    opcionLista.setAttribute('aria-selected', String(opcionLista === item));
                    opcionLista.classList.remove('selector-personalizado-eleccion-inmediata');
                });
                select.value = opcion.value;
                select.dispatchEvent(new Event('change', { bubbles: true }));
                actualizarTexto();

                control.classList.remove('selector-personalizado-confirmado');
                void control.offsetWidth;
                control.classList.add('selector-personalizado-confirmado');
                if (control._temporizadorConfirmacion) clearTimeout(control._temporizadorConfirmacion);
                control._temporizadorConfirmacion = setTimeout(() => {
                    control.classList.remove('selector-personalizado-confirmado');
                }, 850);

                // Mantiene la opción elegida visible brevemente antes de cerrar la lista.
                if (item._temporizadorCierre) clearTimeout(item._temporizadorCierre);
                item._temporizadorCierre = setTimeout(() => cerrar(true), 220);
            });
            lista.appendChild(item);
        });

        control.addEventListener('click', () => {
            if (lista.hidden) abrir();
            else cerrar();
        });
        control.addEventListener('keydown', evento => {
            if (evento.key === 'ArrowDown' || evento.key === 'Enter' || evento.key === ' ') {
                evento.preventDefault();
                abrir();
                lista.querySelector('.selector-personalizado-opcion:not(:disabled)')?.focus();
            }
        });
        document.addEventListener('click', evento => {
            if (!contenedor.contains(evento.target)) cerrar();
        });
        lista.addEventListener('keydown', evento => {
            const opciones = [...lista.querySelectorAll('.selector-personalizado-opcion:not(:disabled)')];
            const actual = opciones.indexOf(document.activeElement);
            if (evento.key === 'Escape') {
                evento.preventDefault();
                cerrar(true);
            } else if (evento.key === 'ArrowDown' || evento.key === 'ArrowUp') {
                evento.preventDefault();
                const direccion = evento.key === 'ArrowDown' ? 1 : -1;
                opciones[(actual + direccion + opciones.length) % opciones.length]?.focus();
            } else if (evento.key === 'Home' || evento.key === 'End') {
                evento.preventDefault();
                (evento.key === 'Home' ? opciones[0] : opciones[opciones.length - 1])?.focus();
            }
        });
        select.addEventListener('change', actualizarTexto);
        actualizarTexto();
    }

    // El especial requiere una sopa o crema y una bebida, sin cobros adicionales.
    const bloqueEspecial = document.querySelector('.especial-dia');
    if (bloqueEspecial) {
        const contenedorSopas = document.getElementById('opciones-sopa-especial');
        const contenedorBebidas = document.getElementById('opciones-bebida-especial');
        const selectorSopas = crearGrupoOpciones(contenedorSopas, 'Sopa o crema (obligatoria)', opcionesSopasEspecial);
        const selectorBebidas = crearGrupoOpciones(contenedorBebidas, 'Jugo o bebida (obligatorio)', opcionesBebidasEspecial);
        const botonAgregarEspecial = document.getElementById('agregar-menu-especial');
        botonAgregarEspecial.textContent = 'Agregar +';
        botonAgregarEspecial.addEventListener('click', () => {
            if (!selectorSopas.valor) { selectorSopas.enfocar(); return; }
            if (!selectorBebidas.valor) { selectorBebidas.enfocar(); return; }
            const plato = bloqueEspecial.querySelector('.nombre-especial')?.textContent.trim() || 'Plato del día';
            const nombreMenu = 'Menú especial: ' + plato + ' + ' + selectorSopas.valor + ' + ' + selectorBebidas.valor;
            agregar(nombreMenu, 19000, 2000, 'especiales');
            confirmarAgregado(botonAgregarEspecial);
        });
    }

    // Solo se personaliza la lista que se despliega; el texto y el tamaño del control se conservan.
    document.querySelectorAll('.selector-especial select, #almuerzos .selector-almuerzos select, .formulario-pedido select[name="metodo_pago"]')
        .forEach(personalizarDesplegable);

    function confirmarAgregado(boton) {
        const textoOriginal = boton.dataset.textoOriginal || boton.textContent;
        boton.dataset.textoOriginal = textoOriginal;
        const esBotonIcono = boton.classList.contains('boton-agregar-icono');
        const esBotonEspecialOAlmuerzo = boton.id === 'agregar-menu-especial' || boton.classList.contains('boton-agregar-almuerzo');
        boton.textContent = esBotonEspecialOAlmuerzo ? 'Agregado' : (esBotonIcono ? '✓' : '✓ Agregado');
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
        // Reinicia la animación para que se note cada producto agregado.
        botonCarrito.classList.remove('animar-carrito');
        contadorEl.classList.remove('animar-contador');
        void botonCarrito.offsetWidth;
        botonCarrito.classList.add('animar-carrito');
        contadorEl.classList.add('animar-contador');
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

    const opcionesEntrega = formulario.querySelectorAll('input[name="tipo_entrega"]');
    const camposDomicilio = document.getElementById('campos-domicilio');
    const campoDireccion = formulario.elements.direccion;
    const campoBarrio = formulario.elements.barrio;
    const campoObservaciones = formulario.elements.observaciones;
    const labelObservaciones = document.getElementById('label-observaciones');

    opcionesEntrega.forEach(opcion => opcion.addEventListener('change', () => {
        const esDomicilio = opcion.value === 'Domicilio';
        camposDomicilio.hidden = !esDomicilio;
        campoDireccion.required = esDomicilio;
        campoBarrio.required = esDomicilio;
        if (!esDomicilio) {
            campoDireccion.value = '';
            campoBarrio.value = '';
        }

        labelObservaciones.firstChild.textContent = esDomicilio
            ? 'Indicaciones adicionales '
            : 'Hora de recogida específica, indicaciones o comentarios ';
        campoObservaciones.placeholder = esDomicilio
            ? 'Apartamento, indicaciones o comentarios'
            : 'Indica la hora de recogida y cualquier comentario';
    }));

    formulario.addEventListener('submit', e => {
        e.preventDefault();
        if (!carrito.size) return;
        if (!formulario.reportValidity()) return;
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
                return '• ' + detalle + ' — ' + formatoPrecio(p.precio * cantidad);
            }),
            '',
            'Recipientes: ' + formatoPrecio(totalRecipientes),
            '*TOTAL: ' + formatoPrecio(total) + '*',
            '',
            '*DATOS DE ENTREGA*',
            'Nombre: ' + datos.get('nombre'),
            'Teléfono: ' + datos.get('telefono'),
            'Entrega: ' + datos.get('tipo_entrega'),
            ...(datos.get('tipo_entrega') === 'Domicilio' ? [
                'Dirección: ' + datos.get('direccion'),
                'Barrio: ' + datos.get('barrio')
            ] : []),
            'Indicaciones: ' + (datos.get('observaciones') || 'Ninguna'),
            'Método de pago: ' + datos.get('metodo_pago')
        ];
        window.open('https://wa.me/' + numeroWhatsApp + '?text=' + encodeURIComponent(lineas.join('\n')), '_blank', 'noopener');
    });

    // Muestra inmediatamente los productos recuperados al cargar la página.
    renderizar();

    // El sitio ya no registra Service Worker: GitHub Pages entrega siempre la versión publicada.
});
