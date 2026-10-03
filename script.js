/* =========================================================
   CVora — CV Generator (Vanilla JavaScript)
   Semua data diproses di browser, tanpa backend.
   ========================================================= */

// ============================
// 1. STATE: Data CV disimpan di sini
// ============================
const state = {
    personal: {
        fullName: '',
        jobTitle: '',
        email: '',
        phone: '',
        location: '',
        website: '',
        about: '',
        photo: '' // base64 string
    },
    education: [],     // array of objects
    experience: [],    // array of objects
    skills: [],        // array of strings
    certificates: [],  // array of objects
    template: 'modern',
    accentColor: '#4f46e5'
};

// ============================
// 2. UTILITAS: Fungsi pembantu
// ============================

// Menampilkan notifikasi toast
function showToast(message, type = 'default') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = 'toast show ' + type;
    setTimeout(() => {
        toast.className = 'toast ' + type;
    }, 2500);
}

// Membuat ID unik sederhana
function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// Escape HTML untuk mencegah XSS saat menampilkan teks user
function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// Format rentang tahun/tanggal
function formatDate(start, end) {
    const s = start ? String(start).trim() : '';
    const e = end ? String(end).trim() : '';
    if (!s && !e) return '';
    if (s && e) return `${s} — ${e}`;
    if (s) return `${s} — Present`;
    return e;
}

// ============================
// 3. AUTO-SAVE: localStorage
// ============================
const STORAGE_KEY = 'cvora_data_v1';

function saveToStorage() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
        console.warn('Gagal menyimpan:', e);
    }
}

function loadFromStorage() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return;
        const data = JSON.parse(raw);
        // Gabungkan dengan state default (jaga-jaga jika struktur berubah)
        Object.assign(state.personal, data.personal || {});
        state.education = data.education || [];
        state.experience = data.experience || [];
        state.skills = data.skills || [];
        state.certificates = data.certificates || [];
        state.template = data.template || 'modern';
        state.accentColor = data.accentColor || '#4f46e5';
    } catch (e) {
        console.warn('Gagal memuat data:', e);
    }
}

// Debounce untuk auto-save agar tidak menulis terlalu sering
let saveTimer;
function debouncedSave() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
        saveToStorage();
    }, 400);
}

// ============================
// 4. RENDER: Update tampilan preview CV
// ============================
function renderCV() {
    const paper = document.getElementById('cvPaper');
    const badge = document.getElementById('templateBadge');
    badge.textContent = state.template.charAt(0).toUpperCase() + state.template.slice(1);

    // Terapkan warna aksen ke CSS variable
    document.documentElement.style.setProperty('--accent', state.accentColor);

    let html = '';
    if (state.template === 'modern') html = renderModern();
    else if (state.template === 'professional') html = renderProfessional();
    else if (state.template === 'minimal') html = renderMinimal();

    paper.innerHTML = html;
    paper.className = 'cv-paper cv-' + state.template;
}

