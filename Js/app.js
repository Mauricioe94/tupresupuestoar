// app.js - JavaScript mínimo para TuPresupuestoAR

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM cargado - TuPresupuestoAR');
    
    // Ocultar overlay de carga
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        setTimeout(() => {
            loadingOverlay.style.opacity = '0';
            setTimeout(() => {
                loadingOverlay.style.display = 'none';
            }, 300);
        }, 500);
    }
    
    // Inicializar datos de ejemplo para la calculadora
    initCalculatorData();
    
    // Configurar funcionalidades básicas
    setupBasicFunctionality();
});

// Datos de ejemplo para trabajos de pintura
const jobsData = [
    {
        id: 1,
        name: "Pintura interior",
        description: "Paredes interiores con pintura látex",
        priceCABA: { min: 12000, max: 18000 },
        priceGBA: { min: 9000, max: 14000 }
    },
    {
        id: 2,
        name: "Pintura exterior",
        description: "Fachadas con pintura antihongos",
        priceCABA: { min: 15000, max: 22000 },
        priceGBA: { min: 11000, max: 18000 }
    },
    {
        id: 3,
        name: "Jornal de pintor",
        description: "Día completo de trabajo (8 horas)",
        priceCABA: { min: 35000, max: 50000 },
        priceGBA: { min: 28000, max: 40000 }
    },
    {
        id: 4,
        name: "Pintura de techos",
        description: "Techos interiores, preparación incluida",
        priceCABA: { min: 14000, max: 20000 },
        priceGBA: { min: 10500, max: 16000 }
    },
    {
        id: 5,
        name: "Lacado de puertas",
        description: "Puertas de madera, mano de obra",
        priceCABA: { min: 8000, max: 12000 },
        priceGBA: { min: 6000, max: 9500 }
    },
    {
        id: 6,
        name: "Pintura de ventanas",
        description: "Carpintería exterior e interior",
        priceCABA: { min: 7000, max: 10000 },
        priceGBA: { min: 5000, max: 8000 }
    }
];

// Variables globales para el estado de la calculadora
let currentStep = 1;
let selectedZone = null;
let selectedJob = null;
let squareMeters = 50;

function initCalculatorData() {
    console.log('Inicializando datos de la calculadora...');
    
    // Cargar trabajos en la calculadora
    loadJobs();
    
    // Cargar tabla de precios
    loadPriceTable();
    
    // Configurar listeners básicos
    setupCalculatorListeners();
}

