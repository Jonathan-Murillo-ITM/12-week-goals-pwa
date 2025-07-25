// ===== CONFIGURACIÓN ===== 
// Detectar si estamos en GitHub Pages o desarrollo local
const isGitHubPages = window.location.hostname.includes('github.io');
const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const basePath = isGitHubPages ? '/12-week-goals-pwa' : '';

console.log('🔍 Entorno detectado:', {
    hostname: window.location.hostname,
    isGitHubPages,
    isLocalhost,
    basePath
});

const API_CONFIG = {
    baseURL: 'https://12-week-goals-back-production.up.railway.app/api', // Tu API backend
    endpoints: {
        createGoals: '/goals/create',
        callback: '/goals/callback',
        weekCalculator: '/Goals/week-calculator',
        // Nuevos endpoints simplificados sin Selenium
        auth: '/goals/auth',
        authWithCode: '/goals/auth-with-code',
        getListsFromCache: '/goals/get-lists-from-cache'
    }
};

// Función para crear URLs con cache-busting
function createCacheBustingUrl(url) {
    const timestamp = Date.now();
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}_t=${timestamp}`;
}

// ===== VER LISTAS DE MICROSOFT TO DO =====
async function verAvance() {
    try {
        console.log('🎯 Iniciando verificación de listas...');
        
        // Mostrar mensaje de carga
        const resultDiv = document.getElementById('calculator-result');
        if (resultDiv) {
            resultDiv.innerHTML = `
                <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; border-left: 4px solid #2196f3;">
                    <p><strong>⚡ Verificando cache...</strong></p>
                    <p>Buscando listas guardadas...</p>
                </div>
            `;
            resultDiv.classList.remove('hidden');
        }
        
        // 1. Intentar primero con cache (súper rápido)
        console.log('⚡ Intentando obtener listas desde cache...');
        const cacheUrl = createCacheBustingUrl(`${API_CONFIG.baseURL}${API_CONFIG.endpoints.getListsFromCache}`);
        
        let response = await fetch(cacheUrl, {
            method: 'GET',
            headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            },
            cache: 'no-store'
        });
        
        let data = await response.json();
        console.log('📊 Respuesta del cache:', data);
        
        if (data.success) {
            console.log('✅ ¡Listas obtenidas desde cache!');
            mostrarListas(data);
            return data;
        }
        
        // 2. Si no hay cache, pedir autorización UNA VEZ
        console.log('🔑 No hay cache, obteniendo URL de autorización...');
        if (resultDiv) {
            resultDiv.innerHTML = `
                <div style="background: #fff3cd; padding: 15px; border-radius: 8px; border-left: 4px solid #ffc107;">
                    <p><strong>🔑 Obteniendo autorización...</strong></p>
                    <p>Preparando autenticación con Microsoft...</p>
                </div>
            `;
        }
        
        const authUrl = createCacheBustingUrl(`${API_CONFIG.baseURL}${API_CONFIG.endpoints.auth}`);
        response = await fetch(authUrl, {
            method: 'GET',
            headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            },
            cache: 'no-store'
        });
        
        data = await response.json();
        console.log('🔗 URL de autorización obtenida:', data);
        
        if (!data.authUrl) {
            throw new Error('No se pudo obtener la URL de autorización');
        }
        
        // 3. Mostrar instrucciones y abrir URL de autorización
        if (resultDiv) {
            resultDiv.innerHTML = `
                <div style="background: #e7f3ff; padding: 20px; border-radius: 12px; border-left: 4px solid #0066cc;">
                    <h3 style="margin: 0 0 15px 0; color: #0066cc;">
                        🔐 Autorización de Microsoft
                    </h3>
                    
                    <div style="margin-bottom: 15px;">
                        <p><strong>Se abrirá una nueva ventana para autenticarte con Microsoft</strong></p>
                        <p>Después de autorizar, copia el código que aparece en la URL</p>
                    </div>
                    
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                        <h4 style="margin: 0 0 10px 0;">📋 Instrucciones:</h4>
                        <ol style="margin: 0; padding-left: 20px;">
                            <li>Se abrirá Microsoft en una nueva ventana</li>
                            <li>Inicia sesión con tu cuenta de Outlook/Hotmail</li>
                            <li>Autoriza el acceso a Microsoft To Do</li>
                            <li>Copia el código que aparece en la URL</li>
                            <li>Pégalo cuando te lo pida</li>
                        </ol>
                    </div>
                    
                    <button id="open-auth-btn" class="primary-button" style="width: 100%; margin-bottom: 10px;">
                        🌐 Abrir Autorización de Microsoft
                    </button>
                    
                    <button id="paste-code-btn" class="secondary-button" style="width: 100%;">
                        📋 Ya tengo el código
                    </button>
                </div>
            `;
            
            // Event listeners para los botones
            const openAuthBtn = document.getElementById('open-auth-btn');
            const pasteCodeBtn = document.getElementById('paste-code-btn');
            
            if (openAuthBtn) {
                openAuthBtn.addEventListener('click', () => {
                    console.log('🌐 Abriendo URL de autorización:', data.authUrl);
                    window.open(data.authUrl, '_blank');
                    
                    // Cambiar el botón a "opened"
                    openAuthBtn.innerHTML = '✅ Ventana abierta - Ahora autoriza';
                    openAuthBtn.style.background = '#28a745';
                });
            }
            
            if (pasteCodeBtn) {
                pasteCodeBtn.addEventListener('click', async () => {
                    await solicitarCodigo();
                });
            }
        }
        
        return null;
        
    } catch (error) {
        console.error('❌ Error en verAvance:', error);
        mostrarErrorGeneral(error.message);
        throw error;
    }
}

// Función para solicitar y procesar el código
async function solicitarCodigo() {
    try {
        // 4. Pedir al usuario que pegue el código que obtiene
        const codigo = prompt("📋 Pega aquí el código que aparece en la URL después de autorizar:");
        
        if (!codigo || !codigo.trim()) {
            alert('❌ No se proporcionó ningún código. Intenta nuevamente.');
            return;
        }
        
        console.log('📝 Código recibido:', codigo.substring(0, 10) + '...');
        
        // Mostrar mensaje de procesamiento
        const resultDiv = document.getElementById('calculator-result');
        if (resultDiv) {
            resultDiv.innerHTML = `
                <div style="background: #d4edda; padding: 15px; border-radius: 8px; border-left: 4px solid #28a745;">
                    <p><strong>🔄 Procesando código...</strong></p>
                    <p>Obteniendo tus listas de Microsoft To Do...</p>
                </div>
            `;
        }
        
        // 5. Enviar el código al backend
        const codeUrl = createCacheBustingUrl(`${API_CONFIG.baseURL}${API_CONFIG.endpoints.authWithCode}`);
        const response = await fetch(codeUrl, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            },
            cache: 'no-store',
            body: JSON.stringify({ code: codigo.trim() })
        });
        
        const data = await response.json();
        console.log('📊 Respuesta del código:', data);
        
        if (data.success) {
            console.log('✅ ¡Listas obtenidas con código!');
            mostrarListas(data);
            
            // Mostrar mensaje de éxito sobre el token guardado
            setTimeout(() => {
                alert("🎉 ¡Token guardado! La próxima vez será automático y súper rápido.");
            }, 1000);
            
            return data;
        } else {
            throw new Error(data.error || 'Error al procesar el código');
        }
        
    } catch (error) {
        console.error('❌ Error al procesar código:', error);
        mostrarErrorGeneral(`Error al procesar código: ${error.message}`);
        throw error;
    }
}

// Mostrar listas en la interfaz
function mostrarListas(data) {
    const resultDiv = document.getElementById('calculator-result');
    if (!resultDiv) return;
    
    console.log('🎨 Mostrando listas en la interfaz:', data);
    
    const listItems = data.listNames.map(name => 
        `<li style="padding: 8px 0; border-bottom: 1px solid #eee; display: flex; align-items: center;">
            <span style="margin-right: 8px;">📝</span>
            ${name}
        </li>`
    ).join('');
    
    resultDiv.innerHTML = `
        <div style="background: #f8f9fa; padding: 20px; border-radius: 12px; border-left: 4px solid #28a745;">
            <h3 style="margin: 0 0 15px 0; color: #155724;">
                🎯 Tus Listas en Microsoft To Do
            </h3>
            
            <div style="display: flex; flex-wrap: wrap; gap: 15px; margin-bottom: 15px;">
                <span style="background: #e7f3ff; padding: 6px 12px; border-radius: 20px; font-size: 14px;">
                    📊 <strong>${data.totalLists}</strong> listas
                </span>
                <span style="background: ${data.source === 'cached_token' ? '#d4edda' : '#fff3cd'}; padding: 6px 12px; border-radius: 20px; font-size: 14px;">
                    ${data.source === 'cached_token' ? '⚡ Desde cache' : '🔑 Nueva autorización'}
                </span>
                ${data.tokenCached ? '<span style="background: #d1ecf1; padding: 6px 12px; border-radius: 20px; font-size: 14px;">🔐 Token guardado</span>' : ''}
            </div>
            
            <div style="background: white; border-radius: 8px; padding: 15px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <ul style="list-style: none; padding: 0; margin: 0;">
                    ${listItems}
                </ul>
            </div>
            
            <p style="margin: 15px 0 0 0; color: #6c757d; font-size: 14px;">
                💡 <strong>Mensaje:</strong> ${data.message || 'Listas obtenidas exitosamente'}
            </p>
            
            <div style="margin-top: 15px; padding: 10px; background: #d1ecf1; border-radius: 6px; font-size: 14px;">
                <strong>✨ Próxima vez:</strong> Las listas aparecerán instantáneamente sin necesidad de autorización
            </div>
        </div>
    `;
    
    resultDiv.classList.remove('hidden');
}

// Mostrar error general
function mostrarErrorGeneral(mensaje) {
    const resultDiv = document.getElementById('calculator-result');
    if (!resultDiv) return;
    
    resultDiv.innerHTML = `
        <div style="background: #f8d7da; padding: 20px; border-radius: 12px; border-left: 4px solid #dc3545;">
            <h3 style="margin: 0 0 15px 0; color: #721c24;">
                ❌ Error
            </h3>
            
            <div style="margin-bottom: 15px;">
                <p><strong>Mensaje:</strong> ${mensaje}</p>
                <p>Verifica tu conexión e intenta nuevamente.</p>
            </div>
            
            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                <h4 style="margin: 0 0 10px 0;">🔧 Posibles soluciones:</h4>
                <ul style="margin: 0; padding-left: 20px;">
                    <li>Verifica tu conexión a internet</li>
                    <li>Asegúrate de estar usando el código correcto</li>
                    <li>El código puede haber expirado (duran ~10 minutos)</li>
                    <li>Intenta el proceso de autorización nuevamente</li>
                </ul>
            </div>
            
            <button id="retry-btn" class="primary-button" style="width: 100%;">
                🔄 Intentar Nuevamente
            </button>
        </div>
    `;
    
    // Event listener para el botón de reintentar
    const retryBtn = document.getElementById('retry-btn');
    if (retryBtn) {
        retryBtn.addEventListener('click', () => {
            verAvance().catch(error => {
                console.error('❌ Error al reintentar:', error);
            });
        });
    }
    
    resultDiv.classList.remove('hidden');
}

// ===== VARIABLES GLOBALES =====
let currentScreen = 'splash';
let goals = [];
let currentGoalGroup = null;

// ===== ELEMENTOS DEL DOM =====
const elements = {
    // Screens
    splashScreen: document.getElementById('splash-screen'),
    mainScreen: document.getElementById('main-screen'),
    createScreen: document.getElementById('create-screen'),
    successScreen: document.getElementById('success-screen'),
    
    // Main screen
    createGoalsBtn: document.getElementById('create-goals-btn'),
    viewListsBtn: document.getElementById('view-lists-btn'),
    calculatorResult: document.getElementById('calculator-result'),
    
    // Create screen
    backBtn: document.getElementById('back-btn'),
    goalsForm: document.getElementById('goals-form'),
    groupNameInput: document.getElementById('group-name'),
    startDateInput: document.getElementById('start-date'),
    goalsContainer: document.getElementById('goals-container'),
    addGoalBtn: document.getElementById('add-goal-btn'),
    submitBtn: document.getElementById('submit-btn'),
    buttonText: document.querySelector('.button-text'),
    buttonLoading: document.querySelector('.button-loading'),
    
    // Success screen
    successTitle: document.getElementById('success-title'),
    successDescription: document.getElementById('success-description'),
    authBtn: document.getElementById('auth-btn'),
    doneBtn: document.getElementById('done-btn')
};

// ===== INICIALIZACIÓN =====
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Iniciando 12 Week Goals PWA...');
    
    // Inicializar elementos del DOM después de que se cargue
    initializeElements();
    initializeApp();
    registerServiceWorker();
    setupEventListeners();
    setDefaultStartDate();
    
    console.log('✅ Inicialización completada');
});

function initializeElements() {
    // Reasignar elementos del DOM para asegurar que existen
    elements.calculatorResult = document.getElementById('calculator-result');
    
    // Debug: verificar que los elementos existen
    console.log('🔍 Verificando elementos del DOM:');
    console.log('- calculatorResult:', elements.calculatorResult ? '✅ Encontrado' : '❌ No encontrado');
}

function initializeApp() {
    // Mostrar splash screen por 500ms (más rápido)
    setTimeout(() => {
        showScreen('main');
        
        // Debug inmediato
        console.log('🔍 DEBUGGING - Estado de elementos:');
        console.log('- calculator-result existe:', !!document.getElementById('calculator-result'));
        console.log('- reload-progress existe:', !!document.getElementById('reload-progress'));
        
        // Mostrar inmediatamente un mensaje de carga
        const resultDiv = document.getElementById('calculator-result');
        if (resultDiv) {
            resultDiv.innerHTML = `
                <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; border-left: 4px solid #2196f3;">
                    <p><strong>⏳ Cargando progreso de metas...</strong></p>
                    <p>Conectando con el servidor...</p>
                </div>
            `;
            resultDiv.classList.remove('hidden');
        }
        
        // Cargar automáticamente el progreso de las metas con delay
        setTimeout(() => {
            loadWeekProgress();
        }, 1500);
    }, 500);
}

function registerServiceWorker() {
    // Service Worker deshabilitado para evitar cache
    console.log('🚫 Service Worker deshabilitado - Sin cache');
    
    // Si hay un service worker previo, desregistrarlo
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(function(registrations) {
            for(let registration of registrations) {
                registration.unregister();
                console.log('🗑️ Service Worker desregistrado');
            }
        });
    }
}

function setupEventListeners() {
    // Navigation
    elements.createGoalsBtn.addEventListener('click', () => showScreen('create'));
    elements.backBtn.addEventListener('click', () => showScreen('main'));
    elements.doneBtn.addEventListener('click', () => showScreen('main'));
    
    // Nuevo botón para ver listas
    const viewListsBtn = document.getElementById('view-lists-btn');
    if (viewListsBtn) {
        viewListsBtn.addEventListener('click', () => {
            console.log('🎯 Botón "Ver Mis Listas" clickeado');
            verAvance().catch(error => {
                console.error('❌ Error al obtener listas:', error);
                mostrarErrorGeneral(error.message);
            });
        });
    }
    
    // Botón continuar del splash screen
    const continueBtn = document.getElementById('continue-btn');
    if (continueBtn) {
        continueBtn.addEventListener('click', () => showScreen('main'));
    }
    
    // Botón de recargar progreso
    const reloadBtn = document.getElementById('reload-progress-btn');
    if (reloadBtn) {
        reloadBtn.addEventListener('click', () => {
            console.log('🔄 Recargando progreso manualmente...');
            loadWeekProgress();
        });
    }
    
    // Form
    elements.addGoalBtn.addEventListener('click', addGoal);
    elements.goalsForm.addEventListener('submit', handleFormSubmit);
    
    // Success screen
    elements.authBtn.addEventListener('click', handleAuthRedirect);
}

function setDefaultStartDate() {
    const today = new Date();
    const nextMonday = new Date(today);
    nextMonday.setDate(today.getDate() + (1 + 7 - today.getDay()) % 7);
    elements.startDateInput.value = nextMonday.toISOString().split('T')[0];
}

// ===== NAVEGACIÓN ENTRE SCREENS =====
function showScreen(screenName) {
    // Ocultar todas las screens
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.add('hidden');
    });
    
    // Mostrar screen seleccionada
    const screenElement = document.getElementById(`${screenName}-screen`);
    if (screenElement) {
        screenElement.classList.remove('hidden');
        currentScreen = screenName;
        
        // Inicializar screen específica
        if (screenName === 'create') {
            initializeCreateScreen();
        } else if (screenName === 'main') {
            // Cargar progreso cuando se muestra la pantalla principal
            setTimeout(() => {
                loadWeekProgress();
            }, 300);
        }
    }
}

function initializeCreateScreen() {
    // Limpiar formulario
    elements.goalsContainer.innerHTML = '';
    goals = [];
    
    // Agregar primera meta
    addGoal();
}

// ===== GESTIÓN DE METAS =====
function addGoal() {
    const goalIndex = goals.length;
    const goal = {
        id: `goal-${goalIndex}`,
        name: '',
        tasks: new Array(12).fill('')
    };
    
    goals.push(goal);
    renderGoal(goal, goalIndex);
}

function renderGoal(goal, index) {
    const goalCard = document.createElement('div');
    goalCard.className = 'goal-card';
    goalCard.innerHTML = `
        <div class="goal-header">
            <div class="goal-number">${index + 1}</div>
            <button type="button" class="remove-goal-btn" onclick="removeGoal(${index})" ${goals.length === 1 ? 'disabled style="opacity:0.5"' : ''}>
                Eliminar
            </button>
        </div>
        
        <div class="input-group">
            <label for="goal-name-${index}">Nombre de la meta:</label>
            <input type="text" id="goal-name-${index}" placeholder="Ej: Hacer ejercicio" required>
        </div>
        
        <div class="input-group">
            <label>Tareas semanales (12 semanas):</label>
            <div class="tasks-grid">
                ${generateTaskInputs(index)}
            </div>
        </div>
    `;
    
    elements.goalsContainer.appendChild(goalCard);
    
    // Event listeners para inputs
    setupGoalEventListeners(index);
}

function generateTaskInputs(goalIndex) {
    let html = '';
    for (let week = 1; week <= 12; week++) {
        html += `
            <div class="task-input" data-week="S${week}">
                <input 
                    type="text" 
                    id="task-${goalIndex}-${week}" 
                    placeholder="Semana ${week} - Describe la tarea"
                    required
                >
            </div>
        `;
    }
    return html;
}

function setupGoalEventListeners(index) {
    // Goal name input
    const nameInput = document.getElementById(`goal-name-${index}`);
    nameInput.addEventListener('input', (e) => {
        goals[index].name = e.target.value;
    });
    
    // Task inputs
    for (let week = 1; week <= 12; week++) {
        const taskInput = document.getElementById(`task-${index}-${week}`);
        taskInput.addEventListener('input', (e) => {
            goals[index].tasks[week - 1] = e.target.value;
        });
    }
}

function removeGoal(index) {
    if (goals.length > 1) {
        goals.splice(index, 1);
        renderAllGoals();
    }
}

function renderAllGoals() {
    elements.goalsContainer.innerHTML = '';
    goals.forEach((goal, index) => {
        renderGoal(goal, index);
    });
}

// ===== VALIDACIÓN Y ENVÍO =====
function handleFormSubmit(e) {
    e.preventDefault();
    
    if (!validateForm()) {
        return;
    }
    
    const goalGroup = createGoalGroup();
    submitGoals(goalGroup);
}

function validateForm() {
    const groupName = elements.groupNameInput.value.trim();
    const startDate = elements.startDateInput.value;
    
    if (!groupName) {
        showAlert('Error', 'Por favor ingresa un nombre para el grupo de metas');
        return false;
    }
    
    if (!startDate) {
        showAlert('Error', 'Por favor selecciona una fecha de inicio');
        return false;
    }
    
    // Validar metas
    for (let i = 0; i < goals.length; i++) {
        const goal = goals[i];
        
        if (!goal.name.trim()) {
            showAlert('Error', `Por favor ingresa un nombre para la meta ${i + 1}`);
            return false;
        }
        
        for (let j = 0; j < goal.tasks.length; j++) {
            if (!goal.tasks[j].trim()) {
                showAlert('Error', `Por favor completa la semana ${j + 1} de la meta "${goal.name}"`);
                return false;
            }
        }
    }
    
    return true;
}

function createGoalGroup() {
    const groupName = elements.groupNameInput.value.trim();
    const startDate = new Date(elements.startDateInput.value);
    
    const goalsData = goals.map(goal => ({
        name: goal.name.trim(),
        tasks: goal.tasks.map(task => task.trim())
    }));
    
    return {
        goalGroupName: groupName,
        startDate: startDate.toISOString(),
        goals: goalsData
    };
}

async function submitGoals(goalGroup) {
    setLoadingState(true);
    
    try {
        const response = await fetch(`${API_CONFIG.baseURL}${API_CONFIG.endpoints.createGoals}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(goalGroup)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        currentGoalGroup = goalGroup;
        
        showSuccess(data);
        
    } catch (error) {
        console.error('Error:', error);
        showAlert('Error de Conexión', 
            'No se pudo conectar con el servidor. Verifica que tu API esté ejecutándose y que la URL sea correcta.');
    } finally {
        setLoadingState(false);
    }
}

