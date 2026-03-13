// ===== State =====
let employeesData = [];

// ===== DOM Elements =====
const tableBody = document.getElementById('tableBody');
const tableEmpty = document.getElementById('tableEmpty');
const tableCount = document.getElementById('tableCount');
const searchInput = document.getElementById('searchName');
const filterDept = document.getElementById('filterDept');
const filterPos = document.getElementById('filterPos');
const filterStatus = document.getElementById('filterStatus');
const addBtn = document.getElementById('addBtn');
const form = document.getElementById('employeeForm');
const viewEditBtn = document.getElementById('viewEditBtn');

// Stats elements
const totalEmployeesEl = document.getElementById('totalEmployees');
const activeEmployeesEl = document.getElementById('activeEmployees');
const firedEmployeesEl = document.getElementById('firedEmployees');
const totalSalaryEl = document.getElementById('totalSalary');

// ===== Initialize =====
document.addEventListener('DOMContentLoaded', () => {
    loadEmployees();
    setupInputMasks();
});

// ===== API Functions =====
async function loadEmployees() {
    try {
        const params = new URLSearchParams({
            department: filterDept.value,
            position: filterPos.value,
            search: searchInput.value,
            status: filterStatus.value
        });

        const res = await fetch(`/api/employees?${params}`);
        if (!res.ok) throw new Error('Ошибка загрузки');

        employeesData = await res.json();
        renderTable(employeesData);
        updateStats(employeesData);
    } catch (err) {
        console.error(err);
        showToast('Ошибка загрузки данных', 'error');
    }
}

async function saveEmployee(data, id = null) {
    try {
        const url = id ? `/api/employees/${id}` : '/api/employees';
        const method = id ? 'PUT' : 'POST';

        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || 'Ошибка сохранения');
        }

        return true;
    } catch (err) {
        console.error(err);
        showToast(err.message, 'error');
        return false;
    }
}

async function fireEmployee(id) {
    if (!confirm('Вы уверены, что хотите уволить сотрудника?')) return;

    try {
        const res = await fetch(`/api/employees/${id}/fire`, { method: 'PATCH' });
        if (!res.ok) throw new Error('Ошибка увольнения');

        showToast('Сотрудник уволен');
        loadEmployees();
    } catch (err) {
        console.error(err);
        showToast(err.message, 'error');
    }
}

// ===== Render Functions =====
function renderTable(data) {
    tableBody.innerHTML = '';

    if (data.length === 0) {
        tableEmpty.classList.add('show');
        tableCount.textContent = '0 записей';
        return;
    }

    tableEmpty.classList.remove('show');
    tableCount.textContent = `${data.length} записей`;

    data.forEach(emp => {
        const row = document.createElement('tr');
        const isFired = emp.is_fired || emp.isFired;
        const statusBadge = isFired
            ? '<span class="badge badge-fired">Уволен</span>'
            : '<span class="badge badge-active">Активен</span>';

        const hireDate = formatDate(emp.hire_date || emp.hireDate);
        const salary = formatSalary(emp.salary);

        let actions = `
            <div class="action-buttons">
                <button class="action-btn action-btn-view" onclick="viewEmployee(${emp.id})">👁 Просмотр</button>
                <button class="action-btn action-btn-edit" onclick="openEditModal(${emp.id})">✏️ Ред.</button>
        `;

        if (!isFired) {
            actions += `<button class="action-btn action-btn-fire" onclick="fireEmployee(${emp.id})">🚫 Уволить</button>`;
        } else {
            actions += `<button class="action-btn" disabled style="background:#e5e7eb;color:#9ca3af">🚫 Уволен</button>`;
        }

        actions += '</div>';

        row.innerHTML = `
            <td><strong>${emp.full_name || emp.fullName}</strong></td>
            <td>${emp.department}</td>
            <td>${emp.position}</td>
            <td>${salary}</td>
            <td>${hireDate}</td>
            <td>${statusBadge}</td>
            <td class="text-center">${actions}</td>
        `;

        tableBody.appendChild(row);
    });
}

function updateStats(data) {
    const total = data.length;
    const active = data.filter(e => !(e.is_fired || e.isFired)).length;
    const fired = total - active;
    const totalSalary = data
        .filter(e => !(e.is_fired || e.isFired))
        .reduce((sum, e) => sum + (e.salary || 0), 0);

    totalEmployeesEl.textContent = total;
    activeEmployeesEl.textContent = active;
    firedEmployeesEl.textContent = fired;
    totalSalaryEl.textContent = formatSalary(totalSalary);
}