function loadJobs() {
    const jobSelection = document.getElementById('jobSelection');
    if (!jobSelection) return;
    
    jobSelection.innerHTML = '';
    
    jobsData.forEach(job => {
        const jobElement = document.createElement('div');
        jobElement.className = 'job-item';
        jobElement.dataset.jobId = job.id;
        
        jobElement.innerHTML = `
            <div class="job-name">${job.name}</div>
            <div class="job-description">${job.description}</div>
            <div class="job-price">
                <span>CABA: $${job.priceCABA.min.toLocaleString()} - $${job.priceCABA.max.toLocaleString()}/m²</span>
                <i class="fas fa-chevron-right"></i>
            </div>
        `;
        
        jobElement.addEventListener('click', () => selectJob(job));
        jobSelection.appendChild(jobElement);
    });
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
                <button class="table-btn-use" data-job-id="${job.id}">
                    <i class="fas fa-calculator"></i> Usar
                </button>
            </td>
        `;
        
        // Añadir event listener al botón "Usar"
        const useButton = row.querySelector('.table-btn-use');
        useButton.addEventListener('click', () => {
            selectJob(job);
            scrollToCalculator();
        });
        
        tableBody.appendChild(row);
    });
}

function setupCalculatorListeners() {
    console.log('Configurando listeners de la calculadora...');
    
    // Paso 1: Selección de zona
    const zoneCards = document.querySelectorAll('.zone-card');
    zoneCards.forEach(card => {
        card.addEventListener('click', function() {
            // Remover selección previa
            zoneCards.forEach(c => c.classList.remove('selected'));
            
            // Seleccionar nueva zona
            this.classList.add('selected');
            selectedZone = this.dataset.zone;
            
            // Activar botón siguiente
            const nextButton = document.querySelector('.btn-next-step[data-next="2"]');
            if (nextButton) {
                nextButton.disabled = false;
                nextButton.style.opacity = '1';
            }
        });
    });
    
    // Botones de siguiente paso
    const nextButtons = document.querySelectorAll('.btn-next-step');
    nextButtons.forEach(button => {
        button.addEventListener('click', function() {
            const nextStep = parseInt(this.dataset.next);
            goToStep(nextStep);
        });
    });
    
    // Botones de paso anterior
    const prevButtons = document.querySelectorAll('.btn-prev-step');
    prevButtons.forEach(button => {
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
    
    // Input de metros cuadrados
    const metrosInput = document.getElementById('metrosInput');
    if (metrosInput) {
        metrosInput.addEventListener('input', function() {
            squareMeters = parseFloat(this.value) || 50;
        });
        
        // Botones rápidos de metros
        const quickButtons = document.querySelectorAll('.quick-meter-btn');
        quickButtons.forEach(button => {
            button.addEventListener('click', function() {
                const meters = parseInt(this.dataset.meters);
                metrosInput.value = meters;
                squareMeters = meters;
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
            
            // Animar iconos del menú hamburguesa
            const menuIcons = this.querySelectorAll('.menu-icon');
            if (!isExpanded) {
                // Transformar en X
                menuIcons[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
                menuIcons[1].style.opacity = '0';
                menuIcons[2].style.transform = 'rotate(-45deg) translate(7px, -6px)';
            } else {
                // Volver a hamburguesa
                menuIcons[0].style.transform = 'none';
                menuIcons[1].style.opacity = '1';
                menuIcons[2].style.transform = 'none';
            }
        });
        
        // Cerrar menú al hacer clic en un enlace
        const mobileLinks = document.querySelectorAll('.mobile-nav-link');
        mobileLinks.forEach(link => {
            link.addEventListener('click', () => {
                mobileNav.classList.remove('active');
                mobileMenuBtn.setAttribute('aria-expanded', 'false');
                
                // Restaurar iconos del menú
                const menuIcons = mobileMenuBtn.querySelectorAll('.menu-icon');
                menuIcons[0].style.transform = 'none';
                menuIcons[1].style.opacity = '1';
                menuIcons[2].style.transform = 'none';
            });
        });
    }
    
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
    
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }
    
    if (mobileThemeToggle) {
        mobileThemeToggle.addEventListener('click', toggleTheme);
    }
    
    // Cargar tema guardado
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.body.setAttribute('data-theme', savedTheme);
    
    // Botón nuevo cálculo
    const newCalcBtn = document.getElementById('newCalculation');
    if (newCalcBtn) {
        newCalcBtn.addEventListener('click', () => {
            resetCalculator();
            goToStep(1);
        });
    }
}

function selectJob(job) {
    // Remover selección previa
    const jobItems = document.querySelectorAll('.job-item');
    jobItems.forEach(item => item.classList.remove('selected'));
    
    // Seleccionar nuevo trabajo
    const selectedItem = document.querySelector(`.job-item[data-job-id="${job.id}"]`);
    if (selectedItem) {
        selectedItem.classList.add('selected');
    }
    
    selectedJob = job;
    
    // Activar botón siguiente
    const nextButton = document.querySelector('.btn-next-step[data-next="3"]');
    if (nextButton) {
        nextButton.disabled = false;
        nextButton.style.opacity = '1';
    }
}

function goToStep(step) {
    // Validaciones antes de cambiar de paso
    if (step === 2 && !selectedZone) {
        showToast('Por favor, selecciona una zona primero', 'error');
        return;
    }
    
    if (step === 3 && !selectedJob) {
        showToast('Por favor, selecciona un tipo de trabajo', 'error');
        return;
    }
    
    // Actualizar indicadores de progreso
    const stepIndicators = document.querySelectorAll('.step-indicator');
    stepIndicators.forEach(indicator => {
        if (parseInt(indicator.dataset.step) <= step) {
            indicator.classList.add('active');
        } else {
            indicator.classList.remove('active');
        }
    });
    
    // Ocultar todos los pasos
    const steps = document.querySelectorAll('.calculator-step');
    steps.forEach(stepElement => {
        stepElement.classList.remove('active');
    });
    
    // Mostrar paso actual
    const currentStepElement = document.getElementById(`step${step}`);
    if (currentStepElement) {
        currentStepElement.classList.add('active');
    }
    
    currentStep = step;
    
    // Scroll suave a la sección de calculadora
    if (step > 1) {
        const calculatorSection = document.getElementById('calculadora');
        if (calculatorSection) {
            calculatorSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }
}

function calculateBudget() {
    if (!selectedZone || !selectedJob || !squareMeters) {
        showToast('Por favor, completa todos los pasos primero', 'error');
        return;
    }
    
    // Calcular presupuesto
    const prices = selectedZone === 'CABA' ? selectedJob.priceCABA : selectedJob.priceGBA;
    const minTotal = Math.round(prices.min * squareMeters);
    const maxTotal = Math.round(prices.max * squareMeters);
    
    // Mostrar resultados
    const resultMin = document.querySelector('.amount-min');
    const resultMax = document.querySelector('.amount-max');
    const resultZone = document.getElementById('resultZone');
    const resultJob = document.getElementById('resultJob');
    const resultMeters = document.getElementById('resultMeters');
    
    if (resultMin && resultMax) {
        resultMin.textContent = minTotal.toLocaleString();
        resultMax.textContent = maxTotal.toLocaleString();
    }
    
    if (resultZone) resultZone.textContent = selectedZone;
    if (resultJob) resultJob.textContent = selectedJob.name;
    if (resultMeters) resultMeters.textContent = `${squareMeters} m²`;
    
    // Calcular materiales estimados (ejemplo)
    const materialsEstimation = document.getElementById('materialsEstimation');
    if (materialsEstimation) {
        const paintLiters = Math.ceil(squareMeters / 10); // 1 litro cada 10m²
        const primerLiters = Math.ceil(squareMeters / 15); // 1 litro cada 15m²
        
        materialsEstimation.innerHTML = `
            <h4><i class="fas fa-paint-brush"></i> Materiales estimados</h4>
            <div class="materials-list">
                <div class="material-item">
                    <span class="material-name">Pintura látex</span>
                    <span class="material-amount">${paintLiters} litros</span>
                </div>
                <div class="material-item">
                    <span class="material-name">Imprimación</span>
                    <span class="material-amount">${primerLiters} litros</span>
                </div>
                <div class="material-item">
                    <span class="material-name">Rodillos y pinceles</span>
                    <span class="material-amount">1 juego</span>
                </div>
                <div class="material-item">
                    <span class="material-name">Cinta de enmascarar</span>
                    <span class="material-amount">2 rollos</span>
                </div>
            </div>
        `;
    }
    
    // Ir al paso 4
    goToStep(4);
    
    // Mostrar toast de éxito
    showToast('Presupuesto calculado exitosamente', 'success');
    
    // Guardar en historial
    saveToHistory(minTotal, maxTotal);
}

function saveToHistory(minPrice, maxPrice) {
    const historyContainer = document.getElementById('historyContainer');
    const historyEmpty = document.getElementById('historyEmpty');
    const historyCards = document.getElementById('historyCards');
    
    if (!historyContainer || !historyEmpty || !historyCards) return;
    
    // Ocultar mensaje de vacío si es la primera vez
    if (historyEmpty.style.display !== 'none') {
        historyEmpty.style.display = 'none';
    }
    
    // Crear tarjeta de historial
    const historyCard = document.createElement('div');
    historyCard.className = 'history-card';
    
    const date = new Date();
    const dateStr = date.toLocaleDateString('es-AR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
    
    historyCard.innerHTML = `
        <div class="history-header">
            <span class="history-date">${dateStr}</span>
            <button class="history-delete" aria-label="Eliminar cálculo">
                <i class="fas fa-times"></i>
            </button>
        </div>
        <div class="history-amount">$${minPrice.toLocaleString()} - $${maxPrice.toLocaleString()}</div>
        <div class="history-details">
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
                <span class="history-value">${squareMeters} m²</span>
            </div>
        </div>
        <div class="history-actions">
            <button class="history-action-btn">
                <i class="fas fa-redo"></i> Reutilizar
            </button>
            <button class="history-action-btn">
                <i class="fab fa-whatsapp"></i> Compartir
            </button>
        </div>
    `;
    
    // Añadir al inicio
    historyCards.insertBefore(historyCard, historyCards.firstChild);
    
    // Configurar botón de eliminar
    const deleteBtn = historyCard.querySelector('.history-delete');
    deleteBtn.addEventListener('click', function() {
        historyCard.remove();
        
        // Mostrar mensaje de vacío si no quedan cálculos
        if (historyCards.children.length === 0) {
            historyEmpty.style.display = 'block';
        }
        
        showToast('Cálculo eliminado del historial', 'success');
    });
    
    // Configurar botón de reutilizar
    const reuseBtn = historyCard.querySelector('.history-action-btn');
    reuseBtn.addEventListener('click', function() {
        // Pre-cargar datos en la calculadora
        resetCalculator();
        goToStep(1);
        
        // Seleccionar zona
        const zoneCard = document.querySelector(`.zone-card[data-zone="${selectedZone}"]`);
        if (zoneCard) {
            zoneCard.click();
        }
        
        // Seleccionar trabajo
        setTimeout(() => {
            selectJob(selectedJob);
            goToStep(2);
            
            setTimeout(() => {
                // Establecer metros
                const metrosInput = document.getElementById('metrosInput');
                if (metrosInput) {
                    metrosInput.value = squareMeters;
                    goToStep(3);
                }
            }, 300);
        }, 300);
        
        showToast('Cálculo cargado en la calculadora', 'success');
    });
}

function resetCalculator() {
    // Resetear selecciones
    selectedZone = null;
    selectedJob = null;
    squareMeters = 50;
    
    // Resetear UI
    const zoneCards = document.querySelectorAll('.zone-card');
    zoneCards.forEach(card => card.classList.remove('selected'));
    
    const jobItems = document.querySelectorAll('.job-item');
    jobItems.forEach(item => item.classList.remove('selected'));
    
    const metrosInput = document.getElementById('metrosInput');
    if (metrosInput) {
        metrosInput.value = '50';
    }
}

function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) return;
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    const icon = type === 'success' ? 'check-circle' : 
                 type === 'error' ? 'exclamation-circle' : 
                 'info-circle';
    
    toast.innerHTML = `
        <div class="toast-icon">
            <i class="fas fa-${icon}"></i>
        </div>
        <div class="toast-message">${message}</div>
        <button class="toast-close" aria-label="Cerrar notificación">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    toastContainer.appendChild(toast);
    
    // Auto-eliminar después de 5 segundos
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 5000);
    
    // Configurar botón de cerrar
    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', () => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => {
            toast.remove();
        }, 300);
    });
}