function setLoadingState(loading) {
    elements.submitBtn.disabled = loading;
    
    if (loading) {
        elements.buttonText.classList.add('hidden');
        elements.buttonLoading.classList.remove('hidden');
    } else {
        elements.buttonText.classList.remove('hidden');
        elements.buttonLoading.classList.add('hidden');
    }
}

// ===== CALCULADOR DE SEMANAS =====
async function getWeekProgress(startDate, cacheBuster = null) {
    try {
        const formattedDate = startDate instanceof Date 
            ? startDate.toISOString().split('T')[0] 
            : startDate;
        
        // Construir URL base
        let url = `${API_CONFIG.baseURL}${API_CONFIG.endpoints.weekCalculator}?startDate=${formattedDate}`;
        
        // Aplicar cache-busting automáticamente
        url = createCacheBustingUrl(url);
        
        // Agregar cache buster adicional si se proporciona
        if (cacheBuster) {
            url += `&v=${cacheBuster}`;
        }
        
        console.log('🌐 Haciendo fetch a:', url);
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            },
            cache: 'no-store'
        });
        
        console.log('📡 Response status:', response.status);
        console.log('📡 Response ok:', response.ok);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('📊 Data recibida:', data);
        return data;
        
    } catch (error) {
        console.error('❌ Error en getWeekProgress:', error);
        throw error;
    }
}

