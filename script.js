// ===================================
// CONFIGURACIÓN INICIAL Y ESTADO
// ===================================

// Configuración de tiers por defecto
const DEFAULT_TIERS = [
    { id: 1, label: 'S', color: '#10b981' },
    { id: 2, label: 'A', color: '#3b82f6' },
    { id: 3, label: 'B', color: '#fbbf24' },
    { id: 4, label: 'C', color: '#f97316' }
];

// Estado de la aplicación
let tiers = [];
let students = [];
let currentEditingTierId = null;
let draggedElement = null;
let draggedTierRow = null;

// ===================================
// INICIALIZACIÓN
// ===================================

/**
 * Inicializa la aplicación al cargar la página
 */
document.addEventListener('DOMContentLoaded', () => {
    loadFromLocalStorage();
    renderTiers();
    renderStudents();
});

/**
 * Carga datos desde LocalStorage
 * - Carga tiers (textos, colores, orden) si existen
 * - Carga lista de alumnos si existe
 * - Reinicia todos los alumnos al banquillo
 */
function loadFromLocalStorage() {
    // Cargar configuración de tiers
    const savedTiers = localStorage.getItem('tierListTiers');
    if (savedTiers) {
        tiers = JSON.parse(savedTiers);
    } else {
        tiers = [...DEFAULT_TIERS];
    }

    // Cargar lista de alumnos (pero todos van al banquillo)
    const savedStudents = localStorage.getItem('tierListStudents');
    if (savedStudents) {
        students = JSON.parse(savedStudents);
    } else {
        students = [];
    }
}

/**
 * Guarda la configuración de tiers en LocalStorage
 */
function saveTiersToLocalStorage() {
    localStorage.setItem('tierListTiers', JSON.stringify(tiers));
}

/**
 * Guarda la lista de alumnos en LocalStorage
 */
function saveStudentsToLocalStorage() {
    localStorage.setItem('tierListStudents', JSON.stringify(students));
}

// ===================================
// RENDERIZADO DE TIERS
// ===================================

/**
 * Renderiza todas las filas de tier
 */
function renderTiers() {
    const container = document.getElementById('tierListContainer');
    container.innerHTML = '';

    tiers.forEach((tier, index) => {
        const tierRow = createTierRow(tier, index);
        container.appendChild(tierRow);
    });
}

/**
 * Crea un elemento de fila de tier
 * @param {Object} tier - Objeto con datos del tier
 * @param {number} index - Índice del tier en el array
 * @returns {HTMLElement} Elemento DOM de la fila
 */
function createTierRow(tier, index) {
    const row = document.createElement('div');
    row.className = 'tier-row';
    row.dataset.tierId = tier.id;
    row.dataset.tierIndex = index;
    row.draggable = true;

    // Eventos para arrastrar la fila completa
    row.addEventListener('dragstart', handleTierRowDragStart);
    row.addEventListener('dragend', handleTierRowDragEnd);
    row.addEventListener('dragover', handleTierRowDragOver);
    row.addEventListener('drop', handleTierRowDrop);

    row.innerHTML = `
        <div class="tier-label" style="background: ${tier.color}">
            <span class="tier-label-text">${tier.label}</span>
            <div class="tier-actions">
                <button class="tier-action-btn" onclick="openEditTierModal(${tier.id})" title="Editar">
                    ✏️
                </button>
                <button class="tier-action-btn" onclick="deleteTier(${tier.id})" title="Eliminar">
                    🗑️
                </button>
            </div>
        </div>
        <div class="tier-items" data-tier-id="${tier.id}">
            <!-- Los estudiantes se añadirán aquí mediante drag & drop -->
        </div>
    `;

    // Configurar eventos de drag & drop para los items
    const tierItems = row.querySelector('.tier-items');
    tierItems.addEventListener('dragover', handleDragOver);
    tierItems.addEventListener('drop', handleDrop);
    tierItems.addEventListener('dragleave', handleDragLeave);

    return row;
}

// ===================================
// DRAG & DROP DE FILAS COMPLETAS
// ===================================

/**
 * Maneja el inicio del arrastre de una fila completa
 */
function handleTierRowDragStart(e) {
    // Solo permitir arrastrar si se hace desde el label, no desde los items
    if (!e.target.classList.contains('tier-row')) {
        return;
    }

    draggedTierRow = this;
    this.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', this.innerHTML);
}

/**
 * Maneja el fin del arrastre de una fila
 */
function handleTierRowDragEnd(e) {
    this.classList.remove('dragging');

    // Remover clases de drag-over de todas las filas
    document.querySelectorAll('.tier-row').forEach(row => {
        row.classList.remove('drag-over');
    });

    draggedTierRow = null;
}

/**
 * Maneja el evento dragover para filas
 */
function handleTierRowDragOver(e) {
    if (!draggedTierRow) return;

    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    const afterElement = getDragAfterElement(e.clientY);
    if (afterElement == null) {
        this.classList.add('drag-over');
    }
}

/**
 * Maneja el drop de una fila sobre otra
 */