function scrollToCalculator() {
    const calculatorSection = document.getElementById('calculadora');
    if (calculatorSection) {
        calculatorSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function setupBasicFunctionality() {
    console.log('Configurando funcionalidades básicas...');
    
    // Botón de limpiar historial
    const clearHistoryBtn = document.getElementById('clearHistory');
    if (clearHistoryBtn) {
        clearHistoryBtn.addEventListener('click', function() {
            const historyCards = document.getElementById('historyCards');
            const historyEmpty = document.getElementById('historyEmpty');
            
            if (historyCards && historyEmpty && confirm('¿Estás seguro de que querés limpiar todo el historial?')) {
                historyCards.innerHTML = '';
                historyEmpty.style.display = 'block';
                showToast('Historial limpiado correctamente', 'success');
            }
        });
    }
    
    // Botón de exportar historial
    const exportHistoryBtn = document.getElementById('exportHistory');
    if (exportHistoryBtn) {
        exportHistoryBtn.addEventListener('click', function() {
            showToast('Función de exportación en desarrollo', 'info');
        });
    }
    
    // Botón de exportar tabla
    const exportTableBtn = document.getElementById('exportTable');
    if (exportTableBtn) {
        exportTableBtn.addEventListener('click', function() {
            showToast('Exportando tabla en formato CSV...', 'success');
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
            
            // Aquí normalmente enviarías los datos a un servidor
            console.log('Reporte enviado:', { jobId, zone, price });
            
            // Mostrar confirmación
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
                
                const zoneCell = row.querySelector(`.col-${selectedZone.toLowerCase()}`);
                row.style.display = zoneCell ? '' : 'none';
            });
        });
    }
    
    // Configurar búsqueda de trabajos en calculadora
    const jobSearch = document.getElementById('jobSearch');
    if (jobSearch) {
        jobSearch.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            const jobItems = document.querySelectorAll('.job-item');
            
            jobItems.forEach(item => {
                const jobName = item.querySelector('.job-name').textContent.toLowerCase();
                const jobDesc = item.querySelector('.job-description').textContent.toLowerCase();
                
                item.style.display = (jobName.includes(searchTerm) || jobDesc.includes(searchTerm)) ? '' : 'none';
            });
        });
    }
}