// ---------- Template: MODERN ----------
function renderModern() {
    const p = state.personal;
    const photoHtml = p.photo
        ? `<img src="${p.photo}" alt="photo">`
        : `<div class="cv-photo-placeholder">${(p.fullName || '?').charAt(0).toUpperCase()}</div>`;

    const contactItems = [
        p.email && `<div class="cv-contact-item">✉ ${escapeHtml(p.email)}</div>`,
        p.phone && `<div class="cv-contact-item">☎ ${escapeHtml(p.phone)}</div>`,
        p.location && `<div class="cv-contact-item">⌂ ${escapeHtml(p.location)}</div>`,
        p.website && `<div class="cv-contact-item">🔗 ${escapeHtml(p.website)}</div>`
    ].filter(Boolean).join('');

    const skillsHtml = state.skills.length
        ? `<div class="cv-skills-list">${state.skills.map(s => `<span class="cv-skill-tag">${escapeHtml(s)}</span>`).join('')}</div>`
        : '';

    const aboutHtml = p.about
        ? `<div class="cv-section"><div class="cv-section-title">Profile</div><div class="cv-about">${escapeHtml(p.about)}</div></div>`
        : '';

    const educationHtml = state.education.length
        ? `<div class="cv-section"><div class="cv-section-title">Education</div>${state.education.map(e => `
            <div class="cv-item">
                <div class="cv-item-header">
                    <div class="cv-item-title">${escapeHtml(e.institution) || 'Institution'}</div>
                    <div class="cv-item-date">${formatDate(e.startYear, e.endYear)}</div>
                </div>
                <div class="cv-item-subtitle">${escapeHtml(e.degree) || ''}</div>
                ${e.description ? `<div class="cv-item-desc">${escapeHtml(e.description)}</div>` : ''}
            </div>`).join('')}</div>`
        : '';

    const experienceHtml = state.experience.length
        ? `<div class="cv-section"><div class="cv-section-title">Experience</div>${state.experience.map(e => `
            <div class="cv-item">
                <div class="cv-item-header">
                    <div class="cv-item-title">${escapeHtml(e.company) || 'Company'}</div>
                    <div class="cv-item-date">${formatDate(e.startDate, e.endDate)}</div>
                </div>
                <div class="cv-item-subtitle">${escapeHtml(e.position) || ''}</div>
                ${e.description ? `<div class="cv-item-desc">${escapeHtml(e.description)}</div>` : ''}
            </div>`).join('')}</div>`
        : '';

    const certHtml = state.certificates.length
        ? `<div class="cv-section"><div class="cv-section-title">Certificates</div>${state.certificates.map(c => `
            <div class="cv-item">
                <div class="cv-item-title">${escapeHtml(c.name) || 'Certificate'}</div>
                <div class="cv-item-subtitle">${escapeHtml(c.issuer) || ''} ${c.year ? '• ' + escapeHtml(c.year) : ''}</div>
            </div>`).join('')}</div>`
        : '';

    return `
        <div class="cv-sidebar">
            <div class="cv-photo">${photoHtml}</div>
            <div class="cv-name">${escapeHtml(p.fullName) || 'Your Name'}</div>
            <div class="cv-title">${escapeHtml(p.jobTitle) || 'Professional Title'}</div>
            ${contactItems ? `<div class="cv-sidebar-section"><div class="cv-sidebar-title">Contact</div>${contactItems}</div>` : ''}
            ${skillsHtml ? `<div class="cv-sidebar-section"><div class="cv-sidebar-title">Skills</div>${skillsHtml}</div>` : ''}
        </div>
        <div class="cv-main">
            ${aboutHtml}
            ${educationHtml}
            ${experienceHtml}
            ${certHtml}
        </div>
    `;
}

