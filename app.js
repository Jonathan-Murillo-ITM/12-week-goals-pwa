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
    baseURL: 'https://12-week-goals-back-production.up.railway.app/api',
    endpoints: {
        getListsFromCache: '/goals/get-lists-from-cache',
        getListsWithBrowser: '/goals/get-lists-with-browser-and-cache'
    }
};

// Función para crear URLs con cache-busting
function createCacheBustingUrl(url) {
    const timestamp = Date.now();
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}_t=${timestamp}`;
}

// ===== FUNCIÓN DE DEBUGGING PARA CALLBACK =====
async function testCallbackEndpoint(code) {
    try {
        console.log('🔍 Testing callback endpoint with code:', code);
        
        const url = createCacheBustingUrl(`${API_CONFIG.baseURL}/goals/callback?code=${code}`);
        console.log('🌐 Testing URL:', url);
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0',
                'Accept': 'application/json'
            },
            cache: 'no-store'
        });
        
        console.log('📡 Response status:', response.status);
        console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));
        
        const text = await response.text();
        console.log('📡 Raw response:', text);
        
        let data;
        try {
            data = JSON.parse(text);
        } catch (parseError) {
            console.error('❌ JSON parse error:', parseError);
            data = { error: 'Invalid JSON response', rawResponse: text };
        }
        
        console.log('📊 Parsed data:', data);
        
        // Mostrar resultado en la UI
        const resultDiv = document.getElementById('calculator-result');
        if (resultDiv) {
            const diagnostics = [];
            
            // Análisis del error
            if (data.error === "No se pudo obtener el token de acceso") {
                diagnostics.push("❌ El intercambio código→token falló");
                diagnostics.push("🔍 Posibles causas:");
                diagnostics.push("• Código expirado (códigos duran ~10 minutos)");
                diagnostics.push("• Configuración OAuth incorrecta en el backend");
                diagnostics.push("• Redirect URI no coincide exactamente");
                diagnostics.push("• Client ID o Client Secret incorrectos");
            }
            
            if (data.step === "exchange_code_for_token") {
                diagnostics.push("🔧 El error ocurre al llamar a Microsoft Graph");
                diagnostics.push("📍 Endpoint: https://login.microsoftonline.com/common/oauth2/v2.0/token");
            }
            
            resultDiv.innerHTML = `
                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 4px solid #17a2b8;">
                    <h4>🔍 Debug Callback Test</h4>
                    <p><strong>Status HTTP:</strong> ${response.status}</p>
                    <p><strong>Success:</strong> ${data.success || 'false'}</p>
                    <p><strong>Error:</strong> ${data.error || 'N/A'}</p>
                    <p><strong>Paso fallido:</strong> ${data.step || 'N/A'}</p>
                    <p><strong>Código proporcionado:</strong> ${data.codeProvided || 'N/A'}</p>
                    <p><strong>Longitud del código:</strong> ${data.codeLength || 'N/A'}</p>
                    
                    ${diagnostics.length > 0 ? `
                        <div style="margin-top: 15px; padding: 10px; background: #fff3cd; border-radius: 6px;">
                            <h5 style="margin: 0 0 10px 0; color: #856404;">🩺 Diagnóstico</h5>
                            ${diagnostics.map(d => `<p style="margin: 3px 0; font-size: 14px;">${d}</p>`).join('')}
                        </div>
                    ` : ''}
                    
                    <details style="margin-top: 15px;">
                        <summary style="cursor: pointer; font-weight: bold;">📋 Respuesta completa del servidor</summary>
                        <pre style="font-size: 12px; background: #f1f1f1; padding: 10px; margin-top: 10px; overflow-x: auto;">${JSON.stringify(data, null, 2)}</pre>
                    </details>
                    
                    <div style="margin-top: 15px; padding: 10px; background: #d1ecf1; border-radius: 6px; font-size: 14px;">
                        <strong>💡 Próximos pasos:</strong>
                        <br>1. Verificar configuración OAuth en Railway
                        <br>2. Comprobar redirect_uri exacto
                        <br>3. Validar que el código no haya expirado
                        <br>4. Revisar logs del backend en Railway
                    </div>
                </div>
            `;
        }
        
        return data;
        
    } catch (error) {
        console.error('❌ Error testing callback:', error);
        
        const resultDiv = document.getElementById('calculator-result');
        if (resultDiv) {
            resultDiv.innerHTML = `
                <div style="background: #f8d7da; padding: 15px; border-radius: 8px; border-left: 4px solid #dc3545;">
                    <h4>❌ Error Testing Callback</h4>
                    <p><strong>Error:</strong> ${error.message}</p>
                    <p><strong>URL:</strong> ${API_CONFIG.baseURL}/goals/callback</p>
                </div>
            `;
        }
        
        throw error;
    }
}

// Exponer función para testing desde consola
window.testCallback = testCallbackEndpoint;

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
    elements.createGoalsBtn.addEventListener('click', () => {
        console.log('🎯 Botón "Ver Mis Listas" clickeado');
        verAvance().catch(error => {
            console.error('❌ Error al obtener listas:', error);
        });
    });
    elements.backBtn.addEventListener('click', () => showScreen('main'));
    elements.doneBtn.addEventListener('click', () => showScreen('main'));
    
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
    
    // Botón de testing callback
    const testCallbackBtn = document.getElementById('test-callback-btn');
    if (testCallbackBtn) {
        testCallbackBtn.addEventListener('click', () => {
            const codeInput = document.getElementById('debug-code');
            const code = codeInput ? codeInput.value.trim() : '';
            
            if (!code) {
                alert('Por favor ingresa un código de autorización');
                return;
            }
            
            console.log('🧪 Testing callback with code:', code);
            testCallbackEndpoint(code).catch(error => {
                console.error('❌ Error testing callback:', error);
            });
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

// ===== VER LISTAS DE MICROSOFT TO DO =====
async function verAvance() {
    try {
        console.log('🎯 Iniciando verificación de listas...');
        
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
        
        // 2. Si falló el cache, pedir credenciales UNA VEZ
        console.log('🔑 Cache falló, pidiendo credenciales...');
        
        const username = prompt("📧 Email de Microsoft (Outlook/Hotmail):");
        if (!username) {
            throw new Error('Email requerido');
        }
        
        const password = prompt("🔒 Contraseña de Microsoft:");
        if (!password) {
            throw new Error('Contraseña requerida');
        }
        
        console.log('🌐 Obteniendo listas con navegador y guardando token...');
        const browserUrl = createCacheBustingUrl(`${API_CONFIG.baseURL}${API_CONFIG.endpoints.getListsWithBrowser}`);
        
        response = await fetch(browserUrl, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            },
            cache: 'no-store',
            body: JSON.stringify({ username, password })
        });
        
        data = await response.json();
        console.log('� Respuesta del navegador:', data);
        
        if (data.success) {
            console.log('✅ ¡Listas obtenidas y token guardado!');
            mostrarListas(data);
            
            // Mostrar mensaje de éxito
            const resultDiv = document.getElementById('calculator-result');
            if (resultDiv) {
                const successMessage = document.createElement('div');
                successMessage.innerHTML = `
                    <div style="background: #d4edda; padding: 10px; border-radius: 6px; margin-bottom: 15px; border-left: 4px solid #28a745;">
                        <strong>🎉 ¡Token guardado!</strong> La próxima vez será automático y súper rápido.
                    </div>
                `;
                resultDiv.insertBefore(successMessage, resultDiv.firstChild);
                
                setTimeout(() => {
                    successMessage.remove();
                }, 5000);
            }
            
            return data;
        } else {
            throw new Error(data.error || 'Error al obtener las listas');
        }
        
    } catch (error) {
        console.error('❌ Error en verAvance:', error);
        throw error;
    }
}

// Mostrar listas en la interfaz
function mostrarListas(data) {
    const resultDiv = document.getElementById('calculator-result');
    if (!resultDiv) return;
    
    console.log('🎨 Mostrando listas en la interfaz:', data);
    
    const listItems = data.listNames.map(name => 
        `<li style="padding: 8px 0; border-bottom: 1px solid #eee;">${name}</li>`
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
                    ${data.source === 'cached_token' ? '⚡ Desde cache' : '🌐 Navegador + Cache'}
                </span>
                ${data.tokenCached ? '<span style="background: #d1ecf1; padding: 6px 12px; border-radius: 20px; font-size: 14px;">🔐 Token guardado</span>' : ''}
            </div>
            
            <div style="background: white; border-radius: 8px; padding: 15px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <ul style="list-style: none; padding: 0; margin: 0;">
                    ${listItems}
                </ul>
            </div>
            
            <p style="margin: 15px 0 0 0; color: #6c757d; font-size: 14px;">
                💡 <strong>Mensaje:</strong> ${data.message}
            </p>
        </div>
    `;
}