function handleTierRowDrop(e) {
    if (!draggedTierRow) return;

    e.stopPropagation();
    this.classList.remove('drag-over');

    if (draggedTierRow !== this) {
        // Obtener índices
        const draggedIndex = parseInt(draggedTierRow.dataset.tierIndex);
        const targetIndex = parseInt(this.dataset.tierIndex);

        // Reordenar array de tiers
        const [removed] = tiers.splice(draggedIndex, 1);
        tiers.splice(targetIndex, 0, removed);

        // Guardar y re-renderizar
        saveTiersToLocalStorage();
        renderTiers();
        renderStudents();
    }
}

/**
 * Determina el elemento después del cual se debe insertar
 */
function getDragAfterElement(y) {
    const draggableElements = [...document.querySelectorAll('.tier-row:not(.dragging)')];

    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;

        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

// ===================================
// GESTIÓN DE TIERS
// ===================================

/**
 * Añade una nueva fila de tier
 */
function addNewTier() {
    const newId = Math.max(...tiers.map(t => t.id), 0) + 1;
    const newTier = {
        id: newId,
        label: 'D',
        color: '#8b5cf6'
    };

    tiers.push(newTier);
    saveTiersToLocalStorage();
    renderTiers();
    renderStudents();
}

/**
 * Abre el modal para editar un tier
 */
function openEditTierModal(tierId) {
    const tier = tiers.find(t => t.id === tierId);
    if (!tier) return;

    currentEditingTierId = tierId;
    document.getElementById('tierLabel').value = tier.label;
    document.getElementById('tierColor').value = tier.color;

    const modal = new bootstrap.Modal(document.getElementById('editTierModal'));
    modal.show();
}

/**
 * Guarda los cambios de edición de un tier
 */
function saveTierEdit() {
    const tier = tiers.find(t => t.id === currentEditingTierId);
    if (!tier) return;

    tier.label = document.getElementById('tierLabel').value;
    tier.color = document.getElementById('tierColor').value;

    saveTiersToLocalStorage();
    renderTiers();
    renderStudents();

    const modal = bootstrap.Modal.getInstance(document.getElementById('editTierModal'));
    modal.hide();
}

/**
 * Elimina un tier
 */
function deleteTier(tierId) {
    if (tiers.length <= 1) {
        alert('Debe haber al menos una fila de tier');
        return;
    }

    if (confirm('¿Estás seguro de eliminar esta fila? Los estudiantes volverán al banquillo.')) {
        tiers = tiers.filter(t => t.id !== tierId);
        saveTiersToLocalStorage();
        renderTiers();
        renderStudents();
    }
}

// ===================================
// RENDERIZADO DE ESTUDIANTES
// ===================================

/**
 * Renderiza todos los estudiantes en el banquillo
 */
function renderStudents() {
    const banquillo = document.getElementById('banquillo');
    banquillo.innerHTML = '';

    students.forEach(student => {
        const card = createStudentCard(student);
        banquillo.appendChild(card);
    });
}

/**
 * Crea una tarjeta de estudiante arrastrable
 * @param {string} studentName - Nombre del estudiante
 * @returns {HTMLElement} Elemento DOM de la tarjeta
 */
function createStudentCard(studentName) {
    const card = document.createElement('div');
    card.className = 'student-card';
    card.draggable = true;
    card.dataset.studentName = studentName;

    // Evento dragstart: se dispara cuando comenzamos a arrastrar
    card.addEventListener('dragstart', handleStudentDragStart);

    // Evento dragend: se dispara cuando terminamos de arrastrar
    card.addEventListener('dragend', handleStudentDragEnd);

    card.innerHTML = `
        <span class="student-icon">👤</span>
        <span>${studentName}</span>
    `;

    return card;
}

// ===================================
// DRAG & DROP DE ESTUDIANTES
// ===================================

/**
 * Maneja el inicio del arrastre de un estudiante
 * Se guarda referencia al elemento arrastrado
 */
function handleStudentDragStart(e) {
    draggedElement = this;
    this.classList.add('dragging');

    // Guardamos el nombre del estudiante en el dataTransfer
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', this.dataset.studentName);
}

/**
 * Maneja el fin del arrastre
 * Limpia las clases visuales
 */
function handleStudentDragEnd(e) {
    this.classList.remove('dragging');

    // Remover clases drag-over de todos los contenedores
    document.querySelectorAll('.tier-items, .banquillo-container').forEach(container => {
        container.classList.remove('drag-over');
    });

    draggedElement = null;
}

/**
 * Maneja el evento dragover (cuando pasamos por encima de un contenedor)
 * Necesario para permitir el drop
 */
function handleDragOver(e) {
    if (!draggedElement) return;

    // Prevenir comportamiento por defecto para permitir el drop
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    // Añadir clase visual
    this.classList.add('drag-over');
}

/**
 * Maneja cuando el elemento sale del área de drop
 */
function handleDragLeave(e) {
    // Solo remover si realmente salimos del contenedor
    if (e.target === this) {
        this.classList.remove('drag-over');
    }
}

/**
 * Maneja el evento drop (cuando soltamos el elemento)
 * Mueve el estudiante al contenedor correspondiente
 */
function handleDrop(e) {
    if (!draggedElement) return;

    e.preventDefault();
    e.stopPropagation();

    this.classList.remove('drag-over');

    // Añadir el elemento al nuevo contenedor
    this.appendChild(draggedElement);
}

// ===================================
// IMPORTACIÓN DE ESTUDIANTES
// ===================================

/**
 * Importa estudiantes desde el textarea del modal
 */
function importStudents() {
    const input = document.getElementById('studentInput').value;

    if (!input.trim()) {
        alert('Por favor, introduce al menos un nombre');
        return;
    }

    // Separar por comas y limpiar espacios
    const newStudents = input
        .split(',')
        .map(name => name.trim())
        .filter(name => name.length > 0);

    if (newStudents.length === 0) {
        alert('No se encontraron nombres válidos');
        return;
    }

    // Añadir solo estudiantes que no existan ya
    newStudents.forEach(name => {
        if (!students.includes(name)) {
            students.push(name);
        }
    });

    // Guardar y renderizar
    saveStudentsToLocalStorage();
    renderStudents();

    // Limpiar input y cerrar modal
    document.getElementById('studentInput').value = '';
    const modal = bootstrap.Modal.getInstance(document.getElementById('importModal'));
    modal.hide();

    alert(`Se importaron ${newStudents.length} estudiante(s)`);
}

// ===================================
// EXPORTACIÓN DE RESULTADOS
// ===================================

/**
 * Exporta los resultados en formato JSON
 * Genera un archivo descargable con la asignación de cada estudiante
 */
function exportResults() {
    const results = [];

    // Recorrer cada tier y obtener los estudiantes
    tiers.forEach(tier => {
        const tierContainer = document.querySelector(`.tier-items[data-tier-id="${tier.id}"]`);
        const studentsInTier = tierContainer.querySelectorAll('.student-card');

        studentsInTier.forEach(card => {
            results.push({
                nombre: card.dataset.studentName,
                tier: tier.label,
                color: tier.color
            });
        });
    });

    // Estudiantes en el banquillo
    const banquilloStudents = document.querySelectorAll('#banquillo .student-card');
    banquilloStudents.forEach(card => {
        results.push({
            nombre: card.dataset.studentName,
            tier: 'Sin asignar',
            color: '#6b7280'
        });
    });

    if (results.length === 0) {
        alert('No hay estudiantes para exportar');
        return;
    }

    // Crear objeto JSON con metadatos
    const exportData = {
        fecha: new Date().toISOString(),
        total_estudiantes: results.length,
        tiers: tiers.map(t => ({ label: t.label, color: t.color })),
        resultados: results
    };

    // Crear archivo y descargar
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `tierlist-resultados-${new Date().toISOString().split('T')[0]}.json`;
    link.click();

    alert(`Se exportaron ${results.length} estudiante(s)`);
}

// ===================================
// CONFIGURACIÓN DEL BANQUILLO Y PAPELERA
// ===================================

// Configurar eventos de drag & drop para el banquillo
document.addEventListener('DOMContentLoaded', () => {
    const banquillo = document.getElementById('banquillo');
    banquillo.addEventListener('dragover', handleDragOver);
    banquillo.addEventListener('drop', handleDrop);
    banquillo.addEventListener('dragleave', handleDragLeave);

    // Configurar eventos para la zona de papelera
    const trashZone = document.getElementById('trashZone');
    trashZone.addEventListener('dragover', handleTrashDragOver);
    trashZone.addEventListener('drop', handleTrashDrop);
    trashZone.addEventListener('dragleave', handleTrashDragLeave);
});

/**
 * Maneja el dragover sobre la zona de papelera
 */
function handleTrashDragOver(e) {
    if (!draggedElement) return;

    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    this.classList.add('drag-over');
}

/**
 * Maneja cuando el elemento sale de la zona de papelera
 */
function handleTrashDragLeave(e) {
    if (e.target === this) {
        this.classList.remove('drag-over');
    }
}

/**
 * Maneja el drop en la zona de papelera
 * Elimina el estudiante de la lista
 */
function handleTrashDrop(e) {
    if (!draggedElement) return;

    e.preventDefault();
    e.stopPropagation();

    this.classList.remove('drag-over');

    const studentName = draggedElement.dataset.studentName;

    // Confirmar eliminación
    if (confirm(`¿Estás seguro de eliminar a "${studentName}"?`)) {
        // Eliminar del array de estudiantes
        students = students.filter(s => s !== studentName);

        // Eliminar el elemento del DOM
        draggedElement.remove();

        // Guardar cambios
        saveStudentsToLocalStorage();

        // Mostrar feedback visual
        showTrashFeedback();
    }
}

/**
 * Muestra un feedback visual cuando se elimina un estudiante
 */
function showTrashFeedback() {
    const trashZone = document.getElementById('trashZone');
    const originalBg = trashZone.style.background;

    trashZone.style.background = 'rgba(239, 68, 68, 0.5)';

    setTimeout(() => {
        trashZone.style.background = originalBg;
    }, 300);
}

