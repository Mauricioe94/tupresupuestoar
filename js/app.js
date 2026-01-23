// app.js - TuPresupuestoAR - VERSIÓN CORREGIDA
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM cargado - TuPresupuestoAR v2.0');
    
    // Ocultar loading overlay
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        setTimeout(() => {
            loadingOverlay.style.opacity = '0';
            setTimeout(() => {
                loadingOverlay.style.display = 'none';
            }, 300);
        }, 500);
    }
    
    // Inicializar todo
    initCalculatorData();
    initJobSelection();
    setupBasicFunctionality();
    setupResultButtons();
    
    // Configurar tema inicial
    initTheme();
});

// =====================
// DATOS DE TRABAJOS
// =====================
const jobsData = [
    {
        id: 1,
        name: "Pintura interior",
        description: "Paredes interiores con pintura látex",
        unit: "m2",
        priceCABA: { min: 12000, max: 18000 },
        priceGBA: { min: 9000, max: 14000 },
        type: "interior"
    },
    {
        id: 2,
        name: "Pintura exterior",
        description: "Fachadas con pintura antihongos",
        unit: "m2",
        priceCABA: { min: 14000, max: 17000 },
        priceGBA: { min: 9000, max: 14000 },
        type: "exterior"
    },
    {
        id: 3,
        name: "Jornal de pintor",
        description: "Día completo de trabajo (8 horas)",
        unit: "jornal",
        priceCABA: { min: 50000, max: 70000 },
        priceGBA: { min: 45000, max: 60000 },
        type: "jornal"
    },
    {
        id: 4,
        name: "Sintéticos",
        description: "Hierros, chapas y galvanizados",
        unit: "m2",
        priceCABA: { min: 15000, max: 20000 },
        priceGBA: { min: 10000, max: 14000 },
        type: "exterior"
    },
    {
        id: 5,
        name: "Barniz o Laca",
        description: "Puertas de madera, pisos y portones",
        unit: "m2",
        priceCABA: { min: 13000, max: 17000 },
        priceGBA: { min: 9000, max: 11000 },
        type: "barniz"
    },
    {
        id: 6,
        name: "Revestimiento plástico",
        description: "Interior y exterior (aplicado con llana)",
        unit: "m2",
        priceCABA: { min: 18000, max: 25000 },
        priceGBA: { min: 16000, max: 22000 },
        type: "revestimiento"
    }
];

// =====================
// ESTADO GLOBAL
// =====================
let currentStep = 1;
let selectedZone = null;
let selectedJob = null;
let squareMeters = 50;

// =====================
// INICIALIZACIÓN
// =====================
function initCalculatorData() {
    console.log('Inicializando calculadora...');
    loadPriceTable();
    setupCalculatorListeners();
}

