// ============================================================================
// CONSTANTES Y CONFIGURACIÓN
// ============================================================================

// Versión de la aplicación
const APP_VERSION = '2.0.0';

// Base de Datos de Precios (con valores de ejemplo realistas para 2024)
const PRECIOS = {
    "CABA": {
        "pintura-interior": { min: 12000, max: 18000, unidad: "m²", icon: "home", desc: "Incluye masillado básico" },
        "pintura-exterior": { min: 11000, max: 14000, unidad: "m²", icon: "building", desc: "Con hidrolavado previo" },
        "pintura-cielo-raso": { min: 10000, max: 12000, unidad: "m²", icon: "cloud", desc: "Interior, altura normal" },
        "pintura-sintetica": { min: 9000, max: 12000, unidad: "m²", icon: "paint-brush", desc: "Para carpintería/herrería" },
        "pintura-epoxica": { min: 11000, max: 13000, unidad: "m²", icon: "layer-group", desc: "Garages, pisos industriales" },
        "pintura-altura": { min: 18000, max: 25000, unidad: "m²", icon: "ladder", desc: "Andamio o plataforma" },
        "reparacion-paredes": { min: 8000, max: 15000, unidad: "m²", icon: "tools", desc: "Grietas y huecos" },
        "impermeabilizacion": { min: 10000, max: 12000, unidad: "m²", icon: "umbrella", desc: "Líquida o membrana" },
        "revestimiento-plastico": { min: 15000, max: 20000, unidad: "m²", icon: "texture", desc: "Texturado o liso" },
        "jornal": { min: 50000, max: 70000, unidad: "día", icon: "calendar-day", desc: "Reparaciones varias" }
    },
    "GBA": {
        "pintura-interior": { min: 10000, max: 14000, unidad: "m²", icon: "home", desc: "Incluye masillado básico" },
        "pintura-exterior": { min: 9000, max: 10000, unidad: "m²", icon: "building", desc: "Con hidrolavado previo" },
        "pintura-cielo-raso": { min: 8000, max: 11000, unidad: "m²", icon: "cloud", desc: "Interior, altura normal" },
        "pintura-sintetica": { min: 7000, max: 10000, unidad: "m²", icon: "paint-brush", desc: "Para carpintería/herrería" },
        "pintura-epoxica": { min: 10000, max: 12000, unidad: "m²", icon: "layer-group", desc: "Garages, pisos industriales" },
        "pintura-altura": { min: 16000, max: 22000, unidad: "m²", icon: "ladder", desc: "Andamio o plataforma" },
        "reparacion-paredes": { min: 6000, max: 10000, unidad: "m²", icon: "tools", desc: "Grietas y huecos" },
        "impermeabilizacion": { min: 7000, max: 9000, unidad: "m²", icon: "umbrella", desc: "Líquida o membrana" },
        "revestimiento-plastico": { min: 12000, max: 15000, unidad: "m²", icon: "texture", desc: "Texturado o liso" },
        "jornal": { min: 45000, max: 60000, unidad: "día", icon: "calendar-day", desc: "Reparaciones varias" }
    }
};

// Rendimientos de materiales (m² por litro)
const RENDIMIENTOS = {
    "pintura-interior": 10,
    "pintura-exterior": 8,
    "pintura-epoxica": 5,
    "pintura-sintetica": 12,
    "pintura-altura": 9,
    "impermeabilizacion": 3,
    "revestimiento-plastico": 6
};

// Precios aproximados de materiales (por litro o unidad)
const PRECIOS_MATERIALES = {
    "pintura-latex": 15000,
    "pintura-exterior": 18000,
    "pintura-epoxica": 25000,
    "sellador": 8000,
    "masilla": 12000,
    "lija": 500,
    "rodillo": 3000,
    "brocha": 2000
};

// ============================================================================
// ESTADO DE LA APLICACIÓN
// ============================================================================

const estadoApp = {
    zona: "CABA",
    trabajo: "",
    metros: 50,
    historial: [],
    tema: localStorage.getItem('tema') || 'light',
    ultimaActualizacion: null
};

// ============================================================================
// FUNCIONES DE UTILIDAD
// ============================================================================

/**
 * Formatea números con separadores de miles
 */
