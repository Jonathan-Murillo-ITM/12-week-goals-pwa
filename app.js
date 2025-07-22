// ===== CONFIGURACIÓN ===== 
const API_CONFIG = {
    baseURL: 'https://12-week-goals-back-production.up.railway.app/api', // Tu API backend
    endpoints: {
        createGoals: '/goals/create',
        callback: '/goals/callback',
        weekCalculator: '/Goals/week-calculator'
    }
};

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
        // Cargar automáticamente el progreso de las metas
        loadWeekProgress();
    }, 500);
}

function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => console.log('SW registrado:', registration))
            .catch(error => console.log('SW error:', error));
    }
}

function setupEventListeners() {
    // Navigation
    elements.createGoalsBtn.addEventListener('click', () => showScreen('create'));
    elements.backBtn.addEventListener('click', () => showScreen('main'));
    elements.doneBtn.addEventListener('click', () => showScreen('main'));
    
    // Botón continuar del splash screen
    const continueBtn = document.getElementById('continue-btn');
    if (continueBtn) {
        continueBtn.addEventListener('click', () => showScreen('main'));
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
async function getWeekProgress(startDate) {
    try {
        const formattedDate = startDate instanceof Date 
            ? startDate.toISOString().split('T')[0] 
            : startDate;
            
        const response = await fetch(`${API_CONFIG.baseURL}${API_CONFIG.endpoints.weekCalculator}?startDate=${formattedDate}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        return data;
        
    } catch (error) {
        console.error('Error al consultar progreso de semanas:', error);
        throw error;
    }
}

// Función para cargar automáticamente el progreso
async function loadWeekProgress() {
    try {
        console.log('📊 Cargando progreso de semanas automáticamente...');
        
        const testDate = '2025-07-14';
        console.log('📅 Consultando con fecha:', testDate);
        console.log('🌐 URL completa:', `${API_CONFIG.baseURL}${API_CONFIG.endpoints.weekCalculator}?startDate=${testDate}`);
        
        const result = await getWeekProgress(testDate);
        console.log('✅ Resultado del calculador de semanas:', result);
        
        if (result) {
            displayCalculatorResult(result);
        }
    } catch (error) {
        console.error('❌ Error al cargar progreso automáticamente:', error);
        // Si hay error, simplemente no mostramos nada, la app sigue funcionando
    }
}

// Mostrar resultado del calculador en la interfaz
function displayCalculatorResult(data) {
    const resultDiv = elements.calculatorResult;
    
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
    checkElements: () => {
        console.log('🔍 Estado de elementos:');
        console.log('- calculatorResult:', document.getElementById('calculator-result'));
    }
};

console.log('🛠️ Funciones de debug disponibles en window.debugCalculator');
console.log('- debugCalculator.load(): Cargar progreso manualmente');
console.log('- debugCalculator.checkElements(): Verificar elementos del DOM');