// ---------- Template: PROFESSIONAL ----------
function renderProfessional() {
    const p = state.personal;
    const photoHtml = p.photo
        ? `<img src="${p.photo}" alt="photo">`
        : `<div class="cv-photo-placeholder">${(p.fullName || '?').charAt(0).toUpperCase()}</div>`;

    const contactItems = [
        p.email && `<span class="cv-contact-item">✉ ${escapeHtml(p.email)}</span>`,
        p.phone && `<span class="cv-contact-item">☎ ${escapeHtml(p.phone)}</span>`,
        p.location && `<span class="cv-contact-item">⌂ ${escapeHtml(p.location)}</span>`,
        p.website && `<span class="cv-contact-item">🔗 ${escapeHtml(p.website)}</span>`
    ].filter(Boolean).join('');

    const aboutHtml = p.about
        ? `<div class="cv-section"><div class="cv-section-title">Profile</div><div class="cv-about">${escapeHtml(p.about)}</div></div>`
        : '';

    const educationHtml = state.education.length
        ? state.education.map(e => `
            <div class="cv-item">
                <div class="cv-item-title">${escapeHtml(e.institution) || 'Institution'}</div>
                <div class="cv-item-subtitle">${escapeHtml(e.degree) || ''}</div>
                <div class="cv-item-date">${formatDate(e.startYear, e.endYear)}</div>
                ${e.description ? `<div class="cv-item-desc">${escapeHtml(e.description)}</div>` : ''}
            </div>`).join('')
        : '<div class="empty-state">No education added yet.</div>';

    const experienceHtml = state.experience.length
        ? state.experience.map(e => `
            <div class="cv-item">
                <div class="cv-item-title">${escapeHtml(e.company) || 'Company'}</div>
                <div class="cv-item-subtitle">${escapeHtml(e.position) || ''}</div>
                <div class="cv-item-date">${formatDate(e.startDate, e.endDate)}</div>
                ${e.description ? `<div class="cv-item-desc">${escapeHtml(e.description)}</div>` : ''}
            </div>`).join('')
        : '<div class="empty-state">No experience added yet.</div>';

    const skillsHtml = state.skills.length
        ? `<div class="cv-skills-list">${state.skills.map(s => `<span class="cv-skill-tag">${escapeHtml(s)}</span>`).join('')}</div>`
        : '<div class="empty-state">No skills added yet.</div>';

    const certHtml = state.certificates.length
        ? state.certificates.map(c => `
            <div class="cv-cert-item">
                <div>
                    <span class="cv-cert-name">${escapeHtml(c.name) || 'Certificate'}</span>
                    ${c.issuer ? ` — <span class="cv-cert-issuer">${escapeHtml(c.issuer)}</span>` : ''}
                </div>
                ${c.year ? `<span class="cv-cert-year">${escapeHtml(c.year)}</span>` : ''}
            </div>`).join('')
        : '<div class="empty-state">No certificates added yet.</div>';

    return `
        <div class="cv-header">
            <div class="cv-photo">${photoHtml}</div>
            <div class="cv-header-text">
                <div class="cv-name">${escapeHtml(p.fullName) || 'Your Name'}</div>
                <div class="cv-title">${escapeHtml(p.jobTitle) || 'Professional Title'}</div>
                <div class="cv-contact-row">${contactItems}</div>
            </div>
        </div>
        ${aboutHtml}
        <div class="cv-two-col">
            <div>
                <div class="cv-section"><div class="cv-section-title">Education</div>${educationHtml}</div>
                <div class="cv-section"><div class="cv-section-title">Experience</div>${experienceHtml}</div>
            </div>
            <div>
                <div class="cv-section"><div class="cv-section-title">Skills</div>${skillsHtml}</div>
                <div class="cv-section"><div class="cv-section-title">Certificates</div>${certHtml}</div>
            </div>
        </div>
    `;
}

// ---------- Template: MINIMAL ----------
function renderMinimal() {
    const p = state.personal;
    const photoHtml = p.photo
        ? `<img src="${p.photo}" alt="photo">`
        : `<div class="cv-photo-placeholder">${(p.fullName || '?').charAt(0).toUpperCase()}</div>`;

    const contactItems = [
        p.email && `<span>${escapeHtml(p.email)}</span>`,
        p.phone && `<span>${escapeHtml(p.phone)}</span>`,
        p.location && `<span>${escapeHtml(p.location)}</span>`,
        p.website && `<span>${escapeHtml(p.website)}</span>`
    ].filter(Boolean).join('');

    const aboutHtml = p.about
        ? `<div class="cv-section"><div class="cv-section-title">About</div><div class="cv-about">${escapeHtml(p.about)}</div></div>`
        : '';

    const educationHtml = state.education.length
        ? state.education.map(e => `
            <div class="cv-item">
                <div class="cv-item-title">${escapeHtml(e.institution) || 'Institution'}</div>
                <div class="cv-item-subtitle">${escapeHtml(e.degree) || ''}</div>
                <div class="cv-item-date">${formatDate(e.startYear, e.endYear)}</div>
                ${e.description ? `<div class="cv-item-desc">${escapeHtml(e.description)}</div>` : ''}
            </div>`).join('')
        : '';

    const experienceHtml = state.experience.length
        ? state.experience.map(e => `
            <div class="cv-item">
                <div class="cv-item-title">${escapeHtml(e.company) || 'Company'}</div>
                <div class="cv-item-subtitle">${escapeHtml(e.position) || ''}</div>
                <div class="cv-item-date">${formatDate(e.startDate, e.endDate)}</div>
                ${e.description ? `<div class="cv-item-desc">${escapeHtml(e.description)}</div>` : ''}
            </div>`).join('')
        : '';

    const skillsHtml = state.skills.length
        ? `<div class="cv-skills-list">${state.skills.map(s => `<span class="cv-skill-tag">${escapeHtml(s)}</span>`).join('')}</div>`
        : '';

    const certHtml = state.certificates.length
        ? state.certificates.map(c => `
            <div class="cv-cert-item">
                <div>
                    <span class="cv-cert-name">${escapeHtml(c.name) || 'Certificate'}</span>
                    ${c.issuer ? ` — <span class="cv-cert-issuer">${escapeHtml(c.issuer)}</span>` : ''}
                </div>
                ${c.year ? `<span class="cv-cert-year">${escapeHtml(c.year)}</span>` : ''}
            </div>`).join('')
        : '';

    return `
        <div class="cv-header">
            <div class="cv-photo">${photoHtml}</div>
            <div class="cv-name">${escapeHtml(p.fullName) || 'Your Name'}</div>
            <div class="cv-title">${escapeHtml(p.jobTitle) || 'Professional Title'}</div>
            <div class="cv-contact-row">${contactItems}</div>
        </div>
        ${aboutHtml}
        ${educationHtml ? `<div class="cv-section"><div class="cv-section-title">Education</div>${educationHtml}</div>` : ''}
        ${experienceHtml ? `<div class="cv-section"><div class="cv-section-title">Experience</div>${experienceHtml}</div>` : ''}
        ${skillsHtml ? `<div class="cv-section"><div class="cv-section-title">Skills</div>${skillsHtml}</div>` : ''}
        ${certHtml ? `<div class="cv-section"><div class="cv-section-title">Certificates</div>${certHtml}</div>` : ''}
    `;
}

