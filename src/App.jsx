import React, { useState, useEffect, useCallback } from 'react';

// ============================================================
// CONFIG - ganti BASE_URL sesuai backend lo
// ============================================================
const BASE_URL = 'https://simada-kelompok-5.infinityfreeapp.com/api'; // sesuaikan dengan URL backend lo

const api = {
  post: async (endpoint, body, token) => {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
    return res.json();
  },
  get: async (endpoint, token) => {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${BASE_URL}${endpoint}`, { headers });
    return res.json();
  },
  put: async (endpoint, body, token) => {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(body),
    });
    return res.json();
  },
  postForm: async (endpoint, formData, token) => {
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: formData,
    });
    return res.json();
  },
};

// Format rupiah
const formatRp = (val) => {
  if (!val) return '-';
  const num = typeof val === 'string' ? parseFloat(val.replace(/\./g, '').replace(',', '.')) : val;
  if (isNaN(num)) return val;
  return new Intl.NumberFormat('id-ID').format(num);
};

// Status badge helper
const statusBadge = (status) => {
  const map = {
    draft: 'bg-slate-500/10 border-slate-500/30 text-slate-400',
    menunggu_persetujuan: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
    disetujui: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
    pemilihan_penyedia: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
    negosiasi: 'bg-purple-500/10 border-purple-500/30 text-purple-400',
    spk_dibuat: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
    kontrak_aktif: 'bg-teal-500/10 border-teal-500/30 text-teal-400',
    selesai: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
    dibatalkan: 'bg-red-500/10 border-red-500/30 text-red-400',
  };
  return map[status] || 'bg-slate-500/10 border-slate-500/30 text-slate-400';
};

const statusLabel = (status) => {
  const map = {
    draft: 'Draft',
    menunggu_persetujuan: 'Menunggu Persetujuan',
    disetujui: 'Disetujui',
    pemilihan_penyedia: 'Pemilihan Penyedia',
    negosiasi: 'Negosiasi',
    spk_dibuat: 'SPK Dibuat',
    kontrak_aktif: 'Kontrak Aktif',
    selesai: 'Selesai',
    dibatalkan: 'Dibatalkan',
  };
  return map[status] || status;
};

const progressFromStatus = (status) => {
  const map = {
    draft: 10,
    menunggu_persetujuan: 25,
    disetujui: 40,
    pemilihan_penyedia: 55,
    negosiasi: 70,
    spk_dibuat: 85,
    kontrak_aktif: 90,
    selesai: 100,
    dibatalkan: 0,
  };
  return map[status] || 0;
};

// ============================================================
// TOAST NOTIFIKASI
// ============================================================
function Toast({ message, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);
  const colors = {
    success: 'bg-emerald-600 border-emerald-500',
    error: 'bg-red-700 border-red-500',
    info: 'bg-blue-700 border-blue-500',
  };
  return (
    <div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl border text-white text-xs font-bold shadow-2xl flex items-center gap-3 ${colors[type] || colors.info}`}>
      <span>{type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'}</span>
      {message}
      <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100 cursor-pointer">✕</button>
    </div>
  );
}