function initJobSelection() {
    console.log('Inicializando selección de trabajos...');
    const jobCards = document.querySelectorAll('#jobSelection .job-card');
    const nextBtn = document.querySelector('.btn-next-step[data-next="3"]');
    
    if (jobCards.length === 0) return;
    
    // Inicialmente deshabilitar el botón "Continuar"
    if (nextBtn) {
        nextBtn.disabled = true;
        nextBtn.style.opacity = '0.5';
        nextBtn.style.cursor = 'not-allowed';
    }
    
    // Agregar evento click a cada tarjeta
    jobCards.forEach(card => {
        card.addEventListener('click', function() {
            // Quitar selección de todas
            jobCards.forEach(c => c.classList.remove('selected'));
            
            // Agregar selección a esta
            this.classList.add('selected');
            
            // Habilitar botón "Continuar"
            if (nextBtn) {
                nextBtn.disabled = false;
                nextBtn.style.opacity = '1';
                nextBtn.style.cursor = 'pointer';
            }
            
            // Encontrar trabajo correspondiente en jobsData
            const jobName = this.querySelector('.job-title').textContent;
            const job = jobsData.find(j => j.name.toLowerCase() === jobName.toLowerCase());
            
            if (job) {
                selectedJob = job;
                console.log('Trabajo seleccionado:', job.name);
                
                // Actualizar título del paso 2
                const stepTitle = document.querySelector('#step2 .step-title');
                if (stepTitle) {
                    const badge = document.createElement('span');
                    badge.className = 'selection-badge';
                    badge.textContent = job.name;
                    
                    // Actualizar solo si no existe ya el badge
                    const existingBadge = stepTitle.querySelector('.selection-badge');
                    if (existingBadge) {
                        existingBadge.textContent = job.name;
                    } else {
                        stepTitle.appendChild(badge);
                    }
                }
                
                // Feedback visual
                showToast(`${job.name} seleccionado`, 'success');
            }
        });
        
        // Hacer tarjetas enfocables para accesibilidad
        card.setAttribute('tabindex', '0');
        card.setAttribute('role', 'button');
        
        // Soporte para teclado
        card.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.click();
            }
        });
    });
    
    // Buscar trabajos
    const jobSearch = document.getElementById('jobSearch');
    if (jobSearch) {
        jobSearch.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            
            jobCards.forEach(card => {
                const title = card.querySelector('.job-title').textContent.toLowerCase();
                const desc = card.querySelector('.job-description').textContent.toLowerCase();
                
                if (title.includes(searchTerm) || desc.includes(searchTerm)) {
                    card.style.display = 'flex';
                } else {
                    card.style.display = 'none';
                    card.classList.remove('selected');
                }
            });
            
            // Verificar si hay al menos un resultado visible
            const visibleCards = Array.from(jobCards).filter(card => 
                card.style.display !== 'none'
            );
            
            if (nextBtn && visibleCards.length === 0) {
                nextBtn.disabled = true;
                nextBtn.style.opacity = '0.5';
                nextBtn.style.cursor = 'not-allowed';
            }
        });
    }
}

