/**
 * E-Penilaian SMP Terpadu - Main Client Application Logic
 */

const App = (() => {
  // Application state
  let state = {
    user: null,
    db_driver: 'In-Memory Store',
    settings: {},
    kelas: [],
    mapel: [],
    guru: [],
    murid: [],
    konfigurasi_sumatif: [],
    nilai_sumatif: [],
    nilai_kelas9: [],
    metaSkl: {},
    metaTranskrip: {}
  };

  let currentMenu = 'dashboard';
  let currentMasterTab = 'guru';
  let currentSumatifTab = 'input';
  let currentKelas9Tab = 'input';

  let chartMapelInstance = null;
  let chartGuruInstance = null;
  let chartKelasInstance = null;

  // Helper: API Caller
  async function api(action, data = null) {
    try {
      let url = `/api.php?action=${encodeURIComponent(action)}`;
      let options = {
        headers: { 'Content-Type': 'application/json' }
      };

      if (data) {
        options.method = 'POST';
        options.body = JSON.stringify(data);
      } else {
        options.method = 'GET';
      }

      const res = await fetch(url, options);
      const json = await res.json();
      return json;
    } catch (err) {
      console.error(`API Error on ${action}:`, err);
      showToast(`Gagal menghubungi server (${action}): ${err.message}`, 'error');
      return { success: false, message: err.message };
    }
  }

  // Toast notification
  function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    const bgClass =
      type === 'error'
        ? 'bg-red-600 text-white'
        : type === 'warning'
        ? 'bg-amber-600 text-white'
        : 'bg-emerald-600 text-white';
    const iconClass =
      type === 'error'
        ? 'fa-circle-xmark'
        : type === 'warning'
        ? 'fa-triangle-exclamation'
        : 'fa-circle-check';

    toast.className = `flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-xl text-xs font-bold transition-all transform translate-y-2 opacity-0 ${bgClass}`;
    toast.innerHTML = `<i class="fa-solid ${iconClass} text-sm"></i> <span>${message}</span>`;
    container.appendChild(toast);

    requestAnimationFrame(() => {
      toast.classList.remove('translate-y-2', 'opacity-0');
    });

    setTimeout(() => {
      toast.classList.add('opacity-0', 'translate-y-2');
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  // Modal handler
  function openModal(title, htmlContent) {
    const overlay = document.getElementById('modalOverlay');
    const titleEl = document.getElementById('modalTitle');
    const bodyEl = document.getElementById('modalBody');
    if (!overlay || !bodyEl) return;

    titleEl.textContent = title;
    bodyEl.innerHTML = htmlContent;
    overlay.classList.remove('hidden');
    overlay.classList.add('flex');
  }

  function closeModal() {
    const overlay = document.getElementById('modalOverlay');
    if (overlay) {
      overlay.classList.add('hidden');
      overlay.classList.remove('flex');
    }
  }

  function togglePassword(inputId, eyeId) {
    const input = document.getElementById(inputId);
    const eye = document.getElementById(eyeId);
    if (!input) return;
    if (input.type === 'password') {
      input.type = 'text';
      if (eye) {
        eye.classList.remove('fa-eye');
        eye.classList.add('fa-eye-slash');
      }
    } else {
      input.type = 'password';
      if (eye) {
        eye.classList.remove('fa-eye-slash');
        eye.classList.add('fa-eye');
      }
    }
  }

  // Initial Load
  async function init() {
    // Bind global listeners
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
      loginForm.onsubmit = async (e) => {
        e.preventDefault();
        const username = document.getElementById('loginUsername').value.trim();
        const password = document.getElementById('loginPassword').value.trim();
        await handleLogin(username, password);
      };
    }

    await reloadAllData();

    // Check auth status
    if (!state.user) {
      showLoginScreen(true);
    } else {
      showLoginScreen(false);
      applyUserState();
      switchMenu('dashboard');
    }
  }

  async function reloadAllData() {
    const res = await api('get_all_data');
    if (res.success) {
      state.user = res.user;
      state.settings = res.settings || {};
      state.kelas = res.kelas || [];
      state.mapel = res.mapel || [];
      state.guru = res.guru || [];
      state.murid = res.murid || [];
      state.konfigurasi_sumatif = res.konfigurasi_sumatif || [];
      state.nilai_sumatif = res.nilai_sumatif || [];
      state.nilai_kelas9 = res.nilai_kelas9 || [];
      updateTopBarAndSettings();
    }
  }

  function showLoginScreen(show) {
    const login = document.getElementById('loginScreen');
    const shell = document.getElementById('appShell');
    if (show) {
      if (login) login.classList.remove('hidden');
      if (shell) shell.classList.add('hidden');
    } else {
      if (login) login.classList.add('hidden');
      if (shell) shell.classList.remove('hidden');
    }
  }

  function applyUserState() {
    if (!state.user) return;
    const nameEl = document.getElementById('sidebarUserName');
    const roleBadge = document.getElementById('sidebarUserRoleBadge');
    const avatarEl = document.getElementById('sidebarUserAvatar');

    if (nameEl) nameEl.textContent = state.user.nama || state.user.username;
    if (roleBadge) {
      roleBadge.textContent = state.user.role === 'admin' ? 'Admin Sekolah' : 'Guru Mapel';
    }
    if (avatarEl) {
      if (state.user.foto) {
        avatarEl.innerHTML = `<img src="${state.user.foto}" class="w-full h-full object-cover">`;
      } else {
        avatarEl.innerHTML = `<i class="fa-solid fa-user-tie"></i>`;
      }
    }
  }

  function updateTopBarAndSettings() {
    const s = state.settings;
    const schoolName = s.set_kop_baris2_sekolah || 'SMP NEGERI 1 NUSANTARA';
    const ta = s.set_tahun_ajaran || '2026/2027';
    const sem = s.set_semester || 'Ganjil';
    const hari = s.set_sistem_hari_sekolah || '5 Hari Kerja (Senin - Jumat)';

    const sidebarSchoolName = document.getElementById('sidebarSchoolName');
    if (sidebarSchoolName) sidebarSchoolName.textContent = schoolName;

    const sidebarTaSem = document.getElementById('sidebarTaSem');
    if (sidebarTaSem) sidebarTaSem.textContent = `TA ${ta} • ${sem}`;

    const topTaSemester = document.getElementById('topTaSemester');
    if (topTaSemester) topTaSemester.textContent = `TA ${ta} - Semester ${sem}`;

    const topHariSekolah = document.getElementById('topHariSekolah');
    if (topHariSekolah) topHariSekolah.textContent = hari.includes('5') ? '5 Hari Kerja' : '6 Hari Kerja';

    const loginSchoolName = document.getElementById('loginSchoolName');
    if (loginSchoolName) loginSchoolName.textContent = schoolName;

    const loginInfoTa = document.getElementById('loginInfoTa');
    if (loginInfoTa) loginInfoTa.textContent = `Sistem Informasi Penilaian Terpadu • TA ${ta}`;

    const loginFooterAddress = document.getElementById('loginFooterAddress');
    if (loginFooterAddress) {
      loginFooterAddress.innerHTML = `<i class="fa-solid fa-location-dot mr-1 text-blue-400"></i> ${s.set_alamat_jalan || 'Jl. Pendidikan No. 45'}, ${s.set_kabupaten || 'Kabupaten Nusantara'}`;
    }

    const loginFooterKepsek = document.getElementById('loginFooterKepsek');
    if (loginFooterKepsek) loginFooterKepsek.textContent = s.set_kepsek_nama || 'Dr. H. Hendra Wijaya, M.Pd.';

    const sidebarLogo = document.getElementById('sidebarLogoContainer');
    if (sidebarLogo && s.logo_sekolah) {
      sidebarLogo.innerHTML = `<img src="${s.logo_sekolah}" class="w-full h-full object-contain">`;
    }

    const loginLogoBox = document.getElementById('loginLogoBox');
    if (loginLogoBox && s.logo_sekolah) {
      loginLogoBox.innerHTML = `<img src="${s.logo_sekolah}" class="w-full h-full object-contain">`;
    }
  }

  // Auth Handling
  async function handleLogin(username, password) {
    const errorBox = document.getElementById('loginError');
    if (errorBox) errorBox.classList.add('hidden');

    const res = await api('login', { username, password });
    if (res.success) {
      state.user = res.user;
      showLoginScreen(false);
      applyUserState();
      await reloadAllData();
      switchMenu('dashboard');
      showToast(`Selamat datang, ${state.user.nama}!`, 'success');
    } else {
      if (errorBox) {
        errorBox.textContent = res.message || 'Login gagal, periksa username dan password.';
        errorBox.classList.remove('hidden');
      }
    }
  }

  async function logout() {
    await api('logout');
    state.user = null;
    showLoginScreen(true);
    showToast('Anda telah keluar dari aplikasi.', 'warning');
  }

  function openProfileModal() {
    if (!state.user) return;
    const isGuru = state.user.role === 'guru';
    const html = `
      <div class="space-y-4">
        <div class="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
          <div id="modalUserAvatarPreview" class="w-14 h-14 rounded-full bg-blue-100 border border-blue-300 flex items-center justify-center overflow-hidden shrink-0">
            ${state.user.foto ? `<img src="${state.user.foto}" class="w-full h-full object-cover">` : `<i class="fa-solid fa-user text-2xl text-blue-600"></i>`}
          </div>
          <div class="flex-1">
            <h4 class="font-extrabold text-sm text-slate-800">${state.user.nama}</h4>
            <p class="text-slate-500 text-[11px]">${state.user.role === 'admin' ? 'Administrator Sekolah' : 'NIP: ' + state.user.nip}</p>
            <div class="mt-1 flex items-center gap-2">
              <label class="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-bold cursor-pointer transition">
                <i class="fa-solid fa-upload mr-1"></i> Ganti Foto
                <input type="file" accept="image/*" class="hidden" onchange="App.handleProfileFotoUpload(event)">
              </label>
              <button type="button" onclick="App.deleteProfileFoto()" class="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-[10px] font-bold">
                Hapus Foto
              </button>
            </div>
          </div>
        </div>

        <form onsubmit="App.saveProfilePassword(event)" class="space-y-3 pt-2 border-t border-slate-100">
          <h4 class="font-extrabold text-xs uppercase tracking-wider text-slate-700">
            <i class="fa-solid fa-key text-blue-600 mr-1"></i> Ganti Password Akun
          </h4>
          <div>
            <label class="block font-bold text-slate-600 mb-1">Password Lama</label>
            <input type="password" id="modalOldPass" required class="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 bg-white">
          </div>
          <div>
            <label class="block font-bold text-slate-600 mb-1">Password Baru</label>
            <input type="password" id="modalNewPass" required class="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 bg-white">
          </div>
          <div>
            <label class="block font-bold text-slate-600 mb-1">Konfirmasi Password Baru</label>
            <input type="password" id="modalConfirmPass" required class="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 bg-white">
          </div>
          <div class="pt-2 flex justify-end gap-2">
            <button type="button" onclick="App.closeModal()" class="px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs">
              Batal
            </button>
            <button type="submit" class="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm">
              Simpan Password
            </button>
          </div>
        </form>
      </div>
    `;
    openModal('Pengaturan Profil & Password', html);
  }

  async function handleProfileFotoUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target.result;
      const res = await api('profile_update_foto', { foto: base64 });
      if (res.success) {
        state.user.foto = base64;
        applyUserState();
        const prev = document.getElementById('modalUserAvatarPreview');
        if (prev) prev.innerHTML = `<img src="${base64}" class="w-full h-full object-cover">`;
        showToast('Foto profil berhasil diperbarui!');
      }
    };
    reader.readAsDataURL(file);
  }

  async function deleteProfileFoto() {
    const res = await api('profile_update_foto', { foto: '' });
    if (res.success) {
      state.user.foto = '';
      applyUserState();
      const prev = document.getElementById('modalUserAvatarPreview');
      if (prev) prev.innerHTML = `<i class="fa-solid fa-user text-2xl text-blue-600"></i>`;
      showToast('Foto profil dihapus.');
    }
  }

  async function saveProfilePassword(e) {
    e.preventDefault();
    const old_password = document.getElementById('modalOldPass').value;
    const new_password = document.getElementById('modalNewPass').value;
    const confirm_password = document.getElementById('modalConfirmPass').value;

    const res = await api('profile_change_password', { old_password, new_password, confirm_password });
    if (res.success) {
      showToast(res.message);
      closeModal();
    } else {
      showToast(res.message || 'Gagal mengubah password.', 'error');
    }
  }

  // Menu navigation
  function switchMenu(menuId) {
    currentMenu = menuId;
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach((btn) => btn.classList.remove('active'));

    const activeBtn = document.getElementById(`nav-${menuId}`);
    if (activeBtn) activeBtn.classList.add('active');

    const sections = ['dashboard', 'manajemen', 'sumatif', 'kelas9', 'pengaturan'];
    sections.forEach((s) => {
      const el = document.getElementById(`view-${s}`);
      if (el) {
        if (s === menuId) el.classList.remove('hidden');
        else el.classList.add('hidden');
      }
    });

    const pageTitle = document.getElementById('pageTitle');
    const pageSubtitle = document.getElementById('pageSubtitle');

    switch (menuId) {
      case 'dashboard':
        if (pageTitle) pageTitle.textContent = '1. Dashboard Statistik & Analisis Nilai';
        if (pageSubtitle) pageSubtitle.textContent = 'Ringkasan data siswa per jenjang serta grafik progres & analisis nilai';
        renderDashboard();
        break;
      case 'manajemen':
        if (pageTitle) pageTitle.textContent = '2. Manajemen Data Induk Sekolah';
        if (pageSubtitle) pageSubtitle.textContent = 'Kelola data Guru (multi-ampuan), Murid, Kartu Rombel Kelas, dan Mata Pelajaran';
        switchMasterTab(currentMasterTab);
        break;
      case 'sumatif':
        if (pageTitle) pageTitle.textContent = '3. Nilai Sumatif & Legger Matriks Kelas';
        if (pageSubtitle) pageSubtitle.textContent = 'Input nilai sumatif dinamis, bobot STS/SAS, léger kelas, dan cetak laporan';
        switchSumatifTab(currentSumatifTab);
        break;
      case 'kelas9':
        if (pageTitle) pageTitle.textContent = '4. Analisis Kelulusan & Nilai Akhir Kelas IX';
        if (pageSubtitle) pageSubtitle.textContent = 'Pengolahan nilai 6 semester + Ujian Sekolah, cetak SKNR, SKL, dan Transkrip Nilai';
        switchKelas9Tab(currentKelas9Tab);
        break;
      case 'pengaturan':
        if (pageTitle) pageTitle.textContent = '5. Pengaturan Sekolah & Aplikasi';
        if (pageSubtitle) pageSubtitle.textContent = 'Identitas sekolah, logo kop surat, kepala sekolah, tahun ajaran & backup database';
        loadSettingsForm();
        updateKopPreview();
        break;
    }
  }

  // ==================== 1. DASHBOARD ====================
  function renderDashboard() {
    renderDashboardSummaryCards();
    renderDashboardJenjangCards();
    renderDashboardCharts();
  }

  function renderDashboardSummaryCards() {
    const el = document.getElementById('dashboardSummaryCards');
    if (!el) return;

    const totalMurid = state.murid.length;
    const totalGuru = state.guru.length;
    const totalKelas = state.kelas.length;
    const totalMapel = state.mapel.length;

    el.innerHTML = `
      <div class="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex items-center gap-3.5">
        <div class="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center text-xl shrink-0">
          <i class="fa-solid fa-user-graduate"></i>
        </div>
        <div>
          <span class="text-[10px] font-extrabold uppercase text-slate-500">Total Murid</span>
          <h3 class="text-xl font-extrabold text-slate-900">${totalMurid} <span class="text-xs font-semibold text-slate-400">Siswa</span></h3>
          <p class="text-[10px] text-blue-600 font-semibold mt-0.5">Terdaftar di ${totalKelas} Kelas</p>
        </div>
      </div>

      <div class="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex items-center gap-3.5">
        <div class="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center text-xl shrink-0">
          <i class="fa-solid fa-chalkboard-user"></i>
        </div>
        <div>
          <span class="text-[10px] font-extrabold uppercase text-slate-500">Total Guru</span>
          <h3 class="text-xl font-extrabold text-slate-900">${totalGuru} <span class="text-xs font-semibold text-slate-400">Tenaga Pendidik</span></h3>
          <p class="text-[10px] text-emerald-600 font-semibold mt-0.5">Multi-Mapel & Multi-Kelas</p>
        </div>
      </div>

      <div class="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex items-center gap-3.5">
        <div class="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center text-xl shrink-0">
          <i class="fa-solid fa-door-open"></i>
        </div>
        <div>
          <span class="text-[10px] font-extrabold uppercase text-slate-500">Rombongan Belajar</span>
          <h3 class="text-xl font-extrabold text-slate-900">${totalKelas} <span class="text-xs font-semibold text-slate-400">Rombel</span></h3>
          <p class="text-[10px] text-indigo-600 font-semibold mt-0.5">Jenjang VII, VIII, IX</p>
        </div>
      </div>

      <div class="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex items-center gap-3.5">
        <div class="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center text-xl shrink-0">
          <i class="fa-solid fa-book"></i>
        </div>
        <div>
          <span class="text-[10px] font-extrabold uppercase text-slate-500">Mata Pelajaran</span>
          <h3 class="text-xl font-extrabold text-slate-900">${totalMapel} <span class="text-xs font-semibold text-slate-400">Mapel</span></h3>
          <p class="text-[10px] text-amber-600 font-semibold mt-0.5">Kurikulum Nasional Terpadu</p>
        </div>
      </div>
    `;
  }

  function renderDashboardJenjangCards() {
    const el = document.getElementById('dashboardJenjangCards');
    if (!el) return;

    const jenjangs = ['VII', 'VIII', 'IX'];
    const colors = [
      { border: 'border-blue-200', bg: 'bg-blue-50/50', badge: 'bg-blue-600 text-white', icon: 'fa-7' },
      { border: 'border-emerald-200', bg: 'bg-emerald-50/50', badge: 'bg-emerald-600 text-white', icon: 'fa-8' },
      { border: 'border-purple-200', bg: 'bg-purple-50/50', badge: 'bg-purple-600 text-white', icon: 'fa-9' }
    ];

    let html = '';
    jenjangs.forEach((j, idx) => {
      const klsInJ = state.kelas.filter((k) => k.jenjang === j);
      const klsCodes = klsInJ.map((k) => k.kode_kelas);
      const students = state.murid.filter((m) => klsCodes.includes(m.kode_kelas));
      const col = colors[idx];

      const islam = students.filter((s) => s.agama === 'Islam').length;
      const kristen = students.filter((s) => s.agama === 'Kristen').length;
      const katolik = students.filter((s) => s.agama === 'Katolik').length;
      const other = students.length - (islam + kristen + katolik);

      // Average score in sumatif
      const scores = state.nilai_sumatif.filter((n) => klsCodes.includes(n.kode_kelas) && n.nilai_akhir > 0);
      const avg = scores.length > 0 ? (scores.reduce((sum, s) => sum + s.nilai_akhir, 0) / scores.length).toFixed(1) : '-';

      html += `
        <div class="rounded-2xl border ${col.border} ${col.bg} p-4.5 space-y-3">
          <div class="flex items-center justify-between">
            <span class="px-2.5 py-1 rounded-xl text-xs font-extrabold ${col.badge}">Kelas ${j}</span>
            <span class="text-xs font-bold text-slate-500">${klsInJ.length} Rombel</span>
          </div>

          <div class="grid grid-cols-2 gap-2 pt-1">
            <div class="bg-white/80 p-2.5 rounded-xl border border-slate-200/60">
              <span class="text-[10px] text-slate-500 font-bold block">Total Siswa</span>
              <span class="text-base font-extrabold text-slate-800">${students.length} Siswa</span>
            </div>
            <div class="bg-white/80 p-2.5 rounded-xl border border-slate-200/60">
              <span class="text-[10px] text-slate-500 font-bold block">Rata-Rata Capaian</span>
              <span class="text-base font-extrabold text-slate-800">${avg}</span>
            </div>
          </div>

          <div class="text-[11px] text-slate-600 bg-white/70 p-2.5 rounded-xl border border-slate-200/60 space-y-1">
            <div class="font-bold text-slate-700">Komposisi Agama Siswa:</div>
            <div class="flex flex-wrap gap-2 text-[10px]">
              <span class="bg-slate-100 px-2 py-0.5 rounded-md">Islam: <b>${islam}</b></span>
              <span class="bg-slate-100 px-2 py-0.5 rounded-md">Kristen: <b>${kristen}</b></span>
              <span class="bg-slate-100 px-2 py-0.5 rounded-md">Katolik: <b>${katolik}</b></span>
              ${other > 0 ? `<span class="bg-slate-100 px-2 py-0.5 rounded-md">Lainnya: <b>${other}</b></span>` : ''}
            </div>
          </div>
        </div>
      `;
    });

    el.innerHTML = html;
  }

  function renderDashboardCharts() {
    if (typeof Chart === 'undefined') return;

    const mode = (document.getElementById('dashboardChartMode') || {}).value || 'rata_nilai';

    // 1. Chart Mapel
    renderPieChartMapel(mode);
    // 2. Chart Guru
    renderPieChartGuru(mode);
    // 3. Chart Kelas
    renderPieChartKelas(mode);
  }

  function renderPieChartMapel(mode) {
    const canvas = document.getElementById('pieChartMapel');
    if (!canvas) return;

    const labels = [];
    const values = [];
    const bgColors = [
      '#2563eb', '#3b82f6', '#60a5fa', '#059669', '#10b981',
      '#34d399', '#f59e0b', '#fbbf24', '#7c3aed', '#8b5cf6', '#ec4899'
    ];

    state.mapel.forEach((m) => {
      labels.push(m.nama_mapel);
      const scores = state.nilai_sumatif.filter((n) => n.mapel_id === m.id && n.nilai_akhir > 0);
      if (mode === 'progres_input') {
        const totalPossible = state.murid.length;
        const pct = totalPossible > 0 ? Math.round((scores.length / totalPossible) * 100) : 0;
        values.push(pct);
      } else if (mode === 'ketuntasan') {
        const tuntas = scores.filter((s) => s.nilai_akhir >= 75).length;
        values.push(tuntas);
      } else {
        const avg = scores.length > 0 ? Math.round((scores.reduce((acc, s) => acc + s.nilai_akhir, 0) / scores.length) * 10) / 10 : 75;
        values.push(avg);
      }
    });

    if (chartMapelInstance) chartMapelInstance.destroy();
    chartMapelInstance = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{ data: values, backgroundColor: bgColors.slice(0, labels.length) }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } }
      }
    });

    // Custom legend
    const legendEl = document.getElementById('legendChartMapel');
    if (legendEl) {
      legendEl.innerHTML = labels
        .map(
          (lbl, i) => `
          <div class="flex items-center justify-between text-[11px] py-0.5">
            <span class="flex items-center gap-1.5 truncate">
              <span class="w-2.5 h-2.5 rounded-full inline-block" style="background:${bgColors[i % bgColors.length]}"></span>
              <span class="truncate">${lbl}</span>
            </span>
            <b class="text-slate-800 ml-2">${values[i]}${mode === 'progres_input' ? '%' : ''}</b>
          </div>`
        )
        .join('');
    }

    const badge = document.getElementById('badgeChartMapel');
    if (badge) badge.textContent = `${state.mapel.length} Mapel`;
  }

  function renderPieChartGuru(mode) {
    const canvas = document.getElementById('pieChartGuru');
    if (!canvas) return;

    const labels = [];
    const values = [];
    const bgColors = ['#10b981', '#059669', '#34d399', '#0d9488', '#14b8a6', '#2dd4bf'];

    state.guru.forEach((g) => {
      labels.push(g.nama_guru);
      // Mapel and kelas of this teacher
      const mapelNames = g.mapel_ampuan || [];
      const mapelIds = state.mapel.filter((m) => mapelNames.includes(m.nama_mapel)).map((m) => m.id);
      const scores = state.nilai_sumatif.filter((n) => mapelIds.includes(n.mapel_id) && n.nilai_akhir > 0);

      if (mode === 'progres_input') {
        values.push(scores.length);
      } else if (mode === 'ketuntasan') {
        const tuntas = scores.filter((s) => s.nilai_akhir >= 75).length;
        values.push(tuntas);
      } else {
        const avg = scores.length > 0 ? Math.round((scores.reduce((acc, s) => acc + s.nilai_akhir, 0) / scores.length) * 10) / 10 : 80;
        values.push(avg);
      }
    });

    if (chartGuruInstance) chartGuruInstance.destroy();
    chartGuruInstance = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{ data: values, backgroundColor: bgColors.slice(0, labels.length) }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } }
      }
    });

    const legendEl = document.getElementById('legendChartGuru');
    if (legendEl) {
      legendEl.innerHTML = labels
        .map(
          (lbl, i) => `
          <div class="flex items-center justify-between text-[11px] py-0.5">
            <span class="flex items-center gap-1.5 truncate">
              <span class="w-2.5 h-2.5 rounded-full inline-block" style="background:${bgColors[i % bgColors.length]}"></span>
              <span class="truncate">${lbl}</span>
            </span>
            <b class="text-slate-800 ml-2">${values[i]}</b>
          </div>`
        )
        .join('');
    }

    const badge = document.getElementById('badgeChartGuru');
    if (badge) badge.textContent = `${state.guru.length} Guru`;
  }

  function renderPieChartKelas(mode) {
    const canvas = document.getElementById('pieChartKelas');
    if (!canvas) return;

    const labels = [];
    const values = [];
    const bgColors = ['#f59e0b', '#d97706', '#fbbf24', '#f97316', '#ea580c', '#fb923c'];

    state.kelas.forEach((k) => {
      labels.push(k.nama_kelas || k.kode_kelas);
      const scores = state.nilai_sumatif.filter((n) => n.kode_kelas === k.kode_kelas && n.nilai_akhir > 0);

      if (mode === 'progres_input') {
        const totalMurid = state.murid.filter((m) => m.kode_kelas === k.kode_kelas).length;
        const totalMapel = state.mapel.length;
        const maxInputs = totalMurid * totalMapel;
        const pct = maxInputs > 0 ? Math.round((scores.length / maxInputs) * 100) : 0;
        values.push(pct);
      } else if (mode === 'ketuntasan') {
        const tuntas = scores.filter((s) => s.nilai_akhir >= 75).length;
        values.push(tuntas);
      } else {
        const avg = scores.length > 0 ? Math.round((scores.reduce((acc, s) => acc + s.nilai_akhir, 0) / scores.length) * 10) / 10 : 82;
        values.push(avg);
      }
    });

    if (chartKelasInstance) chartKelasInstance.destroy();
    chartKelasInstance = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{ data: values, backgroundColor: bgColors.slice(0, labels.length) }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } }
      }
    });

    const legendEl = document.getElementById('legendChartKelas');
    if (legendEl) {
      legendEl.innerHTML = labels
        .map(
          (lbl, i) => `
          <div class="flex items-center justify-between text-[11px] py-0.5">
            <span class="flex items-center gap-1.5 truncate">
              <span class="w-2.5 h-2.5 rounded-full inline-block" style="background:${bgColors[i % bgColors.length]}"></span>
              <span class="truncate">${lbl}</span>
            </span>
            <b class="text-slate-800 ml-2">${values[i]}${mode === 'progres_input' ? '%' : ''}</b>
          </div>`
        )
        .join('');
    }

    const badge = document.getElementById('badgeChartKelas');
    if (badge) badge.textContent = `${state.kelas.length} Kelas`;
  }

  // ==================== 2. MANAJEMEN DATA ====================
  function switchMasterTab(tab) {
    currentMasterTab = tab;
    ['guru', 'murid', 'kelas', 'mapel'].forEach((t) => {
      const btn = document.getElementById(`tab-master-${t}`);
      const panel = document.getElementById(`panel-master-${t}`);
      if (btn && panel) {
        if (t === tab) {
          btn.className = 'px-4 py-2.5 rounded-xl text-xs font-bold transition bg-blue-600 text-white shadow-sm';
          panel.classList.remove('hidden');
        } else {
          btn.className = 'px-4 py-2.5 rounded-xl text-xs font-bold transition text-slate-600 hover:bg-slate-100';
          panel.classList.add('hidden');
        }
      }
    });

    if (tab === 'guru') renderGuruTable();
    else if (tab === 'murid') {
      populateMuridFilters();
      renderMuridTable();
    } else if (tab === 'kelas') renderKelasView();
    else if (tab === 'mapel') renderMapelTable();
  }

  // --- Guru CRUD & Excel ---
  function renderGuruTable() {
    const tbody = document.getElementById('tbodyGuru');
    if (!tbody) return;

    if (state.guru.length === 0) {
      tbody.innerHTML = `<tr><td colspan="9" class="py-8 text-center text-slate-400">Belum ada data guru. Klik tombol Tambah Guru atau Impor Excel.</td></tr>`;
      return;
    }

    tbody.innerHTML = state.guru
      .map((g, idx) => {
        const mapels = (g.mapel_ampuan || [])
          .map((m) => `<span class="inline-block bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md text-[10px] font-semibold mr-1 mb-1 border border-blue-200">${m}</span>`)
          .join('');
        const kelass = (g.kelas_ampuan || [])
          .map((k) => `<span class="inline-block bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md text-[10px] font-semibold mr-1 mb-1 border border-indigo-200">${k}</span>`)
          .join('');

        return `
          <tr class="hover:bg-slate-50/80 transition">
            <td class="py-2.5 px-3 text-center text-slate-500 font-semibold">${idx + 1}</td>
            <td class="py-2.5 px-3 text-center">
              <div class="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 mx-auto overflow-hidden flex items-center justify-center text-slate-400 text-xs">
                ${g.foto ? `<img src="${g.foto}" class="w-full h-full object-cover">` : `<i class="fa-solid fa-user"></i>`}
              </div>
            </td>
            <td class="py-2.5 px-3 font-bold text-slate-800">${g.nama_guru}</td>
            <td class="py-2.5 px-3 text-slate-600 font-mono text-[11px]">${g.nip || '-'}</td>
            <td class="py-2.5 px-3">${mapels || '<span class="text-slate-400">-</span>'}</td>
            <td class="py-2.5 px-3">${kelass || '<span class="text-slate-400">-</span>'}</td>
            <td class="py-2.5 px-3 text-slate-600 font-mono text-[11px]">${g.username}</td>
            <td class="py-2.5 px-3 text-slate-400">••••••</td>
            <td class="py-2.5 px-3 text-center">
              <div class="flex items-center justify-center gap-1">
                <button onclick="App.openGuruModal(${g.id})" class="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 transition" title="Edit Data Guru">
                  <i class="fa-solid fa-pen-to-square"></i>
                </button>
                <button onclick="App.resetGuruPassword(${g.id})" class="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-600 transition" title="Reset Password">
                  <i class="fa-solid fa-key"></i>
                </button>
                <button onclick="App.deleteGuru(${g.id})" class="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition" title="Hapus Guru">
                  <i class="fa-solid fa-trash-can"></i>
                </button>
              </div>
            </td>
          </tr>
        `;
      })
      .join('');
  }

  function openGuruModal(id = 0) {
    const isEdit = id > 0;
    const g = isEdit ? state.guru.find((x) => x.id === id) : null;

    const mapelCheckboxes = state.mapel
      .map((m) => {
        const checked = g && g.mapel_ampuan && g.mapel_ampuan.includes(m.nama_mapel) ? 'checked' : '';
        return `
          <label class="flex items-center gap-2 p-1.5 rounded hover:bg-slate-50 cursor-pointer text-xs">
            <input type="checkbox" name="guru_mapel" value="${m.nama_mapel}" ${checked} class="rounded text-blue-600">
            <span>${m.nama_mapel}</span>
          </label>
        `;
      })
      .join('');

    const kelasCheckboxes = state.kelas
      .map((k) => {
        const checked = g && g.kelas_ampuan && g.kelas_ampuan.includes(k.kode_kelas) ? 'checked' : '';
        return `
          <label class="flex items-center gap-2 p-1.5 rounded hover:bg-slate-50 cursor-pointer text-xs">
            <input type="checkbox" name="guru_kelas" value="${k.kode_kelas}" ${checked} class="rounded text-blue-600">
            <span>${k.kode_kelas} (${k.nama_kelas})</span>
          </label>
        `;
      })
      .join('');

    // Check if this teacher is currently a Wali Kelas
    const currentWaliKelas = state.kelas.find((k) => g && k.wali_kelas.toLowerCase().trim() === g.nama_guru.toLowerCase().trim());
    const waliKelasOptions = state.kelas
      .map((k) => {
        const sel = currentWaliKelas && currentWaliKelas.kode_kelas === k.kode_kelas ? 'selected' : '';
        return `<option value="${k.kode_kelas}" ${sel}>${k.kode_kelas} - ${k.nama_kelas}</option>`;
      })
      .join('');

    const html = `
      <form onsubmit="App.saveGuruForm(event, ${id})" class="space-y-4">
        <div>
          <label class="block font-bold text-slate-700 mb-1">Nama Lengkap Guru Beserta Gelar *</label>
          <input type="text" id="guru_nama" required value="${g ? g.nama_guru : ''}" placeholder="Contoh: Budi Santoso, S.Pd." class="w-full text-xs font-semibold border border-slate-300 rounded-xl px-3 py-2 bg-white">
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block font-bold text-slate-700 mb-1">NIP Guru</label>
            <input type="text" id="guru_nip" value="${g ? g.nip : ''}" placeholder="Contoh: 19800312 200501 1 004" class="w-full text-xs font-semibold border border-slate-300 rounded-xl px-3 py-2 bg-white">
          </div>
          <div>
            <label class="block font-bold text-slate-700 mb-1">Penugasan Wali Kelas</label>
            <select id="guru_wali_kelas_kode" class="w-full text-xs font-semibold border border-slate-300 rounded-xl px-3 py-2 bg-white">
              <option value="">Bukan Wali Kelas</option>
              ${waliKelasOptions}
            </select>
          </div>
        </div>

        <div>
          <label class="block font-bold text-slate-700 mb-1">Mata Pelajaran Ampuan (Bisa Pilih Banyak)</label>
          <div class="max-h-36 overflow-y-auto border border-slate-200 rounded-xl p-2 bg-slate-50">
            ${mapelCheckboxes}
          </div>
        </div>

        <div>
          <label class="block font-bold text-slate-700 mb-1">Rombel Kelas Ampuan (Bisa Pilih Banyak)</label>
          <div class="max-h-32 overflow-y-auto border border-slate-200 rounded-xl p-2 bg-slate-50">
            ${kelasCheckboxes}
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3 pt-1 border-t border-slate-100">
          <div>
            <label class="block font-bold text-slate-700 mb-1">Username Login</label>
            <input type="text" id="guru_username" value="${g ? g.username : ''}" placeholder="Otomatis NIP jika kosong" class="w-full text-xs font-semibold border border-slate-300 rounded-xl px-3 py-2 bg-white">
          </div>
          <div>
            <label class="block font-bold text-slate-700 mb-1">Password Login</label>
            <input type="password" id="guru_password" value="${g ? g.password : 'guru123456'}" class="w-full text-xs font-semibold border border-slate-300 rounded-xl px-3 py-2 bg-white">
          </div>
        </div>

        <div class="pt-3 border-t border-slate-100 flex justify-end gap-2">
          <button type="button" onclick="App.closeModal()" class="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs">
            Batal
          </button>
          <button type="submit" class="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm">
            Simpan Data Guru
          </button>
        </div>
      </form>
    `;

    openModal(isEdit ? 'Edit Data Guru' : 'Tambah Guru Baru', html);
  }

  async function saveGuruForm(e, id) {
    e.preventDefault();
    const nama_guru = document.getElementById('guru_nama').value.trim();
    const nip = document.getElementById('guru_nip').value.trim();
    const wali_kelas_kode = document.getElementById('guru_wali_kelas_kode').value;
    const username = document.getElementById('guru_username').value.trim();
    const password = document.getElementById('guru_password').value.trim();

    const mapel_ampuan = Array.from(document.querySelectorAll('input[name="guru_mapel"]:checked')).map((c) => c.value);
    const kelas_ampuan = Array.from(document.querySelectorAll('input[name="guru_kelas"]:checked')).map((c) => c.value);

    const payload = {
      id,
      nama_guru,
      nip,
      wali_kelas_kode,
      username,
      password,
      mapel_ampuan,
      kelas_ampuan
    };

    const res = await api('guru_save', payload);
    if (res.success) {
      showToast(res.message);
      closeModal();
      await reloadAllData();
      renderGuruTable();
    } else {
      showToast(res.message || 'Gagal menyimpan guru', 'error');
    }
  }

  async function deleteGuru(id) {
    if (!confirm('Apakah Anda yakin ingin menghapus data guru ini?')) return;
    const res = await api('guru_delete', { id });
    if (res.success) {
      showToast(res.message);
      await reloadAllData();
      renderGuruTable();
    }
  }

  async function deleteAllGuru() {
    if (!confirm('PERINGATAN: Apakah Anda yakin ingin menghapus SELURUH data guru? Tindakan ini tidak dapat dibatalkan!')) return;
    const res = await api('guru_delete_all');
    if (res.success) {
      showToast(res.message);
      await reloadAllData();
      renderGuruTable();
    }
  }

  async function resetGuruPassword(id) {
    const newPass = prompt('Masukkan password baru untuk guru ini:', 'guru123456');
    if (newPass === null) return;
    const res = await api('guru_reset_password', { id, new_password: newPass });
    if (res.success) {
      showToast(res.message);
      await reloadAllData();
      renderGuruTable();
    }
  }

  function downloadTemplateGuruExcel() {
    if (typeof XLSX === 'undefined') return showToast('Pustaka SheetJS belum termuat.', 'error');
    const ws_data = [
      ['nama_guru', 'nip', 'mapel_ampuan', 'kelas_ampuan', 'username', 'password'],
      ['Ahmad Fauzi, S.Pd.I.', '19881110 201101 1 002', 'Pendidikan Agama dan Budi Pekerti', 'VII-A, VIII-A', '198811102011011002', 'guru123456'],
      ['Siti Rahmawati, M.Pd.', '19850720 200902 2 006', 'Bahasa Indonesia', 'VII-A, IX-A', '198507202009022006', 'guru123456']
    ];
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    XLSX.utils.book_append_sheet(wb, ws, 'Template_Guru');
    XLSX.writeFile(wb, 'Template_Import_Data_Guru.xlsx');
  }

  function exportGuruExcel() {
    if (typeof XLSX === 'undefined') return showToast('Pustaka SheetJS belum termuat.', 'error');
    const ws_data = [
      ['No', 'Nama Guru', 'NIP', 'Mapel Ampuan', 'Kelas Ampuan', 'Username']
    ];
    state.guru.forEach((g, idx) => {
      ws_data.push([
        idx + 1,
        g.nama_guru,
        g.nip,
        (g.mapel_ampuan || []).join(', '),
        (g.kelas_ampuan || []).join(', '),
        g.username
      ]);
    });
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    XLSX.utils.book_append_sheet(wb, ws, 'Data_Guru');
    XLSX.writeFile(wb, `Data_Guru_SMP_${Date.now()}.xlsx`);
  }

  function importGuruExcel(event) {
    const file = event.target.files[0];
    if (!file || typeof XLSX === 'undefined') return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const wb = XLSX.read(data, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(ws);

        if (!json.length) return showToast('File Excel kosong.', 'warning');

        const rows = json.map((r) => ({
          nama_guru: r.nama_guru || r['Nama Guru'] || '',
          nip: r.nip || r['NIP'] || '',
          mapel_ampuan: r.mapel_ampuan || r['Mapel Ampuan'] || '',
          kelas_ampuan: r.kelas_ampuan || r['Kelas Ampuan'] || '',
          username: r.username || r['Username'] || '',
          password: r.password || r['Password'] || 'guru123456'
        }));

        const res = await api('guru_bulk_import', { rows });
        if (res.success) {
          showToast(res.message);
          await reloadAllData();
          renderGuruTable();
        }
      } catch (err) {
        showToast('Gagal memproses file Excel: ' + err.message, 'error');
      }
    };
    reader.readAsArrayBuffer(file);
    event.target.value = '';
  }

  // --- Murid CRUD & Excel ---
  function populateMuridFilters() {
    const klsSelect = document.getElementById('filterMuridKelas');
    if (klsSelect) {
      const cur = klsSelect.value;
      klsSelect.innerHTML = `<option value="">Semua Kelas</option>` +
        state.kelas.map((k) => `<option value="${k.kode_kelas}">${k.kode_kelas} - ${k.nama_kelas}</option>`).join('');
      klsSelect.value = cur;
    }
  }

  function renderMuridTable() {
    const tbody = document.getElementById('tbodyMurid');
    if (!tbody) return;

    const filterKls = (document.getElementById('filterMuridKelas') || {}).value || '';
    const filterAgama = (document.getElementById('filterMuridAgama') || {}).value || '';
    const search = ((document.getElementById('searchMuridInput') || {}).value || '').toLowerCase().trim();

    let list = state.murid.filter((m) => {
      if (filterKls && m.kode_kelas !== filterKls) return false;
      if (filterAgama && m.agama !== filterAgama) return false;
      if (search && !m.nama_murid.toLowerCase().includes(search) && !m.nis_nisn.includes(search)) return false;
      return true;
    });

    if (list.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" class="py-8 text-center text-slate-400">Tidak ada data murid yang sesuai filter.</td></tr>`;
      return;
    }

    tbody.innerHTML = list
      .map(
        (m, idx) => `
        <tr class="hover:bg-slate-50/80 transition">
          <td class="py-2.5 px-3 text-center text-slate-500 font-semibold">${idx + 1}</td>
          <td class="py-2.5 px-3 font-bold text-slate-800">${m.nama_murid}</td>
          <td class="py-2.5 px-3 font-mono text-slate-600">${m.nis_nisn || '-'}</td>
          <td class="py-2.5 px-3">
            <span class="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700">
              ${m.agama}
            </span>
          </td>
          <td class="py-2.5 px-3 font-bold text-blue-700">${m.kode_kelas}</td>
          <td class="py-2.5 px-3 text-center">
            <div class="flex items-center justify-center gap-1">
              <button onclick="App.openMuridModal(${m.id})" class="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 transition" title="Edit Data Murid">
                <i class="fa-solid fa-pen-to-square"></i>
              </button>
              <button onclick="App.deleteMurid(${m.id})" class="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition" title="Hapus Murid">
                <i class="fa-solid fa-trash-can"></i>
              </button>
            </div>
          </td>
        </tr>
      `
      )
      .join('');
  }

  function openMuridModal(id = 0) {
    const isEdit = id > 0;
    const m = isEdit ? state.murid.find((x) => x.id === id) : null;

    const kelasOptions = state.kelas
      .map((k) => {
        const sel = m && m.kode_kelas === k.kode_kelas ? 'selected' : '';
        return `<option value="${k.kode_kelas}" ${sel}>${k.kode_kelas} - ${k.nama_kelas}</option>`;
      })
      .join('');

    const agamaList = ['Islam', 'Kristen', 'Katolik', 'Hindu', 'Buddha', 'Konghucu'];
    const agamaOptions = agamaList
      .map((a) => {
        const sel = m && m.agama === a ? 'selected' : a === 'Islam' && !m ? 'selected' : '';
        return `<option value="${a}" ${sel}>${a}</option>`;
      })
      .join('');

    const html = `
      <form onsubmit="App.saveMuridForm(event, ${id})" class="space-y-4">
        <div>
          <label class="block font-bold text-slate-700 mb-1">Nama Lengkap Murid *</label>
          <input type="text" id="murid_nama" required value="${m ? m.nama_murid : ''}" placeholder="Masukkan nama murid" class="w-full text-xs font-semibold border border-slate-300 rounded-xl px-3 py-2 bg-white">
        </div>

        <div>
          <label class="block font-bold text-slate-700 mb-1">NIS / NISN</label>
          <input type="text" id="murid_nis" value="${m ? m.nis_nisn : ''}" placeholder="Contoh: 0098765431" class="w-full text-xs font-semibold border border-slate-300 rounded-xl px-3 py-2 bg-white">
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block font-bold text-slate-700 mb-1">Agama Murid *</label>
            <select id="murid_agama" class="w-full text-xs font-semibold border border-slate-300 rounded-xl px-3 py-2 bg-white">
              ${agamaOptions}
            </select>
          </div>
          <div>
            <label class="block font-bold text-slate-700 mb-1">Rombongan Belajar (Kelas) *</label>
            <select id="murid_kelas" class="w-full text-xs font-semibold border border-slate-300 rounded-xl px-3 py-2 bg-white">
              ${kelasOptions}
            </select>
          </div>
        </div>

        <div class="pt-3 border-t border-slate-100 flex justify-end gap-2">
          <button type="button" onclick="App.closeModal()" class="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs">
            Batal
          </button>
          <button type="submit" class="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm">
            Simpan Murid
          </button>
        </div>
      </form>
    `;

    openModal(isEdit ? 'Edit Data Murid' : 'Tambah Murid Baru', html);
  }

  async function saveMuridForm(e, id) {
    e.preventDefault();
    const nama_murid = document.getElementById('murid_nama').value.trim();
    const nis_nisn = document.getElementById('murid_nis').value.trim();
    const agama = document.getElementById('murid_agama').value;
    const kode_kelas = document.getElementById('murid_kelas').value;

    const res = await api('murid_save', { id, nama_murid, nis_nisn, agama, kode_kelas });
    if (res.success) {
      showToast(res.message);
      closeModal();
      await reloadAllData();
      renderMuridTable();
    } else {
      showToast(res.message || 'Gagal menyimpan murid', 'error');
    }
  }

  async function deleteMurid(id) {
    if (!confirm('Apakah Anda yakin ingin menghapus data murid ini beserta seluruh nilai terkait?')) return;
    const res = await api('murid_delete', { id });
    if (res.success) {
      showToast(res.message);
      await reloadAllData();
      renderMuridTable();
    }
  }

  async function deleteAllMurid() {
    if (!confirm('PERINGATAN: Apakah Anda yakin ingin menghapus SELURUH data murid beserta nilainya? Tindakan ini tidak dapat dibatalkan!')) return;
    const res = await api('murid_delete_all');
    if (res.success) {
      showToast(res.message);
      await reloadAllData();
      renderMuridTable();
    }
  }

  function downloadTemplateMuridExcel() {
    if (typeof XLSX === 'undefined') return showToast('Pustaka SheetJS belum termuat.', 'error');
    const ws_data = [
      ['nama_murid', 'nis_nisn', 'agama', 'kode_kelas'],
      ['Aditya Pratama', '0098765431', 'Islam', 'VII-A'],
      ['Maria Fransiska', '0098765435', 'Katolik', 'VII-A']
    ];
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    XLSX.utils.book_append_sheet(wb, ws, 'Template_Murid');
    XLSX.writeFile(wb, 'Template_Import_Data_Murid.xlsx');
  }

  function exportMuridExcel() {
    if (typeof XLSX === 'undefined') return showToast('Pustaka SheetJS belum termuat.', 'error');
    const ws_data = [
      ['No', 'Nama Murid', 'NIS / NISN', 'Agama', 'Kelas']
    ];
    state.murid.forEach((m, idx) => {
      ws_data.push([idx + 1, m.nama_murid, m.nis_nisn, m.agama, m.kode_kelas]);
    });
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    XLSX.utils.book_append_sheet(wb, ws, 'Data_Murid');
    XLSX.writeFile(wb, `Data_Murid_SMP_${Date.now()}.xlsx`);
  }

  function importMuridExcel(event) {
    const file = event.target.files[0];
    if (!file || typeof XLSX === 'undefined') return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const wb = XLSX.read(data, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(ws);

        if (!json.length) return showToast('File Excel kosong.', 'warning');

        const rows = json.map((r) => ({
          nama_murid: r.nama_murid || r['Nama Murid'] || '',
          nis_nisn: String(r.nis_nisn || r['NIS / NISN'] || r['NISN'] || ''),
          agama: r.agama || r['Agama'] || 'Islam',
          kode_kelas: r.kode_kelas || r['Kode Kelas'] || r['Kelas'] || 'VII-A'
        }));

        const res = await api('murid_bulk_import', { rows });
        if (res.success) {
          showToast(res.message);
          await reloadAllData();
          renderMuridTable();
        }
      } catch (err) {
        showToast('Gagal membaca file Excel: ' + err.message, 'error');
      }
    };
    reader.readAsArrayBuffer(file);
    event.target.value = '';
  }

  // --- Kelas CRUD & Excel ---
  function renderKelasView() {
    renderKelasCards();
    renderKelasTable();
  }

  function renderKelasCards() {
    const el = document.getElementById('kelasCardGrid');
    if (!el) return;

    if (state.kelas.length === 0) {
      el.innerHTML = `<div class="col-span-full py-8 text-center text-slate-400">Belum ada kelas. Klik Tambah Kelas Manual.</div>`;
      return;
    }

    el.innerHTML = state.kelas
      .map((k) => {
        const studentCount = state.murid.filter((m) => m.kode_kelas === k.kode_kelas).length;
        const color = k.jenjang === 'VII' ? 'blue' : k.jenjang === 'VIII' ? 'emerald' : 'purple';

        return `
          <div class="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs hover:shadow-md transition space-y-3">
            <div class="flex items-center justify-between">
              <span class="px-2.5 py-1 rounded-xl text-xs font-extrabold bg-${color}-50 text-${color}-700 border border-${color}-200">
                Jenjang ${k.jenjang}
              </span>
              <div class="flex items-center gap-1">
                <button onclick="App.openKelasModal(${k.id})" class="p-1.5 rounded-lg bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 transition" title="Edit Kelas">
                  <i class="fa-solid fa-pen-to-square"></i>
                </button>
                <button onclick="App.deleteKelas(${k.id})" class="p-1.5 rounded-lg bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 transition" title="Hapus Kelas">
                  <i class="fa-solid fa-trash-can"></i>
                </button>
              </div>
            </div>

            <div>
              <h4 class="text-base font-extrabold text-slate-800">${k.nama_kelas}</h4>
              <p class="text-[11px] text-slate-500 font-mono">Kode: <b>${k.kode_kelas}</b></p>
            </div>

            <div class="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
              <span class="truncate">Wali: <b class="text-slate-800">${k.wali_kelas || '-'}</b></span>
              <span class="shrink-0 bg-slate-100 px-2 py-0.5 rounded-md font-bold text-slate-700">${studentCount} Murid</span>
            </div>
          </div>
        `;
      })
      .join('');
  }

  function renderKelasTable() {
    const tbody = document.getElementById('tbodyKelas');
    if (!tbody) return;

    tbody.innerHTML = state.kelas
      .map((k, idx) => {
        const count = state.murid.filter((m) => m.kode_kelas === k.kode_kelas).length;
        return `
          <tr class="hover:bg-slate-50/80 transition">
            <td class="py-2.5 px-3 text-center text-slate-500 font-semibold">${idx + 1}</td>
            <td class="py-2.5 px-3 font-mono font-bold text-blue-700">${k.kode_kelas}</td>
            <td class="py-2.5 px-3 font-bold text-slate-800">${k.nama_kelas}</td>
            <td class="py-2.5 px-3">
              <span class="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold text-[11px]">Jenjang ${k.jenjang}</span>
            </td>
            <td class="py-2.5 px-3 text-slate-700">${k.wali_kelas || '<span class="text-slate-400">-</span>'}</td>
            <td class="py-2.5 px-3 text-center font-bold text-slate-800">${count}</td>
            <td class="py-2.5 px-3 text-center">
              <div class="flex items-center justify-center gap-1">
                <button onclick="App.openKelasModal(${k.id})" class="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 transition" title="Edit Kelas">
                  <i class="fa-solid fa-pen-to-square"></i>
                </button>
                <button onclick="App.deleteKelas(${k.id})" class="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition" title="Hapus Kelas">
                  <i class="fa-solid fa-trash-can"></i>
                </button>
              </div>
            </td>
          </tr>
        `;
      })
      .join('');
  }

  function openKelasModal(id = 0) {
    const isEdit = id > 0;
    const k = isEdit ? state.kelas.find((x) => x.id === id) : null;

    const teacherOptions = state.guru
      .map((g) => {
        const sel = k && k.wali_kelas.toLowerCase().trim() === g.nama_guru.toLowerCase().trim() ? 'selected' : '';
        return `<option value="${g.nama_guru}" ${sel}>${g.nama_guru}</option>`;
      })
      .join('');

    const html = `
      <form onsubmit="App.saveKelasForm(event, ${id})" class="space-y-4">
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block font-bold text-slate-700 mb-1">Kode Kelas *</label>
            <input type="text" id="kelas_kode" required value="${k ? k.kode_kelas : ''}" placeholder="Contoh: VII-A" class="w-full text-xs font-semibold border border-slate-300 rounded-xl px-3 py-2 bg-white">
          </div>
          <div>
            <label class="block font-bold text-slate-700 mb-1">Nama Lengkap Kelas *</label>
            <input type="text" id="kelas_nama" required value="${k ? k.nama_kelas : ''}" placeholder="Contoh: Kelas VII-A" class="w-full text-xs font-semibold border border-slate-300 rounded-xl px-3 py-2 bg-white">
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block font-bold text-slate-700 mb-1">Jenjang Tingkat *</label>
            <select id="kelas_jenjang" class="w-full text-xs font-semibold border border-slate-300 rounded-xl px-3 py-2 bg-white">
              <option value="VII" ${k && k.jenjang === 'VII' ? 'selected' : ''}>Kelas VII (Tujuh)</option>
              <option value="VIII" ${k && k.jenjang === 'VIII' ? 'selected' : ''}>Kelas VIII (Delapan)</option>
              <option value="IX" ${k && k.jenjang === 'IX' ? 'selected' : ''}>Kelas IX (Sembilan)</option>
            </select>
          </div>
          <div>
            <label class="block font-bold text-slate-700 mb-1">Jumlah Nilai Sumatif</label>
            <input type="number" id="kelas_jml_sumatif" min="1" max="15" value="${k ? k.jml_sumatif : 3}" class="w-full text-xs font-semibold border border-slate-300 rounded-xl px-3 py-2 bg-white">
          </div>
        </div>

        <div>
          <label class="block font-bold text-slate-700 mb-1">Wali Kelas</label>
          <select id="kelas_wali" class="w-full text-xs font-semibold border border-slate-300 rounded-xl px-3 py-2 bg-white">
            <option value="">Belum Ditentukan</option>
            ${teacherOptions}
          </select>
        </div>

        <div class="pt-3 border-t border-slate-100 flex justify-end gap-2">
          <button type="button" onclick="App.closeModal()" class="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs">
            Batal
          </button>
          <button type="submit" class="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm">
            Simpan Kelas
          </button>
        </div>
      </form>
    `;

    openModal(isEdit ? 'Edit Data Kelas' : 'Tambah Kelas Baru', html);
  }

  async function saveKelasForm(e, id) {
    e.preventDefault();
    const kode_kelas = document.getElementById('kelas_kode').value.trim();
    const nama_kelas = document.getElementById('kelas_nama').value.trim();
    const jenjang = document.getElementById('kelas_jenjang').value;
    const jml_sumatif = parseInt(document.getElementById('kelas_jml_sumatif').value || 3, 10);
    const wali_kelas = document.getElementById('kelas_wali').value;

    const res = await api('kelas_save', { id, kode_kelas, nama_kelas, jenjang, jml_sumatif, wali_kelas });
    if (res.success) {
      showToast(res.message);
      closeModal();
      await reloadAllData();
      renderKelasView();
    } else {
      showToast(res.message || 'Gagal menyimpan kelas', 'error');
    }
  }

  async function deleteKelas(id) {
    if (!confirm('Apakah Anda yakin ingin menghapus data kelas ini?')) return;
    const res = await api('kelas_delete', { id });
    if (res.success) {
      showToast(res.message);
      await reloadAllData();
      renderKelasView();
    }
  }

  async function deleteAllKelas() {
    if (!confirm('PERINGATAN: Apakah Anda yakin ingin menghapus SELURUH kelas? Tindakan ini tidak dapat dibatalkan!')) return;
    const res = await api('kelas_delete_all');
    if (res.success) {
      showToast(res.message);
      await reloadAllData();
      renderKelasView();
    }
  }

  function downloadTemplateKelasExcel() {
    if (typeof XLSX === 'undefined') return showToast('Pustaka SheetJS belum termuat.', 'error');
    const ws_data = [
      ['kode_kelas', 'nama_kelas', 'jenjang', 'wali_kelas'],
      ['VII-A', 'Kelas VII-A', 'VII', 'Budi Santoso, S.Pd.'],
      ['VIII-A', 'Kelas VIII-A', 'VIII', 'Ahmad Fauzi, S.Pd.I.']
    ];
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    XLSX.utils.book_append_sheet(wb, ws, 'Template_Kelas');
    XLSX.writeFile(wb, 'Template_Import_Data_Kelas.xlsx');
  }

  function exportKelasExcel() {
    if (typeof XLSX === 'undefined') return showToast('Pustaka SheetJS belum termuat.', 'error');
    const ws_data = [['No', 'Kode Kelas', 'Nama Kelas', 'Jenjang', 'Wali Kelas', 'Jumlah Murid']];
    state.kelas.forEach((k, idx) => {
      const count = state.murid.filter((m) => m.kode_kelas === k.kode_kelas).length;
      ws_data.push([idx + 1, k.kode_kelas, k.nama_kelas, k.jenjang, k.wali_kelas, count]);
    });
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    XLSX.utils.book_append_sheet(wb, ws, 'Data_Kelas');
    XLSX.writeFile(wb, `Data_Kelas_SMP_${Date.now()}.xlsx`);
  }

  function importKelasExcel(event) {
    const file = event.target.files[0];
    if (!file || typeof XLSX === 'undefined') return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const wb = XLSX.read(data, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(ws);

        if (!json.length) return showToast('File Excel kosong.', 'warning');

        const rows = json.map((r) => ({
          kode_kelas: r.kode_kelas || r['Kode Kelas'] || '',
          nama_kelas: r.nama_kelas || r['Nama Kelas'] || '',
          jenjang: r.jenjang || r['Jenjang'] || '',
          wali_kelas: r.wali_kelas || r['Wali Kelas'] || ''
        }));

        const res = await api('kelas_bulk_import', { rows });
        if (res.success) {
          showToast(res.message);
          await reloadAllData();
          renderKelasView();
        }
      } catch (err) {
        showToast('Gagal memproses file Excel: ' + err.message, 'error');
      }
    };
    reader.readAsArrayBuffer(file);
    event.target.value = '';
  }

  // --- Mapel CRUD & Excel ---
  function renderMapelTable() {
    const tbody = document.getElementById('tbodyMapel');
    if (!tbody) return;

    tbody.innerHTML = state.mapel
      .map((m, idx) => {
        return `
          <tr class="hover:bg-slate-50/80 transition">
            <td class="py-2.5 px-3 text-center text-slate-500 font-semibold">${idx + 1}</td>
            <td class="py-2.5 px-3 text-center font-mono font-bold text-slate-700">${m.no_urut}</td>
            <td class="py-2.5 px-3 font-bold text-slate-800">${m.nama_mapel}</td>
            <td class="py-2.5 px-3 text-center">
              ${
                m.is_agama
                  ? `<span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200"><i class="fa-solid fa-hands-praying mr-1"></i>Pendidikan Agama</span>`
                  : `<span class="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600">Umum</span>`
              }
            </td>
            <td class="py-2.5 px-3 text-center">
              <div class="flex items-center justify-center gap-1">
                <button onclick="App.openMapelModal(${m.id})" class="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 transition" title="Edit Mapel">
                  <i class="fa-solid fa-pen-to-square"></i>
                </button>
                <button onclick="App.deleteMapel(${m.id})" class="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition" title="Hapus Mapel">
                  <i class="fa-solid fa-trash-can"></i>
                </button>
              </div>
            </td>
          </tr>
        `;
      })
      .join('');
  }

  function openMapelModal(id = 0) {
    const isEdit = id > 0;
    const m = isEdit ? state.mapel.find((x) => x.id === id) : null;

    const html = `
      <form onsubmit="App.saveMapelForm(event, ${id})" class="space-y-4">
        <div>
          <label class="block font-bold text-slate-700 mb-1">Nama Mata Pelajaran *</label>
          <input type="text" id="mapel_nama" required value="${m ? m.nama_mapel : ''}" placeholder="Contoh: Matematika" class="w-full text-xs font-semibold border border-slate-300 rounded-xl px-3 py-2 bg-white">
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block font-bold text-slate-700 mb-1">Nomor Urut Transkrip</label>
            <input type="number" id="mapel_no_urut" value="${m ? m.no_urut : state.mapel.length + 1}" class="w-full text-xs font-semibold border border-slate-300 rounded-xl px-3 py-2 bg-white">
          </div>
          <div>
            <label class="block font-bold text-slate-700 mb-1">Kategori Khusus</label>
            <label class="flex items-center gap-2 p-2 border border-slate-200 rounded-xl bg-slate-50 cursor-pointer text-xs mt-0.5">
              <input type="checkbox" id="mapel_is_agama" ${m && m.is_agama ? 'checked' : ''} class="rounded text-blue-600">
              <span class="font-bold text-slate-700">Mapel Pendidikan Agama</span>
            </label>
          </div>
        </div>

        <div class="pt-3 border-t border-slate-100 flex justify-end gap-2">
          <button type="button" onclick="App.closeModal()" class="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs">
            Batal
          </button>
          <button type="submit" class="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm">
            Simpan Mapel
          </button>
        </div>
      </form>
    `;

    openModal(isEdit ? 'Edit Mata Pelajaran' : 'Tambah Mapel Baru', html);
  }

  async function saveMapelForm(e, id) {
    e.preventDefault();
    const nama_mapel = document.getElementById('mapel_nama').value.trim();
    const no_urut = parseInt(document.getElementById('mapel_no_urut').value || 1, 10);
    const is_agama = document.getElementById('mapel_is_agama').checked ? 1 : 0;

    const res = await api('mapel_save', { id, nama_mapel, no_urut, is_agama });
    if (res.success) {
      showToast(res.message);
      closeModal();
      await reloadAllData();
      renderMapelTable();
    } else {
      showToast(res.message || 'Gagal menyimpan mata pelajaran', 'error');
    }
  }

  async function deleteMapel(id) {
    if (!confirm('Apakah Anda yakin ingin menghapus data mata pelajaran ini?')) return;
    const res = await api('mapel_delete', { id });
    if (res.success) {
      showToast(res.message);
      await reloadAllData();
      renderMapelTable();
    }
  }

  async function deleteAllMapel() {
    if (!confirm('PERINGATAN: Apakah Anda yakin ingin menghapus SELURUH mata pelajaran?')) return;
    const res = await api('mapel_delete_all');
    if (res.success) {
      showToast(res.message);
      await reloadAllData();
      renderMapelTable();
    }
  }

  function downloadTemplateMapelExcel() {
    if (typeof XLSX === 'undefined') return showToast('Pustaka SheetJS belum termuat.', 'error');
    const ws_data = [
      ['no_urut', 'nama_mapel', 'is_agama'],
      [1, 'Pendidikan Agama dan Budi Pekerti', 1],
      [2, 'Pendidikan Pancasila', 0],
      [3, 'Bahasa Indonesia', 0],
      [4, 'Matematika', 0]
    ];
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    XLSX.utils.book_append_sheet(wb, ws, 'Template_Mapel');
    XLSX.writeFile(wb, 'Template_Import_Data_Mapel.xlsx');
  }

  function exportMapelExcel() {
    if (typeof XLSX === 'undefined') return showToast('Pustaka SheetJS belum termuat.', 'error');
    const ws_data = [['No', 'No. Urut Transkrip', 'Nama Mata Pelajaran', 'Kategori']];
    state.mapel.forEach((m, idx) => {
      ws_data.push([idx + 1, m.no_urut, m.nama_mapel, m.is_agama ? 'Pendidikan Agama' : 'Umum']);
    });
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    XLSX.utils.book_append_sheet(wb, ws, 'Data_Mapel');
    XLSX.writeFile(wb, `Data_Mapel_SMP_${Date.now()}.xlsx`);
  }

  function importMapelExcel(event) {
    const file = event.target.files[0];
    if (!file || typeof XLSX === 'undefined') return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const wb = XLSX.read(data, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(ws);

        if (!json.length) return showToast('File Excel kosong.', 'warning');

        const rows = json.map((r, i) => ({
          no_urut: parseInt(r.no_urut || r['No. Urut'] || i + 1, 10),
          nama_mapel: r.nama_mapel || r['Nama Mapel'] || '',
          is_agama: r.is_agama !== undefined ? parseInt(r.is_agama, 10) : 0
        }));

        const res = await api('mapel_bulk_import', { rows });
        if (res.success) {
          showToast(res.message);
          await reloadAllData();
          renderMapelTable();
        }
      } catch (err) {
        showToast('Gagal memproses file Excel: ' + err.message, 'error');
      }
    };
    reader.readAsArrayBuffer(file);
    event.target.value = '';
  }

  // ==================== 3. NILAI SUMATIF & LEGGER ====================
  function switchSumatifTab(tab) {
    currentSumatifTab = tab;
    const btnInput = document.getElementById('tab-sumatif-input');
    const btnRekap = document.getElementById('tab-sumatif-rekap');
    const panelInput = document.getElementById('panel-sumatif-input');
    const panelRekap = document.getElementById('panel-sumatif-rekap');

    if (tab === 'input') {
      if (btnInput) btnInput.className = 'px-4 py-2.5 rounded-xl text-xs font-bold transition bg-blue-600 text-white shadow-sm';
      if (btnRekap) btnRekap.className = 'px-4 py-2.5 rounded-xl text-xs font-bold transition text-slate-600 hover:bg-slate-100';
      if (panelInput) panelInput.classList.remove('hidden');
      if (panelRekap) panelRekap.classList.add('hidden');
      populateSumatifInputDropdowns();
      onSumatifFilterChange();
    } else {
      if (btnInput) btnInput.className = 'px-4 py-2.5 rounded-xl text-xs font-bold transition text-slate-600 hover:bg-slate-100';
      if (btnRekap) btnRekap.className = 'px-4 py-2.5 rounded-xl text-xs font-bold transition bg-blue-600 text-white shadow-sm';
      if (panelInput) panelInput.classList.add('hidden');
      if (panelRekap) panelRekap.classList.remove('hidden');
      populateSumatifRekapDropdowns();
      renderRekapSumatif();
      renderStatistikAntarKelas();
    }
  }

  function populateSumatifInputDropdowns() {
    const kSelect = document.getElementById('sumatifKelasSelect');
    const mSelect = document.getElementById('sumatifMapelSelect');

    if (kSelect && state.kelas.length > 0) {
      const cur = kSelect.value;
      kSelect.innerHTML = state.kelas
        .map((k) => `<option value="${k.kode_kelas}">${k.kode_kelas} - ${k.nama_kelas}</option>`)
        .join('');
      if (cur && state.kelas.some((x) => x.kode_kelas === cur)) kSelect.value = cur;
    }

    if (mSelect && state.mapel.length > 0) {
      const cur = mSelect.value;
      mSelect.innerHTML = state.mapel
        .map((m) => `<option value="${m.id}">${m.nama_mapel}</option>`)
        .join('');
      if (cur && state.mapel.some((x) => String(x.id) === String(cur))) mSelect.value = cur;
    }
  }

  function onSumatifFilterChange() {
    const kSelect = document.getElementById('sumatifKelasSelect');
    const mSelect = document.getElementById('sumatifMapelSelect');
    if (!kSelect || !mSelect) return;

    const kodeKelas = kSelect.value;
    const mapelId = parseInt(mSelect.value || 0, 10);

    const targetMapel = state.mapel.find((m) => m.id === mapelId);
    const banner = document.getElementById('agamaSpecialBanner');
    if (banner) {
      if (targetMapel && targetMapel.is_agama) banner.classList.remove('hidden');
      else banner.classList.add('hidden');
    }

    // Load config for (kodeKelas, mapelId)
    const conf = state.konfigurasi_sumatif.find((k) => k.kode_kelas === kodeKelas && k.mapel_id === mapelId);
    const targetKelas = state.kelas.find((k) => k.kode_kelas === kodeKelas);
    const defaultJml = targetKelas ? targetKelas.jml_sumatif || 3 : 3;

    const jmlSumatif = conf ? conf.jml_sumatif : defaultJml;
    const bSumatif = conf ? conf.bobot_sumatif : 50;
    const bSts = conf ? conf.bobot_sts : 25;
    const bSas = conf ? conf.bobot_sas : 25;

    const inputJml = document.getElementById('inputJmlSumatif');
    if (inputJml) inputJml.value = jmlSumatif;

    const labelKolom = document.getElementById('labelKolomSumatif');
    if (labelKolom) labelKolom.textContent = `(Kolom S1 - S${jmlSumatif})`;

    const bS = document.getElementById('bobotSumatifInput');
    const bT = document.getElementById('bobotStsInput');
    const bA = document.getElementById('bobotSasInput');
    if (bS) bS.value = bSumatif;
    if (bT) bT.value = bSts;
    if (bA) bA.value = bSas;

    renderSumatifInputTable();
  }

  function adjustJmlSumatif(delta) {
    const input = document.getElementById('inputJmlSumatif');
    if (!input) return;
    let val = parseInt(input.value || 3, 10) + delta;
    if (val < 1) val = 1;
    if (val > 15) val = 15;
    input.value = val;
    applyKonfigSumatif();
  }

  async function applyKonfigSumatif() {
    const kSelect = document.getElementById('sumatifKelasSelect');
    const mSelect = document.getElementById('sumatifMapelSelect');
    if (!kSelect || !mSelect) return;

    const kode_kelas = kSelect.value;
    const mapel_id = parseInt(mSelect.value || 0, 10);
    const jml_sumatif = parseInt(document.getElementById('inputJmlSumatif').value || 3, 10);
    const bobot_sumatif = parseFloat(document.getElementById('bobotSumatifInput').value || 50);
    const bobot_sts = parseFloat(document.getElementById('bobotStsInput').value || 25);
    const bobot_sas = parseFloat(document.getElementById('bobotSasInput').value || 25);

    const labelKolom = document.getElementById('labelKolomSumatif');
    if (labelKolom) labelKolom.textContent = `(Kolom S1 - S${jml_sumatif})`;

    const res = await api('konfig_sumatif_save', {
      kode_kelas,
      mapel_id,
      jml_sumatif,
      bobot_sumatif,
      bobot_sts,
      bobot_sas
    });

    if (res.success) {
      showToast('Konfigurasi kolom sumatif & bobot diterapkan!');
      await reloadAllData();
      renderSumatifInputTable();
    }
  }

  function renderSumatifInputTable() {
    const thead = document.getElementById('theadInputSumatif');
    const tbody = document.getElementById('tbodyInputSumatif');
    const tfoot = document.getElementById('tfootInputSumatif');
    if (!thead || !tbody) return;

    const kSelect = document.getElementById('sumatifKelasSelect');
    const mSelect = document.getElementById('sumatifMapelSelect');
    if (!kSelect || !mSelect) return;

    const kodeKelas = kSelect.value;
    const mapelId = parseInt(mSelect.value || 0, 10);
    const agamaFilter = (document.getElementById('sumatifAgamaFilter') || {}).value || '';

    const targetMapel = state.mapel.find((m) => m.id === mapelId);
    const isAgama = targetMapel ? targetMapel.is_agama : 0;
    const jmlSumatif = parseInt((document.getElementById('inputJmlSumatif') || {}).value || 3, 10);

    // Build thead
    let sumatifHeaders = '';
    for (let i = 1; i <= jmlSumatif; i++) {
      sumatifHeaders += `<th class="py-2 px-1 text-center border border-slate-200 bg-blue-50/70 text-blue-900 w-14">S${i}</th>`;
    }

    thead.innerHTML = `
      <tr class="bg-slate-100 text-slate-700 font-extrabold border-y border-slate-200 uppercase text-[11px]">
        <th class="py-2.5 px-2 text-center w-10 border border-slate-200">No</th>
        <th class="py-2.5 px-2.5 text-center w-28 border border-slate-200">NIS/NISN</th>
        <th class="py-2.5 px-3 border border-slate-200">Nama Murid</th>
        ${isAgama ? `<th class="py-2.5 px-2 text-center w-28 border border-slate-200">Agama Siswa</th>` : ''}
        ${sumatifHeaders}
        <th class="py-2.5 px-2 text-center border border-slate-200 bg-indigo-50/80 text-indigo-900 w-16">Rerata S</th>
        <th class="py-2.5 px-2 text-center border border-slate-200 bg-amber-50/80 text-amber-900 w-16">STS</th>
        <th class="py-2.5 px-2 text-center border border-slate-200 bg-purple-50/80 text-purple-900 w-16">SAS</th>
        <th class="py-2.5 px-2 text-center border border-slate-200 bg-emerald-100 text-emerald-950 font-extrabold w-20">Nilai Akhir</th>
      </tr>
    `;

    // Filter students
    let students = state.murid.filter((m) => m.kode_kelas === kodeKelas);
    if (agamaFilter) students = students.filter((m) => m.agama === agamaFilter);

    if (students.length === 0) {
      tbody.innerHTML = `<tr><td colspan="${7 + jmlSumatif}" class="py-8 text-center text-slate-400">Tidak ada murid pada kelas dan filter ini.</td></tr>`;
      if (tfoot) tfoot.innerHTML = '';
      return;
    }

    let bSumatif = parseFloat((document.getElementById('bobotSumatifInput') || {}).value || 50);
    let bSts = parseFloat((document.getElementById('bobotStsInput') || {}).value || 25);
    let bSas = parseFloat((document.getElementById('bobotSasInput') || {}).value || 25);
    let totalBobot = bSumatif + bSts + bSas;
    if (totalBobot <= 0) totalBobot = 100;

    let totalNA = 0;
    let countGraded = 0;

    tbody.innerHTML = students
      .map((m, idx) => {
        const valRow = state.nilai_sumatif.find((n) => n.murid_id === m.id && n.mapel_id === mapelId);
        const sObj = (valRow && valRow.nilai_s) || {};

        let sumS = 0;
        let sInputs = '';
        for (let i = 1; i <= jmlSumatif; i++) {
          const v = parseFloat(sObj['s' + i] || 0);
          sumS += v;
          sInputs += `
            <td class="p-1 border border-slate-200 text-center">
              <input type="number" min="0" max="100" data-murid="${m.id}" data-type="s" data-index="${i}" value="${v || ''}"
                oninput="App.recalcSumatifTableLive()"
                class="w-full text-center py-1 font-bold text-xs border border-slate-200 rounded focus:border-blue-500 focus:bg-blue-50/30 outline-none">
            </td>
          `;
        }

        const rerataS = Math.round((sumS / jmlSumatif) * 100) / 100;
        const sts = valRow ? parseFloat(valRow.sts || 0) : 0;
        const sas = valRow ? parseFloat(valRow.sas || 0) : 0;
        const na = valRow ? parseFloat(valRow.nilai_akhir || 0) : Math.round(((rerataS * bSumatif + sts * bSts + sas * bSas) / totalBobot) * 100) / 100;

        if (na > 0) {
          totalNA += na;
          countGraded++;
        }

        return `
          <tr class="hover:bg-slate-50/60 transition" id="row-sumatif-${m.id}">
            <td class="py-2 px-2 text-center text-slate-500 font-semibold border border-slate-200">${idx + 1}</td>
            <td class="py-2 px-2.5 text-center font-mono text-slate-600 border border-slate-200">${m.nis_nisn || '-'}</td>
            <td class="py-2 px-3 font-bold text-slate-800 border border-slate-200">${m.nama_murid}</td>
            ${
              isAgama
                ? `<td class="py-2 px-2 text-center text-[10px] font-semibold text-slate-600 border border-slate-200">${m.agama}</td>`
                : ''
            }
            ${sInputs}
            <td class="py-2 px-2 text-center font-bold text-indigo-700 bg-indigo-50/30 border border-slate-200" id="rerataS-${m.id}">
              ${rerataS}
            </td>
            <td class="p-1 border border-slate-200 text-center">
              <input type="number" min="0" max="100" data-murid="${m.id}" data-type="sts" value="${sts || ''}"
                oninput="App.recalcSumatifTableLive()"
                class="w-full text-center py-1 font-bold text-xs border border-slate-200 rounded focus:border-amber-500 focus:bg-amber-50/30 outline-none">
            </td>
            <td class="p-1 border border-slate-200 text-center">
              <input type="number" min="0" max="100" data-murid="${m.id}" data-type="sas" value="${sas || ''}"
                oninput="App.recalcSumatifTableLive()"
                class="w-full text-center py-1 font-bold text-xs border border-slate-200 rounded focus:border-purple-500 focus:bg-purple-50/30 outline-none">
            </td>
            <td class="py-2 px-2 text-center font-extrabold text-sm text-emerald-800 bg-emerald-50 border border-slate-200" id="na-${m.id}">
              ${na}
            </td>
          </tr>
        `;
      })
      .join('');

    const avgKelas = countGraded > 0 ? (totalNA / countGraded).toFixed(2) : '-';
    if (tfoot) {
      tfoot.innerHTML = `
        <tr class="bg-slate-100 font-extrabold text-slate-800 border-t-2 border-slate-300">
          <td colspan="${isAgama ? 4 : 3}" class="py-2.5 px-3 text-right">Rata-Rata Capaian Kelas:</td>
          <td colspan="${jmlSumatif + 3}" class="py-2.5 px-2 text-center text-xs text-slate-500 font-semibold">(Berdasarkan ${countGraded} Siswa yang telah dinilai)</td>
          <td class="py-2.5 px-2 text-center text-emerald-900 bg-emerald-200 font-extrabold text-sm" id="footerAvgSumatif">${avgKelas}</td>
        </tr>
      `;
    }
  }

  function recalcSumatifTableLive() {
    const kSelect = document.getElementById('sumatifKelasSelect');
    const mSelect = document.getElementById('sumatifMapelSelect');
    if (!kSelect || !mSelect) return;

    const jmlSumatif = parseInt((document.getElementById('inputJmlSumatif') || {}).value || 3, 10);
    const bSumatif = parseFloat((document.getElementById('bobotSumatifInput') || {}).value || 50);
    const bSts = parseFloat((document.getElementById('bobotStsInput') || {}).value || 25);
    const bSas = parseFloat((document.getElementById('bobotSasInput') || {}).value || 25);
    let totalBobot = bSumatif + bSts + bSas;
    if (totalBobot <= 0) totalBobot = 100;

    const rows = document.querySelectorAll('#tbodyInputSumatif tr');
    let totalNA = 0;
    let countGraded = 0;

    rows.forEach((row) => {
      const match = row.id && row.id.match(/^row-sumatif-(\d+)$/);
      if (!match) return;
      const muridId = match[1];

      let sumS = 0;
      for (let i = 1; i <= jmlSumatif; i++) {
        const inputS = row.querySelector(`input[data-murid="${muridId}"][data-type="s"][data-index="${i}"]`);
        const val = inputS ? parseFloat(inputS.value || 0) : 0;
        sumS += val;
      }

      const rerataS = Math.round((sumS / jmlSumatif) * 100) / 100;
      const inputSts = row.querySelector(`input[data-murid="${muridId}"][data-type="sts"]`);
      const sts = inputSts ? parseFloat(inputSts.value || 0) : 0;

      const inputSas = row.querySelector(`input[data-murid="${muridId}"][data-type="sas"]`);
      const sas = inputSas ? parseFloat(inputSas.value || 0) : 0;

      const na = Math.round(((rerataS * bSumatif + sts * bSts + sas * bSas) / totalBobot) * 100) / 100;

      const elRerataS = document.getElementById(`rerataS-${muridId}`);
      if (elRerataS) elRerataS.textContent = rerataS;

      const elNa = document.getElementById(`na-${muridId}`);
      if (elNa) elNa.textContent = na;

      if (na > 0) {
        totalNA += na;
        countGraded++;
      }
    });

    const footerAvg = document.getElementById('footerAvgSumatif');
    if (footerAvg) {
      footerAvg.textContent = countGraded > 0 ? (totalNA / countGraded).toFixed(2) : '-';
    }
  }

  async function saveAllNilaiSumatif() {
    const kSelect = document.getElementById('sumatifKelasSelect');
    const mSelect = document.getElementById('sumatifMapelSelect');
    if (!kSelect || !mSelect) return;

    const kode_kelas = kSelect.value;
    const mapel_id = parseInt(mSelect.value || 0, 10);
    const jml_sumatif = parseInt((document.getElementById('inputJmlSumatif') || {}).value || 3, 10);
    const bobot_sumatif = parseFloat((document.getElementById('bobotSumatifInput') || {}).value || 50);
    const bobot_sts = parseFloat((document.getElementById('bobotStsInput') || {}).value || 25);
    const bobot_sas = parseFloat((document.getElementById('bobotSasInput') || {}).value || 25);

    const rows = [];
    const trList = document.querySelectorAll('#tbodyInputSumatif tr');
    trList.forEach((tr) => {
      const match = tr.id && tr.id.match(/^row-sumatif-(\d+)$/);
      if (!match) return;
      const murid_id = parseInt(match[1], 10);

      const nilai_s = {};
      for (let i = 1; i <= jml_sumatif; i++) {
        const inp = tr.querySelector(`input[data-murid="${murid_id}"][data-type="s"][data-index="${i}"]`);
        nilai_s['s' + i] = inp ? parseFloat(inp.value || 0) : 0;
      }

      const inpSts = tr.querySelector(`input[data-murid="${murid_id}"][data-type="sts"]`);
      const sts = inpSts ? parseFloat(inpSts.value || 0) : 0;

      const inpSas = tr.querySelector(`input[data-murid="${murid_id}"][data-type="sas"]`);
      const sas = inpSas ? parseFloat(inpSas.value || 0) : 0;

      rows.push({
        murid_id,
        nilai_s,
        sts,
        sas
      });
    });

    const res = await api('nilai_sumatif_bulk_save', {
      kode_kelas,
      mapel_id,
      jml_sumatif,
      bobot_sumatif,
      bobot_sts,
      bobot_sas,
      rows
    });

    if (res.success) {
      showToast(res.message);
      await reloadAllData();
      renderSumatifInputTable();
    } else {
      showToast(res.message || 'Gagal menyimpan nilai', 'error');
    }
  }

  function exportSumatifExcel() {
    if (typeof XLSX === 'undefined') return showToast('Pustaka SheetJS belum termuat.', 'error');
    const kSelect = document.getElementById('sumatifKelasSelect');
    const mSelect = document.getElementById('sumatifMapelSelect');
    if (!kSelect || !mSelect) return;

    const kodeKelas = kSelect.value;
    const mapelId = parseInt(mSelect.value || 0, 10);
    const targetMapel = state.mapel.find((m) => m.id === mapelId);
    const mapelName = targetMapel ? targetMapel.nama_mapel : 'Mapel';
    const jmlSumatif = parseInt((document.getElementById('inputJmlSumatif') || {}).value || 3, 10);

    const headers = ['No', 'NISN', 'Nama Murid'];
    for (let i = 1; i <= jmlSumatif; i++) headers.push(`S${i}`);
    headers.push('Rerata Sumatif', 'STS', 'SAS', 'Nilai Akhir');

    const ws_data = [
      [`NILAI SUMATIF - KELAS ${kodeKelas} - ${mapelName.toUpperCase()}`],
      [`Tahun Ajaran: ${state.settings.set_tahun_ajaran || '2026/2027'} - Semester: ${state.settings.set_semester || 'Ganjil'}`],
      [],
      headers
    ];

    const students = state.murid.filter((m) => m.kode_kelas === kodeKelas);
    students.forEach((m, idx) => {
      const valRow = state.nilai_sumatif.find((n) => n.murid_id === m.id && n.mapel_id === mapelId);
      const sObj = (valRow && valRow.nilai_s) || {};

      const row = [idx + 1, m.nis_nisn, m.nama_murid];
      for (let i = 1; i <= jmlSumatif; i++) {
        row.push(sObj['s' + i] || 0);
      }
      row.push(
        valRow ? valRow.rerata_sumatif : 0,
        valRow ? valRow.sts : 0,
        valRow ? valRow.sas : 0,
        valRow ? valRow.nilai_akhir : 0
      );
      ws_data.push(row);
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    XLSX.utils.book_append_sheet(wb, ws, 'Nilai_Sumatif');
    XLSX.writeFile(wb, `Nilai_Sumatif_${kodeKelas}_${mapelName.replace(/\s+/g, '_')}.xlsx`);
  }

  function importSumatifExcel(event) {
    const file = event.target.files[0];
    if (!file || typeof XLSX === 'undefined') return;

    const kSelect = document.getElementById('sumatifKelasSelect');
    const mSelect = document.getElementById('sumatifMapelSelect');
    if (!kSelect || !mSelect) return;

    const kode_kelas = kSelect.value;
    const mapel_id = parseInt(mSelect.value || 0, 10);
    const jml_sumatif = parseInt((document.getElementById('inputJmlSumatif') || {}).value || 3, 10);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const wb = XLSX.read(data, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(ws, { header: 1 });

        // Find header row containing 'NISN' or 'Nama Murid'
        let headerIdx = -1;
        for (let i = 0; i < json.length; i++) {
          const rowStr = JSON.stringify(json[i]);
          if (rowStr.includes('NISN') || rowStr.includes('Nama Murid')) {
            headerIdx = i;
            break;
          }
        }

        if (headerIdx === -1) return showToast('Format header Excel tidak dikenali.', 'warning');

        const headers = json[headerIdx].map((h) => String(h || '').trim());
        const dataRows = json.slice(headerIdx + 1);

        const rows = [];
        dataRows.forEach((r) => {
          if (!r || !r.length) return;
          const nisn = String(r[1] || '').trim();
          const nama = String(r[2] || '').trim();

          const st = state.murid.find(
            (m) =>
              m.kode_kelas === kode_kelas &&
              ((nisn && m.nis_nisn === nisn) || m.nama_murid.toLowerCase().trim() === nama.toLowerCase().trim())
          );
          if (!st) return;

          const nilai_s = {};
          let sColStart = 3;
          for (let i = 1; i <= jml_sumatif; i++) {
            nilai_s['s' + i] = parseFloat(r[sColStart + i - 1] || 0);
          }

          const sts = parseFloat(r[sColStart + jml_sumatif + 1] || 0);
          const sas = parseFloat(r[sColStart + jml_sumatif + 2] || 0);

          rows.push({
            murid_id: st.id,
            nilai_s,
            sts,
            sas
          });
        });

        if (rows.length === 0) return showToast('Tidak ada siswa yang cocok dengan kelas ini.', 'warning');

        const bSumatif = parseFloat((document.getElementById('bobotSumatifInput') || {}).value || 50);
        const bSts = parseFloat((document.getElementById('bobotStsInput') || {}).value || 25);
        const bSas = parseFloat((document.getElementById('bobotSasInput') || {}).value || 25);

        const res = await api('nilai_sumatif_bulk_save', {
          kode_kelas,
          mapel_id,
          jml_sumatif,
          bobot_sumatif: bSumatif,
          bobot_sts: bSts,
          bobot_sas: bSas,
          rows
        });

        if (res.success) {
          showToast(`Berhasil mengimpor ${rows.length} nilai murid!`);
          await reloadAllData();
          renderSumatifInputTable();
        }
      } catch (err) {
        showToast('Gagal memproses import nilai: ' + err.message, 'error');
      }
    };
    reader.readAsArrayBuffer(file);
    event.target.value = '';
  }

  // --- Rekap Legger Matriks & Cetak ---
  function populateSumatifRekapDropdowns() {
    const kSelect = document.getElementById('rekapKelasSelect');
    if (kSelect && state.kelas.length > 0) {
      kSelect.innerHTML = state.kelas
        .map((k) => `<option value="${k.kode_kelas}">${k.kode_kelas} - ${k.nama_kelas}</option>`)
        .join('');
    }

    const statMapel = document.getElementById('statAntarKelasMapelFilter');
    if (statMapel && state.mapel.length > 0) {
      statMapel.innerHTML =
        `<option value="">Semua Mata Pelajaran (Gabungan)</option>` +
        state.mapel.map((m) => `<option value="${m.id}">${m.nama_mapel}</option>`).join('');
    }
  }

  function renderRekapSumatif() {
    const kCards = document.getElementById('rekapKelasCards');
    if (kCards) {
      kCards.innerHTML = state.kelas
        .map((k) => {
          const count = state.murid.filter((m) => m.kode_kelas === k.kode_kelas).length;
          return `
            <div onclick="document.getElementById('rekapKelasSelect').value='${k.kode_kelas}'; App.renderRekapSumatif();"
              class="bg-white rounded-2xl border border-slate-200 p-4 hover:border-blue-500 hover:shadow-md transition cursor-pointer space-y-2">
              <div class="flex items-center justify-between">
                <span class="text-xs font-extrabold text-blue-700">${k.nama_kelas}</span>
                <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">${count} Murid</span>
              </div>
              <p class="text-[11px] text-slate-500 truncate">Wali: <b>${k.wali_kelas || '-'}</b></p>
              <div class="pt-1 text-[10px] text-blue-600 font-bold flex items-center gap-1">
                <i class="fa-solid fa-table"></i> Klik untuk Buka Legger Matriks
              </div>
            </div>
          `;
        })
        .join('');
    }

    const kSelect = document.getElementById('rekapKelasSelect');
    if (!kSelect) return;
    const kodeKelas = kSelect.value;
    const students = state.murid.filter((m) => m.kode_kelas === kodeKelas);

    const thead = document.getElementById('theadRekapMatrix');
    const tbody = document.getElementById('tbodyRekapMatrix');
    const tfoot = document.getElementById('tfootRekapMatrix');
    const title = document.getElementById('rekapMatrixTitle');
    const subtitle = document.getElementById('rekapMatrixSubtitle');

    if (title) title.textContent = `Legger Nilai Matriks Kelas ${kodeKelas}`;
    const targetK = state.kelas.find((k) => k.kode_kelas === kodeKelas);
    if (subtitle) {
      subtitle.textContent = `Wali Kelas: ${targetK ? targetK.wali_kelas || '-' : '-'} • Total ${students.length} Siswa Terdaftar`;
    }

    if (!thead || !tbody) return;

    // Headers: No, NISN, Nama, [Mapel 1..N], Total, Rerata, Ranking
    let mapelHeaders = state.mapel
      .map(
        (m) =>
          `<th class="py-2.5 px-2 text-center border border-slate-200 bg-slate-50 text-[10px] min-w-[70px]" title="${m.nama_mapel}">
            ${m.nama_mapel.length > 12 ? m.nama_mapel.substring(0, 10) + '..' : m.nama_mapel}
          </th>`
      )
      .join('');

    thead.innerHTML = `
      <tr class="bg-slate-100 text-slate-800 font-extrabold uppercase text-[10px] border-y border-slate-200">
        <th class="py-2.5 px-2 text-center w-8 border border-slate-200">No</th>
        <th class="py-2.5 px-2 text-center w-24 border border-slate-200">NISN</th>
        <th class="py-2.5 px-3 border border-slate-200 min-w-[160px]">Nama Siswa</th>
        ${mapelHeaders}
        <th class="py-2.5 px-2 text-center border border-slate-200 bg-indigo-100 text-indigo-950 w-16">Total</th>
        <th class="py-2.5 px-2 text-center border border-slate-200 bg-blue-100 text-blue-950 w-16">Rerata</th>
        <th class="py-2.5 px-2 text-center border border-slate-200 bg-amber-100 text-amber-950 w-12">Rank</th>
      </tr>
    `;

    // Calculate student totals for ranking
    const studentStats = students.map((m) => {
      let total = 0;
      let count = 0;
      const grades = {};
      state.mapel.forEach((map) => {
        const valRow = state.nilai_sumatif.find((n) => n.murid_id === m.id && n.mapel_id === map.id);
        const val = valRow ? parseFloat(valRow.nilai_akhir || 0) : 0;
        grades[map.id] = val;
        if (val > 0) {
          total += val;
          count++;
        }
      });
      const avg = count > 0 ? Math.round((total / count) * 100) / 100 : 0;
      return { murid: m, grades, total: Math.round(total * 100) / 100, avg };
    });

    // Rank sorting
    const sorted = [...studentStats].sort((a, b) => b.total - a.total);
    sorted.forEach((item, rIdx) => {
      item.rank = rIdx + 1;
    });

    if (studentStats.length === 0) {
      tbody.innerHTML = `<tr><td colspan="${4 + state.mapel.length}" class="py-8 text-center text-slate-400">Tidak ada murid di kelas ini.</td></tr>`;
      if (tfoot) tfoot.innerHTML = '';
      return;
    }

    tbody.innerHTML = studentStats
      .map((st, idx) => {
        const gradeCols = state.mapel
          .map((m) => {
            const v = st.grades[m.id];
            const cls = v >= 75 ? 'text-slate-800' : v > 0 ? 'text-red-600 font-bold' : 'text-slate-300';
            return `<td class="py-2 px-1 text-center font-bold text-xs border border-slate-200 ${cls}">${v || '-'}</td>`;
          })
          .join('');

        return `
          <tr class="hover:bg-slate-50 transition">
            <td class="py-2 px-2 text-center text-slate-500 font-semibold border border-slate-200">${idx + 1}</td>
            <td class="py-2 px-2 text-center font-mono text-slate-600 text-[11px] border border-slate-200">${st.murid.nis_nisn || '-'}</td>
            <td class="py-2 px-3 font-bold text-slate-800 text-xs border border-slate-200">${st.murid.nama_murid}</td>
            ${gradeCols}
            <td class="py-2 px-2 text-center font-extrabold text-xs text-indigo-900 bg-indigo-50/50 border border-slate-200">${st.total}</td>
            <td class="py-2 px-2 text-center font-extrabold text-xs text-blue-900 bg-blue-50/50 border border-slate-200">${st.avg}</td>
            <td class="py-2 px-2 text-center font-extrabold text-xs text-amber-900 bg-amber-50/50 border border-slate-200">${st.rank}</td>
          </tr>
        `;
      })
      .join('');

    // Footer averages
    let mapelAvgCols = state.mapel
      .map((m) => {
        const scores = studentStats.map((s) => s.grades[m.id]).filter((v) => v > 0);
        const avg = scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : '-';
        return `<td class="py-2 px-1 text-center font-extrabold text-xs border border-slate-200 bg-slate-100">${avg}</td>`;
      })
      .join('');

    if (tfoot) {
      tfoot.innerHTML = `
        <tr class="bg-slate-100 font-extrabold text-slate-800 border-t-2 border-slate-300">
          <td colspan="3" class="py-2 px-3 text-right">Rata-Rata Mata Pelajaran:</td>
          ${mapelAvgCols}
          <td colspan="3" class="py-2 px-2 text-center text-xs text-slate-500 font-semibold">Legger Matriks Kelas ${kodeKelas}</td>
        </tr>
      `;
    }
  }

  function exportLeggerExcel() {
    if (typeof XLSX === 'undefined') return showToast('Pustaka SheetJS belum termuat.', 'error');
    const kSelect = document.getElementById('rekapKelasSelect');
    if (!kSelect) return;
    const kodeKelas = kSelect.value;
    const targetK = state.kelas.find((k) => k.kode_kelas === kodeKelas);
    const students = state.murid.filter((m) => m.kode_kelas === kodeKelas);

    const headers = ['No', 'NISN', 'Nama Murid'];
    state.mapel.forEach((m) => headers.push(m.nama_mapel));
    headers.push('Total Nilai', 'Rata-Rata', 'Peringkat');

    const ws_data = [
      [`LEGGER NILAI MATRIKS KELAS - ${kodeKelas}`],
      [`Sekolah: ${state.settings.set_kop_baris2_sekolah || 'SMP NEGERI 1 NUSANTARA'}`],
      [`Wali Kelas: ${targetK ? targetK.wali_kelas : '-'} • Tahun Ajaran: ${state.settings.set_tahun_ajaran || '2026/2027'} (${state.settings.set_semester || 'Ganjil'})`],
      [],
      headers
    ];

    const studentStats = students.map((m) => {
      let total = 0;
      let count = 0;
      const grades = {};
      state.mapel.forEach((map) => {
        const valRow = state.nilai_sumatif.find((n) => n.murid_id === m.id && n.mapel_id === map.id);
        const val = valRow ? parseFloat(valRow.nilai_akhir || 0) : 0;
        grades[map.id] = val;
        if (val > 0) {
          total += val;
          count++;
        }
      });
      const avg = count > 0 ? Math.round((total / count) * 100) / 100 : 0;
      return { murid: m, grades, total, avg };
    });

    const sorted = [...studentStats].sort((a, b) => b.total - a.total);
    sorted.forEach((item, rIdx) => {
      item.rank = rIdx + 1;
    });

    studentStats.forEach((st, idx) => {
      const row = [idx + 1, st.murid.nis_nisn, st.murid.nama_murid];
      state.mapel.forEach((m) => row.push(st.grades[m.id] || 0));
      row.push(st.total, st.avg, st.rank);
      ws_data.push(row);
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    XLSX.utils.book_append_sheet(wb, ws, 'Legger_Kelas');
    XLSX.writeFile(wb, `Legger_Kelas_${kodeKelas}.xlsx`);
  }

  function renderStatistikAntarKelas() {
    const tbody = document.getElementById('tbodyStatAntarKelas');
    if (!tbody) return;

    const filterMapelId = parseInt((document.getElementById('statAntarKelasMapelFilter') || {}).value || 0, 10);

    tbody.innerHTML = state.kelas
      .map((k, idx) => {
        const count = state.murid.filter((m) => m.kode_kelas === k.kode_kelas).length;

        let scores = state.nilai_sumatif.filter((n) => n.kode_kelas === k.kode_kelas);
        if (filterMapelId > 0) scores = scores.filter((n) => n.mapel_id === filterMapelId);

        const validNA = scores.map((s) => s.nilai_akhir).filter((v) => v > 0);
        const validS = scores.map((s) => s.rerata_sumatif).filter((v) => v > 0);
        const validSTS = scores.map((s) => s.sts).filter((v) => v > 0);
        const validSAS = scores.map((s) => s.sas).filter((v) => v > 0);

        const rS = validS.length > 0 ? (validS.reduce((a, b) => a + b, 0) / validS.length).toFixed(1) : '-';
        const rSTS = validSTS.length > 0 ? (validSTS.reduce((a, b) => a + b, 0) / validSTS.length).toFixed(1) : '-';
        const rSAS = validSAS.length > 0 ? (validSAS.reduce((a, b) => a + b, 0) / validSAS.length).toFixed(1) : '-';
        const rNA = validNA.length > 0 ? (validNA.reduce((a, b) => a + b, 0) / validNA.length).toFixed(1) : '-';

        const max = validNA.length > 0 ? Math.max(...validNA) : '-';
        const min = validNA.length > 0 ? Math.min(...validNA) : '-';

        return `
          <tr class="hover:bg-slate-50 transition">
            <td class="py-2.5 px-3 text-center text-slate-500 font-semibold">${idx + 1}</td>
            <td class="py-2.5 px-3 font-mono font-bold text-blue-700">${k.kode_kelas}</td>
            <td class="py-2.5 px-3 font-bold text-slate-800">${k.nama_kelas}</td>
            <td class="py-2.5 px-3 text-slate-700">${k.wali_kelas || '-'}</td>
            <td class="py-2.5 px-3 text-center font-bold text-slate-700">${count}</td>
            <td class="py-2.5 px-3 text-center font-bold text-blue-800 bg-blue-50/30">${rS}</td>
            <td class="py-2.5 px-3 text-center font-bold text-indigo-800 bg-indigo-50/30">${rSTS}</td>
            <td class="py-2.5 px-3 text-center font-bold text-purple-800 bg-purple-50/30">${rSAS}</td>
            <td class="py-2.5 px-3 text-center font-extrabold text-emerald-900 bg-emerald-50">${rNA}</td>
            <td class="py-2.5 px-3 text-center font-bold text-slate-700">${max}</td>
            <td class="py-2.5 px-3 text-center font-bold text-slate-700">${min}</td>
          </tr>
        `;
      })
      .join('');
  }

  function printRekap(type) {
    const printArea = document.getElementById('printArea');
    if (!printArea) return;

    const s = state.settings;
    const kSelect = document.getElementById('rekapKelasSelect');
    const kodeKelas = kSelect ? kSelect.value : 'VII-A';
    const targetK = state.kelas.find((k) => k.kode_kelas === kodeKelas);

    let contentHtml = '';
    if (type === 'legger') {
      const matrixTable = document.getElementById('tableRekapMatrix');
      contentHtml = `
        <div class="space-y-4">
          <div class="text-center pb-2">
            <h2 class="text-base font-bold uppercase tracking-wider">REKAPITULASI NILAI LEGER KELAS</h2>
            <p class="text-xs">Kelas: <b>${kodeKelas}</b> • Rombel: <b>${targetK ? targetK.nama_kelas : kodeKelas}</b> • Semester: <b>${s.set_semester || 'Ganjil'}</b> • Tahun Ajaran: <b>${s.set_tahun_ajaran || '2026/2027'}</b></p>
          </div>
          <table class="w-full text-xs border-collapse">
            ${matrixTable ? matrixTable.innerHTML : ''}
          </table>
          <div class="grid grid-cols-2 pt-8 text-xs">
            <div class="text-center space-y-12">
              <p>Mengetahui,<br>Kepala Sekolah,</p>
              <div>
                <b class="underline block">${s.set_kepsek_nama || 'Dr. H. Hendra Wijaya, M.Pd.'}</b>
                <span>NIP. ${s.set_kepsek_nip || '-'}</span>
              </div>
            </div>
            <div class="text-center space-y-12">
              <p>${s.set_titimangsa_kota || 'Nusantara'}, ${s.set_titimangsa_tanggal || '20 Juni 2026'}<br>Wali Kelas,</p>
              <div>
                <b class="underline block">${targetK ? targetK.wali_kelas || 'Wali Kelas' : 'Wali Kelas'}</b>
                <span>Guru Pembimbing</span>
              </div>
            </div>
          </div>
        </div>
      `;
    } else {
      contentHtml = `
        <div class="space-y-4">
          <div class="text-center pb-2">
            <h2 class="text-base font-bold uppercase tracking-wider">STATISTIK NILAI ANTAR KELAS</h2>
            <p class="text-xs">Tahun Ajaran: <b>${s.set_tahun_ajaran || '2026/2027'}</b> • Semester: <b>${s.set_semester || 'Ganjil'}</b></p>
          </div>
          <table class="w-full text-xs border-collapse">
            ${document.querySelector('#view-sumatif table') ? document.querySelector('#view-sumatif table').innerHTML : ''}
          </table>
        </div>
      `;
    }

    printArea.innerHTML = `
      <div class="preview-document p-6 space-y-4 max-w-4xl mx-auto bg-white text-black">
        ${getOfficialKopHtml()}
        ${contentHtml}
      </div>
    `;

    window.print();
  }

  // ==================== 4. ANALISIS KELAS IX ====================
  function switchKelas9Tab(tab) {
    currentKelas9Tab = tab;
    ['input', 'sknr', 'skl', 'transkrip'].forEach((t) => {
      const btn = document.getElementById(`tab-k9-${t}`);
      const panel = document.getElementById(`panel-k9-${t}`);
      if (btn && panel) {
        if (t === tab) {
          btn.className = 'px-4 py-2.5 rounded-xl text-xs font-bold transition bg-blue-600 text-white shadow-sm';
          panel.classList.remove('hidden');
        } else {
          btn.className = 'px-4 py-2.5 rounded-xl text-xs font-bold transition text-slate-600 hover:bg-slate-100';
          panel.classList.add('hidden');
        }
      }
    });

    if (tab === 'input') {
      populateKelas9InputDropdowns();
      renderKelas9Table();
    } else if (tab === 'sknr') {
      populateKelas9DocDropdowns('sknr');
      renderSknrView();
    } else if (tab === 'skl') {
      populateKelas9DocDropdowns('skl');
      renderSklView();
    } else if (tab === 'transkrip') {
      populateKelas9DocDropdowns('transkrip');
      renderTranskripView();
    }
  }

  function populateKelas9InputDropdowns() {
    const kSelect = document.getElementById('kelas9KelasSelect');
    const mSelect = document.getElementById('kelas9MapelSelect');

    const k9Classes = state.kelas.filter((k) => k.jenjang === 'IX');
    if (kSelect && k9Classes.length > 0) {
      const cur = kSelect.value;
      kSelect.innerHTML = k9Classes
        .map((k) => `<option value="${k.kode_kelas}">${k.kode_kelas} - ${k.nama_kelas}</option>`)
        .join('');
      if (cur && k9Classes.some((x) => x.kode_kelas === cur)) kSelect.value = cur;
    }

    if (mSelect && state.mapel.length > 0) {
      const cur = mSelect.value;
      mSelect.innerHTML = state.mapel
        .map((m) => `<option value="${m.id}">${m.nama_mapel}</option>`)
        .join('');
      if (cur && state.mapel.some((x) => String(x.id) === String(cur))) mSelect.value = cur;
    }

    const s = state.settings;
    const bR = document.getElementById('k9_bobot_rapor');
    const bU = document.getElementById('k9_bobot_us');
    const bUt = document.getElementById('k9_bobot_us_tulis');
    const bUp = document.getElementById('k9_bobot_us_praktik');
    if (bR) bR.value = s.k9_bobot_rapor || 60;
    if (bU) bU.value = s.k9_bobot_us || 40;
    if (bUt) bUt.value = s.k9_bobot_us_tulis || 60;
    if (bUp) bUp.value = s.k9_bobot_us_praktik || 40;
  }

  function renderKelas9Table() {
    const tbody = document.getElementById('tbodyKelas9');
    const tfoot = document.getElementById('tfootKelas9');
    if (!tbody) return;

    const kSelect = document.getElementById('kelas9KelasSelect');
    const mSelect = document.getElementById('kelas9MapelSelect');
    if (!kSelect || !mSelect) return;

    const kodeKelas = kSelect.value;
    const mapelId = parseInt(mSelect.value || 0, 10);

    const bRapor = parseFloat((document.getElementById('k9_bobot_rapor') || {}).value || 60);
    const bUs = parseFloat((document.getElementById('k9_bobot_us') || {}).value || 40);
    const bTulis = parseFloat((document.getElementById('k9_bobot_us_tulis') || {}).value || 60);
    const bPraktik = parseFloat((document.getElementById('k9_bobot_us_praktik') || {}).value || 40);

    const totUs = bTulis + bPraktik > 0 ? bTulis + bPraktik : 100;
    const totNa = bRapor + bUs > 0 ? bRapor + bUs : 100;

    const students = state.murid.filter((m) => m.kode_kelas === kodeKelas);

    if (students.length === 0) {
      tbody.innerHTML = `<tr><td colspan="15" class="py-8 text-center text-slate-400">Tidak ada murid di kelas IX ini.</td></tr>`;
      if (tfoot) tfoot.innerHTML = '';
      return;
    }

    let totalNA = 0;
    let countGraded = 0;

    tbody.innerHTML = students
      .map((m, idx) => {
        const row = state.nilai_kelas9.find((n) => n.murid_id === m.id && n.mapel_id === mapelId);

        const s1 = row ? parseFloat(row.sem1 || 0) : 0;
        const s2 = row ? parseFloat(row.sem2 || 0) : 0;
        const s3 = row ? parseFloat(row.sem3 || 0) : 0;
        const s4 = row ? parseFloat(row.sem4 || 0) : 0;
        const s5 = row ? parseFloat(row.sem5 || 0) : 0;
        const s6 = row ? parseFloat(row.sem6 || 0) : 0;
        const usT = row ? parseFloat(row.us_tulis || 0) : 0;
        const usP = row ? parseFloat(row.us_praktik || 0) : 0;

        const rRapor = Math.round(((s1 + s2 + s3 + s4 + s5 + s6) / 6) * 100) / 100;
        const rUs = Math.round(((usT * bTulis + usP * bPraktik) / totUs) * 100) / 100;
        const na = row ? parseFloat(row.nilai_akhir || 0) : Math.round(((rRapor * bRapor + rUs * bUs) / totNa) * 100) / 100;

        if (na > 0) {
          totalNA += na;
          countGraded++;
        }

        return `
          <tr class="hover:bg-slate-50 transition" id="row-k9-${m.id}">
            <td class="py-2 px-1 text-center text-slate-500 font-semibold border border-slate-200">${idx + 1}</td>
            <td class="py-2 px-2 text-center font-mono text-slate-600 text-xs border border-slate-200">${m.nis_nisn || '-'}</td>
            <td class="py-2 px-2 font-bold text-slate-800 text-xs border border-slate-200">${m.nama_murid}</td>
            
            <td class="p-0.5 border border-slate-200 text-center"><input type="number" min="0" max="100" data-murid="${m.id}" data-col="sem1" value="${s1 || ''}" oninput="App.recalcKelas9Live()" class="w-12 text-center py-1 font-bold text-xs border border-slate-200 rounded"></td>
            <td class="p-0.5 border border-slate-200 text-center"><input type="number" min="0" max="100" data-murid="${m.id}" data-col="sem2" value="${s2 || ''}" oninput="App.recalcKelas9Live()" class="w-12 text-center py-1 font-bold text-xs border border-slate-200 rounded"></td>
            <td class="p-0.5 border border-slate-200 text-center"><input type="number" min="0" max="100" data-murid="${m.id}" data-col="sem3" value="${s3 || ''}" oninput="App.recalcKelas9Live()" class="w-12 text-center py-1 font-bold text-xs border border-slate-200 rounded"></td>
            <td class="p-0.5 border border-slate-200 text-center"><input type="number" min="0" max="100" data-murid="${m.id}" data-col="sem4" value="${s4 || ''}" oninput="App.recalcKelas9Live()" class="w-12 text-center py-1 font-bold text-xs border border-slate-200 rounded"></td>
            <td class="p-0.5 border border-slate-200 text-center"><input type="number" min="0" max="100" data-murid="${m.id}" data-col="sem5" value="${s5 || ''}" oninput="App.recalcKelas9Live()" class="w-12 text-center py-1 font-bold text-xs border border-slate-200 rounded"></td>
            <td class="p-0.5 border border-slate-200 text-center"><input type="number" min="0" max="100" data-murid="${m.id}" data-col="sem6" value="${s6 || ''}" oninput="App.recalcKelas9Live()" class="w-12 text-center py-1 font-bold text-xs border border-slate-200 rounded"></td>
            
            <td class="py-2 px-1 text-center font-bold text-xs text-blue-700 bg-blue-50/40 border border-slate-200" id="k9-rrapor-${m.id}">${rRapor}</td>
            
            <td class="p-0.5 border border-slate-200 text-center"><input type="number" min="0" max="100" data-murid="${m.id}" data-col="us_tulis" value="${usT || ''}" oninput="App.recalcKelas9Live()" class="w-12 text-center py-1 font-bold text-xs border border-slate-200 rounded"></td>
            <td class="p-0.5 border border-slate-200 text-center"><input type="number" min="0" max="100" data-murid="${m.id}" data-col="us_praktik" value="${usP || ''}" oninput="App.recalcKelas9Live()" class="w-12 text-center py-1 font-bold text-xs border border-slate-200 rounded"></td>
            
            <td class="py-2 px-1 text-center font-bold text-xs text-indigo-700 bg-indigo-50/40 border border-slate-200" id="k9-rus-${m.id}">${rUs}</td>
            <td class="py-2 px-1 text-center font-extrabold text-xs text-emerald-800 bg-emerald-100 border border-slate-200" id="k9-na-${m.id}">${na}</td>
            
            <td class="py-2 px-1 text-center border border-slate-200">
              <button onclick="App.resetKelas9Row(${m.id})" class="text-red-500 hover:text-red-700 text-xs p-1" title="Reset Nilai Siswa">
                <i class="fa-solid fa-rotate-left"></i>
              </button>
            </td>
          </tr>
        `;
      })
      .join('');

    const avgKelas = countGraded > 0 ? (totalNA / countGraded).toFixed(2) : '-';
    if (tfoot) {
      tfoot.innerHTML = `
        <tr class="bg-slate-100 font-extrabold text-slate-800 border-t-2 border-slate-300">
          <td colspan="9" class="py-2 px-3 text-right">Rata-Rata Nilai Akhir Kelas:</td>
          <td colspan="4" class="py-2 px-2 text-center text-xs text-slate-500 font-semibold">(Berdasarkan ${countGraded} Siswa)</td>
          <td class="py-2 px-2 text-center text-emerald-900 bg-emerald-200 font-extrabold text-sm" id="footerAvgK9">${avgKelas}</td>
          <td></td>
        </tr>
      `;
    }
  }

  function recalcKelas9Live() {
    const bRapor = parseFloat((document.getElementById('k9_bobot_rapor') || {}).value || 60);
    const bUs = parseFloat((document.getElementById('k9_bobot_us') || {}).value || 40);
    const bTulis = parseFloat((document.getElementById('k9_bobot_us_tulis') || {}).value || 60);
    const bPraktik = parseFloat((document.getElementById('k9_bobot_us_praktik') || {}).value || 40);

    const totUs = bTulis + bPraktik > 0 ? bTulis + bPraktik : 100;
    const totNa = bRapor + bUs > 0 ? bRapor + bUs : 100;

    const rows = document.querySelectorAll('#tbodyKelas9 tr');
    let totalNA = 0;
    let countGraded = 0;

    rows.forEach((row) => {
      const match = row.id && row.id.match(/^row-k9-(\d+)$/);
      if (!match) return;
      const muridId = match[1];

      let sumSem = 0;
      for (let i = 1; i <= 6; i++) {
        const inp = row.querySelector(`input[data-murid="${muridId}"][data-col="sem${i}"]`);
        sumSem += inp ? parseFloat(inp.value || 0) : 0;
      }
      const rRapor = Math.round((sumSem / 6) * 100) / 100;

      const inpUt = row.querySelector(`input[data-murid="${muridId}"][data-col="us_tulis"]`);
      const ut = inpUt ? parseFloat(inpUt.value || 0) : 0;

      const inpUp = row.querySelector(`input[data-murid="${muridId}"][data-col="us_praktik"]`);
      const up = inpUp ? parseFloat(inpUp.value || 0) : 0;

      const rUs = Math.round(((ut * bTulis + up * bPraktik) / totUs) * 100) / 100;
      const na = Math.round(((rRapor * bRapor + rUs * bUs) / totNa) * 100) / 100;

      const elRRapor = document.getElementById(`k9-rrapor-${muridId}`);
      if (elRRapor) elRRapor.textContent = rRapor;

      const elRUs = document.getElementById(`k9-rus-${muridId}`);
      if (elRUs) elRUs.textContent = rUs;

      const elNa = document.getElementById(`k9-na-${muridId}`);
      if (elNa) elNa.textContent = na;

      if (na > 0) {
        totalNA += na;
        countGraded++;
      }
    });

    const footerAvg = document.getElementById('footerAvgK9');
    if (footerAvg) {
      footerAvg.textContent = countGraded > 0 ? (totalNA / countGraded).toFixed(2) : '-';
    }
  }

  async function saveAllNilaiKelas9() {
    const kSelect = document.getElementById('kelas9KelasSelect');
    const mSelect = document.getElementById('kelas9MapelSelect');
    if (!kSelect || !mSelect) return;

    const kode_kelas = kSelect.value;
    const mapel_id = parseInt(mSelect.value || 0, 10);
    const k9_bobot_rapor = parseFloat((document.getElementById('k9_bobot_rapor') || {}).value || 60);
    const k9_bobot_us = parseFloat((document.getElementById('k9_bobot_us') || {}).value || 40);
    const k9_bobot_us_tulis = parseFloat((document.getElementById('k9_bobot_us_tulis') || {}).value || 60);
    const k9_bobot_us_praktik = parseFloat((document.getElementById('k9_bobot_us_praktik') || {}).value || 40);

    const rows = [];
    const trList = document.querySelectorAll('#tbodyKelas9 tr');
    trList.forEach((tr) => {
      const match = tr.id && tr.id.match(/^row-k9-(\d+)$/);
      if (!match) return;
      const murid_id = parseInt(match[1], 10);

      const sem1 = parseFloat((tr.querySelector(`input[data-murid="${murid_id}"][data-col="sem1"]`) || {}).value || 0);
      const sem2 = parseFloat((tr.querySelector(`input[data-murid="${murid_id}"][data-col="sem2"]`) || {}).value || 0);
      const sem3 = parseFloat((tr.querySelector(`input[data-murid="${murid_id}"][data-col="sem3"]`) || {}).value || 0);
      const sem4 = parseFloat((tr.querySelector(`input[data-murid="${murid_id}"][data-col="sem4"]`) || {}).value || 0);
      const sem5 = parseFloat((tr.querySelector(`input[data-murid="${murid_id}"][data-col="sem5"]`) || {}).value || 0);
      const sem6 = parseFloat((tr.querySelector(`input[data-murid="${murid_id}"][data-col="sem6"]`) || {}).value || 0);
      const us_tulis = parseFloat((tr.querySelector(`input[data-murid="${murid_id}"][data-col="us_tulis"]`) || {}).value || 0);
      const us_praktik = parseFloat((tr.querySelector(`input[data-murid="${murid_id}"][data-col="us_praktik"]`) || {}).value || 0);

      rows.push({
        murid_id,
        sem1,
        sem2,
        sem3,
        sem4,
        sem5,
        sem6,
        us_tulis,
        us_praktik
      });
    });

    const res = await api('nilai_kelas9_bulk_save', {
      kode_kelas,
      mapel_id,
      k9_bobot_rapor,
      k9_bobot_us,
      k9_bobot_us_tulis,
      k9_bobot_us_praktik,
      rows
    });

    if (res.success) {
      showToast(res.message);
      await reloadAllData();
      renderKelas9Table();
    } else {
      showToast(res.message || 'Gagal menyimpan nilai kelas IX', 'error');
    }
  }

  async function saveKonfigKelas9() {
    const k9_bobot_rapor = parseFloat((document.getElementById('k9_bobot_rapor') || {}).value || 60);
    const k9_bobot_us = parseFloat((document.getElementById('k9_bobot_us') || {}).value || 40);
    const k9_bobot_us_tulis = parseFloat((document.getElementById('k9_bobot_us_tulis') || {}).value || 60);
    const k9_bobot_us_praktik = parseFloat((document.getElementById('k9_bobot_us_praktik') || {}).value || 40);

    const res = await api('konfig_kelas9_save', {
      k9_bobot_rapor,
      k9_bobot_us,
      k9_bobot_us_tulis,
      k9_bobot_us_praktik
    });

    if (res.success) {
      showToast(res.message);
      await reloadAllData();
      renderKelas9Table();
    }
  }

  async function resetKelas9Row(muridId) {
    const mSelect = document.getElementById('kelas9MapelSelect');
    if (!mSelect) return;
    const mapelId = parseInt(mSelect.value || 0, 10);
    if (!confirm('Reset nilai siswa ini pada mapel ini?')) return;
    const res = await api('nilai_kelas9_reset_row', { murid_id: muridId, mapel_id: mapelId });
    if (res.success) {
      showToast(res.message);
      await reloadAllData();
      renderKelas9Table();
    }
  }

  async function resetAllNilaiKelas9() {
    const kSelect = document.getElementById('kelas9KelasSelect');
    const mSelect = document.getElementById('kelas9MapelSelect');
    if (!kSelect || !mSelect) return;
    const kode_kelas = kSelect.value;
    const mapel_id = parseInt(mSelect.value || 0, 10);

    if (!confirm(`Yakin ingin mereset seluruh nilai siswa kelas ${kode_kelas} pada mapel ini?`)) return;
    const res = await api('nilai_kelas9_reset_all', { kode_kelas, mapel_id });
    if (res.success) {
      showToast(res.message);
      await reloadAllData();
      renderKelas9Table();
    }
  }

  function exportKelas9Excel() {
    if (typeof XLSX === 'undefined') return showToast('Pustaka SheetJS belum termuat.', 'error');
    const kSelect = document.getElementById('kelas9KelasSelect');
    const mSelect = document.getElementById('kelas9MapelSelect');
    if (!kSelect || !mSelect) return;

    const kodeKelas = kSelect.value;
    const mapelId = parseInt(mSelect.value || 0, 10);
    const targetMapel = state.mapel.find((m) => m.id === mapelId);
    const mapelName = targetMapel ? targetMapel.nama_mapel : 'Mapel';

    const headers = [
      'No', 'NISN', 'Nama Murid',
      'Sem 1', 'Sem 2', 'Sem 3', 'Sem 4', 'Sem 5', 'Sem 6', 'Rerata Rapor',
      'US Tulis', 'US Praktik', 'Rerata US', 'Nilai Akhir'
    ];

    const ws_data = [
      [`ANALISIS NILAI KELAS IX - ${kodeKelas} - ${mapelName.toUpperCase()}`],
      [`Tahun Ajaran: ${state.settings.set_tahun_ajaran || '2026/2027'}`],
      [],
      headers
    ];

    const students = state.murid.filter((m) => m.kode_kelas === kodeKelas);
    students.forEach((m, idx) => {
      const row = state.nilai_kelas9.find((n) => n.murid_id === m.id && n.mapel_id === mapelId);
      ws_data.push([
        idx + 1,
        m.nis_nisn,
        m.nama_murid,
        row ? row.sem1 : 0,
        row ? row.sem2 : 0,
        row ? row.sem3 : 0,
        row ? row.sem4 : 0,
        row ? row.sem5 : 0,
        row ? row.sem6 : 0,
        row ? row.rerata_rapor : 0,
        row ? row.us_tulis : 0,
        row ? row.us_praktik : 0,
        row ? row.rerata_us : 0,
        row ? row.nilai_akhir : 0
      ]);
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    XLSX.utils.book_append_sheet(wb, ws, 'Analisis_Kelas9');
    XLSX.writeFile(wb, `Analisis_Nilai_${kodeKelas}_${mapelName.replace(/\s+/g, '_')}.xlsx`);
  }

  function importKelas9Excel(event) {
    const file = event.target.files[0];
    if (!file || typeof XLSX === 'undefined') return;

    const kSelect = document.getElementById('kelas9KelasSelect');
    const mSelect = document.getElementById('kelas9MapelSelect');
    if (!kSelect || !mSelect) return;

    const kode_kelas = kSelect.value;
    const mapel_id = parseInt(mSelect.value || 0, 10);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const wb = XLSX.read(data, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(ws, { header: 1 });

        let headerIdx = -1;
        for (let i = 0; i < json.length; i++) {
          const rowStr = JSON.stringify(json[i]);
          if (rowStr.includes('Sem 1') || rowStr.includes('Nama Murid')) {
            headerIdx = i;
            break;
          }
        }
        if (headerIdx === -1) return showToast('Header file Excel tidak dikenali.', 'warning');

        const dataRows = json.slice(headerIdx + 1);
        const rows = [];

        dataRows.forEach((r) => {
          if (!r || !r.length) return;
          const nisn = String(r[1] || '').trim();
          const nama = String(r[2] || '').trim();

          const st = state.murid.find(
            (m) =>
              m.kode_kelas === kode_kelas &&
              ((nisn && m.nis_nisn === nisn) || m.nama_murid.toLowerCase().trim() === nama.toLowerCase().trim())
          );
          if (!st) return;

          rows.push({
            murid_id: st.id,
            sem1: parseFloat(r[3] || 0),
            sem2: parseFloat(r[4] || 0),
            sem3: parseFloat(r[5] || 0),
            sem4: parseFloat(r[6] || 0),
            sem5: parseFloat(r[7] || 0),
            sem6: parseFloat(r[8] || 0),
            us_tulis: parseFloat(r[10] || 0),
            us_praktik: parseFloat(r[11] || 0)
          });
        });

        if (!rows.length) return showToast('Tidak ada siswa cocok untuk diimpor.', 'warning');

        const bRapor = parseFloat((document.getElementById('k9_bobot_rapor') || {}).value || 60);
        const bUs = parseFloat((document.getElementById('k9_bobot_us') || {}).value || 40);
        const bTulis = parseFloat((document.getElementById('k9_bobot_us_tulis') || {}).value || 60);
        const bPraktik = parseFloat((document.getElementById('k9_bobot_us_praktik') || {}).value || 40);

        const res = await api('nilai_kelas9_bulk_save', {
          kode_kelas,
          mapel_id,
          k9_bobot_rapor: bRapor,
          k9_bobot_us: bUs,
          k9_bobot_us_tulis: bTulis,
          k9_bobot_us_praktik: bPraktik,
          rows
        });

        if (res.success) {
          showToast(`Berhasil mengimpor ${rows.length} nilai analisis kelas IX!`);
          await reloadAllData();
          renderKelas9Table();
        }
      } catch (err) {
        showToast('Gagal memproses file Excel: ' + err.message, 'error');
      }
    };
    reader.readAsArrayBuffer(file);
    event.target.value = '';
  }

  // --- Document Previews & Printing: SKNR, SKL, Transkrip ---
  function populateKelas9DocDropdowns(docType) {
    const kSelect = document.getElementById(`${docType}KelasSelect`);
    const k9Classes = state.kelas.filter((k) => k.jenjang === 'IX');

    if (kSelect && k9Classes.length > 0) {
      const cur = kSelect.value;
      kSelect.innerHTML = k9Classes
        .map((k) => `<option value="${k.kode_kelas}">${k.kode_kelas} - ${k.nama_kelas}</option>`)
        .join('');
      if (cur && k9Classes.some((x) => x.kode_kelas === cur)) kSelect.value = cur;
    }

    onKelas9DocClassChange(docType);
  }

  function onKelas9DocClassChange(docType) {
    const kSelect = document.getElementById(`${docType}KelasSelect`);
    const mSelect = document.getElementById(`${docType}MuridSelect`);
    if (!kSelect || !mSelect) return;

    const kodeKelas = kSelect.value;
    const students = state.murid.filter((m) => m.kode_kelas === kodeKelas);

    mSelect.innerHTML = students
      .map((m) => `<option value="${m.id}">${m.nama_murid} (${m.nis_nisn || '-'})</option>`)
      .join('');

    renderStudentListForDoc(docType, students);

    if (docType === 'sknr') renderSknrView();
    else if (docType === 'skl') onSklStudentChange();
    else if (docType === 'transkrip') onTranskripStudentChange();
  }

  function renderStudentListForDoc(docType, students) {
    const tbody = document.getElementById(`tbody${docType.charAt(0).toUpperCase() + docType.slice(1)}StudentList`);
    if (!tbody) return;

    tbody.innerHTML = students
      .map((m, idx) => {
        let valBadge = '-';
        if (docType === 'sknr') {
          // Average Sem 1-5 across all subjects
          const rows = state.nilai_kelas9.filter((n) => n.murid_id === m.id);
          let sum = 0;
          let count = 0;
          rows.forEach((r) => {
            const avg5 = (parseFloat(r.sem1 || 0) + parseFloat(r.sem2 || 0) + parseFloat(r.sem3 || 0) + parseFloat(r.sem4 || 0) + parseFloat(r.sem5 || 0)) / 5;
            if (avg5 > 0) {
              sum += avg5;
              count++;
            }
          });
          valBadge = count > 0 ? (sum / count).toFixed(2) : '-';
        } else {
          // Average Nilai Akhir
          const rows = state.nilai_kelas9.filter((n) => n.murid_id === m.id && n.nilai_akhir > 0);
          valBadge = rows.length > 0 ? (rows.reduce((a, b) => a + b.nilai_akhir, 0) / rows.length).toFixed(2) : '-';
        }

        return `
          <tr class="hover:bg-blue-50/50 cursor-pointer transition" onclick="document.getElementById('${docType}MuridSelect').value='${m.id}'; App.render${docType.charAt(0).toUpperCase() + docType.slice(1)}View();">
            <td class="py-2 px-2 text-center text-slate-500 font-semibold">${idx + 1}</td>
            <td class="py-2 px-2 font-bold text-slate-800">${m.nama_murid}</td>
            <td class="py-2 px-2 text-center font-extrabold text-blue-700">${valBadge}</td>
            ${docType === 'skl' ? `<td class="py-2 px-2 text-center"><span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800">LULUS</span></td>` : ''}
            <td class="py-2 px-2 text-center">
              <button class="px-2 py-1 rounded bg-blue-100 text-blue-700 font-bold text-[10px] hover:bg-blue-200">
                Pilih
              </button>
            </td>
          </tr>
        `;
      })
      .join('');
  }

  function getOfficialKopHtml() {
    const s = state.settings;
    const pemda = s.set_kop_baris1_pemda || 'PEMERINTAH KABUPATEN NUSANTARA DINAS PENDIDIKAN';
    const sekolah = s.set_kop_baris2_sekolah || 'SMP NEGERI 1 NUSANTARA';
    const alamat = s.set_kop_baris3_alamat || 'Jl. Pendidikan No. 45, Kec. Nusantara Pusat';
    const telp = s.set_telepon || '(022) 7654321';
    const pos = s.set_kode_pos || '40123';
    const email = s.set_email || 'info@smpn1nusantara.sch.id';

    const logoPemda = s.logo_pemda
      ? `<img src="${s.logo_pemda}" class="w-16 h-16 object-contain">`
      : `<div class="w-16 h-16 border border-slate-300 rounded flex items-center justify-center text-slate-400"><i class="fa-solid fa-landmark text-2xl"></i></div>`;

    const logoSekolah = s.logo_sekolah
      ? `<img src="${s.logo_sekolah}" class="w-16 h-16 object-contain">`
      : `<div class="w-16 h-16 border border-slate-300 rounded flex items-center justify-center text-slate-400"><i class="fa-solid fa-school text-2xl"></i></div>`;

    return `
      <div class="border-b-4 border-double border-black pb-3 mb-4">
        <div class="flex items-center justify-between gap-4">
          <div class="shrink-0">${logoPemda}</div>
          <div class="text-center flex-1 leading-tight space-y-1">
            <h3 class="text-xs font-bold uppercase tracking-wide text-slate-800">${pemda}</h3>
            <h1 class="text-lg font-black uppercase text-black tracking-wider">${sekolah}</h1>
            <p class="text-[11px] text-slate-600">${alamat} • Telp: ${telp} • Kode Pos: ${pos}</p>
            <p class="text-[10px] text-slate-500">Email: ${email} • Website: ${s.set_website || 'https://sekolah.sch.id'}</p>
          </div>
          <div class="shrink-0">${logoSekolah}</div>
        </div>
      </div>
    `;
  }

  // 1. SKNR
  function renderSknrView() {
    const box = document.getElementById('previewSknrBox');
    if (!box) return;

    const mSelect = document.getElementById('sknrMuridSelect');
    const muridId = parseInt((mSelect || {}).value || 0, 10);
    const m = state.murid.find((x) => x.id === muridId);

    if (!m) {
      box.innerHTML = `<p class="text-center text-slate-400 py-8">Pilih siswa untuk melihat pratinjau SKNR.</p>`;
      return;
    }

    const s = state.settings;
    const noSurat = (document.getElementById('sknrNomorSurat') || {}).value || '400.3.11/157/2026';
    const jabatan = (document.getElementById('sknrJabatanKepsek') || {}).value || 'Kepala Sekolah';
    const titimangsa = (document.getElementById('sknrTitimangsa') || {}).value || `${s.set_titimangsa_kota || 'Banyumas'}, 2 Juni 2026`;

    let rowsHtml = '';
    let grandSum = 0;
    let countSem = 0;

    state.mapel.forEach((map, idx) => {
      const k9Row = state.nilai_kelas9.find((n) => n.murid_id === m.id && n.mapel_id === map.id);
      const s1 = k9Row ? parseFloat(k9Row.sem1 || 0) : 0;
      const s2 = k9Row ? parseFloat(k9Row.sem2 || 0) : 0;
      const s3 = k9Row ? parseFloat(k9Row.sem3 || 0) : 0;
      const s4 = k9Row ? parseFloat(k9Row.sem4 || 0) : 0;
      const s5 = k9Row ? parseFloat(k9Row.sem5 || 0) : 0;
      const avg = Math.round(((s1 + s2 + s3 + s4 + s5) / 5) * 100) / 100;

      grandSum += avg;
      countSem++;

      rowsHtml += `
        <tr>
          <td class="border border-black p-1 text-center">${idx + 1}</td>
          <td class="border border-black p-1 font-semibold">${map.nama_mapel}</td>
          <td class="border border-black p-1 text-center">${s1 || '-'}</td>
          <td class="border border-black p-1 text-center">${s2 || '-'}</td>
          <td class="border border-black p-1 text-center">${s3 || '-'}</td>
          <td class="border border-black p-1 text-center">${s4 || '-'}</td>
          <td class="border border-black p-1 text-center">${s5 || '-'}</td>
          <td class="border border-black p-1 text-center font-bold bg-slate-100">${avg || '-'}</td>
        </tr>
      `;
    });

    const overallAvg = countSem > 0 ? (grandSum / countSem).toFixed(2) : '-';

    box.innerHTML = `
      <div class="preview-document space-y-3 bg-white p-4">
        ${getOfficialKopHtml()}
        <div class="text-center space-y-1">
          <h2 class="text-sm font-black underline uppercase">SURAT KETERANGAN NILAI RAPOR (SKNR)</h2>
          <p class="text-[11px] font-mono">Nomor: ${noSurat}</p>
        </div>

        <p class="text-xs leading-relaxed text-justify">
          Yang bertanda tangan di bawah ini, ${jabatan} ${s.set_kop_baris2_sekolah || 'SMP Negeri 1 Nusantara'}, menerangkan bahwa:
        </p>

        <div class="grid grid-cols-12 text-xs pl-4 space-y-0.5">
          <div class="col-span-3 text-slate-700">Nama Siswa</div>
          <div class="col-span-9 font-bold">: ${m.nama_murid}</div>
          <div class="col-span-3 text-slate-700">NIS / NISN</div>
          <div class="col-span-9 font-mono">: ${m.nis_nisn || '-'}</div>
          <div class="col-span-3 text-slate-700">Kelas / Rombel</div>
          <div class="col-span-9 font-bold">: ${m.kode_kelas}</div>
          <div class="col-span-3 text-slate-700">Sekolah Asal</div>
          <div class="col-span-9">: ${s.set_kop_baris2_sekolah || 'SMP Negeri 1 Nusantara'}</div>
        </div>

        <p class="text-xs leading-relaxed">
          Adalah benar peserta didik pada sekolah kami dengan rekapitulasi capaian Nilai Rapor Semester 1 s.d. Semester 5 sebagai berikut:
        </p>

        <table class="w-full text-xs border-collapse border border-black">
          <thead>
            <tr class="bg-slate-100 text-center font-bold">
              <th class="border border-black p-1 w-8">No</th>
              <th class="border border-black p-1">Mata Pelajaran</th>
              <th class="border border-black p-1 w-12">Sem 1</th>
              <th class="border border-black p-1 w-12">Sem 2</th>
              <th class="border border-black p-1 w-12">Sem 3</th>
              <th class="border border-black p-1 w-12">Sem 4</th>
              <th class="border border-black p-1 w-12">Sem 5</th>
              <th class="border border-black p-1 w-16 bg-slate-200">Rerata</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
            <tr class="font-bold bg-slate-100">
              <td colspan="7" class="border border-black p-1 text-right">Rata-Rata Seluruh Mata Pelajaran:</td>
              <td class="border border-black p-1 text-center bg-slate-200 text-sm">${overallAvg}</td>
            </tr>
          </tbody>
        </table>

        <div class="pt-4 flex justify-end">
          <div class="text-center text-xs space-y-12 min-w-[200px]">
            <p>${titimangsa}<br>${jabatan},</p>
            <div>
              <b class="underline block">${s.set_kepsek_nama || 'Dr. H. Hendra Wijaya, M.Pd.'}</b>
              <span>NIP. ${s.set_kepsek_nip || '-'}</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // 2. SKL
  function onSklStudentChange() {
    const mSelect = document.getElementById('sklMuridSelect');
    const muridId = parseInt((mSelect || {}).value || 0, 10);
    const meta = state.metaSkl[muridId] || {};

    const ttlEl = document.getElementById('sklTtlSiswa');
    const noPesertaEl = document.getElementById('sklNoPeserta');

    if (ttlEl) ttlEl.value = meta.ttl || 'Nusantara, 12 Januari 2011';
    if (noPesertaEl) noPesertaEl.value = meta.no_peserta || `15-140-${String(muridId).padStart(3, '0')}`;

    renderSklView();
  }

  function onSklMetaInput() {
    const mSelect = document.getElementById('sklMuridSelect');
    const muridId = parseInt((mSelect || {}).value || 0, 10);
    if (!muridId) return;

    state.metaSkl[muridId] = {
      ttl: (document.getElementById('sklTtlSiswa') || {}).value || '',
      no_peserta: (document.getElementById('sklNoPeserta') || {}).value || ''
    };
    renderSklView();
  }

  function renderSklView() {
    const box = document.getElementById('previewSklBox');
    if (!box) return;

    const mSelect = document.getElementById('sklMuridSelect');
    const muridId = parseInt((mSelect || {}).value || 0, 10);
    const m = state.murid.find((x) => x.id === muridId);

    if (!m) {
      box.innerHTML = `<p class="text-center text-slate-400 py-8">Pilih siswa untuk melihat pratinjau SKL.</p>`;
      return;
    }

    const s = state.settings;
    const noSurat = (document.getElementById('sklNomorSurat') || {}).value || '400.3.11.1/156/2026';
    const ttl = (document.getElementById('sklTtlSiswa') || {}).value || 'Nusantara, 12 Januari 2011';
    const noPeserta = (document.getElementById('sklNoPeserta') || {}).value || `15-140-${String(muridId).padStart(3, '0')}`;
    const titimangsa = (document.getElementById('sklTitimangsa') || {}).value || `${s.set_titimangsa_kota || 'Banyumas'}, 2 Juni 2026`;

    let rowsHtml = '';
    let grandTotal = 0;
    let countMapel = 0;

    state.mapel.forEach((map, idx) => {
      const k9Row = state.nilai_kelas9.find((n) => n.murid_id === m.id && n.mapel_id === map.id);
      const na = k9Row ? parseFloat(k9Row.nilai_akhir || 0) : 0;
      if (na > 0) {
        grandTotal += na;
        countMapel++;
      }
      rowsHtml += `
        <tr>
          <td class="border border-black p-1 text-center">${idx + 1}</td>
          <td class="border border-black p-1 font-semibold">${map.nama_mapel}</td>
          <td class="border border-black p-1 text-center font-bold">${na || '-'}</td>
        </tr>
      `;
    });

    const overallAvg = countMapel > 0 ? (grandTotal / countMapel).toFixed(2) : '-';

    box.innerHTML = `
      <div class="preview-document space-y-3 bg-white p-4">
        ${getOfficialKopHtml()}
        <div class="text-center space-y-1">
          <h2 class="text-sm font-black underline uppercase">SURAT KETERANGAN LULUS (SKL)</h2>
          <p class="text-[11px] font-mono">Nomor: ${noSurat}</p>
        </div>

        <p class="text-xs leading-relaxed text-justify">
          Kepala ${s.set_kop_baris2_sekolah || 'SMP Negeri 1 Nusantara'}, menerangkan bahwa:
        </p>

        <div class="grid grid-cols-12 text-xs pl-4 space-y-0.5">
          <div class="col-span-4 text-slate-700">Nama Lengkap Siswa</div>
          <div class="col-span-8 font-bold">: ${m.nama_murid}</div>
          <div class="col-span-4 text-slate-700">Tempat, Tanggal Lahir</div>
          <div class="col-span-8">: ${ttl}</div>
          <div class="col-span-4 text-slate-700">Nomor Induk Siswa (NIS/NISN)</div>
          <div class="col-span-8 font-mono">: ${m.nis_nisn || '-'}</div>
          <div class="col-span-4 text-slate-700">Nomor Peserta Ujian</div>
          <div class="col-span-8 font-mono">: ${noPeserta}</div>
        </div>

        <div class="p-2 border-2 border-emerald-600 bg-emerald-50 text-center rounded-lg space-y-0.5">
          <span class="text-xs uppercase font-semibold text-emerald-800">Berdasarkan Kriteria Kelulusan Satuan Pendidikan, Dinyatakan:</span>
          <h3 class="text-base font-black text-emerald-900 tracking-widest">L U L U S</h3>
        </div>

        <p class="text-xs leading-relaxed">
          Dengan perolehan Nilai Akhir (Gabungan Nilai Rapor Semester 1 s.d. 6 dan Ujian Sekolah) sebagai berikut:
        </p>

        <table class="w-full text-xs border-collapse border border-black">
          <thead>
            <tr class="bg-slate-100 text-center font-bold">
              <th class="border border-black p-1 w-10">No</th>
              <th class="border border-black p-1">Mata Pelajaran</th>
              <th class="border border-black p-1 w-28 bg-slate-200">Nilai Akhir Sekolah</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
            <tr class="font-bold bg-slate-100">
              <td colspan="2" class="border border-black p-1 text-right">Rata-Rata Nilai Akhir:</td>
              <td class="border border-black p-1 text-center bg-slate-200 text-sm font-black">${overallAvg}</td>
            </tr>
          </tbody>
        </table>

        <div class="pt-4 flex justify-end">
          <div class="text-center text-xs space-y-12 min-w-[200px]">
            <p>${titimangsa}<br>Kepala Sekolah,</p>
            <div>
              <b class="underline block">${s.set_kepsek_nama || 'Dr. H. Hendra Wijaya, M.Pd.'}</b>
              <span>NIP. ${s.set_kepsek_nip || '-'}</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function exportTemplateDataSkl() {
    if (typeof XLSX === 'undefined') return showToast('Pustaka SheetJS belum termuat.', 'error');
    const ws_data = [
      ['nama_murid', 'nis_nisn', 'ttl', 'no_peserta'],
      ['Ahmad Fauzan', '0065432101', 'Banyumas, 15 Januari 2011', '15-140-001'],
      ['Bella Safitri', '0065432102', 'Banyumas, 22 Maret 2011', '15-140-002']
    ];
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    XLSX.utils.book_append_sheet(wb, ws, 'Template_SKL');
    XLSX.writeFile(wb, 'Template_Data_SKL.xlsx');
  }

  function importTemplateDataSkl(event) {
    const file = event.target.files[0];
    if (!file || typeof XLSX === 'undefined') return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const wb = XLSX.read(data, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(ws);

        json.forEach((r) => {
          const nisn = String(r.nis_nisn || '');
          const nama = String(r.nama_murid || '');
          const st = state.murid.find((m) => (nisn && m.nis_nisn === nisn) || m.nama_murid.toLowerCase().trim() === nama.toLowerCase().trim());
          if (st) {
            state.metaSkl[st.id] = {
              ttl: r.ttl || r['Tempat, Tanggal Lahir'] || '',
              no_peserta: r.no_peserta || r['Nomor Peserta'] || ''
            };
          }
        });

        showToast('Data metadata SKL berhasil diimpor!');
        onSklStudentChange();
      } catch (err) {
        showToast('Gagal membaca data SKL: ' + err.message, 'error');
      }
    };
    reader.readAsArrayBuffer(file);
    event.target.value = '';
  }

  // 3. Transkrip Nilai
  function onTranskripStudentChange() {
    const mSelect = document.getElementById('transkripMuridSelect');
    const muridId = parseInt((mSelect || {}).value || 0, 10);
    const meta = state.metaTranskrip[muridId] || {};

    const ttlEl = document.getElementById('transkripTtlSiswa');
    const ijazahEl = document.getElementById('transkripNomorIjazah');

    if (ttlEl) ttlEl.value = meta.ttl || 'Banyumas, 13 November 2010';
    if (ijazahEl) ijazahEl.value = meta.nomor_ijazah || `DN-03/D-SMP/26/${String(muridId).padStart(7, '0')}`;

    renderTranskripView();
  }

  function onTranskripMetaInput() {
    const mSelect = document.getElementById('transkripMuridSelect');
    const muridId = parseInt((mSelect || {}).value || 0, 10);
    if (!muridId) return;

    state.metaTranskrip[muridId] = {
      ttl: (document.getElementById('transkripTtlSiswa') || {}).value || '',
      nomor_ijazah: (document.getElementById('transkripNomorIjazah') || {}).value || ''
    };
    renderTranskripView();
  }

  function renderTranskripView() {
    const box = document.getElementById('previewTranskripBox');
    if (!box) return;

    const mSelect = document.getElementById('transkripMuridSelect');
    const muridId = parseInt((mSelect || {}).value || 0, 10);
    const m = state.murid.find((x) => x.id === muridId);

    if (!m) {
      box.innerHTML = `<p class="text-center text-slate-400 py-8">Pilih siswa untuk melihat pratinjau Transkrip.</p>`;
      return;
    }

    const s = state.settings;
    const noSurat = (document.getElementById('transkripNomorSurat') || {}).value || '400.3.11.1/158.1/2026';
    const ttl = (document.getElementById('transkripTtlSiswa') || {}).value || 'Banyumas, 13 November 2010';
    const noIjazah = (document.getElementById('transkripNomorIjazah') || {}).value || `DN-03/D-SMP/26/${String(muridId).padStart(7, '0')}`;
    const tglLulus = (document.getElementById('transkripTanggalLulus') || {}).value || '2 Juni 2026';

    const sortedMapel = [...state.mapel].sort((a, b) => a.no_urut - b.no_urut);

    let rowsHtml = '';
    let grandTotal = 0;
    let countMapel = 0;

    sortedMapel.forEach((map) => {
      const k9Row = state.nilai_kelas9.find((n) => n.murid_id === m.id && n.mapel_id === map.id);
      const na = k9Row ? parseFloat(k9Row.nilai_akhir || 0) : 0;
      if (na > 0) {
        grandTotal += na;
        countMapel++;
      }
      rowsHtml += `
        <tr>
          <td class="border border-black p-1 text-center">${map.no_urut}</td>
          <td class="border border-black p-1 font-semibold">${map.nama_mapel}</td>
          <td class="border border-black p-1 text-center font-bold">${na || '-'}</td>
        </tr>
      `;
    });

    const overallAvg = countMapel > 0 ? (grandTotal / countMapel).toFixed(2) : '-';

    box.innerHTML = `
      <div class="preview-document space-y-3 bg-white p-4">
        ${getOfficialKopHtml()}
        <div class="text-center space-y-1">
          <h2 class="text-sm font-black underline uppercase">TRANSKRIP NILAI AKHIR KELAS IX</h2>
          <p class="text-[11px] font-mono">Nomor: ${noSurat}</p>
        </div>

        <div class="grid grid-cols-12 text-xs pl-2 space-y-0.5">
          <div class="col-span-4 text-slate-700">Satuan Pendidikan</div>
          <div class="col-span-8 font-bold">: ${s.set_kop_baris2_sekolah || 'SMP Negeri 1 Nusantara'}</div>
          <div class="col-span-4 text-slate-700">NPSN / NSS</div>
          <div class="col-span-8 font-mono">: ${s.set_npsn || '20102030'} / ${s.set_nss || '201010101010'}</div>
          <div class="col-span-4 text-slate-700">Nama Lengkap Murid</div>
          <div class="col-span-8 font-bold">: ${m.nama_murid}</div>
          <div class="col-span-4 text-slate-700">Tempat, Tanggal Lahir</div>
          <div class="col-span-8">: ${ttl}</div>
          <div class="col-span-4 text-slate-700">Nomor Induk Siswa Nasional (NISN)</div>
          <div class="col-span-8 font-mono">: ${m.nis_nisn || '-'}</div>
          <div class="col-span-4 text-slate-700">Nomor Ijazah</div>
          <div class="col-span-8 font-mono font-bold">: ${noIjazah}</div>
        </div>

        <table class="w-full text-xs border-collapse border border-black">
          <thead>
            <tr class="bg-slate-100 text-center font-bold">
              <th class="border border-black p-1 w-10">No</th>
              <th class="border border-black p-1">Mata Pelajaran (Urutan Kurikulum Transkrip)</th>
              <th class="border border-black p-1 w-28 bg-slate-200">Nilai Akhir</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
            <tr class="font-bold bg-slate-100">
              <td colspan="2" class="border border-black p-1 text-right">Rata-Rata Transkrip Nilai:</td>
              <td class="border border-black p-1 text-center bg-slate-200 text-sm font-black">${overallAvg}</td>
            </tr>
          </tbody>
        </table>

        <div class="pt-4 flex justify-between items-end text-xs">
          <div class="space-y-0.5">
            <p>Tanggal Kelulusan: <b>${tglLulus}</b></p>
            <p class="text-[10px] text-slate-500">Dicetak melalui Sistem E-Penilaian SMP Terpadu</p>
          </div>
          <div class="text-center space-y-12 min-w-[200px]">
            <p>${s.set_titimangsa_kota || 'Banyumas'}, ${tglLulus}<br>Kepala Sekolah,</p>
            <div>
              <b class="underline block">${s.set_kepsek_nama || 'Dr. H. Hendra Wijaya, M.Pd.'}</b>
              <span>NIP. ${s.set_kepsek_nip || '-'}</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function exportTemplateDataTranskrip() {
    if (typeof XLSX === 'undefined') return showToast('Pustaka SheetJS belum termuat.', 'error');
    const ws_data = [
      ['nama_murid', 'nis_nisn', 'ttl', 'nomor_ijazah'],
      ['Ahmad Fauzan', '0065432101', 'Banyumas, 15 Januari 2011', 'DN-03/D-SMP/26/0000001'],
      ['Bella Safitri', '0065432102', 'Banyumas, 22 Maret 2011', 'DN-03/D-SMP/26/0000002']
    ];
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    XLSX.utils.book_append_sheet(wb, ws, 'Template_Transkrip');
    XLSX.writeFile(wb, 'Template_Data_Transkrip.xlsx');
  }

  function importTemplateDataTranskrip(event) {
    const file = event.target.files[0];
    if (!file || typeof XLSX === 'undefined') return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const wb = XLSX.read(data, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(ws);

        json.forEach((r) => {
          const nisn = String(r.nis_nisn || '');
          const nama = String(r.nama_murid || '');
          const st = state.murid.find((m) => (nisn && m.nis_nisn === nisn) || m.nama_murid.toLowerCase().trim() === nama.toLowerCase().trim());
          if (st) {
            state.metaTranskrip[st.id] = {
              ttl: r.ttl || r['Tempat, Tanggal Lahir'] || '',
              nomor_ijazah: r.nomor_ijazah || r['Nomor Ijazah'] || ''
            };
          }
        });

        showToast('Data metadata Transkrip berhasil diimpor!');
        onTranskripStudentChange();
      } catch (err) {
        showToast('Gagal membaca data Transkrip: ' + err.message, 'error');
      }
    };
    reader.readAsArrayBuffer(file);
    event.target.value = '';
  }

  function printDokumenKelas9(docType, mode = 'single') {
    const printArea = document.getElementById('printArea');
    if (!printArea) return;

    const kSelect = document.getElementById(`${docType}KelasSelect`);
    const kodeKelas = kSelect ? kSelect.value : 'IX-A';
    const students = state.murid.filter((m) => m.kode_kelas === kodeKelas);

    if (mode === 'single') {
      const box = document.getElementById(`preview${docType.charAt(0).toUpperCase() + docType.slice(1)}Box`);
      printArea.innerHTML = box ? box.innerHTML : '';
    } else {
      // Print all students in this class with page-breaks
      let combined = '';
      students.forEach((st, idx) => {
        const mSelect = document.getElementById(`${docType}MuridSelect`);
        if (mSelect) mSelect.value = st.id;
        if (docType === 'sknr') renderSknrView();
        else if (docType === 'skl') renderSklView();
        else if (docType === 'transkrip') renderTranskripView();

        const box = document.getElementById(`preview${docType.charAt(0).toUpperCase() + docType.slice(1)}Box`);
        const itemHtml = box ? box.innerHTML : '';
        combined += `<div class="${idx < students.length - 1 ? 'page-break' : ''}">${itemHtml}</div>`;
      });
      printArea.innerHTML = combined;
    }

    window.print();
  }

  function exportDokumenKelas9Excel(docType) {
    if (typeof XLSX === 'undefined') return showToast('Pustaka SheetJS belum termuat.', 'error');
    const kSelect = document.getElementById(`${docType}KelasSelect`);
    const kodeKelas = kSelect ? kSelect.value : 'IX-A';
    const students = state.murid.filter((m) => m.kode_kelas === kodeKelas);

    const headers = ['No', 'NISN', 'Nama Siswa'];
    state.mapel.forEach((m) => headers.push(m.nama_mapel));
    headers.push('Rata-Rata Dokumen');

    const ws_data = [
      [`REKAP NILAI ${docType.toUpperCase()} KELAS ${kodeKelas}`],
      [`Sekolah: ${state.settings.set_kop_baris2_sekolah || 'SMP NEGERI 1 NUSANTARA'}`],
      [],
      headers
    ];

    students.forEach((m, idx) => {
      let sum = 0;
      let count = 0;
      const row = [idx + 1, m.nis_nisn, m.nama_murid];
      state.mapel.forEach((map) => {
        const k9Row = state.nilai_kelas9.find((n) => n.murid_id === m.id && n.mapel_id === map.id);
        let val = 0;
        if (docType === 'sknr') {
          val = k9Row ? Math.round(((parseFloat(k9Row.sem1 || 0) + parseFloat(k9Row.sem2 || 0) + parseFloat(k9Row.sem3 || 0) + parseFloat(k9Row.sem4 || 0) + parseFloat(k9Row.sem5 || 0)) / 5) * 100) / 100 : 0;
        } else {
          val = k9Row ? parseFloat(k9Row.nilai_akhir || 0) : 0;
        }
        row.push(val);
        if (val > 0) {
          sum += val;
          count++;
        }
      });
      row.push(count > 0 ? (sum / count).toFixed(2) : 0);
      ws_data.push(row);
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    XLSX.utils.book_append_sheet(wb, ws, `Rekap_${docType.toUpperCase()}`);
    XLSX.writeFile(wb, `Rekap_${docType.toUpperCase()}_${kodeKelas}.xlsx`);
  }

  // ==================== 5. PENGATURAN ====================
  function loadSettingsForm() {
    const s = state.settings;
    const keys = [
      'set_kop_baris1_pemda', 'set_kop_baris2_sekolah', 'set_kop_baris3_alamat',
      'set_telepon', 'set_kode_pos', 'set_email', 'set_npsn', 'set_nss',
      'set_akreditasi', 'set_jenjang_pendidikan', 'set_status_sekolah',
      'set_alamat_jalan', 'set_kelurahan', 'set_kecamatan', 'set_kabupaten',
      'set_provinsi', 'set_website', 'set_kepsek_nama', 'set_kepsek_nip',
      'set_titimangsa_kota', 'set_titimangsa_tanggal', 'set_tahun_ajaran',
      'set_semester', 'set_sistem_hari_sekolah'
    ];

    keys.forEach((k) => {
      const el = document.getElementById(k);
      if (el && s[k] !== undefined) {
        el.value = s[k];
      }
    });

    renderLogoPreviews();
  }

  function renderLogoPreviews() {
    const s = state.settings;
    const pPemda = document.getElementById('previewBoxLogoPemda');
    if (pPemda) {
      if (s.logo_pemda) pPemda.innerHTML = `<img src="${s.logo_pemda}" class="w-full h-full object-contain">`;
      else pPemda.innerHTML = `<i class="fa-solid fa-landmark text-2xl text-slate-300"></i>`;
    }

    const pSekolah = document.getElementById('previewBoxLogoSekolah');
    if (pSekolah) {
      if (s.logo_sekolah) pSekolah.innerHTML = `<img src="${s.logo_sekolah}" class="w-full h-full object-contain">`;
      else pSekolah.innerHTML = `<i class="fa-solid fa-school text-2xl text-slate-300"></i>`;
    }
  }

  function updateKopPreview() {
    const el = document.getElementById('liveKopSuratPreview');
    if (!el) return;

    // Read temporary form values if available
    const pemda = (document.getElementById('set_kop_baris1_pemda') || {}).value || state.settings.set_kop_baris1_pemda || 'PEMERINTAH KABUPATEN NUSANTARA DINAS PENDIDIKAN';
    const sekolah = (document.getElementById('set_kop_baris2_sekolah') || {}).value || state.settings.set_kop_baris2_sekolah || 'SMP NEGERI 1 NUSANTARA';
    const alamat = (document.getElementById('set_kop_baris3_alamat') || {}).value || state.settings.set_kop_baris3_alamat || 'Jl. Pendidikan No. 45, Kec. Nusantara Pusat';
    const telp = (document.getElementById('set_telepon') || {}).value || state.settings.set_telepon || '(022) 7654321';
    const pos = (document.getElementById('set_kode_pos') || {}).value || state.settings.set_kode_pos || '40123';
    const email = (document.getElementById('set_email') || {}).value || state.settings.set_email || 'info@smpn1nusantara.sch.id';
    const web = (document.getElementById('set_website') || {}).value || state.settings.set_website || 'https://smpn1nusantara.sch.id';

    const hari = (document.getElementById('set_sistem_hari_sekolah') || {}).value || state.settings.set_sistem_hari_sekolah || '5 Hari Kerja (Senin - Jumat)';
    const badge = document.getElementById('previewHariSekolahBadge');
    if (badge) badge.textContent = hari.includes('5') ? '5 Hari Kerja (Senin - Jumat)' : '6 Hari Kerja (Senin - Sabtu)';

    const s = state.settings;
    const logoPemda = s.logo_pemda
      ? `<img src="${s.logo_pemda}" class="w-16 h-16 object-contain">`
      : `<div class="w-16 h-16 border border-slate-300 rounded flex items-center justify-center text-slate-400"><i class="fa-solid fa-landmark text-2xl"></i></div>`;

    const logoSekolah = s.logo_sekolah
      ? `<img src="${s.logo_sekolah}" class="w-16 h-16 object-contain">`
      : `<div class="w-16 h-16 border border-slate-300 rounded flex items-center justify-center text-slate-400"><i class="fa-solid fa-school text-2xl"></i></div>`;

    el.innerHTML = `
      <div class="border-b-4 border-double border-black pb-3">
        <div class="flex items-center justify-between gap-4">
          <div class="shrink-0">${logoPemda}</div>
          <div class="text-center flex-1 leading-tight space-y-1">
            <h3 class="text-xs font-bold uppercase tracking-wide text-slate-800">${pemda}</h3>
            <h1 class="text-lg font-black uppercase text-black tracking-wider">${sekolah}</h1>
            <p class="text-[11px] text-slate-600">${alamat} • Telp: ${telp} • Kode Pos: ${pos}</p>
            <p class="text-[10px] text-slate-500">Email: ${email} • Website: ${web}</p>
          </div>
          <div class="shrink-0">${logoSekolah}</div>
        </div>
      </div>
    `;
  }

  function handleLogoUpload(event, key) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target.result;
      state.settings[key] = base64;
      await api('settings_save', { settings: { [key]: base64 } });
      renderLogoPreviews();
      updateKopPreview();
      updateTopBarAndSettings();
      showToast('Logo berhasil diperbarui!');
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  }

  async function clearLogo(key) {
    state.settings[key] = '';
    await api('settings_save', { settings: { [key]: '' } });
    renderLogoPreviews();
    updateKopPreview();
    updateTopBarAndSettings();
    showToast('Logo dihapus.');
  }

  async function saveSettings(e) {
    e.preventDefault();
    const keys = [
      'set_kop_baris1_pemda', 'set_kop_baris2_sekolah', 'set_kop_baris3_alamat',
      'set_telepon', 'set_kode_pos', 'set_email', 'set_npsn', 'set_nss',
      'set_akreditasi', 'set_jenjang_pendidikan', 'set_status_sekolah',
      'set_alamat_jalan', 'set_kelurahan', 'set_kecamatan', 'set_kabupaten',
      'set_provinsi', 'set_website', 'set_kepsek_nama', 'set_kepsek_nip',
      'set_titimangsa_kota', 'set_titimangsa_tanggal', 'set_tahun_ajaran',
      'set_semester', 'set_sistem_hari_sekolah'
    ];

    const toSave = {};
    keys.forEach((k) => {
      const el = document.getElementById(k);
      if (el) toSave[k] = el.value.trim();
    });

    const res = await api('settings_save', { settings: toSave });
    if (res.success) {
      showToast(res.message);
      await reloadAllData();
      updateKopPreview();
    } else {
      showToast(res.message || 'Gagal menyimpan pengaturan.', 'error');
    }
  }

  function downloadBackupJSON() {
    const backupObj = {
      timestamp: new Date().toISOString(),
      settings: state.settings,
      kelas: state.kelas,
      mapel: state.mapel,
      guru: state.guru,
      murid: state.murid,
      konfigurasi_sumatif: state.konfigurasi_sumatif,
      nilai_sumatif: state.nilai_sumatif,
      nilai_kelas9: state.nilai_kelas9
    };

    const blob = new Blob([JSON.stringify(backupObj, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_penilaian_smp_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('File backup JSON berhasil diunduh!');
  }

  async function downloadBackupSQL() {
    const res = await api('backup_sql');
    if (res.success && res.sql) {
      const blob = new Blob([res.sql], { type: 'application/sql' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = res.filename || `backup_penilaian_${Date.now()}.sql`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('File backup SQL berhasil diunduh!');
    }
  }

  function restoreFromJSON(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const json = JSON.parse(e.target.result);
        const res = await api('restore_json', { backup_data: json });
        if (res.success) {
          showToast(res.message);
          await reloadAllData();
          switchMenu(currentMenu);
        } else {
          showToast(res.message || 'Gagal merestore dari JSON.', 'error');
        }
      } catch (err) {
        showToast('File JSON tidak valid: ' + err.message, 'error');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  }

  function restoreFromSQL(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const sqlContent = e.target.result;
        const res = await api('restore_sql', { sql_content: sqlContent });
        if (res.success) {
          showToast(res.message);
          await reloadAllData();
          switchMenu(currentMenu);
        } else {
          showToast(res.message || 'Gagal merestore dari SQL.', 'error');
        }
      } catch (err) {
        showToast('Gagal memproses file SQL: ' + err.message, 'error');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  }

  // Expose public API
  return {
    init,
    logout,
    togglePassword,
    switchMenu,
    openProfileModal,
    closeModal,
    handleProfileFotoUpload,
    deleteProfileFoto,
    saveProfilePassword,

    // Dashboard
    renderDashboardCharts,

    // Master tabs
    switchMasterTab,
    openGuruModal,
    saveGuruForm,
    deleteGuru,
    deleteAllGuru,
    resetGuruPassword,
    downloadTemplateGuruExcel,
    exportGuruExcel,
    importGuruExcel,

    renderMuridTable,
    openMuridModal,
    saveMuridForm,
    deleteMurid,
    deleteAllMurid,
    downloadTemplateMuridExcel,
    exportMuridExcel,
    importMuridExcel,

    openKelasModal,
    saveKelasForm,
    deleteKelas,
    deleteAllKelas,
    downloadTemplateKelasExcel,
    exportKelasExcel,
    importKelasExcel,

    openMapelModal,
    saveMapelForm,
    deleteMapel,
    deleteAllMapel,
    downloadTemplateMapelExcel,
    exportMapelExcel,
    importMapelExcel,

    // Sumatif
    switchSumatifTab,
    onSumatifFilterChange,
    adjustJmlSumatif,
    applyKonfigSumatif,
    renderSumatifInputTable,
    recalcSumatifTableLive,
    saveAllNilaiSumatif,
    exportSumatifExcel,
    importSumatifExcel,

    renderRekapSumatif,
    exportLeggerExcel,
    renderStatistikAntarKelas,
    printRekap,

    // Kelas IX
    switchKelas9Tab,
    renderKelas9Table,
    recalcKelas9Live,
    saveAllNilaiKelas9,
    saveKonfigKelas9,
    resetKelas9Row,
    resetAllNilaiKelas9,
    exportKelas9Excel,
    importKelas9Excel,

    onKelas9DocClassChange,
    renderSknrView,
    renderSklView,
    renderTranskripView,
    onSklStudentChange,
    onSklMetaInput,
    onTranskripStudentChange,
    onTranskripMetaInput,
    exportTemplateDataSkl,
    importTemplateDataSkl,
    exportTemplateDataTranskrip,
    importTemplateDataTranskrip,
    printDokumenKelas9,
    exportDokumenKelas9Excel,

    // Settings
    updateKopPreview,
    handleLogoUpload,
    clearLogo,
    saveSettings,
    downloadBackupJSON,
    downloadBackupSQL,
    restoreFromJSON,
    restoreFromSQL
  };
})();

// Start application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