// ============================
// 5. FORM RENDER: Tampilkan form list (education, experience, certificates)
// ============================
function renderEducationList() {
    const container = document.getElementById('educationList');
    if (state.education.length === 0) {
        container.innerHTML = '<div class="empty-state">No education added yet.</div>';
        return;
    }
    container.innerHTML = state.education.map((e, i) => `
        <div class="list-item" data-id="${e.id}">
            <div class="list-item-header">
                <span class="list-item-title">Education #${i + 1}</span>
                <button class="remove-btn" data-remove="education" data-id="${e.id}" aria-label="Remove">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
            </div>
            <div class="form-grid">
                <div class="form-group">
                    <label>Institution</label>
                    <input type="text" data-field="institution" value="${escapeHtml(e.institution)}" placeholder="e.g. University of Indonesia">
                </div>
                <div class="form-group">
                    <label>Degree / Major</label>
                    <input type="text" data-field="degree" value="${escapeHtml(e.degree)}" placeholder="e.g. B.Sc. Computer Science">
                </div>
                <div class="form-group">
                    <label>Start Year</label>
                    <input type="text" data-field="startYear" value="${escapeHtml(e.startYear)}" placeholder="2020">
                </div>
                <div class="form-group">
                    <label>End Year</label>
                    <input type="text" data-field="endYear" value="${escapeHtml(e.endYear)}" placeholder="2024">
                </div>
                <div class="form-group full-width">
                    <label>Description</label>
                    <textarea data-field="description" rows="2" placeholder="Activities, achievements, etc.">${escapeHtml(e.description)}</textarea>
                </div>
            </div>
        </div>
    `).join('');
}

function renderExperienceList() {
    const container = document.getElementById('experienceList');
    if (state.experience.length === 0) {
        container.innerHTML = '<div class="empty-state">No experience added yet.</div>';
        return;
    }
    container.innerHTML = state.experience.map((e, i) => `
        <div class="list-item" data-id="${e.id}">
            <div class="list-item-header">
                <span class="list-item-title">Experience #${i + 1}</span>
                <button class="remove-btn" data-remove="experience" data-id="${e.id}" aria-label="Remove">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
            </div>
            <div class="form-grid">
                <div class="form-group">
                    <label>Company</label>
                    <input type="text" data-field="company" value="${escapeHtml(e.company)}" placeholder="e.g. Tokopedia">
                </div>
                <div class="form-group">
                    <label>Position</label>
                    <input type="text" data-field="position" value="${escapeHtml(e.position)}" placeholder="e.g. Frontend Developer">
                </div>
                <div class="form-group">
                    <label>Start Date</label>
                    <input type="text" data-field="startDate" value="${escapeHtml(e.startDate)}" placeholder="Jan 2024">
                </div>
                <div class="form-group">
                    <label>End Date</label>
                    <input type="text" data-field="endDate" value="${escapeHtml(e.endDate)}" placeholder="Present">
                </div>
                <div class="form-group full-width">
                    <label>Description</label>
                    <textarea data-field="description" rows="2" placeholder="What did you do there?">${escapeHtml(e.description)}</textarea>
                </div>
            </div>
        </div>
    `).join('');
}

