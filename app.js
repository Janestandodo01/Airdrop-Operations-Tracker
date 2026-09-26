import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, deleteDoc, doc, updateDoc, query, where } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyCuLy-B3SJwa-wMlWTrh_a3u5DXGNIbdQw",
    authDomain: "airdrop-operations-tracker.firebaseapp.com",
    projectId: "airdrop-operations-tracker",
    storageBucket: "airdrop-operations-tracker.firebasestorage.app",
    messagingSenderId: "569949700625",
    appId: "1:569949700625:web:cd63382ea662f648e167b0"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// DOM Elements
const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const appContainer = document.getElementById('appContainer');
const addBtn = document.getElementById('addProjectBtn');
const projectList = document.getElementById('projectList');

let currentUserUID = null;
let unsubscribeSnapshot = null;

// --- LOGIKA OTENTIKASI ---
loginBtn.addEventListener('click', async () => {
    try {
        await signInWithPopup(auth, provider);
    } catch (error) {
        console.error("Gagal Login:", error);
    }
});

logoutBtn.addEventListener('click', async () => {
    try {
        await signOut(auth);
    } catch (error) {
        console.error("Gagal Logout:", error);
    }
});

onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUserUID = user.uid;
        loginBtn.style.display = 'none';
        logoutBtn.style.display = 'block';
        appContainer.style.display = 'block';
        loadUserData(currentUserUID);
    } else {
        currentUserUID = null;
        loginBtn.style.display = 'block';
        logoutBtn.style.display = 'none';
        appContainer.style.display = 'none';
        projectList.innerHTML = '';
        if (unsubscribeSnapshot) unsubscribeSnapshot();
    }
});

// --- LOGIKA DATABASE (CRUD) ---

// CREATE
addBtn.addEventListener('click', async () => {
    const name = document.getElementById('projectName').value;
    const category = document.getElementById('projectCategory').value;
    const network = document.getElementById('network').value;
    const wallet = document.getElementById('wallet').value;
    const url = document.getElementById('projectUrl').value;
    const frequency = document.getElementById('taskFrequency').value;
    const referral = document.getElementById('referralLink').value;

    if (!name || !currentUserUID) {
        alert("Nama proyek wajib diisi.");
        return;
    }

    try {
        await addDoc(collection(db, "airdrop_projects"), {
            uid: currentUserUID,
            project_name: name,
            category: category,
            network_rpc: network,
            wallet_used: wallet,
            project_url: url,
            task_frequency: frequency,
            referral_link: referral, 
            status: "Active",
            timestamp: new Date()
        });
        
        document.getElementById('projectName').value = '';
        document.getElementById('network').value = '';
        document.getElementById('wallet').value = '';
        document.getElementById('projectUrl').value = '';
        document.getElementById('referralLink').value = ''; 
    } catch (e) {
        console.error("Gagal input: ", e);
    }
});

// --- STATE MANAGEMENT LOKAL ---
let globalProjectsData = []; // Menyimpan data sementara di RAM klien
let currentFilter = 'All';   // Status filter saat ini

// 1. FUNGSI PENARIKAN DATA
function loadUserData(uid) {
    const q = query(collection(db, "airdrop_projects"), where("uid", "==", uid));
    
    unsubscribeSnapshot = onSnapshot(q, (snapshot) => {
        globalProjectsData = []; // Kosongkan array lama
        
        snapshot.forEach((docSnap) => {
            // Masukkan data ke array lokal
            globalProjectsData.push({ id: docSnap.id, ...docSnap.data() });
        });

        // PENGURUTAN ABJAD (A-Z) BERDASARKAN NAMA PROYEK
        globalProjectsData.sort((a, b) => {
            const nameA = a.project_name ? a.project_name.toLowerCase() : '';
            const nameB = b.project_name ? b.project_name.toLowerCase() : '';
            return nameA.localeCompare(nameB);
        });

        renderProjects(); // Panggil fungsi render
    });
}