// Función para cargar automáticamente el progreso
async function loadWeekProgress() {
    console.log('� INICIO loadWeekProgress()');
    
    const resultDiv = document.getElementById('calculator-result');
    if (!resultDiv) {
        console.error('❌ No se encontró el elemento calculator-result');
        return;
    }
    
    try {
        // Actualizar mensaje a "consultando"
        resultDiv.innerHTML = `
            <div style="background: #fff3cd; padding: 15px; border-radius: 8px; border-left: 4px solid #ffc107;">
                <p><strong>� Consultando servidor...</strong></p>
                <p>Obteniendo datos del progreso...</p>
            </div>
        `;
        
        // Cache busting más agresivo para móviles
        const timestamp = Date.now();
        const randomValue = Math.random().toString(36).substring(7);
        const cacheBuster = `${timestamp}_${randomValue}`;
        
        const testDate = '2025-07-14';
        const fullUrl = `${API_CONFIG.baseURL}${API_CONFIG.endpoints.weekCalculator}?startDate=${testDate}&v=${cacheBuster}&_cb=${timestamp}`;
        
        console.log('📅 Fecha de consulta:', testDate);
        console.log('🌐 URL completa:', fullUrl);
        console.log('🔧 API_CONFIG:', API_CONFIG);
        console.log('📱 Device Info:', {
            userAgent: navigator.userAgent,
            isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
            isSafari: /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent),
            isIOS: /iPad|iPhone|iPod/.test(navigator.userAgent),
            cacheBuster: cacheBuster
        });
        
        console.log('📡 Iniciando fetch...');
        const result = await getWeekProgress(testDate, cacheBuster);
        console.log('✅ Respuesta recibida:', result);
        
        if (result && result.message) {
            console.log('✅ Mostrando resultado en UI');
            displayCalculatorResult(result);
        } else {
            console.error('❌ Resultado inválido:', result);
            throw new Error('Respuesta del API inválida');
        }
        
    } catch (error) {
        console.error('❌ ERROR en loadWeekProgress:', error);
        console.error('❌ Error details:', {
            message: error.message,
            stack: error.stack
        });
        
        // Mostrar error específico
        resultDiv.innerHTML = `
            <div style="background: #f8d7da; padding: 15px; border-radius: 8px; border-left: 4px solid #dc3545;">
                <p><strong>❌ Error al cargar progreso</strong></p>
                <p><strong>Detalles:</strong> ${error.message}</p>
                <p><strong>URL:</strong> ${API_CONFIG.baseURL}${API_CONFIG.endpoints.weekCalculator}</p>
                <p>Verifica tu conexión e intenta recargar.</p>
            </div>
        `;
        
        // Mostrar botón de recarga
        const reloadDiv = document.getElementById('reload-progress');
        if (reloadDiv) {
            reloadDiv.classList.remove('hidden');
        }
    }
}