// ============================================================
// MAIN APP
// ============================================================
export default function App() {
  // Auth
  const [screen, setScreen] = useState('login');
  const [token, setToken] = useState(() => localStorage.getItem('simada_token') || null);
  const [currentUser, setCurrentUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('simada_user') || 'null'); } catch { return null; }
  });
  const [activeMenu, setActiveMenu] = useState('dashboard');

  // Toast
  const [toast, setToast] = useState(null);
  const showToast = (message, type = 'info') => setToast({ message, type });

  // Login form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);

  // Register form
  const [regNamaPerusahaan, setRegNamaPerusahaan] = useState('');
  const [regJenis, setRegJenis] = useState('');
  const [regNPWP, setRegNPWP] = useState('');
  const [regAlamat, setRegAlamat] = useState('');
  const [regNamaLengkap, setRegNamaLengkap] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regNoHp, setRegNoHp] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regKonfirmasi, setRegKonfirmasi] = useState('');
  const [regAgree, setRegAgree] = useState(false);
  const [regLoading, setRegLoading] = useState(false);

  // Dashboard data
  const [dashboardStats, setDashboardStats] = useState(null);
  const [paketList, setPaketList] = useState([]);
  const [notifList, setNotifList] = useState([]);
  const [dashLoading, setDashLoading] = useState(false);

  // Paket Pengadaan form
  const [paketForm, setPaketForm] = useState({
    nama_paket: '',
    metode: 'pengadaan_langsung',
    jenis_barang: 'barang',
    pagu: '',
    hps: '',
    tahun: new Date().getFullYear(),
    sumber_dana: 'APBD',
    keterangan: '',
    opd_id: '',
  });
  const [opdList, setOpdList] = useState([]);
  const [paketDokumen, setPaketDokumen] = useState(null);
  const [paketSaving, setPaketSaving] = useState(false);

  // Persetujuan
  const [persetujuanTab, setPersetujuanTab] = useState('menunggu');
  const [paketMenunggu, setPaketMenunggu] = useState([]);
  const [paketDisetujui, setPaketDisetujui] = useState([]);
  const [selectedPaketPersetujuan, setSelectedPaketPersetujuan] = useState(null);
  const [showApprovedOverlay, setShowApprovedOverlay] = useState(false);
  const [persDokumen, setPersDokumen] = useState(null);
  const [persLoading, setPersLoading] = useState(false);

  // Vendor
  const [vendorList, setVendorList] = useState([]);
  const [selectedVendorId, setSelectedVendorId] = useState(null);
  const [selectedPaketVendor, setSelectedPaketVendor] = useState(null);
  const [negoData, setNegoData] = useState({ penawaran_akhir: '', catatan: '' });
  const [vendorSaving, setVendorSaving] = useState(false);
  const [paketSelesai, setPaketSelesai] = useState(null);
  const [vendorPaketList, setVendorPaketList] = useState([]);

  // Penawaran
  const [penawaranPaketList, setPenawaranPaketList] = useState([]);
  const [selectedPenawaranPaket, setSelectedPenawaranPaket] = useState(null);
  const [penawaranForm, setPenawaranForm] = useState({ harga: '', catatan: '' });
  const [penawaranDokumen, setPenawaranDokumen] = useState(null);
  const [penawaranSaving, setPenawaranSaving] = useState(false);

  // ============================================================
  // AUTO LOGIN CHECK
  // ============================================================
  useEffect(() => {
    if (token && currentUser) {
      setScreen('app');
    }
  }, []);

  // ============================================================
  // FETCH FUNCTIONS
  // ============================================================
  const fetchDashboard = useCallback(async () => {
    if (!token) return;
    setDashLoading(true);
    try {
      const [statsRes, paketRes, notifRes] = await Promise.all([
        api.get('/dashboard/stats', token),
        api.get('/paket?limit=10', token),
        api.get('/notifikasi?limit=5', token),
      ]);
      if (statsRes.data) setDashboardStats(statsRes.data);
      if (paketRes.data) setPaketList(paketRes.data);
      if (notifRes.data) setNotifList(notifRes.data);
    } catch (e) {
      // fallback ke data kosong, tidak crash
    }
    setDashLoading(false);
  }, [token]);

  const fetchOPD = useCallback(async () => {
    if (!token) return;
    try {
      const res = await api.get('/opd', token);
      if (res.data) setOpdList(res.data);
    } catch (e) {}
  }, [token]);

  const fetchPersetujuan = useCallback(async () => {
    if (!token) return;
    setPersLoading(true);
    try {
      const [menungguRes, disetujuiRes] = await Promise.all([
        api.get('/paket?status=menunggu_persetujuan', token),
        api.get('/paket?status=disetujui', token),
      ]);
      if (menungguRes.data) setPaketMenunggu(menungguRes.data);
      if (disetujuiRes.data) setPaketDisetujui(disetujuiRes.data);
      if (menungguRes.data && menungguRes.data.length > 0) {
        setSelectedPaketPersetujuan(menungguRes.data[0]);
      }
    } catch (e) {}
    setPersLoading(false);
  }, [token]);

  const fetchVendor = useCallback(async () => {
    if (!token) return;
    try {
      const [vendorRes, paketRes] = await Promise.all([
        api.get('/penyedia', token),
        api.get('/paket?status=disetujui', token),
      ]);
      if (vendorRes.data) setVendorList(vendorRes.data);
      if (paketRes.data) setVendorPaketList(paketRes.data);
      if (paketRes.data && paketRes.data.length > 0 && !selectedPaketVendor) {
        setSelectedPaketVendor(paketRes.data[0]);
      }
    } catch (e) {}
  }, [token]);

  const fetchPenawaran = useCallback(async () => {
    if (!token) return;
    try {
      const res = await api.get('/paket?status=pemilihan_penyedia', token);
      if (res.data) {
        setPenawaranPaketList(res.data);
        if (res.data.length > 0 && !selectedPenawaranPaket) {
          setSelectedPenawaranPaket(res.data[0]);
        }
      }
    } catch (e) {}
  }, [token]);

  useEffect(() => {
    if (screen === 'app') {
      fetchDashboard();
      fetchOPD();
    }
  }, [screen]);

  useEffect(() => {
    if (screen === 'app' && activeMenu === 'persetujuan') fetchPersetujuan();
    if (screen === 'app' && activeMenu === 'vendor') fetchVendor();
    if (screen === 'app' && activeMenu === 'penawaran') fetchPenawaran();
  }, [activeMenu, screen]);

  // ============================================================
  // AUTH HANDLERS
  // ============================================================
  const handleLogin = async () => {
    if (!loginEmail || !loginPassword) {
      showToast('Email dan password wajib diisi', 'error');
      return;
    }
    setLoginLoading(true);
    try {
      const res = await api.post('/auth/login', { email: loginEmail, password: loginPassword });
      if (res.token && res.user) {
        localStorage.setItem('simada_token', res.token);
        localStorage.setItem('simada_user', JSON.stringify(res.user));
        setToken(res.token);
        setCurrentUser(res.user);
        setScreen('app');
        showToast(`Selamat datang, ${res.user.name}!`, 'success');
      } else {
        showToast(res.message || 'Email atau password salah', 'error');
      }
    } catch (e) {
      showToast('Tidak dapat terhubung ke server', 'error');
    }
    setLoginLoading(false);
  };

  const handleRegister = async () => {
    if (!regNamaPerusahaan || !regEmail || !regPassword || !regNamaLengkap) {
      showToast('Mohon lengkapi semua field wajib', 'error');
      return;
    }
    if (regPassword !== regKonfirmasi) {
      showToast('Password dan konfirmasi tidak sama', 'error');
      return;
    }
    if (!regAgree) {
      showToast('Anda harus menyetujui syarat & ketentuan', 'error');
      return;
    }
    setRegLoading(true);
    try {
      const res = await api.post('/auth/register-vendor', {
        nama_perusahaan: `${regJenis} ${regNamaPerusahaan}`.trim(),
        npwp: regNPWP,
        alamat: regAlamat,
        nama_pic: regNamaLengkap,
        email: regEmail,
        no_telp: regNoHp,
        password: regPassword,
      });
      if (res.success) {
        showToast('Pendaftaran berhasil! Silakan login.', 'success');
        setScreen('login');
      } else {
        showToast(res.message || 'Pendaftaran gagal', 'error');
      }
    } catch (e) {
      showToast('Tidak dapat terhubung ke server', 'error');
    }
    setRegLoading(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('simada_token');
    localStorage.removeItem('simada_user');
    setToken(null);
    setCurrentUser(null);
    setScreen('login');
    setActiveMenu('dashboard');
  };

  // ============================================================
  // PAKET PENGADAAN HANDLERS
  // ============================================================
  const handleSavePaket = async (status) => {
    if (!paketForm.nama_paket || !paketForm.pagu || !paketForm.hps) {
      showToast('Nama paket, pagu, dan HPS wajib diisi', 'error');
      return;
    }
    setPaketSaving(true);
    try {
      const formData = new FormData();
      Object.entries({ ...paketForm, status, ppk_id: currentUser?.user_id }).forEach(([k, v]) => {
        if (v !== '' && v !== null) formData.append(k, v);
      });
      if (paketDokumen) formData.append('dokumen', paketDokumen);

      const res = await api.postForm('/paket', formData, token);
      if (res.success || res.data) {
        showToast(
          status === 'draft' ? 'Paket disimpan sebagai draft' : 'Paket dikirim untuk persetujuan',
          'success'
        );
        // Reset form
        setPaketForm({ nama_paket: '', metode: 'pengadaan_langsung', jenis_barang: 'barang', pagu: '', hps: '', tahun: new Date().getFullYear(), sumber_dana: 'APBD', keterangan: '', opd_id: '' });
        setPaketDokumen(null);
        if (status === 'menunggu_persetujuan') {
          setActiveMenu('persetujuan');
        } else {
          setActiveMenu('dashboard');
        }
        fetchDashboard();
      } else {
        showToast(res.message || 'Gagal menyimpan paket', 'error');
      }
    } catch (e) {
      showToast('Tidak dapat terhubung ke server', 'error');
    }
    setPaketSaving(false);
  };

  // ============================================================
  // PERSETUJUAN HANDLERS
  // ============================================================
  const handleSetujui = async () => {
    if (!selectedPaketPersetujuan) return;
    try {
      const formData = new FormData();
      formData.append('status', 'disetujui');
      if (persDokumen) formData.append('dokumen', persDokumen);

      const res = await api.postForm(`/paket/${selectedPaketPersetujuan.paket_id}/setujui`, formData, token);
      if (res.success || res.data) {
        setShowApprovedOverlay(true);
        setPersetujuanTab('disetujui');
        fetchPersetujuan();
        fetchDashboard();
        showToast('Paket berhasil disetujui!', 'success');
      } else {
        showToast(res.message || 'Gagal menyetujui paket', 'error');
      }
    } catch (e) {
      showToast('Tidak dapat terhubung ke server', 'error');
    }
  };

  const handleTolak = async () => {
    if (!selectedPaketPersetujuan) return;
    try {
      const res = await api.put(`/paket/${selectedPaketPersetujuan.paket_id}/tolak`, { status: 'dibatalkan' }, token);
      if (res.success || res.data) {
        showToast('Paket ditolak', 'info');
        fetchPersetujuan();
        fetchDashboard();
        setActiveMenu('dashboard');
      }
    } catch (e) {
      showToast('Tidak dapat terhubung ke server', 'error');
    }
  };

  // ============================================================
  // VENDOR HANDLERS
  // ============================================================
  const handleSimpanVendor = async () => {
    if (!selectedVendorId || !selectedPaketVendor) {
      showToast('Pilih vendor terlebih dahulu', 'error');
      return;
    }
    if (!negoData.penawaran_akhir) {
      showToast('Isi penawaran akhir', 'error');
      return;
    }
    setVendorSaving(true);
    try {
      const res = await api.post('/pengadaan-langsung', {
        paket_id: selectedPaketVendor.paket_id,
        penyedia_id: selectedVendorId,
        harga_negosiasi: negoData.penawaran_akhir,
        hasil_negosiasi: negoData.catatan,
        harga_final: negoData.penawaran_akhir,
        status_pl: 'negosiasi',
        pejabat_id: currentUser?.user_id,
      }, token);
      if (res.success || res.data) {
        const vendorDipilih = vendorList.find(v => v.penyedia_id === selectedVendorId);
        setPaketSelesai({
          paket: selectedPaketVendor,
          vendor: vendorDipilih,
          nilai: negoData.penawaran_akhir,
        });
        setActiveMenu('paket-selesai');
        showToast('Vendor berhasil dipilih!', 'success');
        fetchDashboard();
      } else {
        showToast(res.message || 'Gagal menyimpan vendor', 'error');
      }
    } catch (e) {
      showToast('Tidak dapat terhubung ke server', 'error');
    }
    setVendorSaving(false);
  };

  // ============================================================
  // PENAWARAN HANDLERS
  // ============================================================
  const handleKirimPenawaran = async () => {
    if (!selectedPenawaranPaket) {
      showToast('Tidak ada paket yang dipilih', 'error');
      return;
    }
    if (!penawaranForm.harga) {
      showToast('Harga penawaran wajib diisi', 'error');
      return;
    }
    setPenawaranSaving(true);
    try {
      const formData = new FormData();
      formData.append('paket_id', selectedPenawaranPaket.paket_id);
      formData.append('harga_penawaran', penawaranForm.harga);
      formData.append('catatan_penawaran', penawaranForm.catatan);
      formData.append('penyedia_id', currentUser?.user_id || '');
      if (penawaranDokumen) formData.append('dokumen_penawaran', penawaranDokumen);

      const res = await api.postForm('/penawaran', formData, token);
      if (res.success || res.data) {
        showToast('Penawaran berhasil dikirim!', 'success');
        setPenawaranForm({ harga: '', catatan: '' });
        setPenawaranDokumen(null);
        setActiveMenu('vendor');
      } else {
        showToast(res.message || 'Gagal kirim penawaran', 'error');
      }
    } catch (e) {
      showToast('Tidak dapat terhubung ke server', 'error');
    }
    setPenawaranSaving(false);
  };

  // Sensor nomor telepon
  const sensorNoTelp = (no) => {
    if (!no) return '-';
    if (no.length <= 5) return no;
    return no.slice(0, 4) + '****' + no.slice(-2);
  };

  // ============================================================
  // USER INITIALS
  // ============================================================
  const userInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    return parts.length >= 2 ? (parts[0][0] + parts[1][0]).toUpperCase() : name.slice(0, 2).toUpperCase();
  };

  const wallpaperStyle = {
    backgroundImage: `url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=2000&q=80')`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundAttachment: 'fixed',
  };

  // ============================================================
  // LOGIN SCREEN
  // ============================================================
  if (screen === 'login') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center font-sans" style={{ fontFamily: 'system-ui, sans-serif' }}>
        {toast && <Toast {...toast} onClose={() => setToast(null)} />}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 relative">
            <div className="absolute top-0 left-0 w-5 h-5 bg-gray-300 rounded-sm"></div>
            <div className="absolute top-0 right-0 w-5 h-5 bg-blue-400 rounded-sm"></div>
            <div className="absolute bottom-0 left-0 w-5 h-5 bg-blue-700 rounded-sm"></div>
            <div className="absolute bottom-0 right-0 w-5 h-5 bg-gray-200 rounded-sm"></div>
          </div>
          <div>
            <div className="text-xl font-bold text-gray-800">SIPL</div>
            <div className="text-sm text-gray-500">Sistem Pengadaan Langsung</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
          <h1 className="text-2xl font-bold text-gray-900 text-center mb-1">Masuk ke akun anda</h1>
          <p className="text-sm text-gray-400 text-center mb-6">silakan masuk untuk melanjutkan</p>

          {/* Hint akun */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4 text-xs text-blue-700">
            <p className="font-bold mb-1">Akun tersedia:</p>
            <p>• admin@simada.kebumen.go.id</p>
            <p>• ppk@simada.kebumen.go.id</p>
            <p>• pejabat@simada.kebumen.go.id</p>
            <p className="mt-1 text-blue-500">Password: 123456789</p>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              placeholder="Masukan email"
              value={loginEmail}
              onChange={e => setLoginEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 text-gray-800"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Masukan password"
                value={loginPassword}
                onChange={e => setLoginPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 text-gray-800 pr-10"
              />
              <button onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-gray-400 cursor-pointer">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </button>
            </div>
          </div>

          <button
            onClick={handleLogin}
            disabled={loginLoading}
            className="w-full bg-blue-900 hover:bg-blue-800 disabled:opacity-60 text-white font-semibold py-3 rounded-xl text-sm cursor-pointer transition-colors mb-3"
          >
            {loginLoading ? 'Memuat...' : 'Login'}
          </button>

          <p className="text-sm text-center text-gray-500">
            Belum punya akun?{' '}
            <button onClick={() => setScreen('register')} className="text-blue-600 font-semibold cursor-pointer hover:underline">Daftar akun</button>
          </p>
        </div>
      </div>
    );
  }

  // ============================================================
  // REGISTER SCREEN
  // ============================================================
  if (screen === 'register') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-start py-8 px-4 font-sans" style={{ fontFamily: 'system-ui, sans-serif' }}>
        {toast && <Toast {...toast} onClose={() => setToast(null)} />}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 relative">
            <div className="absolute top-0 left-0 w-5 h-5 bg-gray-300 rounded-sm"></div>
            <div className="absolute top-0 right-0 w-5 h-5 bg-blue-400 rounded-sm"></div>
            <div className="absolute bottom-0 left-0 w-5 h-5 bg-blue-700 rounded-sm"></div>
            <div className="absolute bottom-0 right-0 w-5 h-5 bg-gray-200 rounded-sm"></div>
          </div>
          <div>
            <div className="text-xl font-bold text-gray-800">SIPL</div>
            <div className="text-sm text-gray-500">Sistem Pengadaan Langsung</div>
          </div>
        </div>

        <div className="w-full max-w-5xl flex gap-6">
          {/* Left: Company info */}
          <div className="flex-1 bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-1">Daftar Akun Vendor</h2>
            <p className="text-sm text-gray-400 mb-6">Lengkapi data untuk mendaftar akun vendor</p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama Perusahaan <span className="text-red-500">*</span></label>
              <input type="text" placeholder="Masukan nama perusahaan" value={regNamaPerusahaan} onChange={e => setRegNamaPerusahaan(e.target.value)} className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500" />
            </div>

            <div className="flex gap-4 mb-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Jenis Perusahaan</label>
                <div className="relative">
                  <select value={regJenis} onChange={e => setRegJenis(e.target.value)} className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 appearance-none bg-white">
                    <option value="">Pilih jenis</option>
                    <option>CV</option>
                    <option>PT</option>
                    <option>UD</option>
                  </select>
                  <div className="pointer-events-none absolute right-3 top-3.5 text-gray-400">▼</div>
                </div>
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">NPWP Perusahaan</label>
                <input type="text" placeholder="Masukan NPWP" value={regNPWP} onChange={e => setRegNPWP(e.target.value)} className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Alamat Perusahaan</label>
              <input type="text" placeholder="Masukan alamat perusahaan" value={regAlamat} onChange={e => setRegAlamat(e.target.value)} className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500" />
            </div>
          </div>

          {/* Right: Contact info */}
          <div className="flex-1 bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-1">Kontak Penanggung Jawab</h2>
            <p className="text-sm text-gray-400 mb-6">Masukan data kontak lengkap</p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap <span className="text-red-500">*</span></label>
              <input type="text" placeholder="Masukan nama lengkap" value={regNamaLengkap} onChange={e => setRegNamaLengkap(e.target.value)} className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500" />
            </div>

            <div className="flex gap-4 mb-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Email <span className="text-red-500">*</span></label>
                <input type="email" placeholder="Masukan email" value={regEmail} onChange={e => setRegEmail(e.target.value)} className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500" />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">No HP</label>
                <input type="text" placeholder="Masukan no HP" value={regNoHp} onChange={e => setRegNoHp(e.target.value)} className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500" />
              </div>
            </div>

            <div className="flex gap-4 mb-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Password <span className="text-red-500">*</span></label>
                <input type="password" placeholder="Masukan password" value={regPassword} onChange={e => setRegPassword(e.target.value)} className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500" />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Konfirmasi Password <span className="text-red-500">*</span></label>
                <input type="password" placeholder="Konfirmasi password" value={regKonfirmasi} onChange={e => setRegKonfirmasi(e.target.value)} className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500" />
              </div>
            </div>

            <label className="flex items-center gap-2 mb-5 cursor-pointer">
              <input type="checkbox" checked={regAgree} onChange={e => setRegAgree(e.target.checked)} className="w-4 h-4 border-2 border-gray-300 rounded" />
              <span className="text-sm text-gray-600">
                Saya setuju dengan{' '}
                <span className="text-blue-600 cursor-pointer hover:underline">syarat &amp; ketentuan</span>
                {' '}dan{' '}
                <span className="text-blue-600 cursor-pointer hover:underline">kebijakan privasi</span>
              </span>
            </label>

            <button
              onClick={handleRegister}
              disabled={regLoading}
              className="w-full bg-blue-900 hover:bg-blue-800 disabled:opacity-60 text-white font-semibold py-3 rounded-xl text-sm cursor-pointer transition-colors mb-3"
            >
              {regLoading ? 'Mendaftarkan...' : 'Daftar Akun'}
            </button>
            <p className="text-sm text-center text-gray-500">
              Sudah punya akun?{' '}
              <button onClick={() => setScreen('login')} className="text-blue-600 font-semibold cursor-pointer hover:underline">Login</button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================
  // MAIN APP
  // ============================================================
  return (
    <div className="min-h-screen text-slate-100 font-sans antialiased relative bg-slate-950" style={wallpaperStyle}>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      <div className="absolute inset-0 bg-slate-950/92 backdrop-blur-md z-0"></div>

      <div className="relative z-10 min-h-screen flex">

        {/* ===== SIDEBAR ===== */}
        <aside className="w-72 bg-slate-950 border-r border-white/10 flex flex-col justify-between shrink-0 h-screen sticky top-0">
          <div className="flex flex-col h-full justify-between">
            <div className="overflow-y-auto flex-1">

              {/* Brand */}
              <div className="p-4 flex items-center gap-3 border-b border-white/10 bg-slate-900/40">
                <div className="w-9 h-9 relative shrink-0">
                  <div className="absolute top-0 left-0 w-4 h-4 bg-slate-500/60 rounded-sm"></div>
                  <div className="absolute top-0 right-0 w-4 h-4 bg-blue-400/80 rounded-sm"></div>
                  <div className="absolute bottom-0 left-0 w-4 h-4 bg-blue-600 rounded-sm"></div>
                  <div className="absolute bottom-0 right-0 w-4 h-4 bg-slate-600/40 rounded-sm"></div>
                </div>
                <div>
                  <h1 className="text-xs font-black text-white tracking-wide leading-none">SIPL</h1>
                  <p className="text-[9px] text-blue-400 font-bold uppercase tracking-widest mt-1">Sistem Pengadaan Langsung</p>
                </div>
              </div>

              {/* Nav */}
              <nav className="p-3 space-y-4">
                <div>
                  <button
                    onClick={() => setActiveMenu('dashboard')}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold transition-all text-left cursor-pointer ${activeMenu === 'dashboard' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
                  >
                    <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" /></svg>
                    Dashboard
                  </button>
                </div>

                <div>
                  <span className="px-3 text-[9px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Proses Pengadaan</span>
                  <div className="space-y-0.5">
                    {[
                      { key: 'input-paket', label: 'Paket Pengadaan', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /> },
                      { key: 'persetujuan', label: 'Persetujuan', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />, badge: paketMenunggu.length },
                      { key: 'vendor', label: 'Vendor', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /> },
                      { key: 'penawaran', label: 'Penawaran', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" /> },
                    ].map(item => (
                      <button
                        key={item.key}
                        onClick={() => setActiveMenu(item.key)}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold transition-all text-left cursor-pointer ${activeMenu === item.key || activeMenu === `${item.key}` ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
                      >
                        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">{item.icon}</svg>
                        {item.label}
                        {item.badge > 0 && <span className="ml-auto w-4 h-4 bg-red-500 rounded-full text-[9px] font-black text-white flex items-center justify-center">{item.badge}</span>}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="px-3 text-[9px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Laporan</span>
                  <div className="space-y-0.5">
                    {[
                      { label: 'Laporan Lengkap', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /> },
                      { label: 'Arsip & Rekap', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" /> },
                    ].map((item, i) => (
                      <button key={i} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold text-slate-400 hover:bg-white/5 hover:text-white transition-all text-left cursor-pointer">
                        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">{item.icon}</svg>
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="px-3 text-[9px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Pengaturan</span>
                  <div className="space-y-0.5">
                    <button className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold text-slate-400 hover:bg-white/5 hover:text-white transition-all text-left cursor-pointer">
                      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      Pengaturan Akun
                    </button>
                  </div>
                </div>
              </nav>
            </div>

            {/* User Profile */}
            <div className="p-3 border-t border-white/10 bg-slate-900/40 flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600/20 text-blue-400 font-bold text-xs flex items-center justify-center rounded-lg border border-blue-500/20">
                {currentUser ? userInitials(currentUser.name) : 'U'}
              </div>
              <div className="leading-none flex-1">
                <p className="text-xs font-bold text-white">{currentUser?.name || 'User'}</p>
                <span className="text-[9px] text-slate-400 font-medium">{currentUser?.role?.nama || currentUser?.role || 'Staff'}</span>
              </div>
              <button onClick={handleLogout} className="text-slate-500 hover:text-slate-300 cursor-pointer" title="Logout">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              </button>
            </div>
          </div>
        </aside>

        {/* ===== MAIN CONTENT ===== */}
        <main className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
          {/* Header */}
          <header className="h-12 bg-slate-950/40 border-b border-white/10 px-6 flex items-center justify-between backdrop-blur-xs sticky top-0 z-10">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <span>≡</span>
              <span className="text-blue-400 capitalize">
                {activeMenu === 'input-paket' ? 'PPK - Input Paket'
                  : activeMenu === 'persetujuan' ? 'PA/KPA - Persetujuan Paket'
                  : activeMenu === 'vendor' ? 'Pejabat Pengadaan - Undang Vendor'
                  : activeMenu === 'penawaran' ? 'Vendor - Penawaran'
                  : activeMenu === 'paket-selesai' ? 'Paket Selesai'
                  : activeMenu.replace('-', ' ')}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button className="relative text-slate-400 hover:text-white cursor-pointer">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                {notifList.length > 0 && <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>}
              </button>
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-2.5 py-1 rounded-lg">
                <div className="w-6 h-6 bg-slate-600 rounded-full flex items-center justify-center text-[9px] font-bold">
                  {currentUser ? userInitials(currentUser.name) : 'U'}
                </div>
                <div className="text-xs text-white font-medium">{currentUser?.name || 'User'}</div>
                <div className="text-[9px] text-slate-400">{currentUser?.role?.slug?.toUpperCase() || 'STAFF'}</div>
              </div>
            </div>
          </header>

          <div className="p-6 flex-1 space-y-6 w-full">

            {/* ===== DASHBOARD ===== */}
            {activeMenu === 'dashboard' && (
              <>
                <div>
                  <h2 className="text-lg font-bold text-white">Selamat datang, {currentUser?.name || 'User'}</h2>
                  <p className="text-xs text-slate-400">Berikut ini proses pengadaan hari ini</p>
                </div>

                {/* Stat cards */}
                <div className="grid grid-cols-5 gap-4">
                  {[
                    { label: 'Total Paket', sublabel: 'Semua Paket', value: dashboardStats?.total ?? paketList.length, color: 'from-blue-700 to-blue-900', icon: '🗂' },
                    { label: 'Draft', sublabel: 'Belum Diproses', value: dashboardStats?.draft ?? paketList.filter(p => p.status === 'draft').length, color: 'from-emerald-600 to-emerald-800', icon: '📁' },
                    { label: 'Menunggu Persetujuan', sublabel: 'Perlu tindak lanjut', value: dashboardStats?.menunggu ?? paketList.filter(p => p.status === 'menunggu_persetujuan').length, color: 'from-amber-500 to-amber-700', icon: '⏳' },
                    { label: 'SPK Aktif', sublabel: 'Sedang berjalan', value: dashboardStats?.spk_aktif ?? paketList.filter(p => p.status === 'spk_dibuat').length, color: 'from-purple-600 to-purple-800', icon: '📄' },
                    { label: 'Selesai', sublabel: 'Paket Selesai', value: dashboardStats?.selesai ?? paketList.filter(p => p.status === 'selesai').length, color: 'from-teal-600 to-teal-800', icon: '✅' },
                  ].map((c, i) => (
                    <div key={i} className={`bg-gradient-to-br ${c.color} p-4 rounded-xl shadow-lg border border-white/10`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{c.icon}</span>
                        <span className="text-[10px] font-bold text-white/80 uppercase tracking-wider leading-tight">{c.label}</span>
                      </div>
                      <p className="text-2xl font-black text-white">{dashLoading ? '...' : c.value}</p>
                      <p className="text-[9px] text-white/60 font-medium">{c.sublabel}</p>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Tabel paket */}
                  <div className="lg:col-span-2 bg-white/[0.03] border border-white/10 rounded-2xl p-4 shadow-xl">
                    <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-3">
                      <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Daftar Paket Pengadaan</h3>
                      <button onClick={() => setActiveMenu('input-paket')} className="text-[10px] text-blue-400 cursor-pointer hover:underline">+ Tambah Paket</button>
                    </div>
                    {dashLoading ? (
                      <div className="text-center py-8 text-slate-500 text-xs">Memuat data...</div>
                    ) : paketList.length === 0 ? (
                      <div className="text-center py-8 text-slate-500 text-xs">Belum ada paket pengadaan</div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="border-b border-white/10 text-slate-400 font-bold text-[10px] uppercase tracking-wider">
                              <th className="pb-2.5 pr-2">No</th>
                              <th className="pb-2.5 pr-4">Nama Paket</th>
                              <th className="pb-2.5 pr-4">OPD</th>
                              <th className="pb-2.5 pr-4">Pagu (Rp)</th>
                              <th className="pb-2.5 pr-4">Status</th>
                              <th className="pb-2.5 pr-4">Progres</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5 text-slate-300">
                            {paketList.map((row, i) => {
                              const prog = progressFromStatus(row.status);
                              return (
                                <tr key={row.paket_id} className="hover:bg-white/[0.02] transition-colors">
                                  <td className="py-2 text-slate-500 pr-2">{i + 1}</td>
                                  <td className="py-2 text-white font-medium text-xs pr-4">{row.nama_paket}</td>
                                  <td className="py-2 text-slate-400 text-xs pr-4">{row.opd?.nama_opd || row.opd_id || '-'}</td>
                                  <td className="py-2 font-mono text-slate-300 text-xs pr-4">{formatRp(row.pagu)}</td>
                                  <td className="py-2 pr-4">
                                    <span className={`px-2 py-0.5 border rounded text-[9px] font-bold ${statusBadge(row.status)}`}>{statusLabel(row.status)}</span>
                                  </td>
                                  <td className="py-2 pr-4">
                                    <div className="flex items-center gap-1.5">
                                      <div className="w-20 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${prog}%` }}></div>
                                      </div>
                                      <span className="text-[9px] text-slate-400">{prog}%</span>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Notifikasi */}
                  <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 shadow-xl flex flex-col gap-3">
                    <div className="flex items-center justify-between border-b border-white/5 pb-2">
                      <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Notifikasi Terbaru</h3>
                    </div>
                    <div className="space-y-2">
                      {notifList.length === 0 ? (
                        <p className="text-xs text-slate-500 text-center py-4">Tidak ada notifikasi</p>
                      ) : notifList.map((n, i) => (
                        <div key={i} className="flex items-start gap-2 p-2 bg-white/[0.02] rounded-lg border border-white/5">
                          <div className="w-6 h-6 bg-blue-500/20 border border-blue-500/30 rounded flex items-center justify-center text-[10px] shrink-0 mt-0.5">📋</div>
                          <div>
                            <p className="text-[10px] text-slate-300 font-medium leading-tight">{n.pesan || n.judul}</p>
                            <p className="text-[9px] text-slate-500 mt-0.5">{n.created_at || ''}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Milestone / Status */}
                <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 shadow-xl">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-4">Alur Proses Pengadaan</h3>
                  <div className="flex items-center gap-1 flex-wrap">
                    {[
                      { label: 'Input Paket & HPS', icon: '📝', color: 'bg-blue-600' },
                      { label: 'Persetujuan PPK/PA', icon: '✅', color: 'bg-emerald-600' },
                      { label: 'Undangan Penawaran', icon: '📨', color: 'bg-amber-500' },
                      { label: 'Penerimaan Penawaran', icon: '📩', color: 'bg-purple-600' },
                      { label: 'Negosiasi Harga', icon: '🤝', color: 'bg-teal-600' },
                      { label: 'Penerbitan SPK', icon: '📄', color: 'bg-blue-700' },
                      { label: 'Pelaksanaan Kontrak', icon: '🏗', color: 'bg-slate-600' },
                    ].map((step, i) => (
                      <React.Fragment key={i}>
                        <div className={`${step.color} px-3 py-2 rounded-lg text-[10px] font-bold text-white flex items-center gap-1.5`}>
                          <span>{step.icon}</span>
                          {step.label}
                        </div>
                        {i < 6 && <span className="text-slate-600 text-xs">→</span>}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* ===== INPUT PAKET ===== */}
            {activeMenu === 'input-paket' && (
              <div className="w-full max-w-4xl space-y-4">
                <h2 className="text-base font-bold text-white">Buat Paket Pengadaan</h2>

                <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-8 shadow-2xl backdrop-blur-xl">
                  <h3 className="text-center text-sm font-bold text-white uppercase tracking-widest mb-8 pb-4 border-b border-white/10">Informasi Paket</h3>

                  <div className="grid grid-cols-2 gap-6">
                    {/* Kiri */}
                    <div className="space-y-5">
                      <div className="flex items-start gap-4">
                        <div className="bg-[#0d3b81] text-white text-[10px] font-bold px-3 py-2 rounded-lg min-w-[120px] text-center shrink-0">Nama Paket *</div>
                        <input
                          type="text"
                          value={paketForm.nama_paket}
                          onChange={e => setPaketForm(f => ({ ...f, nama_paket: e.target.value }))}
                          placeholder="Nama paket pengadaan"
                          className="flex-1 px-3 py-2 bg-white/[0.03] border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div className="flex items-start gap-4">
                        <div className="bg-emerald-600 text-white text-[10px] font-bold px-3 py-2 rounded-lg min-w-[120px] text-center shrink-0">Metode</div>
                        <select
                          value={paketForm.metode}
                          onChange={e => setPaketForm(f => ({ ...f, metode: e.target.value }))}
                          className="flex-1 px-3 py-2 bg-white/[0.03] border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
                        >
                          <option value="pengadaan_langsung">Pengadaan Langsung</option>
                          <option value="e_purchasing">E-Purchasing</option>
                          <option value="tender">Tender</option>
                        </select>
                      </div>
                      <div className="flex items-start gap-4">
                        <div className="bg-purple-600 text-white text-[10px] font-bold px-3 py-2 rounded-lg min-w-[120px] text-center shrink-0">Jenis Barang</div>
                        <select
                          value={paketForm.jenis_barang}
                          onChange={e => setPaketForm(f => ({ ...f, jenis_barang: e.target.value }))}
                          className="flex-1 px-3 py-2 bg-white/[0.03] border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
                        >
                          <option value="barang">Barang</option>
                          <option value="jasa_konsultansi">Jasa Konsultansi</option>
                          <option value="jasa_lainnya">Jasa Lainnya</option>
                          <option value="pekerjaan_konstruksi">Pekerjaan Konstruksi</option>
                        </select>
                      </div>
                      <div className="flex items-start gap-4">
                        <div className="bg-amber-500 text-white text-[10px] font-bold px-3 py-2 rounded-lg min-w-[120px] text-center shrink-0">Pagu (Rp) *</div>
                        <input
                          type="number"
                          value={paketForm.pagu}
                          onChange={e => setPaketForm(f => ({ ...f, pagu: e.target.value }))}
                          placeholder="Nilai pagu anggaran"
                          className="flex-1 px-3 py-2 bg-white/[0.03] border border-white/10 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div className="flex items-start gap-4">
                        <div className="bg-rose-600 text-white text-[10px] font-bold px-3 py-2 rounded-lg min-w-[120px] text-center shrink-0">HPS (Rp) *</div>
                        <input
                          type="number"
                          value={paketForm.hps}
                          onChange={e => setPaketForm(f => ({ ...f, hps: e.target.value }))}
                          placeholder="Harga Perkiraan Sendiri"
                          className="flex-1 px-3 py-2 bg-white/[0.03] border border-white/10 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>

                    {/* Kanan */}
                    <div className="space-y-5">
                      <div className="flex items-start gap-4">
                        <div className="bg-teal-600 text-white text-[10px] font-bold px-3 py-2 rounded-lg min-w-[120px] text-center shrink-0">Sumber Dana</div>
                        <select
                          value={paketForm.sumber_dana}
                          onChange={e => setPaketForm(f => ({ ...f, sumber_dana: e.target.value }))}
                          className="flex-1 px-3 py-2 bg-white/[0.03] border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
                        >
                          <option>APBD</option>
                          <option>APBN</option>
                          <option>DAK</option>
                        </select>
                      </div>
                      <div className="flex items-start gap-4">
                        <div className="bg-indigo-600 text-white text-[10px] font-bold px-3 py-2 rounded-lg min-w-[120px] text-center shrink-0">OPD</div>
                        <select
                          value={paketForm.opd_id}
                          onChange={e => setPaketForm(f => ({ ...f, opd_id: e.target.value }))}
                          className="flex-1 px-3 py-2 bg-white/[0.03] border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
                        >
                          <option value="">Pilih OPD</option>
                          {opdList.map(o => (
                            <option key={o.opd_id} value={o.opd_id}>{o.nama_opd}</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex items-start gap-4">
                        <div className="bg-slate-600 text-white text-[10px] font-bold px-3 py-2 rounded-lg min-w-[120px] text-center shrink-0">Tahun</div>
                        <input
                          type="number"
                          value={paketForm.tahun}
                          onChange={e => setPaketForm(f => ({ ...f, tahun: e.target.value }))}
                          className="flex-1 px-3 py-2 bg-white/[0.03] border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div className="flex items-start gap-4">
                        <div className="bg-red-600 text-white text-[10px] font-bold px-3 py-2 rounded-lg min-w-[120px] text-center shrink-0">Deskripsi</div>
                        <textarea
                          value={paketForm.keterangan}
                          onChange={e => setPaketForm(f => ({ ...f, keterangan: e.target.value }))}
                          rows={3}
                          placeholder="Keterangan / deskripsi paket"
                          className="flex-1 px-3 py-2 bg-white/[0.03] border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500 resize-none"
                        />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-300 mb-2">Dokumen Pendukung (PDF)</div>
                        <label className="cursor-pointer">
                          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 hover:border-blue-500/50 px-3 py-1.5 rounded-lg text-xs text-slate-300 transition-colors">
                            <svg className="w-3 h-3 text-blue-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9 2a2 2 0 00-2 2v8a2 2 0 002 2h6a2 2 0 002-2V6.414A2 2 0 0016.414 5L14 2.586A2 2 0 0012.586 2H9z" /></svg>
                            {paketDokumen ? paketDokumen.name : 'Upload PDF...'}
                          </div>
                          <input type="file" accept=".pdf" className="hidden" onChange={e => setPaketDokumen(e.target.files[0])} />
                        </label>
                        {paketDokumen && (
                          <button onClick={() => setPaketDokumen(null)} className="ml-2 text-[10px] text-red-400 hover:underline cursor-pointer">Hapus</button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 flex justify-center gap-4 border-t border-white/10 pt-6">
                    <button
                      onClick={() => handleSavePaket('draft')}
                      disabled={paketSaving}
                      className="px-6 py-2.5 border border-white/20 rounded-xl text-xs font-bold text-slate-300 hover:bg-white/5 disabled:opacity-60 cursor-pointer"
                    >
                      {paketSaving ? 'Menyimpan...' : 'Simpan Draft'}
                    </button>
                    <button
                      onClick={() => handleSavePaket('menunggu_persetujuan')}
                      disabled={paketSaving}
                      className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
                    >
                      {paketSaving ? 'Mengirim...' : 'Kirim untuk Persetujuan'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ===== PERSETUJUAN ===== */}
            {activeMenu === 'persetujuan' && (
              <div className="w-full max-w-2xl space-y-4">
                <h2 className="text-base font-bold text-white">Persetujuan Paket</h2>

                <div className="bg-white/[0.04] border border-white/10 rounded-2xl shadow-2xl backdrop-blur-xl overflow-hidden">
                  {/* Tabs */}
                  <div className="flex border-b border-white/10">
                    <button
                      onClick={() => setPersetujuanTab('menunggu')}
                      className={`flex-1 py-3 text-xs font-bold text-center cursor-pointer transition-colors ${persetujuanTab === 'menunggu' ? 'text-blue-400 border-b-2 border-blue-500 bg-blue-500/5' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                      Menunggu Persetujuan ({paketMenunggu.length})
                    </button>
                    <button
                      onClick={() => setPersetujuanTab('disetujui')}
                      className={`flex-1 py-3 text-xs font-bold text-center cursor-pointer transition-colors ${persetujuanTab === 'disetujui' ? 'text-blue-400 border-b-2 border-blue-500 bg-blue-500/5' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                      Disetujui ({paketDisetujui.length})
                    </button>
                  </div>

                  <div className="p-8 relative">
                    {/* Approved overlay */}
                    {showApprovedOverlay && (
                      <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm rounded-b-2xl flex flex-col items-center justify-center z-10 gap-4">
                        <div className="w-20 h-20 bg-emerald-500/20 border border-emerald-500/40 rounded-full flex items-center justify-center">
                          <svg className="w-10 h-10 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        </div>
                        <div className="bg-emerald-500 text-white font-bold px-6 py-2 rounded-xl text-sm">Disetujui!</div>
                        <button onClick={() => { setShowApprovedOverlay(false); setActiveMenu('vendor'); }} className="px-8 py-2 border border-white/20 text-slate-300 rounded-xl text-xs font-bold cursor-pointer hover:bg-white/5">
                          Lanjut ke Vendor →
                        </button>
                      </div>
                    )}

                    {persLoading ? (
                      <div className="text-center py-8 text-slate-500 text-xs">Memuat data...</div>
                    ) : persetujuanTab === 'menunggu' ? (
                      paketMenunggu.length === 0 ? (
                        <div className="text-center py-8 text-slate-500 text-xs">Tidak ada paket yang menunggu persetujuan</div>
                      ) : (
                        <>
                          {/* Pilih paket jika ada lebih dari 1 */}
                          {paketMenunggu.length > 1 && (
                            <div className="mb-4">
                              <label className="block text-xs text-slate-400 mb-1">Pilih Paket:</label>
                              <select
                                value={selectedPaketPersetujuan?.paket_id || ''}
                                onChange={e => setSelectedPaketPersetujuan(paketMenunggu.find(p => p.paket_id == e.target.value))}
                                className="w-full px-3 py-2 bg-white/[0.03] border border-white/10 rounded-lg text-xs text-white focus:outline-none"
                              >
                                {paketMenunggu.map(p => (
                                  <option key={p.paket_id} value={p.paket_id}>{p.nama_paket}</option>
                                ))}
                              </select>
                            </div>
                          )}

                          {selectedPaketPersetujuan && (
                            <div className="space-y-4 text-xs">
                              {[
                                { label: 'Nama Paket', value: selectedPaketPersetujuan.nama_paket, color: 'bg-[#0d3b81]' },
                                { label: 'PPK', value: selectedPaketPersetujuan.ppk?.name || currentUser?.name || '-', color: 'bg-emerald-600' },
                                { label: 'HPS (Rp)', value: `Rp ${formatRp(selectedPaketPersetujuan.hps)}`, color: 'bg-amber-500' },
                                { label: 'Sumber Dana', value: selectedPaketPersetujuan.sumber_dana || '-', color: 'bg-purple-600' },
                                { label: 'Tanggal Buat', value: selectedPaketPersetujuan.created_at?.split('T')[0] || '-', color: 'bg-teal-600' },
                                { label: 'Dokumen', value: null, color: 'bg-red-600' },
                              ].map((row, i) => (
                                <div key={i} className="flex items-center gap-6">
                                  <div className={`${row.color} text-white text-[10px] font-bold px-3 py-2 rounded-lg w-32 text-center shrink-0`}>{row.label}</div>
                                  {row.value === null ? (
                                    <label className="cursor-pointer">
                                      <div className="flex items-center gap-2 bg-white/5 border border-white/10 hover:border-blue-500/50 px-3 py-1.5 rounded-lg text-xs text-slate-300 cursor-pointer transition-colors">
                                        <svg className="w-3 h-3 text-blue-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9 2a2 2 0 00-2 2v8a2 2 0 002 2h6a2 2 0 002-2V6.414A2 2 0 0016.414 5L14 2.586A2 2 0 0012.586 2H9z" /></svg>
                                        {persDokumen ? persDokumen.name : 'Upload Dokumen PDF'}
                                        <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                      </div>
                                      <input type="file" accept=".pdf" className="hidden" onChange={e => setPersDokumen(e.target.files[0])} />
                                    </label>
                                  ) : (
                                    <span className="text-white font-medium">{row.value}</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}

                          <div className="mt-8 flex justify-center gap-4 border-t border-white/10 pt-6">
                            <button onClick={handleTolak} className="px-8 py-2.5 border border-red-500 text-red-400 hover:bg-red-500/10 rounded-xl text-xs font-bold cursor-pointer">
                              Tolak
                            </button>
                            <button onClick={handleSetujui} className="px-8 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer">
                              Setujui
                            </button>
                          </div>
                        </>
                      )
                    ) : (
                      // Tab disetujui
                      paketDisetujui.length === 0 ? (
                        <div className="text-center py-8 text-slate-500 text-xs">Belum ada paket yang disetujui</div>
                      ) : (
                        <div className="space-y-3">
                          {paketDisetujui.map(p => (
                            <div key={p.paket_id} className="flex items-center justify-between p-3 bg-white/[0.02] border border-emerald-500/20 rounded-xl">
                              <div>
                                <p className="text-xs font-bold text-white">{p.nama_paket}</p>
                                <p className="text-[10px] text-slate-400">Rp {formatRp(p.hps)} · {p.sumber_dana}</p>
                              </div>
                              <span className="text-[9px] font-bold px-2 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded">Disetujui</span>
                            </div>
                          ))}
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ===== VENDOR ===== */}
            {activeMenu === 'vendor' && (
              <div className="w-full max-w-5xl space-y-4">
                <h2 className="text-base font-bold text-white">{selectedVendorId !== null ? 'Negosiasi Harga' : 'Undangan Vendor'}</h2>

                <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-8 shadow-2xl backdrop-blur-xl">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Info Paket */}
                    <div>
                      <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6 space-y-4">
                        <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Informasi Paket</h4>

                        {/* Pilih paket */}
                        {vendorPaketList.length > 1 && (
                          <div className="mb-3">
                            <select
                              value={selectedPaketVendor?.paket_id || ''}
                              onChange={e => setSelectedPaketVendor(vendorPaketList.find(p => p.paket_id == e.target.value))}
                              className="w-full px-2 py-1.5 bg-white/[0.03] border border-white/10 rounded-lg text-xs text-white focus:outline-none"
                            >
                              {vendorPaketList.map(p => (
                                <option key={p.paket_id} value={p.paket_id}>{p.nama_paket}</option>
                              ))}
                            </select>
                          </div>
                        )}

                        <div className="space-y-3 text-xs">
                          {[
                            { label: 'Nama Paket', value: selectedPaketVendor?.nama_paket || '-', color: 'bg-[#0d3b81]' },
                            { label: 'HPS (Rp)', value: `Rp ${formatRp(selectedPaketVendor?.hps)}`, color: 'bg-amber-500' },
                            { label: 'PPK', value: selectedPaketVendor?.ppk?.name || '-', color: 'bg-emerald-600' },
                          ].map((row, i) => (
                            <div key={i} className="flex items-center gap-3">
                              <div className={`${row.color} text-white text-[10px] font-bold px-3 py-1.5 rounded-lg w-24 text-center shrink-0`}>{row.label}</div>
                              <span className="text-white font-medium">{row.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Negosiasi panel */}
                      {selectedVendorId !== null && (
                        <div className="mt-4 bg-white/[0.02] border border-white/10 rounded-2xl p-5 space-y-4">
                          <h4 className="text-xs font-bold text-white">
                            Negosiasi Dengan {vendorList.find(v => v.penyedia_id === selectedVendorId)?.nama_perusahaan || '-'}
                          </h4>
                          <div className="space-y-3 text-xs">
                            <div className="flex items-center gap-3">
                              <div className="bg-amber-500 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg w-32 text-center shrink-0">Penawaran Akhir</div>
                              <input
                                type="number"
                                value={negoData.penawaran_akhir}
                                onChange={e => setNegoData(d => ({ ...d, penawaran_akhir: e.target.value }))}
                                placeholder="Harga negosiasi"
                                className="w-40 px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-mono text-gray-800 focus:outline-none"
                              />
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="bg-teal-600 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg w-32 text-center shrink-0">Catatan</div>
                              <input
                                type="text"
                                value={negoData.catatan}
                                onChange={e => setNegoData(d => ({ ...d, catatan: e.target.value }))}
                                placeholder="Catatan negosiasi"
                                className="w-48 px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs text-gray-800 focus:outline-none"
                              />
                            </div>
                          </div>
                          <div className="pt-2">
                            <button
                              onClick={handleSimpanVendor}
                              disabled={vendorSaving}
                              className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-xs font-bold rounded-xl cursor-pointer"
                            >
                              {vendorSaving ? 'Menyimpan...' : 'Simpan & Selesaikan'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Daftar Vendor */}
                    <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6">
                      <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-4">Daftar Vendor</h4>
                      {vendorList.length === 0 ? (
                        <p className="text-xs text-slate-500 text-center py-4">Tidak ada vendor terdaftar</p>
                      ) : (
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b border-white/10 text-slate-400 font-bold text-[10px] uppercase tracking-wider">
                              <th className="pb-2 text-left">Vendor</th>
                              <th className="pb-2 text-left">No Telp</th>
                              <th className="pb-2 text-right">Aksi</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5">
                            {vendorList.map((v) => (
                              <tr key={v.penyedia_id} className="hover:bg-white/[0.02] transition-colors">
                                <td className="py-2.5 text-white font-medium">{v.nama_perusahaan}</td>
                                <td className="py-2.5 text-slate-400">{sensorNoTelp(v.no_telp)}</td>
                                <td className="py-2.5 text-right">
                                  <button
                                    onClick={() => setSelectedVendorId(selectedVendorId === v.penyedia_id ? null : v.penyedia_id)}
                                    className={`text-[9px] font-bold px-3 py-1 rounded cursor-pointer border transition-colors ${selectedVendorId === v.penyedia_id ? 'bg-blue-600 border-blue-500 text-white' : 'border-blue-500/30 text-blue-400 hover:bg-blue-500/10'}`}
                                  >
                                    {selectedVendorId === v.penyedia_id ? 'Dipilih' : 'Undang'}
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ===== PENAWARAN ===== */}
            {activeMenu === 'penawaran' && (
              <div className="w-full max-w-4xl space-y-4">
                <h2 className="text-base font-bold text-white">Detail Undangan</h2>

                {penawaranPaketList.length === 0 ? (
                  <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-12 text-center">
                    <p className="text-slate-400 text-sm">Tidak ada paket yang menunggu penawaran saat ini.</p>
                    <p className="text-slate-500 text-xs mt-2">Paket akan muncul setelah disetujui dan masuk tahap pemilihan penyedia.</p>
                  </div>
                ) : (
                  <>
                    {/* Pilih paket jika ada lebih dari 1 */}
                    {penawaranPaketList.length > 1 && (
                      <div className="mb-2">
                        <select
                          value={selectedPenawaranPaket?.paket_id || ''}
                          onChange={e => setSelectedPenawaranPaket(penawaranPaketList.find(p => p.paket_id == e.target.value))}
                          className="w-full px-3 py-2 bg-white/[0.03] border border-white/10 rounded-lg text-xs text-white focus:outline-none"
                        >
                          {penawaranPaketList.map(p => (
                            <option key={p.paket_id} value={p.paket_id}>{p.nama_paket}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-8 shadow-2xl grid grid-cols-1 md:grid-cols-2 gap-8 backdrop-blur-xl">
                      {/* Info Paket */}
                      <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6">
                        <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-4">Informasi Paket</h4>
                        <div className="space-y-3 text-xs">
                          {[
                            { label: 'Nama Paket', value: selectedPenawaranPaket?.nama_paket || '-', color: 'bg-[#0d3b81]' },
                            { label: 'HPS (Rp)', value: `Rp ${formatRp(selectedPenawaranPaket?.hps)}`, color: 'bg-amber-500' },
                            { label: 'PPK', value: selectedPenawaranPaket?.ppk?.name || '-', color: 'bg-emerald-600' },
                          ].map((row, i) => (
                            <div key={i} className="flex items-center gap-3">
                              <div className={`${row.color} text-white text-[10px] font-bold px-3 py-1.5 rounded-lg w-24 text-center shrink-0`}>{row.label}</div>
                              <span className="text-white font-medium">{row.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Form Penawaran */}
                      <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6">
                        <h4 className="text-sm font-bold text-white mb-4">Kirim Penawaran</h4>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-xs font-medium text-slate-300 mb-1.5">Harga Penawaran (Rp) *</label>
                            <input
                              type="number"
                              value={penawaranForm.harga}
                              onChange={e => setPenawaranForm(f => ({ ...f, harga: e.target.value }))}
                              placeholder="Masukan harga penawaran"
                              className="w-full px-3 py-2.5 bg-white/[0.03] border border-white/10 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-300 mb-1.5">Catatan Penawaran</label>
                            <textarea
                              value={penawaranForm.catatan}
                              onChange={e => setPenawaranForm(f => ({ ...f, catatan: e.target.value }))}
                              rows={3}
                              placeholder="Catatan / keterangan penawaran"
                              className="w-full px-3 py-2.5 bg-white/[0.03] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 resize-none"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-300 mb-1.5">Dokumen Penawaran (PDF)</label>
                            <label className="cursor-pointer">
                              <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 hover:border-blue-500/50 px-3 py-1.5 rounded-lg text-xs text-slate-300 transition-colors">
                                <svg className="w-3 h-3 text-blue-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9 2a2 2 0 00-2 2v8a2 2 0 002 2h6a2 2 0 002-2V6.414A2 2 0 0016.414 5L14 2.586A2 2 0 0012.586 2H9z" /></svg>
                                {penawaranDokumen ? penawaranDokumen.name : 'Upload PDF...'}
                              </div>
                              <input type="file" accept=".pdf" className="hidden" onChange={e => setPenawaranDokumen(e.target.files[0])} />
                            </label>
                            {penawaranDokumen && (
                              <button onClick={() => setPenawaranDokumen(null)} className="ml-2 text-[10px] text-red-400 hover:underline cursor-pointer">Hapus</button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="text-center">
                      <button
                        onClick={handleKirimPenawaran}
                        disabled={penawaranSaving}
                        className="px-10 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer"
                      >
                        {penawaranSaving ? 'Mengirim...' : 'Kirim Penawaran'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ===== PAKET SELESAI ===== */}
            {activeMenu === 'paket-selesai' && (
              <div className="w-full max-w-xl mx-auto">
                <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-10 shadow-2xl text-center space-y-5 backdrop-blur-xl">
                  <div className="w-20 h-20 bg-emerald-500/20 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto">
                    <svg className="w-10 h-10 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">Paket Selesai</h2>
                    <p className="text-xs text-slate-400 mt-1">Vendor berhasil dipilih, proses pengadaan selesai</p>
                  </div>
                  <div className="bg-white/[0.03] border border-white/10 rounded-xl p-5 text-left text-xs space-y-3">
                    <div className="flex justify-between items-center border-b border-white/5 pb-3">
                      <span className="text-slate-400 font-medium">Paket</span>
                      <span className="text-white font-bold">{paketSelesai?.paket?.nama_paket || '-'}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-white/5 pb-3">
                      <span className="text-slate-400 font-medium">Vendor</span>
                      <span className="text-white font-bold">{paketSelesai?.vendor?.nama_perusahaan || '-'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 font-medium">Nilai Kontrak</span>
                      <span className="text-emerald-400 font-mono font-bold">Rp {formatRp(paketSelesai?.nilai)}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveMenu('dashboard')}
                    className="w-full py-2.5 border border-white/20 text-blue-400 rounded-xl text-xs font-bold hover:bg-white/5 cursor-pointer transition-colors"
                  >
                    Kembali ke Dashboard
                  </button>
                </div>
              </div>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}