function renderCertificateList() {
    const container = document.getElementById('certificateList');
    if (state.certificates.length === 0) {
        container.innerHTML = '<div class="empty-state">No certificates added yet.</div>';
        return;
    }
    container.innerHTML = state.certificates.map((c, i) => `
        <div class="list-item" data-id="${c.id}">
            <div class="list-item-header">
                <span class="list-item-title">Certificate #${i + 1}</span>
                <button class="remove-btn" data-remove="certificate" data-id="${c.id}" aria-label="Remove">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
            </div>
            <div class="form-grid">
                <div class="form-group">
                    <label>Certificate Name</label>
                    <input type="text" data-field="name" value="${escapeHtml(c.name)}" placeholder="e.g. AWS Certified">
                </div>
                <div class="form-group">
                    <label>Issuer</label>
                    <input type="text" data-field="issuer" value="${escapeHtml(c.issuer)}" placeholder="e.g. Amazon">
                </div>
                <div class="form-group">
                    <label>Year</label>
                    <input type="text" data-field="year" value="${escapeHtml(c.year)}" placeholder="2025">
                </div>
            </div>
        </div>
    `).join('');
}

function renderSkillsList() {
    const container = document.getElementById('skillsList');
    if (state.skills.length === 0) {
        container.innerHTML = '<div class="empty-state">No skills added yet.</div>';
        return;
    }
    container.innerHTML = state.skills.map((s, i) => `
        <span class="skill-tag">
            ${escapeHtml(s)}
            <button data-remove-skill="${i}" aria-label="Remove">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
        </span>
    `).join('');
}

// Render semua form sekaligus
function renderAllForms() {
    // Personal info
    document.getElementById('fullName').value = state.personal.fullName;
    document.getElementById('jobTitle').value = state.personal.jobTitle;
    document.getElementById('email').value = state.personal.email;
    document.getElementById('phone').value = state.personal.phone;
    document.getElementById('location').value = state.personal.location;
    document.getElementById('website').value = state.personal.website;
    document.getElementById('about').value = state.personal.about;

    // Foto
    const photoPreview = document.getElementById('photoPreview');
    if (state.personal.photo) {
        photoPreview.innerHTML = `<img src="${state.personal.photo}" alt="photo">`;
        photoPreview.classList.add('has-photo');
    } else {
        photoPreview.innerHTML = `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`;
        photoPreview.classList.remove('has-photo');
    }

    // Lists
    renderEducationList();
    renderExperienceList();
    renderCertificateList();
    renderSkillsList();

    // Template active state
    document.querySelectorAll('.template-card').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.template === state.template);
    });

    // Color dot active state
    document.querySelectorAll('.color-dot').forEach(dot => {
        dot.classList.toggle('active', dot.dataset.color === state.accentColor);
    });
}

// ============================
// 6. EVENT HANDLERS
// ============================

// Personal info: update state saat user mengetik
function bindPersonalInputs() {
    const fields = ['fullName', 'jobTitle', 'email', 'phone', 'location', 'website', 'about'];
    fields.forEach(field => {
        const el = document.getElementById(field);
        el.addEventListener('input', () => {
            state.personal[field] = el.value;
            renderCV();
            debouncedSave();
        });
    });
}

// Upload foto
function bindPhotoUpload() {
    const input = document.getElementById('photoInput');
    const preview = document.getElementById('photoPreview');
    const removeBtn = document.getElementById('removePhoto');

    input.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validasi tipe file
        if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
            showToast('Please upload JPG or PNG only.', 'danger');
            return;
        }

        // Validasi ukuran (maks 3MB)
        if (file.size > 3 * 1024 * 1024) {
            showToast('Photo is too large (max 3MB).', 'danger');
            return;
        }

        // Gunakan FileReader untuk membaca file sebagai base64
        const reader = new FileReader();
        reader.onload = (ev) => {
            state.personal.photo = ev.target.result;
            preview.innerHTML = `<img src="${ev.target.result}" alt="photo">`;
            preview.classList.add('has-photo');
            renderCV();
            debouncedSave();
            showToast('Photo uploaded successfully!', 'success');
        };
        reader.readAsDataURL(file);
    });

    removeBtn.addEventListener('click', () => {
        state.personal.photo = '';
        preview.innerHTML = `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`;
        preview.classList.remove('has-photo');
        input.value = '';
        renderCV();
        debouncedSave();
        showToast('Photo removed.');
    });
}