// Función para cargar automáticamente las listas
async function loadWeekProgress() {
    console.log('🎯 INICIO loadWeekProgress() - Cargando listas automáticamente');
    
    const resultDiv = document.getElementById('calculator-result');
    if (!resultDiv) {
        console.error('❌ No se encontró el elemento calculator-result');
        return;
    }
    
    try {
        // Mostrar mensaje de carga
        resultDiv.innerHTML = `
            <div style="background: #fff3cd; padding: 15px; border-radius: 8px; border-left: 4px solid #ffc107;">
                <p><strong>🔍 Consultando Microsoft To Do...</strong></p>
                <p>Obteniendo tus listas automáticamente...</p>
            </div>
        `;
        
        console.log('� Llamando a verAvance()...');
        const result = await verAvance();
        console.log('✅ Listas cargadas exitosamente:', result);
        
    } catch (error) {
        console.error('❌ ERROR en loadWeekProgress:', error);
        console.error('❌ Error details:', {
            message: error.message,
            stack: error.stack
        });
        
        // Mostrar error específico
        resultDiv.innerHTML = `
            <div style="background: #f8d7da; padding: 15px; border-radius: 8px; border-left: 4px solid #dc3545;">
                <p><strong>❌ Error al cargar listas</strong></p>
                <p><strong>Detalles:</strong> ${error.message}</p>
                <p><strong>API:</strong> ${API_CONFIG.baseURL}</p>
                <p>Intenta recargar la página o verifica tu conexión.</p>
            </div>
        `;
        
        // Mostrar botón de recarga
        const reloadDiv = document.getElementById('reload-progress');
        if (reloadDiv) {
            reloadDiv.classList.remove('hidden');
        }
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