function viewEmployee(id) {
    const emp = employeesData.find(e => e.id === id);
    if (!emp) return;

    const isFired = emp.is_fired || emp.isFired;
    const fullName = emp.full_name || emp.fullName;

    // Avatar initials
    const initials = fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

    document.getElementById('viewAvatar').textContent = initials;
    document.getElementById('viewFullName').textContent = fullName;

    const statusEl = document.getElementById('viewStatus');
    statusEl.textContent = isFired ? 'Уволен' : 'Активен';
    statusEl.className = 'profile-status ' + (isFired ? 'fired' : 'active');

    document.getElementById('viewBirthDate').textContent = formatDate(emp.birth_date || emp.birthDate);
    document.getElementById('viewPassport').textContent = emp.passport;
    document.getElementById('viewContact').textContent = emp.contact;
    document.getElementById('viewAddress').textContent = emp.address;
    document.getElementById('viewDepartment').textContent = emp.department;
    document.getElementById('viewPosition').textContent = emp.position;
    document.getElementById('viewSalary').textContent = formatSalary(emp.salary);
    document.getElementById('viewHireDate').textContent = formatDate(emp.hire_date || emp.hireDate);

    // Edit button state
    viewEditBtn.disabled = isFired;
    viewEditBtn.onclick = () => {
        if (!isFired) {
            closeModal('viewModal');
            openEditModal(id);
        }
    };

    openModal('viewModal');
}

// ===== Modal Functions =====
function openModal(modalId) {
    document.getElementById(modalId).classList.add('show');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('show');
}

function openEditModal(id) {
    const emp = employeesData.find(e => e.id === id);
    if (!emp) return;

    document.getElementById('empId').value = emp.id;
    document.getElementById('fullName').value = emp.full_name || emp.fullName;
    document.getElementById('birthDate').value = emp.birth_date || emp.birthDate;
    document.getElementById('passport').value = emp.passport;
    document.getElementById('contact').value = emp.contact;
    document.getElementById('address').value = emp.address;
    document.getElementById('department').value = emp.department;
    document.getElementById('position').value = emp.position;
    document.getElementById('salary').value = emp.salary;
    document.getElementById('hireDate').value = emp.hire_date || emp.hireDate;

    document.getElementById('modalTitle').textContent = '✏️ Редактирование сотрудника';
    openModal('formModal');
}

addBtn.addEventListener('click', () => {
    form.reset();
    document.getElementById('empId').value = '';
    document.getElementById('modalTitle').textContent = '➕ Новый сотрудник';
    openModal('formModal');
});

// Close modal on backdrop click
document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
    backdrop.addEventListener('click', (e) => {
        closeModal(e.target.closest('.modal').id);
    });
});

// ===== Form Submit =====
form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const id = document.getElementById('empId').value;
    const formData = {
        full_name: document.getElementById('fullName').value,
        birth_date: document.getElementById('birthDate').value,
        passport: document.getElementById('passport').value,
        contact: document.getElementById('contact').value,
        address: document.getElementById('address').value,
        department: document.getElementById('department').value,
        position: document.getElementById('position').value,
        salary: Number(document.getElementById('salary').value),
        hire_date: document.getElementById('hireDate').value
    };

    const success = await saveEmployee(formData, id || null);
    if (success) {
        closeModal('formModal');
        showToast(id ? 'Данные обновлены' : 'Сотрудник добавлен');
        loadEmployees();
    }
});

// ===== Filters =====
[searchInput, filterDept, filterPos, filterStatus].forEach(el => {
    el.addEventListener('input', loadEmployees);
    el.addEventListener('change', loadEmployees);
});

// ===== Input Masks =====
function setupInputMasks() {
    // Phone mask
    const phoneInput = document.getElementById('contact');
    phoneInput.addEventListener('input', function(e) {
        let x = e.target.value.replace(/\D/g, '').match(/(\d{0,1})(\d{0,3})(\d{0,3})(\d{0,2})(\d{0,2})/);
        if (!x[2]) { e.target.value = x[1] ? '+7' : ''; return; }
        e.target.value = !x[3] ? `+7 (${x[2]}` : `+7 (${x[2]}) ${x[3]}` + (x[4] ? `-${x[4]}` : '') + (x[5] ? `-${x[5]}` : '');
    });

    // Passport mask
    const passportInput = document.getElementById('passport');
    passportInput.addEventListener('input', function(e) {
        let val = e.target.value.replace(/\D/g, '');
        if (val.length > 4) {
            val = val.slice(0, 4) + ' ' + val.slice(4, 10);
        }
        e.target.value = val;
    });
}

// ===== Utilities =====
function formatDate(dateStr) {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatSalary(amount) {
    return new Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency: 'RUB',
        minimumFractionDigits: 0
    }).format(amount);
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    const toastIcon = toast.querySelector('.toast-icon');

    toastMessage.textContent = message;
    toastIcon.textContent = type === 'error' ? '✕' : '✓';
    toast.style.background = type === 'error' ? '#ef4444' : '#111827';

    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

// Make functions global for onclick handlers
window.viewEmployee = viewEmployee;
window.openEditModal = openEditModal;
window.fireEmployee = fireEmployee;
window.closeModal = closeModal;