// Delegasi event untuk list items (education, experience, certificate)
function bindListEvents() {
    document.addEventListener('input', (e) => {
        const item = e.target.closest('.list-item');
        if (!item) return;
        const id = item.dataset.id;
        const field = e.target.dataset.field;
        if (!id || !field) return;

        // Cari item di state berdasarkan id
        let target = null;
        if (item.closest('#educationList')) target = state.education.find(x => x.id === id);
        else if (item.closest('#experienceList')) target = state.experience.find(x => x.id === id);
        else if (item.closest('#certificateList')) target = state.certificates.find(x => x.id === id);

        if (target) {
            target[field] = e.target.value;
            renderCV();
            debouncedSave();
        }
    });

    // Hapus item
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-remove]');
        if (!btn) return;
        const type = btn.dataset.remove;
        const id = btn.dataset.id;
        if (type === 'education') state.education = state.education.filter(x => x.id !== id);
        else if (type === 'experience') state.experience = state.experience.filter(x => x.id !== id);
        else if (type === 'certificate') state.certificates = state.certificates.filter(x => x.id !== id);

        renderEducationList();
        renderExperienceList();
        renderCertificateList();
        renderCV();
        debouncedSave();
        showToast('Item removed.');
    });
}

// Tombol Add Education / Experience / Certificate
function bindAddButtons() {
    document.querySelectorAll('[data-add]').forEach(btn => {
        btn.addEventListener('click', () => {
            const type = btn.dataset.add;
            if (type === 'education') {
                state.education.push({ id: uid(), institution: '', degree: '', startYear: '', endYear: '', description: '' });
                renderEducationList();
            } else if (type === 'experience') {
                state.experience.push({ id: uid(), company: '', position: '', startDate: '', endDate: '', description: '' });
                renderExperienceList();
            } else if (type === 'certificate') {
                state.certificates.push({ id: uid(), name: '', issuer: '', year: '' });
                renderCertificateList();
            }
            debouncedSave();
            showToast('New item added!');
        });
    });
}

// Skills
function bindSkills() {
    const input = document.getElementById('skillInput');
    const addBtn = document.getElementById('addSkillBtn');

    function addSkill() {
        const val = input.value.trim();
        if (!val) return;
        if (state.skills.includes(val)) {
            showToast('Skill already exists.', 'danger');
            return;
        }
        state.skills.push(val);
        input.value = '';
        renderSkillsList();
        renderCV();
        debouncedSave();
    }

    addBtn.addEventListener('click', addSkill);
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addSkill();
        }
    });

    // Delegasi untuk tombol hapus skill
    document.getElementById('skillsList').addEventListener('click', (e) => {
        const btn = e.target.closest('[data-remove-skill]');
        if (!btn) return;
        const idx = parseInt(btn.dataset.removeSkill);
        state.skills.splice(idx, 1);
        renderSkillsList();
        renderCV();
        debouncedSave();
    });
}

// Templates
function bindTemplates() {
    document.querySelectorAll('.template-card').forEach(btn => {
        btn.addEventListener('click', () => {
            state.template = btn.dataset.template;
            document.querySelectorAll('.template-card').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderCV();
            debouncedSave();
            showToast(`Template changed to "${state.template}".`);
        });
    });
}

// Accent color
function bindColors() {
    document.querySelectorAll('.color-dot').forEach(dot => {
        dot.addEventListener('click', () => {
            state.accentColor = dot.dataset.color;
            document.querySelectorAll('.color-dot').forEach(d => d.classList.remove('active'));
            dot.classList.add('active');
            renderCV();
            debouncedSave();
        });
    });
}