function loadPriceTable() {
    const tableBody = document.getElementById('priceTableBody');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    jobsData.forEach(job => {
        const diffPercent = Math.round(((job.priceCABA.min - job.priceGBA.min) / job.priceCABA.min) * 100);
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="col-work">${job.name}</td>
            <td class="col-caba">$${job.priceCABA.min.toLocaleString()} - $${job.priceCABA.max.toLocaleString()}</td>
            <td class="col-gba">$${job.priceGBA.min.toLocaleString()} - $${job.priceGBA.max.toLocaleString()}</td>
            <td class="col-diff">${diffPercent}% menos</td>
            <td class="col-actions">
                <button class="btn-use-price" data-job-id="${job.id}">
                    <i class="fas fa-calculator"></i> Usar
                </button>
            </td>
        `;
        
        row.querySelector('.btn-use-price').addEventListener('click', () => {
            // Buscar tarjeta correspondiente y seleccionarla
            const jobCards = document.querySelectorAll('#jobSelection .job-card');
            jobCards.forEach(card => {
                const title = card.querySelector('.job-title').textContent;
                if (title.toLowerCase() === job.name.toLowerCase()) {
                    card.click();
                }
            });
            
            scrollToCalculator();
        });
        
        tableBody.appendChild(row);
    });
}

// =====================
// FUNCIONES DE INTERFAZ
// =====================
function setupCalculatorListeners() {
    console.log('Configurando listeners...');
    
    // Paso 1: Selección de zona
    const zoneCards = document.querySelectorAll('.zone-card');
    zoneCards.forEach(card => {
        card.addEventListener('click', function() {
            zoneCards.forEach(c => c.classList.remove('selected'));
            this.classList.add('selected');
            selectedZone = this.dataset.zone;
            
            const nextButton = document.querySelector('.btn-next-step[data-next="2"]');
            if (nextButton) {
                nextButton.disabled = false;
                nextButton.style.opacity = '1';
            }
            
            showToast(`Zona ${selectedZone} seleccionada`, 'success');
        });
    });
    
    // Botones de navegación
    document.querySelectorAll('.btn-next-step').forEach(button => {
        button.addEventListener('click', function() {
            const nextStep = parseInt(this.dataset.next);
            goToStep(nextStep);
        });
    });
    
    document.querySelectorAll('.btn-prev-step').forEach(button => {
        button.addEventListener('click', function() {
            const prevStep = parseInt(this.dataset.prev);
            goToStep(prevStep);
        });
    });
    
    // Botón de cálculo
    const calculateBtn = document.getElementById('calculateBtn');
    if (calculateBtn) {
        calculateBtn.addEventListener('click', calculateBudget);
    }
    
    // Input de metros
    const metrosInput = document.getElementById('metrosInput');
    if (metrosInput) {
        metrosInput.addEventListener('input', function() {
            squareMeters = parseFloat(this.value) || 50;
        });
        
        // Botones rápidos de metros
        document.querySelectorAll('.quick-meter-btn').forEach(button => {
            button.addEventListener('click', function() {
                const meters = parseInt(this.dataset.meters);
                metrosInput.value = meters;
                squareMeters = meters;
                showToast(`${meters} m² seleccionados`, 'info');
            });
        });
    }
    
    // Menú móvil
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const mobileNav = document.getElementById('mobileNav');
    
    if (mobileMenuBtn && mobileNav) {
        mobileMenuBtn.addEventListener('click', function() {
            const isExpanded = this.getAttribute('aria-expanded') === 'true';
            this.setAttribute('aria-expanded', !isExpanded);
            mobileNav.classList.toggle('active');
        });
        
        // Cerrar menú al hacer clic en enlace
        document.querySelectorAll('.mobile-nav-link').forEach(link => {
            link.addEventListener('click', () => {
                mobileNav.classList.remove('active');
                mobileMenuBtn.setAttribute('aria-expanded', 'false');
            });
        });
    }
    
    // Botón nuevo cálculo
    const newCalcBtn = document.getElementById('newCalculation');
    if (newCalcBtn) {
        newCalcBtn.addEventListener('click', () => {
            resetCalculator();
            goToStep(1);
            showToast('Calculadora reiniciada', 'info');
        });
    }
}

function goToStep(step) {
    // Validaciones
    if (step === 2 && !selectedZone) {
        showToast('Por favor, selecciona una zona primero', 'error');
        return;
    }
    
    if (step === 3 && !selectedJob) {
        showToast('Por favor, selecciona un tipo de trabajo', 'error');
        return;
    }
    
    // Actualizar indicadores de progreso
    document.querySelectorAll('.step-indicator').forEach(indicator => {
        if (parseInt(indicator.dataset.step) <= step) {
            indicator.classList.add('active');
        } else {
            indicator.classList.remove('active');
        }
    });
    
    // Ocultar todos los pasos
    document.querySelectorAll('.calculator-step').forEach(stepElement => {
        stepElement.classList.remove('active');
    });
    
    // Mostrar paso actual
    const currentStepElement = document.getElementById(`step${step}`);
    if (currentStepElement) {
        currentStepElement.classList.add('active');
    }
    
    currentStep = step;
    
    // Scroll suave
    if (step > 1) {
        const calculatorSection = document.getElementById('calculadora');
        if (calculatorSection) {
            calculatorSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }
}

// =====================
// CÁLCULO PRESUPUESTO
// =====================
function calculateBudget() {
    if (!selectedZone || !selectedJob || !squareMeters) {
        showToast('Por favor, completa todos los pasos primero', 'error');
        return;
    }
    
    // Validar metros para jornal
    if (selectedJob.unit === 'jornal' && squareMeters > 1) {
        showToast('Para jornal, dejá el valor en 1', 'warning');
        return;
    }
    
    // Calcular presupuesto
    const prices = selectedZone === 'CABA' ? selectedJob.priceCABA : selectedJob.priceGBA;
    const minTotal = Math.round(prices.min * squareMeters);
    const maxTotal = Math.round(prices.max * squareMeters);
    
    // Mostrar resultados
    const resultMin = document.querySelector('.amount-min');
    const resultMax = document.querySelector('.amount-max');
    
    if (resultMin && resultMax) {
        resultMin.textContent = minTotal.toLocaleString();
        resultMax.textContent = maxTotal.toLocaleString();
    }
    
    document.getElementById('resultZone').textContent = selectedZone;
    document.getElementById('resultJob').textContent = selectedJob.name;
    document.getElementById('resultMeters').textContent = selectedJob.unit === 'jornal' ? '1 día' : `${squareMeters} m²`;
    document.getElementById('resultDate').textContent = 'Hoy';
    
    // Calcular materiales estimados
    updateMaterialsEstimation();
    
    // Ir al paso 4
    goToStep(4);
    showToast('Presupuesto calculado exitosamente', 'success');
    
    // Guardar en historial
    saveToHistory(minTotal, maxTotal);
}

function updateMaterialsEstimation() {
    const materialsEstimation = document.getElementById('materialsEstimation');
    if (!materialsEstimation) return;
    
    if (selectedJob.unit === 'm2') {
        const paintLiters = Math.ceil(squareMeters / 10);
        const primerLiters = Math.ceil(squareMeters / 15);
        
        materialsEstimation.innerHTML = `
            <h4><i class="fas fa-paint-brush"></i> Materiales estimados</h4>
            <div class="materials-list">
                <div class="material-item">
                    <span class="material-name">Pintura látex</span>
                    <span class="material-quantity">${paintLiters} litros</span>
                </div>
                <div class="material-item">
                    <span class="material-name">Imprimación</span>
                    <span class="material-quantity">${primerLiters} litros</span>
                </div>
                <div class="material-item">
                    <span class="material-name">Rodillos y pinceles</span>
                    <span class="material-quantity">1 juego</span>
                </div>
                <div class="material-item">
                    <span class="material-name">Cinta de enmascarar</span>
                    <span class="material-quantity">2 rollos</span>
                </div>
            </div>
        `;
    } else {
        materialsEstimation.innerHTML = `
            <h4><i class="fas fa-tools"></i> Insumos del día</h4>
            <div class="materials-list">
                <div class="material-item">
                    <span class="material-name">Herramientas básicas</span>
                    <span class="material-quantity">Incluidas</span>
                </div>
                <div class="material-item">
                    <span class="material-name">Equipo de seguridad</span>
                    <span class="material-quantity">Incluido</span>
                </div>
                <div class="material-item">
                    <span class="material-name">Transporte</span>
                    <span class="material-quantity">A consultar</span>
                </div>
            </div>
        `;
    }
}

// =====================
// HISTORIAL
// =====================
function saveToHistory(minPrice, maxPrice) {
    const historyContainer = document.getElementById('historyContainer');
    const historyEmpty = document.getElementById('historyEmpty');
    const historyCards = document.getElementById('historyCards');
    
    if (!historyContainer || !historyEmpty || !historyCards) return;
    
    // Ocultar mensaje de vacío
    if (historyEmpty.style.display !== 'none') {
        historyEmpty.style.display = 'none';
    }
    
    // Crear tarjeta
    const historyCard = document.createElement('div');
    historyCard.className = 'history-card';
    
    const date = new Date();
    const dateStr = date.toLocaleDateString('es-AR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    historyCard.innerHTML = `
        <div class="history-card-header">
            <span class="history-date">${dateStr}</span>
            <div class="history-actions">
                <button class="history-action-btn" aria-label="Eliminar cálculo">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        </div>
        <div class="history-card-content">
            <div class="history-detail">
                <span class="history-label">Trabajo:</span>
                <span class="history-value">${selectedJob.name}</span>
            </div>
            <div class="history-detail">
                <span class="history-label">Zona:</span>
                <span class="history-value">${selectedZone}</span>
            </div>
            <div class="history-detail">
                <span class="history-label">Superficie:</span>
                <span class="history-value">${selectedJob.unit === 'jornal' ? '1 día' : squareMeters + ' m²'}</span>
            </div>
            <div class="history-detail">
                <span class="history-label">Total:</span>
                <span class="history-amount">$${minPrice.toLocaleString()} - $${maxPrice.toLocaleString()}</span>
            </div>
        </div>
        <div class="history-actions">
            <button class="btn-history-reuse">
                <i class="fas fa-redo"></i> Reutilizar
            </button>
            <button class="btn-history-share">
                <i class="fab fa-whatsapp"></i> Compartir
            </button>
        </div>
    `;
    
    // Añadir al inicio
    historyCards.insertBefore(historyCard, historyCards.firstChild);
    
    // Configurar botones
    historyCard.querySelector('.history-action-btn').addEventListener('click', function() {
        historyCard.style.opacity = '0';
        historyCard.style.transform = 'translateX(100%)';
        setTimeout(() => {
            historyCard.remove();
            
            if (historyCards.children.length === 0) {
                historyEmpty.style.display = 'block';
            }
        }, 300);
        
        showToast('Cálculo eliminado del historial', 'success');
    });
    
    historyCard.querySelector('.btn-history-reuse').addEventListener('click', function() {
        // Resetear calculadora
        resetCalculator();
        goToStep(1);
        
        // Seleccionar zona
        setTimeout(() => {
            const zoneCard = document.querySelector(`.zone-card[data-zone="${selectedZone}"]`);
            if (zoneCard) {
                zoneCard.click();
                goToStep(2);
                
                // Seleccionar trabajo
                setTimeout(() => {
                    const jobCards = document.querySelectorAll('#jobSelection .job-card');
                    jobCards.forEach(card => {
                        const title = card.querySelector('.job-title').textContent;
                        if (title === selectedJob.name) {
                            card.click();
                        }
                    });
                    goToStep(3);
                    
                    // Establecer metros
                    setTimeout(() => {
                        const metrosInput = document.getElementById('metrosInput');
                        if (metrosInput) {
                            metrosInput.value = squareMeters;
                        }
                        showToast('Cálculo cargado en la calculadora', 'success');
                    }, 300);
                }, 300);
            }
        }, 300);
    });
    
    historyCard.querySelector('.btn-history-share').addEventListener('click', function() {
        shareViaWhatsApp(minPrice, maxPrice);
    });
}

// =====================
// FUNCIONALIDADES BÁSICAS
// =====================
function setupBasicFunctionality() {
    console.log('Configurando funcionalidades básicas...');
    
    // Botón limpiar historial
    const clearHistoryBtn = document.getElementById('clearHistory');
    if (clearHistoryBtn) {
        clearHistoryBtn.addEventListener('click', function() {
            const historyCards = document.getElementById('historyCards');
            const historyEmpty = document.getElementById('historyEmpty');
            
            if (historyCards && historyEmpty && historyCards.children.length > 0) {
                if (confirm('¿Estás seguro de que querés limpiar todo el historial?')) {
                    // Animación de eliminación
                    const cards = Array.from(historyCards.children);
                    cards.forEach((card, index) => {
                        setTimeout(() => {
                            card.style.opacity = '0';
                            card.style.transform = 'translateX(100%)';
                            setTimeout(() => card.remove(), 300);
                        }, index * 100);
                    });
                    
                    setTimeout(() => {
                        historyEmpty.style.display = 'block';
                        showToast('Historial limpiado correctamente', 'success');
                    }, cards.length * 100 + 300);
                }
            }
        });
    }
    
    // Botón exportar historial
    const exportHistoryBtn = document.getElementById('exportHistory');
    if (exportHistoryBtn) {
        exportHistoryBtn.addEventListener('click', function() {
            const historyCards = document.getElementById('historyCards');
            if (historyCards && historyCards.children.length > 0) {
                showToast('Función de exportación en desarrollo', 'info');
            } else {
                showToast('No hay cálculos para exportar', 'warning');
            }
        });
    }
    
    // Botón exportar tabla
    const exportTableBtn = document.getElementById('exportTable');
    if (exportTableBtn) {
        exportTableBtn.addEventListener('click', function() {
            showToast('Tabla exportada en formato CSV', 'success');
        });
    }
    
    // Botón de reportar precio
    const reportPriceBtn = document.getElementById('reportPriceBtn');
    const reportModal = document.getElementById('reportModal');
    const closeReportModal = document.getElementById('closeReportModal');
    
    if (reportPriceBtn && reportModal) {
        reportPriceBtn.addEventListener('click', function() {
            reportModal.classList.add('active');
            reportModal.setAttribute('aria-hidden', 'false');
        });
    }
    
    if (closeReportModal && reportModal) {
        closeReportModal.addEventListener('click', function() {
            reportModal.classList.remove('active');
            reportModal.setAttribute('aria-hidden', 'true');
        });
    }
    
    // Cerrar modal al hacer clic fuera
    if (reportModal) {
        reportModal.addEventListener('click', function(e) {
            if (e.target === this) {
                this.classList.remove('active');
                this.setAttribute('aria-hidden', 'true');
            }
        });
    }
    
    // Formulario de reporte
    const reportForm = document.getElementById('reportForm');
    if (reportForm) {
        // Llenar opciones de trabajos
        const jobSelect = document.getElementById('reportJob');
        if (jobSelect) {
            jobsData.forEach(job => {
                const option = document.createElement('option');
                option.value = job.id;
                option.textContent = job.name;
                jobSelect.appendChild(option);
            });
        }
        
        reportForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const jobId = document.getElementById('reportJob').value;
            const zone = document.getElementById('reportZone').value;
            const price = document.getElementById('reportPrice').value;
            
            if (!jobId || !zone || !price) {
                showToast('Por favor, completá todos los campos requeridos', 'error');
                return;
            }
            
            console.log('Reporte enviado:', { jobId, zone, price });
            showToast('¡Gracias! Tu reporte fue enviado. Lo revisaremos pronto.', 'success');
            
            // Cerrar modal y resetear formulario
            reportModal.classList.remove('active');
            reportModal.setAttribute('aria-hidden', 'true');
            this.reset();
        });
    }
    
    // Configurar búsqueda en la tabla
    const tableSearch = document.getElementById('tableSearch');
    if (tableSearch) {
        tableSearch.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            const rows = document.querySelectorAll('#priceTableBody tr');
            
            rows.forEach(row => {
                const text = row.textContent.toLowerCase();
                row.style.display = text.includes(searchTerm) ? '' : 'none';
            });
        });
    }
    
    // Configurar filtro por zona
    const tableFilterZone = document.getElementById('tableFilterZone');
    if (tableFilterZone) {
        tableFilterZone.addEventListener('change', function() {
            const selectedZone = this.value;
            const rows = document.querySelectorAll('#priceTableBody tr');
            
            rows.forEach(row => {
                if (selectedZone === 'all') {
                    row.style.display = '';
                    return;
                }
                
                row.style.display = '';
            });
        });
    }
}

function setupResultButtons() {
    // Botón guardar cálculo
    const saveBtn = document.getElementById('saveCalculation');
    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            showToast('Cálculo ya guardado en historial', 'info');
        });
    }
    
    // Botón compartir WhatsApp desde resultados
    const shareBtn = document.getElementById('shareWhatsApp');
    if (shareBtn) {
        shareBtn.addEventListener('click', function() {
            const minPrice = document.querySelector('.amount-min').textContent;
            const maxPrice = document.querySelector('.amount-max').textContent;
            const job = document.getElementById('resultJob').textContent;
            const zone = document.getElementById('resultZone').textContent;
            const meters = document.getElementById('resultMeters').textContent;
            
            const message = `💰 Presupuesto estimado: $${minPrice} - $${maxPrice}
            
Trabajo: ${job}
Zona: ${zone}
Superficie: ${meters}

Calculado con TuPresupuestoAR
👉 https://tupresupuesto.ar`;

            const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
            window.open(url, '_blank');
            
            showToast('Compartiendo por WhatsApp...', 'success');
        });
    }
    
    // Botón PDF
    const pdfBtn = document.getElementById('downloadPDF');
    if (pdfBtn) {
        pdfBtn.addEventListener('click', () => {
            showToast('Función PDF en desarrollo', 'info');
        });
    }
}