// Mostrar resultado del calculador en la interfaz
function displayCalculatorResult(data) {
    const resultDiv = elements.calculatorResult;
    const reloadDiv = document.getElementById('reload-progress');
    
    resultDiv.innerHTML = `
        <h3>📊 Progreso de Metas</h3>
        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 4px solid #007AFF;">
            <p><strong>${data.message}</strong></p>
            <div style="margin-top: 10px;">
                <p><strong>📅 Fecha de inicio:</strong> ${data.startDate}</p>
                <p><strong>📅 Fecha actual:</strong> ${data.currentDate}</p>
                <p><strong>📈 Progreso:</strong> ${data.progressPercentage}% (${data.weeksCompleted}/${data.totalWeeks} semanas)</p>
                <p><strong>⏰ Días transcurridos:</strong> ${data.daysSinceStart}</p>
                <p><strong>⏳ Semanas restantes:</strong> ${data.weeksRemaining}</p>
                ${data.nextWeekStartsOn ? `<p><strong>📌 Próxima semana:</strong> ${data.nextWeekStartsOn}</p>` : ''}
                ${data.isCompleted ? '<p style="color: #28a745;"><strong>🎉 ¡Ciclo completado!</strong></p>' : ''}
            </div>
        </div>
    `;
    
    resultDiv.classList.remove('hidden');
    
    // Ocultar botón de recarga si existe
    if (reloadDiv) {
        reloadDiv.classList.add('hidden');
    }
}