// Clear all
function clearAllData() {
    if (!confirm('Are you sure you want to clear all data? This cannot be undone.')) return;

    state.personal = { fullName: '', jobTitle: '', email: '', phone: '', location: '', website: '', about: '', photo: '' };
    state.education = [];
    state.experience = [];
    state.skills = [];
    state.certificates = [];

    renderAllForms();
    renderCV();
    saveToStorage();
    showToast('All data cleared.', 'danger');
}

// ============================
// Download CV sebagai PDF (versi robust untuk HP)
// ============================
function downloadCV() {
    const paper = document.getElementById('cvPaper');
    
    // Cek library
    if (typeof html2pdf === 'undefined') {
        showToast('Library PDF belum siap. Refresh halaman.', 'danger');
        return;
    }

    showToast('📄 Membuat PDF... tunggu sebentar', 'default');

    // Nama file
    const rawName = state.personal.fullName || 'MyCV';
    const safeName = rawName.trim()
        .replace(/[^a-zA-Z0-9\s]/g, '')
        .replace(/\s+/g, '_')
        .substring(0, 30);
    const fileName = `${safeName}_CV.pdf`;

    // CLONE elemen CV ke container tersembunyi (tanpa scale/transform)
    const clone = paper.cloneNode(true);
    clone.style.cssText = `
        position: fixed;
        left: -9999px;
        top: 0;
        width: 794px;
        min-height: 1123px;
        background: white;
        transform: none !important;
        box-shadow: none !important;
        border-radius: 0 !important;
        margin: 0 !important;
        padding: 0 !important;
        z-index: -1;
    `;
    document.body.appendChild(clone);

    const opt = {
        margin: 0,
        filename: fileName,
        image: { type: 'jpeg', quality: 0.95 },
        html2canvas: {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff',
            logging: false,
            windowWidth: 794,
            windowHeight: 1123
        },
        jsPDF: {
            unit: 'mm',
            format: 'a4',
            orientation: 'portrait'
        }
    };

    // Tambahkan timeout untuk deteksi kalau stuck
    const timeout = setTimeout(() => {
        document.body.removeChild(clone);
        showToast('⚠️ Proses terlalu lama. Coba lagi.', 'danger');
    }, 30000); // 30 detik timeout

    html2pdf().set(opt)
        .from(clone)
        .save()
        .then(() => {
            clearTimeout(timeout);
            document.body.removeChild(clone);
            showToast('✅ PDF tersimpan di Downloads!', 'success');
        })
        .catch((err) => {
            clearTimeout(timeout);
            document.body.removeChild(clone);
            console.error('PDF Error:', err);
            showToast('❌ Gagal buat PDF. Coba pakai Print.', 'danger');
        });
}
// Sidebar navigation (smooth scroll ke section)
function bindSidebar() {
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const section = btn.dataset.section;
            document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            if (section === 'new') {
                clearAllData();
                return;
            }

            const target = document.getElementById('section-' + section);
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }

            // Tutup sidebar di mobile
            if (window.innerWidth <= 768) {
                document.getElementById('sidebar').classList.remove('open');
            }
        });
    });

    // Mobile menu
    document.getElementById('openSidebar').addEventListener('click', () => {
        document.getElementById('sidebar').classList.add('open');
    });
    document.getElementById('closeSidebar').addEventListener('click', () => {
        document.getElementById('sidebar').classList.remove('open');
    });
}

// ============================
// 7. INISIALISASI
// ============================
function init() {
    // Muat data dari localStorage (jika ada)
    loadFromStorage();

    // Render semua form dan preview
    renderAllForms();
    renderCV();

    // Pasang semua event listener
    bindPersonalInputs();
    bindPhotoUpload();
    bindListEvents();
    bindAddButtons();
    bindSkills();
    bindTemplates();
    bindColors();
    bindSidebar();

    document.getElementById('clearBtn').addEventListener('click', clearAllData);
    document.getElementById('clearBtn2').addEventListener('click', clearAllData);
    document.getElementById('downloadBtn').addEventListener('click', downloadCV);

    // Tambah item awal jika kosong (biar user langsung bisa mulai)
    if (state.education.length === 0 && state.experience.length === 0 && state.certificates.length === 0 && state.skills.length === 0 && !state.personal.fullName) {
        // Kosong, biarkan default
    }
}

// Jalankan saat DOM siap
document.addEventListener('DOMContentLoaded', init);