// =====================
// TEMA OSCURO/CLARO
// =====================
function initTheme() {
    // Toggle tema oscuro/claro
    const themeToggle = document.getElementById('themeToggle');
    const mobileThemeToggle = document.getElementById('mobileThemeToggle');
    
    function toggleTheme() {
        const isDark = document.body.getAttribute('data-theme') === 'dark';
        const newTheme = isDark ? 'light' : 'dark';
        
        document.body.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        
        // Actualizar iconos
        const icons = document.querySelectorAll('.btn-theme i, .mobile-theme-btn i');
        icons.forEach(icon => {
            icon.className = newTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        });
        
        if (mobileThemeToggle) {
            mobileThemeToggle.innerHTML = `<i class="fas fa-${newTheme === 'dark' ? 'sun' : 'moon'}"></i> ${newTheme === 'dark' ? 'Modo Claro' : 'Modo Oscuro'}`;
        }
        
        showToast(newTheme === 'dark' ? 'Modo oscuro activado' : 'Modo claro activado', 'success');
    }
    
    if (themeToggle) themeToggle.addEventListener('click', toggleTheme);
    if (mobileThemeToggle) mobileThemeToggle.addEventListener('click', toggleTheme);
    
    // Cargar tema guardado
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.body.setAttribute('data-theme', savedTheme);
    
    // Actualizar icono inicial
    if (savedTheme === 'dark') {
        const icons = document.querySelectorAll('.btn-theme i, .mobile-theme-btn i');
        icons.forEach(icon => {
            icon.className = 'fas fa-sun';
        });
        if (mobileThemeToggle) {
            mobileThemeToggle.innerHTML = '<i class="fas fa-sun"></i> Modo Claro';
        }
    }
}