function formatearNumero(numero) {
    return new Intl.NumberFormat('es-AR', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(numero);
}

/**
 * Formatea moneda en pesos argentinos
 */
function formatearMoneda(monto) {
    return `$${formatearNumero(monto)}`;
}

/**
 * Obtiene la fecha actual formateada
 */
function obtenerFechaActual() {
    const ahora = new Date();
    const opciones = { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return ahora.toLocaleDateString('es-AR', opciones);
}

/**
 * Guarda datos en localStorage con manejo de errores
 */
function guardarEnStorage(clave, datos) {
    try {
        localStorage.setItem(clave, JSON.stringify(datos));
        return true;
    } catch (error) {
        console.error('Error al guardar en localStorage:', error);
        mostrarToast('Error al guardar datos', 'error');
        return false;
    }
}

/**
 * Carga datos de localStorage
 */
function cargarDeStorage(clave) {
    try {
        const datos = localStorage.getItem(clave);
        return datos ? JSON.parse(datos) : null;
    } catch (error) {
        console.error('Error al cargar de localStorage:', error);
        return null;
    }
}

/**
 * Muestra una notificación toast
 */
function mostrarToast(mensaje, tipo = 'info', duracion = 5000) {
    const contenedor = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast toast-${tipo}`;
    
    const iconos = {
        success: 'check-circle',
        error: 'exclamation-circle',
        warning: 'exclamation-triangle',
        info: 'info-circle'
    };
    
    toast.innerHTML = `
        <div class="toast-icon">
            <i class="fas fa-${iconos[tipo]}"></i>
        </div>
        <div class="toast-content">
            <div class="toast-title">${tipo.charAt(0).toUpperCase() + tipo.slice(1)}</div>
            <div class="toast-message">${mensaje}</div>
        </div>
        <button class="toast-close">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    contenedor.appendChild(toast);
    
    // Auto-eliminar después de la duración
    setTimeout(() => {
        toast.style.animation = 'toastSlideIn 0.3s ease-out reverse';
        setTimeout(() => toast.remove(), 300);
    }, duracion);
    
    // Cerrar manualmente
    toast.querySelector('.toast-close').addEventListener('click', () => {
        toast.style.animation = 'toastSlideIn 0.3s ease-out reverse';
        setTimeout(() => toast.remove(), 300);
    });
}

// ============================================================================
// MANEJO DEL TEMA (CLARO/OSCURO)
// ============================================================================

/**
 * Inicializa el tema de la aplicación
 */
function inicializarTema() {
    document.documentElement.setAttribute('data-theme', estadoApp.tema);
    
    const icono = document.querySelector('#themeToggle i');
    if (icono) {
        icono.className = estadoApp.tema === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }
    
    // Actualizar estadísticas para tema oscuro
    if (estadoApp.tema === 'dark') {
        document.getElementById('statUsers').textContent = '950+';
        document.getElementById('statUpdates').textContent = '32';
    }
}

/**
 * Cambia el tema entre claro y oscuro
 */
function alternarTema() {
    estadoApp.tema = estadoApp.tema === 'light' ? 'dark' : 'light';
    localStorage.setItem('tema', estadoApp.tema);
    inicializarTema();
    mostrarToast(`Modo ${estadoApp.tema === 'dark' ? 'oscuro' : 'claro'} activado`, 'info');
}

// ============================================================================
// MANEJO DE LA CALCULADORA
// ============================================================================

/**
 * Inicializa la calculadora paso a paso
 */
function inicializarCalculadora() {
    // Cargar historial
    cargarHistorial();
    
    // Inicializar pasos
    inicializarPaso1();
    inicializarPaso2();
    inicializarPaso3();
    inicializarPaso4();
    
    // Configurar navegación entre pasos
    configurarNavegacionPasos();
}

/**
 * Inicializa el paso 1 (selección de zona)
 */
function inicializarPaso1() {
    const zonaCards = document.querySelectorAll('.zone-card');
    
    zonaCards.forEach(card => {
        card.addEventListener('click', () => {
            // Quitar selección anterior
            zonaCards.forEach(c => c.classList.remove('selected'));
            
            // Seleccionar nueva zona
            card.classList.add('selected');
            estadoApp.zona = card.dataset.zone;
            
            // Actualizar estadísticas visuales
            actualizarEstadisticasZona();
            
            // Habilitar siguiente paso
            document.querySelector('[data-next="2"]').disabled = false;
        });
    });
    
    // Seleccionar CABA por defecto
    document.querySelector('.zone-card[data-zone="CABA"]').classList.add('selected');
}

/**
 * Inicializa el paso 2 (selección de trabajo)
 */
function inicializarPaso2() {
    const contenedorTrabajos = document.getElementById('jobSelection');
    const buscador = document.getElementById('jobSearch');
    
    // Cargar trabajos
    function cargarTrabajos(filtro = '') {
        contenedorTrabajos.innerHTML = '';
        
        Object.entries(PRECIOS[estadoApp.zona]).forEach(([id, datos]) => {
            const trabajo = obtenerInfoTrabajo(id);
            const terminoBusqueda = filtro.toLowerCase();
            
            if (filtro && !trabajo.nombre.toLowerCase().includes(terminoBusqueda) && 
                !trabajo.desc.toLowerCase().includes(terminoBusqueda)) {
                return;
            }
            
            const card = document.createElement('div');
            card.className = 'job-card';
            card.dataset.job = id;
            
            card.innerHTML = `
                <div class="job-header">
                    <div class="job-icon">
                        <i class="fas fa-${datos.icon}"></i>
                    </div>
                    <div>
                        <div class="job-title">${trabajo.nombre}</div>
                        <div class="job-price">${formatearMoneda(datos.min)} - ${formatearMoneda(datos.max)} /${datos.unidad}</div>
                    </div>
                </div>
                <div class="job-desc">${trabajo.desc}</div>
            `;
            
            card.addEventListener('click', () => {
                document.querySelectorAll('.job-card').forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                estadoApp.trabajo = id;
                
                // Habilitar siguiente paso
                document.querySelector('[data-next="3"]').disabled = false;
                
                // Si es jornal, ajustar metros
                if (id === 'jornal') {
                    document.getElementById('metrosInput').value = 1;
                    document.getElementById('metrosInput').disabled = true;
                } else {
                    document.getElementById('metrosInput').disabled = false;
                }
            });
            
            contenedorTrabajos.appendChild(card);
        });
    }
    
    // Búsqueda en tiempo real
    buscador.addEventListener('input', (e) => {
        cargarTrabajos(e.target.value);
    });
    
    // Cargar trabajos iniciales
    cargarTrabajos();
}

/**
 * Inicializa el paso 3 (metros cuadrados)
 */
function inicializarPaso3() {
    const inputMetros = document.getElementById('metrosInput');
    const botonesRapidos = document.querySelectorAll('.quick-meter-btn');
    
    // Botones rápidos
    botonesRapidos.forEach(boton => {
        boton.addEventListener('click', () => {
            estadoApp.metros = parseFloat(boton.dataset.meters);
            inputMetros.value = estadoApp.metros;
            inputMetros.focus();
        });
    });
    
    // Input manual
    inputMetros.addEventListener('input', (e) => {
        estadoApp.metros = parseFloat(e.target.value) || 1;
    });
    
    // Validación
    inputMetros.addEventListener('blur', (e) => {
        if (e.target.value < 1) {
            e.target.value = 1;
            estadoApp.metros = 1;
        }
    });
    
    // Botón calcular
    document.getElementById('calculateBtn').addEventListener('click', calcularPresupuesto);
}

/**
 * Inicializa el paso 4 (resultados)
 */
function inicializarPaso4() {
    // Botones de acción
    document.getElementById('saveCalculation').addEventListener('click', guardarCalculo);
    document.getElementById('shareWhatsApp').addEventListener('click', compartirWhatsApp);
    document.getElementById('downloadPDF').addEventListener('click', generarPDF);
    document.getElementById('newCalculation').addEventListener('click', reiniciarCalculadora);
}

/**
 * Configura la navegación entre pasos
 */
function configurarNavegacionPasos() {
    // Botones siguiente
    document.querySelectorAll('.btn-next-step').forEach(boton => {
        boton.addEventListener('click', (e) => {
            const pasoActual = e.target.dataset.next;
            cambiarPaso(pasoActual);
        });
    });
    
    // Botones anterior
    document.querySelectorAll('.btn-prev-step').forEach(boton => {
        boton.addEventListener('click', (e) => {
            const pasoAnterior = e.target.dataset.prev;
            cambiarPaso(pasoAnterior);
        });
    });
}

/**
 * Cambia entre pasos de la calculadora
 */
function cambiarPaso(nuevoPaso) {
    // Ocultar todos los pasos
    document.querySelectorAll('.calculator-step').forEach(paso => {
        paso.classList.remove('active');
    });
    
    // Mostrar nuevo paso
    document.getElementById(`step${nuevoPaso}`).classList.add('active');
    
    // Actualizar indicadores de progreso
    document.querySelectorAll('.step-indicator').forEach((indicador, index) => {
        if (index + 1 <= nuevoPaso) {
            indicador.classList.add('active');
        } else {
            indicador.classList.remove('active');
        }
    });
}

/**
 * Calcula el presupuesto
 */
function calcularPresupuesto() {
    if (!estadoApp.trabajo) {
        mostrarToast('Por favor, selecciona un tipo de trabajo', 'error');
        cambiarPaso(2);
        return;
    }
    
    const precios = PRECIOS[estadoApp.zona][estadoApp.trabajo];
    let minTotal, maxTotal;
    
    if (estadoApp.trabajo === 'jornal') {
        minTotal = precios.min;
        maxTotal = precios.max;
    } else {
        minTotal = precios.min * estadoApp.metros;
        maxTotal = precios.max * estadoApp.metros;
    }
    
    // Actualizar UI con resultados
    document.getElementById('resultAmount').innerHTML = `
        <span class="currency">$</span>
        <span class="amount-min">${formatearNumero(minTotal)}</span>
        <span class="amount-separator"> - </span>
        <span class="currency">$</span>
        <span class="amount-max">${formatearNumero(maxTotal)}</span>
    `;
    
    document.getElementById('resultZone').textContent = estadoApp.zona;
    document.getElementById('resultJob').textContent = obtenerInfoTrabajo(estadoApp.trabajo).nombre;
    document.getElementById('resultMeters').textContent = estadoApp.trabajo === 'jornal' ? 'Por día' : `${formatearNumero(estadoApp.metros)} m²`;
    document.getElementById('resultDate').textContent = obtenerFechaActual();
    
    // Calcular y mostrar materiales
    const materiales = calcularMateriales();
    mostrarMateriales(materiales);
    
    // Ir al paso de resultados
    cambiarPaso(4);
    
    // Scroll suave
    document.getElementById('calculadora').scrollIntoView({ behavior: 'smooth' });
}

/**
 * Calcula materiales aproximados
 */
function calcularMateriales() {
    if (estadoApp.trabajo === 'jornal' || !RENDIMIENTOS[estadoApp.trabajo]) {
        return null;
    }
    
    const rendimiento = RENDIMIENTOS[estadoApp.trabajo];
    const litrosNecesarios = Math.ceil(estadoApp.metros / rendimiento);
    
    return {
        litros: litrosNecesarios,
        costoPintura: litrosNecesarios * PRECIOS_MATERIALES['pintura-latex'],
        otrosMateriales: [
            { nombre: 'Rodillos', cantidad: Math.ceil(estadoApp.metros / 50), costo: 3000 },
            { nombre: 'Brochas', cantidad: 2, costo: 4000 },
            { nombre: 'Lijas', cantidad: Math.ceil(estadoApp.metros / 20), costo: 2000 },
            { nombre: 'Masilla', cantidad: Math.ceil(estadoApp.metros / 30), costo: 8000 }
        ]
    };
}

/**
 * Muestra los materiales calculados
 */
function mostrarMateriales(materiales) {
    const contenedor = document.getElementById('materialsEstimation');
    const lista = contenedor.querySelector('.materials-list');
    
    if (!materiales) {
        contenedor.style.display = 'none';
        return;
    }
    
    contenedor.style.display = 'block';
    lista.innerHTML = '';
    
    // Pintura
    const itemPintura = document.createElement('div');
    itemPintura.className = 'material-item';
    itemPintura.innerHTML = `
        <div>
            <div class="material-name">Pintura</div>
            <div class="material-quantity">${materiales.litros} litros aprox.</div>
        </div>
        <div class="material-cost">${formatearMoneda(materiales.costoPintura)}</div>
    `;
    lista.appendChild(itemPintura);
    
    // Otros materiales
    let costoTotal = materiales.costoPintura;
    
    materiales.otrosMateriales.forEach(material => {
        const item = document.createElement('div');
        item.className = 'material-item';
        item.innerHTML = `
            <div>
                <div class="material-name">${material.nombre}</div>
                <div class="material-quantity">${material.cantidad} unidades</div>
            </div>
            <div class="material-cost">${formatearMoneda(material.costo)}</div>
        `;
        lista.appendChild(item);
        costoTotal += material.costo;
    });
    
    // Total
    const itemTotal = document.createElement('div');
    itemTotal.className = 'material-item total';
    itemTotal.innerHTML = `
        <div>
            <div class="material-name"><strong>Total materiales estimado</strong></div>
            <div class="material-quantity">Aproximado</div>
        </div>
        <div class="material-cost"><strong>${formatearMoneda(costoTotal)}</strong></div>
    `;
    lista.appendChild(itemTotal);
}

// ============================================================================
// HISTORIAL DE CÁLCULOS
// ============================================================================

/**
 * Guarda el cálculo actual en el historial
 */
function guardarCalculo() {
    const resultado = {
        id: Date.now(),
        fecha: new Date().toISOString(),
        zona: estadoApp.zona,
        trabajo: estadoApp.trabajo,
        metros: estadoApp.metros,
        min: calcularTotal(true),
        max: calcularTotal(false),
        materiales: calcularMateriales()
    };
    
    estadoApp.historial.unshift(resultado);
    
    // Mantener solo últimos 50 cálculos
    if (estadoApp.historial.length > 50) {
        estadoApp.historial = estadoApp.historial.slice(0, 50);
    }
    
    guardarEnStorage('historialCalculos', estadoApp.historial);
    cargarHistorial();
    mostrarToast('Cálculo guardado en historial', 'success');
}

/**
 * Carga el historial desde localStorage
 */
function cargarHistorial() {
    const historial = cargarDeStorage('historialCalculos') || [];
    estadoApp.historial = historial;
    actualizarVistaHistorial();
}

/**
 * Actualiza la vista del historial
 */
function actualizarVistaHistorial() {
    const contenedorVacio = document.getElementById('historyEmpty');
    const contenedorCartas = document.getElementById('historyCards');
    
    if (estadoApp.historial.length === 0) {
        contenedorVacio.style.display = 'block';
        contenedorCartas.style.display = 'none';
        return;
    }
    
    contenedorVacio.style.display = 'none';
    contenedorCartas.style.display = 'grid';
    contenedorCartas.innerHTML = '';
    
    estadoApp.historial.forEach(calculo => {
        const carta = crearCartaHistorial(calculo);
        contenedorCartas.appendChild(carta);
    });
}

/**
 * Crea una carta de historial
 */
function crearCartaHistorial(calculo) {
    const trabajo = obtenerInfoTrabajo(calculo.trabajo);
    const fecha = new Date(calculo.fecha).toLocaleDateString('es-AR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });
    
    const carta = document.createElement('div');
    carta.className = 'history-card';
    carta.innerHTML = `
        <div class="history-card-header">
            <div class="history-date">${fecha}</div>
            <div class="history-actions">
                <button class="history-action-btn" data-action="reuse" title="Usar de nuevo">
                    <i class="fas fa-redo"></i>
                </button>
                <button class="history-action-btn" data-action="delete" title="Eliminar">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
        <div class="history-card-content">
            <div class="history-detail">
                <div class="history-label">Trabajo</div>
                <div class="history-value">${trabajo.nombre}</div>
            </div>
            <div class="history-detail">
                <div class="history-label">Zona</div>
                <div class="history-value">${calculo.zona}</div>
            </div>
            <div class="history-detail">
                <div class="history-label">Superficie</div>
                <div class="history-value">${calculo.trabajo === 'jornal' ? 'Por día' : calculo.metros + ' m²'}</div>
            </div>
            <div class="history-detail">
                <div class="history-label">Total</div>
                <div class="history-amount">${formatearMoneda(calculo.min)} - ${formatearMoneda(calculo.max)}</div>
            </div>
        </div>
    `;
    
    // Event listeners para botones
    carta.querySelector('[data-action="reuse"]').addEventListener('click', () => {
        reusarCalculo(calculo);
    });
    
    carta.querySelector('[data-action="delete"]').addEventListener('click', () => {
        eliminarDelHistorial(calculo.id);
    });
    
    return carta;
}

/**
 * Reutiliza un cálculo del historial
 */
function reusarCalculo(calculo) {
    estadoApp.zona = calculo.zona;
    estadoApp.trabajo = calculo.trabajo;
    estadoApp.metros = calculo.metros;
    
    // Actualizar UI
    document.querySelectorAll('.zone-card').forEach(card => {
        card.classList.toggle('selected', card.dataset.zone === calculo.zona);
    });
    
    cambiarPaso(2);
    cargarTrabajosEnPaso2();
    document.getElementById('metrosInput').value = calculo.metros;
    
    mostrarToast('Cálculo cargado', 'success');
}

/**
 * Elimina un cálculo del historial
 */
function eliminarDelHistorial(id) {
    estadoApp.historial = estadoApp.historial.filter(calculo => calculo.id !== id);
    guardarEnStorage('historialCalculos', estadoApp.historial);
    actualizarVistaHistorial();
    mostrarToast('Cálculo eliminado', 'warning');
}

/**
 * Limpia todo el historial
 */
function limpiarHistorial() {
    if (confirm('¿Estás seguro de que querés eliminar todo el historial? Esta acción no se puede deshacer.')) {
        estadoApp.historial = [];
        guardarEnStorage('historialCalculos', []);
        actualizarVistaHistorial();
        mostrarToast('Historial limpiado', 'success');
    }
}

// ============================================================================
// TABLA DE PRECIOS
// ============================================================================

/**
 * Inicializa la tabla de precios
 */
function inicializarTablaPrecios() {
    cargarTablaPrecios();
    
    // Búsqueda
    document.getElementById('tableSearch').addEventListener('input', (e) => {
        filtrarTabla(e.target.value);
    });
    
    // Filtro por zona
    document.getElementById('tableFilterZone').addEventListener('change', (e) => {
        filtrarTabla(document.getElementById('tableSearch').value, e.target.value);
    });
    
    // Actualizar precios
    document.getElementById('refreshPrices').addEventListener('click', () => {
        cargarTablaPrecios();
        mostrarToast('Tabla actualizada', 'success');
    });
    
    // Exportar
    document.getElementById('exportTable').addEventListener('click', exportarTablaCSV);
}

/**
 * Carga la tabla de precios
 */
function cargarTablaPrecios() {
    const tbody = document.getElementById('priceTableBody');
    tbody.innerHTML = '';
    
    Object.entries(PRECIOS.CABA).forEach(([id, precioCABA]) => {
        const precioGBA = PRECIOS.GBA[id];
        const trabajo = obtenerInfoTrabajo(id);
        const diferencia = ((precioCABA.min - precioGBA.min) / precioCABA.min * 100).toFixed(1);
        
        const fila = document.createElement('tr');
        fila.innerHTML = `
            <td class="col-work">
                <div style="display: flex; align-items: center; gap: 8px;">
                    <i class="fas fa-${precioCABA.icon}" style="color: var(--primary-500);"></i>
                    ${trabajo.nombre}
                </div>
                <div style="font-size: 0.75rem; color: var(--gray-500); margin-top: 4px;">
                    ${trabajo.desc}
                </div>
            </td>
            <td class="col-caba">
                ${formatearMoneda(precioCABA.min)} - ${formatearMoneda(precioCABA.max)}
                <div style="font-size: 0.75rem; color: var(--gray-500);">
                    por ${precioCABA.unidad}
                </div>
            </td>
            <td class="col-gba">
                ${formatearMoneda(precioGBA.min)} - ${formatearMoneda(precioGBA.max)}
                <div style="font-size: 0.75rem; color: var(--gray-500);">
                    por ${precioGBA.unidad}
                </div>
            </td>
            <td class="col-diff">
                <span style="color: ${diferencia >= 10 ? 'var(--success)' : 'var(--warning)'};">
                    ${diferencia}% menos
                </span>
            </td>
            <td class="col-actions">
                <button class="btn-use-price" data-job="${id}">
                    Usar
                </button>
            </td>
        `;
        
        tbody.appendChild(fila);
    });
    
    // Event listeners para botones "Usar"
    document.querySelectorAll('.btn-use-price').forEach(boton => {
        boton.addEventListener('click', (e) => {
            const trabajoId = e.target.dataset.job;
            usarPrecioDeTabla(trabajoId);
        });
    });
}

/**
 * Filtra la tabla de precios
 */
function filtrarTabla(termino, zona = 'all') {
    const filas = document.querySelectorAll('#priceTableBody tr');
    const terminoLower = termino.toLowerCase();
    
    filas.forEach(fila => {
        const texto = fila.textContent.toLowerCase();
        const zonaFila = fila.querySelector('.btn-use-price').dataset.job in PRECIOS.CABA ? 'CABA' : 'GBA';
        
        const coincideBusqueda = !termino || texto.includes(terminoLower);
        const coincideZona = zona === 'all' || zona === zonaFila;
        
        fila.style.display = coincideBusqueda && coincideZona ? '' : 'none';
    });
}

/**
 * Usa un precio de la tabla en la calculadora
 */
function usarPrecioDeTabla(trabajoId) {
    estadoApp.trabajo = trabajoId;
    
    // Ir a la calculadora
    document.querySelector('a[href="#calculadora"]').click();
    
    // Seleccionar el trabajo
    setTimeout(() => {
        const card = document.querySelector(`.job-card[data-job="${trabajoId}"]`);
        if (card) {
            card.click();
        }
        cambiarPaso(3);
    }, 100);
    
    mostrarToast('Precio cargado en calculadora', 'success');
}

// ============================================================================
// COMPARTIR Y EXPORTAR
// ============================================================================

/**
 * Comparte el resultado por WhatsApp
 */
function compartirWhatsApp() {
    const min = calcularTotal(true);
    const max = calcularTotal(false);
    const trabajo = obtenerInfoTrabajo(estadoApp.trabajo);
    
    const texto = `🎨 *Presupuesto de Pintura*
    
*Trabajo:* ${trabajo.nombre}
*Zona:* ${estadoApp.zona}
*Superficie:* ${estadoApp.trabajo === 'jornal' ? 'Por día' : estadoApp.metros + ' m²'}
*Mano de obra:* $${formatearNumero(min)} - $${formatearNumero(max)}

*Materiales estimados:*
${estadoApp.trabajo !== 'jornal' ? `- Pintura: $${formatearNumero(calcularMateriales()?.costoPintura || 0)}\n- Total aprox: $${formatearNumero((calcularMateriales()?.costoPintura || 0) + 17000)}` : 'No incluido'}

💡 *Generado con TuPresupuestoAR*
📱 https://tupresupuesto.ar`;

    const url = `https://wa.me/?text=${encodeURIComponent(texto)}`;
    window.open(url, '_blank');
}

/**
 * Genera un PDF del presupuesto
 */
async function generarPDF() {
    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Configuración
        const margen = 20;
        let y = margen;
        
        // Logo y título
        doc.setFillColor(37, 99, 235);
        doc.rect(0, 0, 210, 40, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(24);
        doc.text('TuPresupuestoAR', margen, 25);
        
        doc.setTextColor(150, 150, 150);
        doc.setFontSize(10);
        doc.text('Presupuesto profesional de pintura', margen, 32);
        
        // Información del presupuesto
        y = 50;
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(16);
        doc.text('Detalles del Presupuesto', margen, y);
        y += 10;
        
        doc.setFontSize(10);
        doc.text(`Fecha: ${obtenerFechaActual()}`, margen, y);
        y += 6;
        doc.text(`Zona: ${estadoApp.zona}`, margen, y);
        y += 6;
        doc.text(`Trabajo: ${obtenerInfoTrabajo(estadoApp.trabajo).nombre}`, margen, y);
        y += 6;
        doc.text(`Superficie: ${estadoApp.trabajo === 'jornal' ? 'Por día' : estadoApp.metros + ' m²'}`, margen, y);
        
        // Total estimado
        y += 15;
        doc.setFontSize(20);
        doc.setTextColor(37, 99, 235);
        const min = calcularTotal(true);
        const max = calcularTotal(false);
        doc.text(`Total estimado: $${formatearNumero(min)} - $${formatearNumero(max)}`, margen, y);
        
        // Notas
        y += 20;
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text('Notas importantes:', margen, y);
        y += 6;
        doc.text('- Este es un rango de referencia para mano de obra profesional.', margen, y);
        y += 6;
        doc.text('- No incluye costos de materiales, herramientas especiales o andamios.', margen, y);
        y += 6;
        doc.text('- El precio final puede variar según complejidad y detalles específicos.', margen, y);
        
        // Guardar PDF
        const fecha = new Date().toISOString().split('T')[0];
        doc.save(`presupuesto-pintura-${fecha}.pdf`);
        
        mostrarToast('PDF generado correctamente', 'success');
    } catch (error) {
        console.error('Error generando PDF:', error);
        mostrarToast('Error al generar PDF', 'error');
    }
}

/**
 * Exporta la tabla a CSV
 */
function exportarTablaCSV() {
    let csv = 'Trabajo,CABA Min,CABA Max,GBA Min,GBA Max,Unidad,Descripción\n';
    
    Object.entries(PRECIOS.CABA).forEach(([id, precioCABA]) => {
        const precioGBA = PRECIOS.GBA[id];
        const trabajo = obtenerInfoTrabajo(id);
        
        csv += `"${trabajo.nombre}",${precioCABA.min},${precioCABA.max},${precioGBA.min},${precioGBA.max},${precioCABA.unidad},"${trabajo.desc}"\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `precios-pintura-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    mostrarToast('Tabla exportada como CSV', 'success');
}

// ============================================================================
// REPORTES Y FEEDBACK
// ============================================================================

/**
 * Inicializa el sistema de reportes
 */
function inicializarReportes() {
    const modal = document.getElementById('reportModal');
    const botonReportar = document.getElementById('reportPriceBtn');
    const botonCerrar = document.getElementById('closeReportModal');
    const formulario = document.getElementById('reportForm');
    
    // Abrir modal
    botonReportar.addEventListener('click', () => {
        abrirModalReporte();
    });
    
    // Cerrar modal
    botonCerrar.addEventListener('click', () => {
        cerrarModalReporte();
    });
    
    // Cerrar al hacer clic fuera
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            cerrarModalReporte();
        }
    });
    
    // Enviar formulario
    formulario.addEventListener('submit', (e) => {
        e.preventDefault();
        enviarReporte();
    });
}

/**
 * Abre el modal de reporte
 */
function abrirModalReporte() {
    const modal = document.getElementById('reportModal');
    const selectTrabajo = document.getElementById('reportJob');
    
    // Limpiar y cargar trabajos
    selectTrabajo.innerHTML = '<option value="">Seleccionar trabajo</option>';
    
    Object.entries(PRECIOS.CABA).forEach(([id, datos]) => {
        const trabajo = obtenerInfoTrabajo(id);
        const option = document.createElement('option');
        option.value = id;
        option.textContent = trabajo.nombre;
        selectTrabajo.appendChild(option);
    });
    
    // Mostrar modal
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

/**
 * Cierra el modal de reporte
 */
function cerrarModalReporte() {
    const modal = document.getElementById('reportModal');
    const formulario = document.getElementById('reportForm');
    
    modal.classList.remove('active');
    formulario.reset();
    document.body.style.overflow = '';
}

/**
 * Envía un reporte de precio
 */
function enviarReporte() {
    const trabajo = document.getElementById('reportJob').value;
    const zona = document.getElementById('reportZone').value;
    const precio = document.getElementById('reportPrice').value;
    const comentario = document.getElementById('reportComment').value;
    
    if (!trabajo || !zona || !precio) {
        mostrarToast('Por favor, completá todos los campos requeridos', 'error');
        return;
    }
    
    // Aquí normalmente enviarías a un backend
    // Por ahora simulamos el envío
    
    setTimeout(() => {
        cerrarModalReporte();
        mostrarToast('¡Gracias por tu reporte! Lo revisaremos pronto.', 'success');
        
        // Simular actualización de estadísticas
        document.getElementById('statUpdates').textContent = 
            parseInt(document.getElementById('statUpdates').textContent) + 1;
    }, 1500);
}

// ============================================================================
// FUNCIONES AUXILIARES
// ============================================================================

/**
 * Obtiene información de un trabajo
 */
function obtenerInfoTrabajo(id) {
    const trabajos = {
        "pintura-interior": { nombre: "Pintura interior (látex)", desc: "Incluye masillado básico" },
        "pintura-exterior": { nombre: "Pintura exterior", desc: "Con hidrolavado previo" },
        "pintura-cielo-raso": { nombre: "Pintura cielo raso", desc: "Interior, altura normal" },
        "pintura-sintetica": { nombre: "Pintura sintética", desc: "Para carpintería/herrería" },
        "pintura-epoxica": { nombre: "Pintura epóxica", desc: "Garages, pisos industriales" },
        "pintura-altura": { nombre: "Pintura en altura", desc: "Andamio o plataforma" },
        "reparacion-paredes": { nombre: "Reparación de paredes", desc: "Grietas y huecos" },
        "impermeabilizacion": { nombre: "Impermeabilización techos", desc: "Líquida o membrana" },
        "revestimiento-plastico": { nombre: "Revestimiento plástico", desc: "Texturado o liso" },
        "jornal": { nombre: "Jornal por día", desc: "Reparaciones varias" }
    };
    
    return trabajos[id] || { nombre: "Trabajo no encontrado", desc: "" };
}

/**
 * Calcula el total (mínimo o máximo)
 */
function calcularTotal(esMinimo = true) {
    if (!estadoApp.trabajo) return 0;
    
    const precios = PRECIOS[estadoApp.zona][estadoApp.trabajo];
    const base = esMinimo ? precios.min : precios.max;
    
    return estadoApp.trabajo === 'jornal' ? base : base * estadoApp.metros;
}

/**
 * Actualiza estadísticas según la zona
 */
function actualizarEstadisticasZona() {
    const statUsers = document.getElementById('statUsers');
    const statAccuracy = document.getElementById('statAccuracy');
    
    if (estadoApp.zona === 'CABA') {
        statUsers.textContent = '850+';
        statAccuracy.textContent = '95%';
    } else {
        statUsers.textContent = '720+';
        statAccuracy.textContent = '92%';
    }
}

/**
 * Reinicia la calculadora
 */
function reiniciarCalculadora() {
    estadoApp.trabajo = "";
    estadoApp.metros = 50;
    
    // Resetear UI
    document.querySelectorAll('.job-card').forEach(card => card.classList.remove('selected'));
    document.getElementById('metrosInput').value = 50;
    document.getElementById('metrosInput').disabled = false;
    
    // Volver al paso 1
    cambiarPaso(1);
    
    mostrarToast('Calculadora reiniciada', 'info');
}

// ============================================================================
// INICIALIZACIÓN DE LA APLICACIÓN
// ============================================================================

/**
 * Inicializa toda la aplicación
 */
function inicializarApp() {
    // Ocultar loading
    setTimeout(() => {
        document.getElementById('loadingOverlay').classList.add('hidden');
    }, 500);
    
    // Inicializar tema
    inicializarTema();
    
    // Configurar botones de tema
    document.getElementById('themeToggle').addEventListener('click', alternarTema);
    document.getElementById('mobileThemeToggle').addEventListener('click', alternarTema);
    
    // Configurar menú móvil
    const botonMenu = document.getElementById('mobileMenuBtn');
    const menuMovil = document.getElementById('mobileNav');
    
    botonMenu.addEventListener('click', () => {
        const expandido = botonMenu.getAttribute('aria-expanded') === 'true';
        botonMenu.setAttribute('aria-expanded', !expandido);
        menuMovil.classList.toggle('active');
        document.body.style.overflow = expandido ? '' : 'hidden';
    });
    
    // Cerrar menú al hacer clic en enlace
    document.querySelectorAll('.mobile-nav-link').forEach(enlace => {
        enlace.addEventListener('click', () => {
            botonMenu.setAttribute('aria-expanded', 'false');
            menuMovil.classList.remove('active');
            document.body.style.overflow = '';
        });
    });
    
    // Inicializar módulos
    inicializarCalculadora();
    inicializarTablaPrecios();
    inicializarReportes();
    
    // Configurar otros eventos
    document.getElementById('clearHistory').addEventListener('click', limpiarHistorial);
    document.getElementById('heroCta').addEventListener('click', () => cambiarPaso(1));
    
    // Actualizar footer
    document.getElementById('lastUpdate').textContent = `Última actualización: ${obtenerFechaActual()}`;
    document.getElementById('version').textContent = `v${APP_VERSION}`;
    
    // Mostrar mensaje de bienvenida
    setTimeout(() => {
        mostrarToast('¡Bienvenido a TuPresupuestoAR! Comenzá a calcular tu presupuesto.', 'info', 3000);
    }, 1000);
}

// ============================================================================
// EJECUCIÓN AL CARGAR LA PÁGINA
// ============================================================================

document.addEventListener('DOMContentLoaded', inicializarApp);

// ============================================================================
// API PÚBLICA PARA ACTUALIZAR PRECIOS (para uso en consola)
// ============================================================================

window.TuPresupuestoAR = {
    version: APP_VERSION,
    
    /**
     * Actualiza un precio específico
     * @param {string} zona - "CABA" o "GBA"
     * @param {string} trabajo - ID del trabajo
     * @param {number} min - Precio mínimo
     * @param {number} max - Precio máximo
     */
    actualizarPrecio: function(zona, trabajo, min, max) {
        if (PRECIOS[zona] && PRECIOS[zona][trabajo]) {
            PRECIOS[zona][trabajo].min = min;
            PRECIOS[zona][trabajo].max = max;
            
            // Actualizar UI
            cargarTablaPrecios();
            
            if (estadoApp.zona === zona && estadoApp.trabajo === trabajo) {
                calcularPresupuesto();
            }
            
            mostrarToast(`Precio de ${trabajo} en ${zona} actualizado`, 'success');
            return true;
        }
        
        mostrarToast('Trabajo o zona no encontrados', 'error');
        return false;
    },
    
    /**
     * Exporta todos los precios actuales
     */
    exportarPrecios: function() {
        return JSON.stringify(PRECIOS, null, 2);
    },
    
    /**
     * Importa precios desde JSON
     * @param {string} jsonString - JSON con los precios
     */
    importarPrecios: function(jsonString) {
        try {
            const nuevosPrecios = JSON.parse(jsonString);
            Object.assign(PRECIOS, nuevosPrecios);
            cargarTablaPrecios();
            mostrarToast('Precios importados correctamente', 'success');
            return true;
        } catch (error) {
            mostrarToast('Error al importar precios', 'error');
            return false;
        }
    }
};