// 2. FUNGSI RENDER & FILTER (Terpisah dari Firebase Fetch)
function renderProjects() {
    projectList.innerHTML = ''; 
    
    let countTotal = 0;
    let countActive = 0;
    let countDoneToday = 0;
    let countClaimable = 0;

    globalProjectsData.forEach((data) => {
        const id = data.id;
        
        // Kalkulasi Metrik (Selalu hitung semua data untuk Dasbor)
        countTotal++;
        if (data.status === 'Active') countActive++;
        if (data.status === 'Claimable' || data.status === 'Eligible') countClaimable++;

        let isDoneToday = false;
        if (data.last_executed) {
            const lastDate = data.last_executed.toDate();
            const today = new Date();
            if (lastDate.toDateString() === today.toDateString()) {
                isDoneToday = true;
                if (data.status === 'Active') countDoneToday++; 
            }
        }

        // LOGIKA FILTERING (Tentukan apakah kartu ini harus digambar di layar)
        let shouldRender = false;
        if (currentFilter === 'All') shouldRender = true;
        if (currentFilter === 'Active' && data.status === 'Active') shouldRender = true;
        if (currentFilter === 'Claimable' && (data.status === 'Claimable' || data.status === 'Eligible')) shouldRender = true;
        if (currentFilter === 'DoneToday' && isDoneToday && data.status === 'Active') shouldRender = true;

        if (!shouldRender) return; // Lewati siklus loop jika tidak sesuai filter

        // Eksekusi Render Kartu
        const card = document.createElement('div');
        card.className = 'project-card';
        
        let checkInUI = '';
        if (data.task_frequency !== 'One-Time' && data.task_frequency !== 'N/A' && data.task_frequency) {
            if (isDoneToday) {
                checkInUI = `<span style="color: #00cc66; font-size: 11px; padding: 3px 8px; border: 1px solid #00cc66; border-radius: 4px; margin-right: 15px; background-color: rgba(0, 204, 102, 0.1);">✅ Selesai Hari Ini</span>`;
            } else {
                checkInUI = `<button onclick="window.markAsDone('${id}')" style="background-color: #00cc66; color: black; border: none; padding: 3px 8px; font-size: 11px; border-radius: 4px; cursor: pointer; margin-right: 15px; font-weight: bold;">▶️ Tandai Selesai</button>`;
            }
        }
        
        card.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: start;">
                <div>
                    <h3 style="margin:0 0 5px 0;">
                        ${data.project_name} 
                        <span style="font-size: 12px; color: var(--accent-blue);">[${data.category}]</span>
                        <span style="font-size: 12px; color: #ff9900; margin-left: 5px; padding: 2px 5px; border: 1px solid #ff9900; border-radius: 3px;">${data.task_frequency || 'N/A'}</span>
                    </h3>
                    <p style="margin:5px 0; font-size: 14px;">Network: ${data.network_rpc} | Wallet: ${data.wallet_used}</p>
                    
                    <div style="margin-top: 12px; display: flex; align-items: center;">
                        ${checkInUI}
                        ${data.project_url ? `<a href="${data.project_url}" target="_blank" style="color: var(--accent-blue); font-size: 12px; text-decoration: none; margin-right: 15px;">🔗 Buka Website</a>` : ''}
                        ${data.referral_link ? `<button onclick="window.copyPromo('${data.project_name}', '${data.referral_link}')" style="background-color: transparent; border: 1px solid #00a3ff; color: #00a3ff; padding: 3px 8px; font-size: 11px; border-radius: 4px; cursor: pointer;">📋 Copy Promo</button>` : ''}
                    </div>
                </div>
                
                <select onchange="window.updateStatus('${id}', this.value)" style="padding: 5px; font-size: 12px; background: var(--bg-pure-black); color: var(--accent-blue); border: 1px solid var(--border-dim); border-radius: 4px; cursor: pointer;">
                    <option value="Active" ${data.status === 'Active' ? 'selected' : ''}>Active</option>
                    <option value="Snapshot Taken" ${data.status === 'Snapshot Taken' ? 'selected' : ''}>Snapshot</option>
                    <option value="Eligible" ${data.status === 'Eligible' ? 'selected' : ''}>Eligible</option>
                    <option value="Claimable" ${data.status === 'Claimable' ? 'selected' : ''}>Claimable</option>
                    <option value="Ended" ${data.status === 'Ended' ? 'selected' : ''}>Ended</option>
                </select>
            </div>
            <button onclick="window.deleteProject('${id}')" style="background-color: transparent; border: 1px solid #ff3333; color: #ff3333; margin-top:15px; padding: 5px 10px; font-size: 12px;">Hapus Data</button>
        `;
        projectList.appendChild(card);
    });

    // Perbarui Dasbor DOM
    document.getElementById('metricTotal').innerText = countTotal;
    document.getElementById('metricActive').innerText = countActive;
    document.getElementById('metricDoneToday').innerText = countDoneToday;
    document.getElementById('metricClaimable').innerText = countClaimable;
}

// 3. FUNGSI PEMICU FILTER DARI HTML
window.setFilter = (filterType) => {
    currentFilter = filterType;
    renderProjects(); // Panggil ulang render dengan filter baru tanpa membebani Firebase
};

// UPDATE STATUS
window.updateStatus = async (id, newStatus) => {
    if(!currentUserUID) return;
    try {
        await updateDoc(doc(db, "airdrop_projects", id), {
            status: newStatus,
            last_updated: new Date()
        });
    } catch (e) {
        console.error("Gagal update status: ", e);
    }
};

// [MODIFIKASI CHECK-IN] CATAT WAKTU EKSEKUSI
window.markAsDone = async (id) => {
    if(!currentUserUID) return;
    try {
        await updateDoc(doc(db, "airdrop_projects", id), {
            last_executed: new Date()
        });
    } catch (e) {
        console.error("Gagal mencatat waktu eksekusi: ", e);
    }
};

// DELETE
window.deleteProject = async (id) => {
    if(!currentUserUID) return;
    if(confirm("Tindakan ini tidak bisa dibatalkan. Konfirmasi penghapusan?")) {
        try {
            await deleteDoc(doc(db, "airdrop_projects", id));
        } catch (e) {
            console.error("Gagal hapus: ", e);
        }
    }
};

// REFERRAL CLIPBOARD
window.copyPromo = (projectName, referralLink) => {
    const promoText = `Saya sedang menggarap airdrop ${projectName}. Bergabunglah melalui tautan ini untuk mendapatkan bonus: ${referralLink}`;
    
    navigator.clipboard.writeText(promoText).then(() => {
        alert(`Teks promo untuk ${projectName} berhasil disalin!`);
    }).catch(err => {
        console.error("Gagal menyalin teks: ", err);
        alert("Browser Anda memblokir akses clipboard.");
    });
};
