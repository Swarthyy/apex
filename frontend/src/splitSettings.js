// ═══════════════════════════════════════════════════════════════════════════
// APEX — Split Settings Modal
// Drag-and-drop rotation builder, partner list, exercise mapping
// ═══════════════════════════════════════════════════════════════════════════
import { getOrCreateSplit, saveSplit, MUSCLE_KEYWORDS, getUnmappedExercises, mapExerciseToSlot } from './splitEngine.js';

const ALL_MUSCLES = Object.keys(MUSCLE_KEYWORDS);

// ── Modal HTML ───────────────────────────────────────────────────────────

export function openSplitEditor() {
    // Remove existing modal if present
    let modal = document.getElementById('split-editor-modal');
    if (modal) modal.remove();

    const split = getOrCreateSplit();
    const unmapped = getUnmappedExercises();

    modal = document.createElement('div');
    modal.id = 'split-editor-modal';
    modal.className = 'se-overlay';
    modal.onclick = (e) => { if (e.target === modal) closeSplitEditor(); };

    modal.innerHTML = `
    <div class="se-modal">
      <div class="se-header">
        <div>
          <div class="se-title">Edit Training Split</div>
          <div class="se-sub">Sessions per cycle: <span id="se-session-count">${split.rotation.filter(s => !s.isRest).length}</span></div>
        </div>
        <button class="se-close" onclick="closeSplitEditor()">✕</button>
      </div>

      <div class="se-body">
        <!-- Split Name -->
        <div class="se-section">
          <label class="se-label">Split Name</label>
          <input type="text" class="se-input" id="se-split-name" value="${split.name || ''}">
        </div>

        <!-- Rotation Builder -->
        <div class="se-section">
          <label class="se-label">Rotation</label>
          <div id="se-rotation-list">
            ${split.rotation.map((slot, i) => renderEditorSlot(slot, i)).join('')}
          </div>
          <button class="se-add-btn" onclick="seAddSlot()">+ Add Session</button>
        </div>

        <!-- Partner List -->
        <div class="se-section">
          <label class="se-label">Training Partners</label>
          <div class="se-partner-input-row">
            <input type="text" class="se-input" id="se-partner-input" placeholder="Name...">
            <button class="se-add-partner" onclick="seAddPartner()">+</button>
          </div>
          <div id="se-partner-chips" class="se-chips">
            ${(split.partners || []).map(p => `<span class="se-chip">${p} <span onclick="seRemovePartner('${p}')">×</span></span>`).join('')}
          </div>
        </div>

        <!-- Unmapped Exercises -->
        ${unmapped.length > 0 ? `
          <div class="se-section">
            <label class="se-label">Unmapped Exercises (${unmapped.length})</label>
            <div class="se-unmapped-list">
              ${unmapped.slice(0, 15).map(ex => `
                <div class="se-unmapped-row">
                  <span class="se-unmapped-name">${ex}</span>
                  <select class="se-unmapped-select" data-exercise="${ex}" onchange="seMapExercise(this)">
                    <option value="">Assign...</option>
                    ${split.rotation.filter(s => !s.isRest).map(s => `<option value="${s.id}">${s.label}</option>`).join('')}
                  </select>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
      </div>

      <div class="se-footer">
        <button class="se-btn-cancel" onclick="closeSplitEditor()">Cancel</button>
        <button class="se-btn-save" onclick="seSave()">Save Split</button>
      </div>
    </div>
  `;

    document.body.appendChild(modal);
    initDragDrop();
}

function renderEditorSlot(slot, index) {
    return `
    <div class="se-slot" draggable="true" data-index="${index}">
      <span class="se-drag-handle">⠿</span>
      <input type="text" class="se-input se-slot-label" value="${slot.label || ''}" placeholder="Session name">
      <div class="se-slot-muscles">
        ${ALL_MUSCLES.map(m => `
          <span class="se-muscle ${(slot.muscles || []).includes(m) ? 'active' : ''}" data-muscle="${m}" onclick="this.classList.toggle('active')">${m}</span>
        `).join('')}
      </div>
      <label class="se-rest-toggle"><input type="checkbox" class="se-rest-cb" ${slot.isRest ? 'checked' : ''} onchange="seToggleRest(this)"> Rest</label>
      ${index > 0 ? `<button class="se-delete" onclick="seRemoveSlot(${index})">✕</button>` : ''}
    </div>
  `;
}

// ── Drag & Drop ──────────────────────────────────────────────────────────

function initDragDrop() {
    const list = document.getElementById('se-rotation-list');
    if (!list) return;

    let draggedEl = null;

    list.addEventListener('dragstart', (e) => {
        draggedEl = e.target.closest('.se-slot');
        if (draggedEl) {
            draggedEl.style.opacity = '0.4';
            e.dataTransfer.effectAllowed = 'move';
        }
    });

    list.addEventListener('dragend', () => {
        if (draggedEl) draggedEl.style.opacity = '1';
        draggedEl = null;
        list.querySelectorAll('.se-slot').forEach(s => s.classList.remove('drag-over'));
    });

    list.addEventListener('dragover', (e) => {
        e.preventDefault();
        const target = e.target.closest('.se-slot');
        if (target && target !== draggedEl) {
            list.querySelectorAll('.se-slot').forEach(s => s.classList.remove('drag-over'));
            target.classList.add('drag-over');
        }
    });

    list.addEventListener('drop', (e) => {
        e.preventDefault();
        const target = e.target.closest('.se-slot');
        if (target && draggedEl && target !== draggedEl) {
            const slots = Array.from(list.querySelectorAll('.se-slot'));
            const fromIdx = slots.indexOf(draggedEl);
            const toIdx = slots.indexOf(target);
            if (fromIdx < toIdx) {
                target.after(draggedEl);
            } else {
                target.before(draggedEl);
            }
        }
        list.querySelectorAll('.se-slot').forEach(s => s.classList.remove('drag-over'));
    });
}

// ── Actions ──────────────────────────────────────────────────────────────

window.seAddSlot = function () {
    const list = document.getElementById('se-rotation-list');
    if (!list) return;
    const count = list.querySelectorAll('.se-slot').length;
    const html = renderEditorSlot({ id: `slot-${count}`, label: '', muscles: [], isRest: false }, count);
    list.insertAdjacentHTML('beforeend', html);
    updateSessionCount();
};

window.seRemoveSlot = function (index) {
    const slots = document.querySelectorAll('#se-rotation-list .se-slot');
    const activeCount = Array.from(slots).filter(s => !s.querySelector('.se-rest-cb')?.checked).length;
    // Don't allow deleting the last non-rest slot
    const targetSlot = slots[index];
    if (targetSlot && (activeCount > 1 || targetSlot.querySelector('.se-rest-cb')?.checked)) {
        targetSlot.remove();
        updateSessionCount();
    }
};

window.seToggleRest = function (cb) {
    const row = cb.closest('.se-slot');
    if (row) {
        row.querySelector('.se-slot-muscles').style.display = cb.checked ? 'none' : 'flex';
    }
    updateSessionCount();
};

window.seAddPartner = function () {
    const input = document.getElementById('se-partner-input');
    if (!input || !input.value.trim()) return;
    const chips = document.getElementById('se-partner-chips');
    const name = input.value.trim();
    chips.insertAdjacentHTML('beforeend', `<span class="se-chip">${name} <span onclick="seRemovePartner('${name}')">×</span></span>`);
    input.value = '';
};

window.seRemovePartner = function (name) {
    document.querySelectorAll('#se-partner-chips .se-chip').forEach(c => {
        if (c.textContent.replace('×', '').trim() === name) c.remove();
    });
};

window.seMapExercise = function (selectEl) {
    const exercise = selectEl.dataset.exercise;
    const slotId = selectEl.value;
    if (exercise && slotId) {
        mapExerciseToSlot(exercise, slotId);
        selectEl.closest('.se-unmapped-row').style.opacity = '0.4';
    }
};

function updateSessionCount() {
    const count = document.querySelectorAll('#se-rotation-list .se-slot');
    const active = Array.from(count).filter(s => !s.querySelector('.se-rest-cb')?.checked).length;
    const el = document.getElementById('se-session-count');
    if (el) el.textContent = active;
}

window.seSave = function () {
    const split = getOrCreateSplit();

    split.name = document.getElementById('se-split-name')?.value || 'Custom';

    // Read rotation from DOM
    const slots = [];
    document.querySelectorAll('#se-rotation-list .se-slot').forEach(row => {
        const label = row.querySelector('.se-slot-label')?.value || '';
        const isRest = row.querySelector('.se-rest-cb')?.checked || false;
        const muscles = Array.from(row.querySelectorAll('.se-muscle.active')).map(el => el.dataset.muscle);
        slots.push({
            id: label.toLowerCase().replace(/\s+/g, '-') || `slot-${slots.length}`,
            label: label || `Session ${slots.length + 1}`,
            muscles,
            partner: null,
            isRest,
        });
    });

    if (slots.length > 0) split.rotation = slots;

    // Read partners
    split.partners = Array.from(document.querySelectorAll('#se-partner-chips .se-chip'))
        .map(el => el.textContent.replace('×', '').trim());

    // Clamp currentIndex
    if (split.currentIndex >= split.rotation.length) split.currentIndex = 0;

    saveSplit(split);
    closeSplitEditor();

    // Trigger re-render of gym sector if it's visible
    const gymView = document.getElementById('view-gym');
    if (gymView?.classList.contains('active')) {
        import('./dashboard.js').then(m => m.renderSectorView('gym'));
    }
};

export function closeSplitEditor() {
    const modal = document.getElementById('split-editor-modal');
    if (modal) modal.remove();
}

// Expose globally
window.openSplitEditor = openSplitEditor;
window.closeSplitEditor = closeSplitEditor;