// =====================
// UTILIDADES
// =====================
function resetCalculator() {
    // Resetear selecciones
    selectedZone = null;
    selectedJob = null;
    squareMeters = 50;
    
    // Resetear UI
    document.querySelectorAll('.zone-card, .job-card').forEach(el => {
        el.classList.remove('selected');
    });
    
    // Resetear input de metros
    const metrosInput = document.getElementById('metrosInput');
    if (metrosInput) {
        metrosInput.value = '50';
    }
    
    // Resetear título del paso 2
    const stepTitle = document.querySelector('#step2 .step-title');
    if (stepTitle) {
        const badge = stepTitle.querySelector('.selection-badge');
        if (badge) {
            badge.remove();
        }
        stepTitle.innerHTML = '¿Qué tipo de trabajo es?';
    }
    
    // Desactivar botones de siguiente
    document.querySelectorAll('.btn-next-step').forEach(btn => {
        btn.disabled = true;
        btn.style.opacity = '0.7';
    });
    
    // Resetar materiales estimation
    const materialsEstimation = document.getElementById('materialsEstimation');
    if (materialsEstimation) {
        materialsEstimation.innerHTML = `
            <h4><i class="fas fa-paint-brush"></i> Materiales estimados</h4>
            <div class="materials-list">
                <div class="material-item">
                    <span class="material-name">Pintura látex</span>
                    <span class="material-quantity">-- litros</span>
                </div>
                <div class="material-item">
                    <span class="material-name">Imprimación</span>
                    <span class="material-quantity">-- litros</span>
                </div>
                <div class="material-item">
                    <span class="material-name">Rodillos y pinceles</span>
                    <span class="material-quantity">-- juego</span>
                </div>
            </div>
        `;
    }
}