function showSuccess(data) {
    elements.successTitle.textContent = '¡Metas creadas exitosamente! 🎉';
    elements.successDescription.textContent = data.message || 'Tus metas han sido enviadas a Microsoft To Do';
    
    // Configurar botón de autorización
    if (data.authUrl) {
        elements.authBtn.style.display = 'block';
        elements.authBtn.onclick = () => {
            window.open(data.authUrl, '_blank');
        };
    } else {
        elements.authBtn.style.display = 'none';
    }
    
    showScreen('success');
}

function handleAuthRedirect() {
    // El usuario volverá manualmente con el código
    const code = prompt('Después de autenticarte en Microsoft, ingresa el código que aparece en la URL:');
    
    if (code) {
        processCallback(code);
    }
}

async function processCallback(code) {
    try {
        const response = await fetch(`${API_CONFIG.baseURL}${API_CONFIG.endpoints.callback}?code=${encodeURIComponent(code)}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        showAlert('¡Éxito! 🎉', data.message || 'Tus metas han sido creadas en Microsoft To Do');
        
        // Resetear formulario
        elements.goalsForm.reset();
        goals = [];
        currentGoalGroup = null;
        
    } catch (error) {
        console.error('Callback error:', error);
        showAlert('Error', 'Hubo un problema al procesar la autorización. Intenta nuevamente.');
    }
}

// ===== UTILIDADES =====
function showAlert(title, message) {
    // Simple alert por ahora - podrías crear un modal personalizado
    alert(`${title}\n\n${message}`);
}

// ===== PWA FEATURES =====
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    
    // Mostrar prompt de instalación personalizado
    const installButton = document.createElement('button');
    installButton.textContent = '📱 Instalar App';
    installButton.className = 'secondary-button';
    installButton.style.position = 'fixed';
    installButton.style.bottom = '20px';
    installButton.style.right = '20px';
    installButton.style.width = 'auto';
    installButton.style.zIndex = '1000';
    
    installButton.addEventListener('click', () => {
        e.prompt();
        e.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
                console.log('PWA instalada');
            }
            installButton.remove();
        });
    });
    
    document.body.appendChild(installButton);
});

// ===== DEBUG =====
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    console.log('🚀 12 Week Goals PWA - Modo desarrollo');
    console.log('📊 Configuración API:', API_CONFIG);
}

// Función global para debugging del calculador
window.debugCalculator = {
    load: loadWeekProgress,
    test: async () => {
        console.log('🧪 PRUEBA MANUAL DEL API');
        try {
            const url = 'https://12-week-goals-back-production.up.railway.app/api/Goals/week-calculator?startDate=2025-07-14';
            console.log('🌐 URL de prueba:', url);
            
            const response = await fetch(url);
            console.log('📡 Status:', response.status);
            
            if (response.ok) {
                const data = await response.json();
                console.log('✅ Datos recibidos:', data);
                return data;
            } else {
                console.error('❌ Error HTTP:', response.status, response.statusText);
            }
        } catch (error) {
            console.error('❌ Error de red:', error);
        }
    },
    checkElements: () => {
        console.log('🔍 Estado de elementos:');
        console.log('- calculatorResult:', document.getElementById('calculator-result'));
        console.log('- reloadProgress:', document.getElementById('reload-progress'));
    },
    show: (data) => {
        const testData = data || {
            "currentWeek": 2,
            "message": "Estás en la semana 2 de tus 12 semanas de metas.",
            "startDate": "14/07/2025",
            "currentDate": "22/07/2025",
            "totalWeeks": 12,
            "weeksCompleted": 2,
            "weeksRemaining": 10,
            "progressPercentage": 16.7,
            "daysSinceStart": 8,
            "isCompleted": false,
            "nextWeekStartsOn": "28/07/2025"
        };
        displayCalculatorResult(testData);
    }
};

console.log('🛠️ Funciones de debug disponibles en window.debugCalculator');
console.log('- debugCalculator.load(): Cargar progreso');
console.log('- debugCalculator.test(): Probar API directamente');
console.log('- debugCalculator.checkElements(): Verificar elementos DOM');
console.log('- debugCalculator.show(): Mostrar datos de prueba');

// Debugging para las nuevas funciones de listas
window.debugListas = {
    verAvance: verAvance,
    testCache: async () => {
        console.log('🧪 PROBANDO CACHE DE LISTAS');
        try {
            const url = `${API_CONFIG.baseURL}${API_CONFIG.endpoints.getListsFromCache}`;
            console.log('🌐 URL:', url);
            
            const response = await fetch(url);
            console.log('📡 Status:', response.status);
            
            const data = await response.json();
            console.log('✅ Datos:', data);
            return data;
        } catch (error) {
            console.error('❌ Error:', error);
        }
    },
    testAuth: async () => {
        console.log('🧪 PROBANDO AUTORIZACIÓN');
        try {
            const url = `${API_CONFIG.baseURL}${API_CONFIG.endpoints.auth}`;
            console.log('🌐 URL:', url);
            
            const response = await fetch(url);
            console.log('📡 Status:', response.status);
            
            const data = await response.json();
            console.log('✅ Datos:', data);
            return data;
        } catch (error) {
            console.error('❌ Error:', error);
        }
    },
    mostrarListas: (data) => {
        const testData = data || {
            success: true,
            totalLists: 5,
            listNames: ["🎯 Test Lista 1", "📝 Test Lista 2", "✅ Test Lista 3"],
            source: "cached_token",
            tokenCached: true,
            message: "Test - Listas de prueba"
        };
        mostrarListas(testData);
    }
};

console.log('🛠️ Funciones de debug para listas disponibles en window.debugListas');
console.log('- debugListas.verAvance(): Probar flujo completo');
console.log('- debugListas.testCache(): Probar cache de listas');
console.log('- debugListas.testAuth(): Probar autorización');
console.log('- debugListas.mostrarListas(): Mostrar datos de prueba');