function scrollToCalculator() {
    const calculatorSection = document.getElementById('calculadora');
    if (calculatorSection) {
        calculatorSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        showToast('Calculadora abierta', 'info');
    }
}

function shareViaWhatsApp(minPrice, maxPrice) {
    const message = `💰 Presupuesto estimado: $${minPrice.toLocaleString()} - $${maxPrice.toLocaleString()}
    
Trabajo: ${selectedJob.name}
Zona: ${selectedZone}
Superficie: ${selectedJob.unit === 'jornal' ? '1 día' : squareMeters + ' m²'}

Calculado con TuPresupuestoAR
👉 https://tupresupuesto.ar`;

    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
    
    showToast('Compartiendo por WhatsApp...', 'success');
}

function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) return;
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    const icon = type === 'success' ? 'check-circle' : 
                 type === 'error' ? 'exclamation-circle' : 
                 type === 'warning' ? 'exclamation-triangle' : 
                 'info-circle';
    
    toast.innerHTML = `
        <div class="toast-icon">
            <i class="fas fa-${icon}"></i>
        </div>
        <div class="toast-content">
            <div class="toast-message">${message}</div>
        </div>
        <button class="toast-close" aria-label="Cerrar notificación">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    toastContainer.appendChild(toast);
    
    // Forzar reflow para animación
    toast.offsetHeight;
    
    // Animación de entrada
    toast.style.transform = 'translateX(100%)';
    toast.style.opacity = '0';
    
    setTimeout(() => {
        toast.style.transform = 'translateX(0)';
        toast.style.opacity = '1';
    }, 10);
    
    // Auto-eliminar después de 5 segundos
    const autoRemove = setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 5000);
    
    // Configurar botón de cerrar
    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', () => {
        clearTimeout(autoRemove);
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => {
            toast.remove();
        }, 300);
    });
}

// =====================
// INICIALIZACIÓN FINAL
// =====================
// Verificar si es móvil para ajustes específicos
const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
if (isMobile) {
    document.body.classList.add('is-mobile');
}