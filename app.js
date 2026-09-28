import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, deleteDoc, doc, updateDoc, query, where, setDoc, getDoc, arrayUnion, arrayRemove } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
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

const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const appContainer = document.getElementById('appContainer');
const addBtn = document.getElementById('addProjectBtn');
const projectList = document.getElementById('projectList');
const networkFilterContainer = document.getElementById('networkFilterContainer');
const networkSelect = document.getElementById('network');
const walletSelect = document.getElementById('wallet');
const delNetworkBtn = document.getElementById('delNetworkBtn');
const delWalletBtn = document.getElementById('delWalletBtn');
const addTradeBtn = document.getElementById('addTradeBtn');
const tradingList = document.getElementById('tradingList');

let currentUserUID = null;
let unsubscribeAirdrop = null;
let unsubscribeTrading = null;

let globalProjectsData = [];
let globalTradingData = [];
let savedNetworksLocal = [];
let currentFilter = 'All';          
let currentNetworkFilter = 'All';   
let initialCapital = 0;

// Injeksi Modal Trading ke DOM
if(!document.getElementById('editTradeModal')) {
    const editModalHTML = `
        <div id="editTradeModal" class="modal-overlay">
            <div class="modal-content">
                <h3 id="editTradeTitle">Update Position & Evaluation</h3>
                <input type="hidden" id="editTradeId">
                <input type="number" id="editExitPrice" class="form-input" placeholder="Update Exit Price (Optional)" step="any">
                <textarea id="editEvalNote" class="form-input" placeholder="Post-Trade Evaluation Note..."></textarea>
                <div class="modal-actions">
                    <button onclick="window.closeEditModal()" style="background: transparent; border: 1px solid var(--text-secondary); color: var(--text-secondary); padding: 8px 16px; border-radius: var(--radius-xl); cursor: pointer;">Cancel</button>
                    <button onclick="window.saveTradeUpdate()" class="btn-primary" style="padding: 8px 16px;">Save Eval</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', editModalHTML);
}

loginBtn.addEventListener('click', async () => {
    try { await signInWithPopup(auth, provider); } 
    catch (error) { console.error("Gagal Login:", error); }
});

logoutBtn.addEventListener('click', async () => {
    try { await signOut(auth); } 
    catch (error) { console.error("Gagal Logout:", error); }
});

onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUserUID = user.uid;
        loginBtn.style.display = 'none';
        logoutBtn.style.display = 'block';
        appContainer.style.display = 'block';
        loadUserSettings(currentUserUID); 
        loadUserData(currentUserUID);     
        loadTradingData(currentUserUID); 
    } else {
        currentUserUID = null;
        loginBtn.style.display = 'block';
        logoutBtn.style.display = 'none';
        appContainer.style.display = 'none';
        projectList.innerHTML = '';
        tradingList.innerHTML = '';
        networkFilterContainer.innerHTML = '';
        if (unsubscribeAirdrop) unsubscribeAirdrop();
        if (unsubscribeTrading) unsubscribeTrading();
    }
});

// ==========================================
// MODUL 1: AIRDROP TRACKER
// ==========================================
function loadUserData(uid) {
    const q = query(collection(db, "airdrop_projects"), where("uid", "==", uid));
    unsubscribeAirdrop = onSnapshot(q, (snapshot) => {
        globalProjectsData = [];
        snapshot.forEach((docSnap) => { globalProjectsData.push({ id: docSnap.id, ...docSnap.data() }); });
        globalProjectsData.sort((a, b) => {
            const nameA = a.project_name ? a.project_name.toLowerCase() : '';
            const nameB = b.project_name ? b.project_name.toLowerCase() : '';
            return nameA.localeCompare(nameB);
        });
        renderProjects();
    });
}

async function loadUserSettings(uid) {
    const docRef = doc(db, "user_settings", uid);
    const docSnap = await getDoc(docRef);
    networkSelect.innerHTML = '<option value="">Select Network...</option><option value="_add_new_">+ Add New</option>';
    walletSelect.innerHTML = '<option value="">Select Wallet...</option><option value="_add_new_">+ Add New</option>';
    delNetworkBtn.style.display = 'none';
    delWalletBtn.style.display = 'none';
    if (docSnap.exists()) {
        const data = docSnap.data();
        savedNetworksLocal = data.saved_networks || [];
        savedNetworksLocal.forEach(net => {
            const opt = document.createElement('option');
            opt.value = net; opt.text = net;
            networkSelect.insertBefore(opt, networkSelect.lastElementChild);
        });
        if (data.saved_wallets) {
            data.saved_wallets.forEach(wal => {
                const opt = document.createElement('option');
                opt.value = wal; opt.text = wal;
                walletSelect.insertBefore(opt, walletSelect.lastElementChild);
            });
        }
        renderNetworkFilterButtons();
    }
}

function renderNetworkFilterButtons() {
    networkFilterContainer.innerHTML = '';
    const createFilterBtn = (text, filterValue) => {
        const btn = document.createElement('button');
        btn.innerText = text;
        const isActive = currentNetworkFilter === filterValue;
        btn.style.cssText = `
            background: ${isActive ? 'var(--accent-blue-muted)' : 'var(--bg-main)'}; 
            color: ${isActive ? '#60a5fa' : 'var(--text-secondary)'}; 
            border: 1px solid var(--border-blue-subtle); 
            padding: 8px 16px; 
            border-radius: var(--radius-xl); 
            cursor: pointer; 
            font-size: 13px; 
            font-weight: 600; 
            white-space: nowrap;
            transition: var(--transition-smooth);
        `;
        btn.onclick = () => window.setNetworkFilter(filterValue);
        return btn;
    };
    networkFilterContainer.appendChild(createFilterBtn('All Networks', 'All'));
    savedNetworksLocal.forEach(net => {
        networkFilterContainer.appendChild(createFilterBtn(net, net));
    });
}

networkSelect.addEventListener('change', async (e) => {
    if (e.target.value === '_add_new_') {
        delNetworkBtn.style.display = 'none';
        const newNet = prompt("Enter new Network name:");
        if (newNet && newNet.trim() !== '') {
            await setDoc(doc(db, "user_settings", currentUserUID), { saved_networks: arrayUnion(newNet.trim()) }, { merge: true });
            loadUserSettings(currentUserUID); 
        }
        networkSelect.value = ''; 
    } else if (e.target.value !== '') {
        delNetworkBtn.style.display = 'block'; 
    } else {
        delNetworkBtn.style.display = 'none'; 
    }
});

walletSelect.addEventListener('change', async (e) => {
    if (e.target.value === '_add_new_') {
        delWalletBtn.style.display = 'none';
        const newWal = prompt("NAMING SOP:\n[Network] [Function] - [Short Address]\nExample: EVM Main - 0x1A...8zB2\n\nEnter new Wallet:");
        if (newWal && newWal.trim() !== '') {
            await setDoc(doc(db, "user_settings", currentUserUID), { saved_wallets: arrayUnion(newWal.trim()) }, { merge: true });
            loadUserSettings(currentUserUID); 
        }
        walletSelect.value = '';
    } else if (e.target.value !== '') {
        delWalletBtn.style.display = 'block'; 
    } else {
        delWalletBtn.style.display = 'none'; 
    }
});

delNetworkBtn.addEventListener('click', async () => {
    const selected = networkSelect.value;
    if (!selected || selected === '_add_new_') return;
    if (confirm(`Delete network '${selected}'?`)) {
        await setDoc(doc(db, "user_settings", currentUserUID), { saved_networks: arrayRemove(selected) }, { merge: true });
        if(currentNetworkFilter === selected) currentNetworkFilter = 'All';
        loadUserSettings(currentUserUID);
    }
});

delWalletBtn.addEventListener('click', async () => {
    const selected = walletSelect.value;
    if (!selected || selected === '_add_new_') return;
    if (confirm(`Delete wallet '${selected}'?`)) {
        await setDoc(doc(db, "user_settings", currentUserUID), { saved_wallets: arrayRemove(selected) }, { merge: true });
        loadUserSettings(currentUserUID);
    }
});

addBtn.addEventListener('click', async () => {
    const name = document.getElementById('projectName').value;
    const category = document.getElementById('projectCategory').value;
    const network = document.getElementById('network').value;
    const wallet = document.getElementById('wallet').value;
    const url = document.getElementById('projectUrl').value;
    const frequency = document.getElementById('taskFrequency').value;
    const referral = document.getElementById('referralLink').value;
    if (!name || !currentUserUID) { alert("Project name is required."); return; }
    if (network === '' || network === '_add_new_') { alert("Select a valid network."); return; }
    if (wallet === '' || wallet === '_add_new_') { alert("Select a valid wallet."); return; }
    try {
        await addDoc(collection(db, "airdrop_projects"), {
            uid: currentUserUID, project_name: name, category: category, network_rpc: network,
            wallet_used: wallet, project_url: url, task_frequency: frequency, referral_link: referral, 
            status: "Active", timestamp: new Date()
        });
        document.getElementById('projectName').value = ''; 
        document.getElementById('projectUrl').value = '';
        document.getElementById('referralLink').value = ''; 
        networkSelect.value = ''; walletSelect.value = '';
        delNetworkBtn.style.display = 'none'; delWalletBtn.style.display = 'none';
    } catch (e) { console.error("Error adding project: ", e); }
});

function renderProjects() {
    projectList.innerHTML = ''; 
    let countTotal = 0, countActive = 0, countDoneToday = 0, countClaimable = 0;
    globalProjectsData.forEach((data) => {
        const id = data.id;
        countTotal++;
        if (data.status === 'Active') countActive++;
        if (data.status === 'Claimable' || data.status === 'Eligible') countClaimable++;
        let isDoneToday = false;
        if (data.last_executed) {
            const lastDate = data.last_executed.toDate();
            if (lastDate.toDateString() === new Date().toDateString()) {
                isDoneToday = true;
                if (data.status === 'Active') countDoneToday++; 
            }
        }
        let shouldRenderStatus = false;
        if (currentFilter === 'All') shouldRenderStatus = true;
        if (currentFilter === 'Active' && data.status === 'Active') shouldRenderStatus = true;
        if (currentFilter === 'Claimable' && (data.status === 'Claimable' || data.status === 'Eligible')) shouldRenderStatus = true;
        if (currentFilter === 'DoneToday' && isDoneToday && data.status === 'Active') shouldRenderStatus = true;
        
        let shouldRenderNetwork = false;
        if (currentNetworkFilter === 'All') shouldRenderNetwork = true;
        if (currentNetworkFilter !== 'All' && data.network_rpc === currentNetworkFilter) shouldRenderNetwork = true;
        if (!shouldRenderStatus || !shouldRenderNetwork) return;
        
        const card = document.createElement('div');
        card.className = 'project-card';
        let checkInUI = '';
        
        if (data.status === 'Ended' || data.status === 'Eligible' || data.status === 'Claimable') {
            checkInUI = `<span style="color: var(--text-secondary); font-size: 12px; padding: 4px 10px; border: 1px solid var(--border-blue-subtle); border-radius: 12px; margin-right: 12px; background-color: var(--bg-main);">Status: ${data.status.toUpperCase()}</span>`;
        } else if (data.task_frequency !== 'One-Time' && data.task_frequency !== 'N/A' && data.task_frequency) {
            if (isDoneToday) {
                checkInUI = `<span style="color: #34d399; font-size: 12px; padding: 4px 10px; border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 12px; margin-right: 12px; background-color: rgba(16, 185, 129, 0.1);">✅ Completed Today</span>`;
            } else {
                checkInUI = `<button onclick="window.markAsDone('${id}')" style="background-color: rgba(16, 185, 129, 0.1); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3); padding: 4px 10px; font-size: 12px; border-radius: 12px; cursor: pointer; margin-right: 12px; transition: 0.3s;">▶️ Mark Done</button>`;
            }
        }
        
        card.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: start;">
                <div>
                    <h3 style="margin:0 0 8px 0; font-size: 18px;">
                        ${data.project_name} 
                        <span style="font-size: 12px; color: #60a5fa; margin-left: 8px; font-weight: 500;">[${data.category}]</span>
                    </h3>
                    <p style="margin:4px 0; font-size: 13px; color: var(--text-secondary);">Network: <strong style="color: var(--text-primary); font-weight: 500;">${data.network_rpc}</strong></p>
                    <p style="margin:4px 0; font-size: 13px; color: var(--text-secondary);">Wallet: <strong style="color: var(--text-primary); font-weight: 500;">${data.wallet_used}</strong></p>
                    
                    <div style="margin-top: 16px; display: flex; align-items: center; flex-wrap: wrap; gap: 8px;">
                        ${checkInUI}
                        ${data.project_url ? `<a href="${data.project_url}" target="_blank" style="color: #60a5fa; font-size: 13px; text-decoration: none; padding: 4px 0;">🔗 Website</a>` : ''}
                        ${data.referral_link ? `<button onclick="window.copyPromo('${data.project_name}', '${data.referral_link}')" style="background-color: transparent; border: 1px solid rgba(96, 165, 250, 0.3); color: #60a5fa; padding: 4px 10px; font-size: 12px; border-radius: 12px; cursor: pointer;">📋 Copy Promo</button>` : ''}
                    </div>
                </div>
                <select onchange="window.updateStatus('${id}', this.value)" style="padding: 6px 10px; font-size: 12px; background: var(--bg-main); color: var(--text-primary); border: 1px solid var(--border-blue-subtle); border-radius: 12px; cursor: pointer; outline: none;">
                    <option value="Active" ${data.status === 'Active' ? 'selected' : ''}>Active</option>
                    <option value="Eligible" ${data.status === 'Eligible' ? 'selected' : ''}>Eligible</option>
                    <option value="Claimable" ${data.status === 'Claimable' ? 'selected' : ''}>Claimable</option>
                    <option value="Ended" ${data.status === 'Ended' ? 'selected' : ''}>Ended</option>
                </select>
            </div>
            <button onclick="window.deleteProject('${id}')" style="background-color: transparent; border: 1px solid rgba(239, 68, 68, 0.3); color: #f87171; margin-top: 20px; padding: 6px 16px; font-size: 12px; border-radius: 12px; cursor: pointer; transition: 0.3s;">Delete</button>
        `;
        projectList.appendChild(card);
    });
    document.getElementById('metricTotal').innerText = countTotal;
    document.getElementById('metricActive').innerText = countActive;
    document.getElementById('metricDoneToday').innerText = countDoneToday;
    document.getElementById('metricClaimable').innerText = countClaimable;

    const cardAll = document.getElementById('cardAll');
    const cardActive = document.getElementById('cardActive');
    const cardDoneToday = document.getElementById('cardDoneToday');
    const cardClaimable = document.getElementById('cardClaimable');
    if(cardAll && cardActive && cardDoneToday && cardClaimable) {
        cardAll.classList.remove('active-all'); cardActive.classList.remove('active-blue');
        cardDoneToday.classList.remove('active-green'); cardClaimable.classList.remove('active-orange');
        if (currentFilter === 'All') cardAll.classList.add('active-all');
        else if (currentFilter === 'Active') cardActive.classList.add('active-blue');
        else if (currentFilter === 'DoneToday') cardDoneToday.classList.add('active-green');
        else if (currentFilter === 'Claimable') cardClaimable.classList.add('active-orange');
    }
}

window.setFilter = (filterType) => { currentFilter = filterType; renderProjects(); };
window.setNetworkFilter = (networkType) => { currentNetworkFilter = networkType; renderNetworkFilterButtons(); renderProjects(); };
window.updateStatus = async (id, newStatus) => { try { await updateDoc(doc(db, "airdrop_projects", id), { status: newStatus, last_updated: new Date() }); } catch (e) {} };
window.markAsDone = async (id) => { try { await updateDoc(doc(db, "airdrop_projects", id), { last_executed: new Date() }); } catch (e) {} };
window.deleteProject = async (id) => { if(confirm("Confirm deletion?")) { try { await deleteDoc(doc(db, "airdrop_projects", id)); } catch (e) {} } };
window.copyPromo = (projectName, referralLink) => {
    const promoText = `I am currently participating in the ${projectName} airdrop. Join through this link to get bonuses: ${referralLink}`;
    navigator.clipboard.writeText(promoText).then(() => alert(`Promo text copied!`)).catch(err => alert("Clipboard blocked."));
};

// ==========================================
// MODUL 2: TRADING JOURNAL & CAPITAL MANAGEMENT
// ==========================================
function loadTradingData(uid) {
    getDoc(doc(db, "user_settings", uid)).then(docSnap => {
        if (docSnap.exists() && docSnap.data().initial_capital) {
            initialCapital = parseFloat(docSnap.data().initial_capital);
        }
    });

    const q = query(collection(db, "trading_journal"), where("uid", "==", uid));
    unsubscribeTrading = onSnapshot(q, (snapshot) => {
        globalTradingData = [];
        snapshot.forEach((docSnap) => { globalTradingData.push({ id: docSnap.id, ...docSnap.data() }); });
        globalTradingData.sort((a, b) => b.timestamp - a.timestamp);
        renderTrading();
    });
}

window.saveInitialCapital = async () => {
    const val = document.getElementById('inputInitialCapital').value;
    if(!val || isNaN(val)) return;
    try {
        await setDoc(doc(db, "user_settings", currentUserUID), { initial_capital: parseFloat(val) }, { merge: true });
        initialCapital = parseFloat(val);
        document.getElementById('inputInitialCapital').value = '';
        renderTrading();
    } catch(e) {}
};

addTradeBtn.addEventListener('click', async () => {
    const pair = document.getElementById('tradePair').value.toUpperCase();
    const position = document.getElementById('tradePosition').value;
    const margin = parseFloat(document.getElementById('tradeMargin').value);
    const leverage = parseFloat(document.getElementById('tradeLeverage').value) || 1;
    const entry = parseFloat(document.getElementById('tradeEntry').value);
    const exitInput = document.getElementById('tradeExit').value;
    const exit = exitInput ? parseFloat(exitInput) : null;
    const setup = document.getElementById('tradeSetup').value;
    
    if (!pair || isNaN(margin) || isNaN(entry) || !currentUserUID) {
        alert("Pair, Margin, and Entry Price are required.");
        return;
    }
    
    let pnlPercentage = 0; let nominalPnL = 0;
    if (exit !== null) {
        if (position === 'LONG' || position === 'SPOT') { pnlPercentage = ((exit - entry) / entry) * 100 * leverage; } 
        else if (position === 'SHORT') { pnlPercentage = ((entry - exit) / entry) * 100 * leverage; }
        nominalPnL = (margin * (pnlPercentage / 100));
    }
    
    try {
        await addDoc(collection(db, "trading_journal"), {
            uid: currentUserUID, pair: pair, position: position, margin: margin, leverage: leverage,
            entry_price: entry, exit_price: exit,
            pnl_percentage: exit !== null ? pnlPercentage.toFixed(2) : null,
            nominal_pnl: exit !== null ? nominalPnL.toFixed(2) : null,
            setup: setup, eval_note: "", timestamp: new Date()
        });
        document.getElementById('tradePair').value = ''; document.getElementById('tradeMargin').value = '';
        document.getElementById('tradeLeverage').value = ''; document.getElementById('tradeEntry').value = '';
        document.getElementById('tradeExit').value = ''; document.getElementById('tradeSetup').value = '';
    } catch (e) {}
});

function renderTrading() {
    tradingList.innerHTML = ''; 
    let totalClosedTrades = 0, winningTrades = 0, cumulativeNetPnL = 0;

    globalTradingData.forEach((data) => {
        const isClosed = data.exit_price !== null;
        let pnlColor = 'var(--text-secondary)';
        let pnlSign = '';
        let displayPnL = 'Open Position';
        let displayNominal = '-';

        if (isClosed) {
            totalClosedTrades++;
            const pnlValue = parseFloat(data.pnl_percentage);
            const nominalValue = parseFloat(data.nominal_pnl);
            if (pnlValue > 0) winningTrades++;
            cumulativeNetPnL += nominalValue;
            const isProfit = pnlValue >= 0;
            pnlColor = isProfit ? '#34d399' : '#f87171';
            pnlSign = isProfit ? '+' : '';
            displayPnL = `${pnlSign}${data.pnl_percentage}%`;
            displayNominal = `${pnlSign}$${Math.abs(nominalValue).toFixed(2)}`;
        }
        
        let positionColor = 'var(--text-primary)';
        if(data.position === 'LONG') positionColor = '#34d399';
        if(data.position === 'SHORT') positionColor = '#f87171';
        if(data.position === 'SPOT') positionColor = '#60a5fa';

        const card = document.createElement('div');
        card.className = 'project-card';
        card.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: start;">
                <div>
                    <h3 style="margin:0 0 8px 0; font-size: 18px;">
                        ${data.pair} 
                        <span style="font-size: 12px; color: ${positionColor}; padding: 4px 8px; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; margin-left: 8px; font-weight: 500;">
                            ${data.position} ${data.position !== 'SPOT' ? `(${data.leverage}x)` : ''}
                        </span>
                    </h3>
                    <p style="margin:4px 0; font-size: 13px; color: var(--text-secondary);">
                        Margin: <strong style="color: var(--text-primary); font-weight: 500;">$${data.margin}</strong>
                    </p>
                    <p style="margin:4px 0; font-size: 13px; color: var(--text-secondary);">
                        Entry: <strong style="color: var(--text-primary); font-weight: 500;">$${data.entry_price}</strong> | Exit: <strong style="color: var(--text-primary); font-weight: 500;">${data.exit_price !== null ? '$'+data.exit_price : '---'}</strong>
                    </p>
                    ${data.setup ? `<p style="margin:8px 0 0 0; font-size: 13px; color: var(--text-secondary); font-style: italic;">Setup: ${data.setup}</p>` : ''}
                    ${data.eval_note ? `<p style="margin:4px 0 0 0; font-size: 13px; color: #60a5fa; font-style: italic;">Eval: ${data.eval_note}</p>` : ''}
                </div>
                <div style="text-align: right;">
                    <h2 style="margin: 0; color: ${pnlColor}; font-size: 26px; font-weight: 700;">${displayNominal}</h2>
                    <span style="font-size: 12px; color: ${pnlColor}; font-weight: 600;">${displayPnL}</span>
                </div>
            </div>
            <div style="display: flex; gap: 8px; margin-top: 20px;">
                <button onclick="window.openEditModal('${data.id}', ${data.exit_price}, '${(data.eval_note || '').replace(/'/g, "\\'")}')" style="background-color: transparent; border: 1px solid var(--border-blue-subtle); color: var(--text-secondary); padding: 6px 16px; font-size: 12px; border-radius: 12px; cursor: pointer; transition: 0.3s;">Update / Eval</button>
                <button onclick="window.deleteTrade('${data.id}')" style="background-color: transparent; border: 1px solid rgba(239, 68, 68, 0.3); color: #f87171; padding: 6px 16px; font-size: 12px; border-radius: 12px; cursor: pointer; transition: 0.3s;">Delete</button>
            </div>
        `;
        tradingList.appendChild(card);
    });

    const currentCapital = initialCapital + cumulativeNetPnL;
    const metricCurrentCapital = document.getElementById('metricCurrentCapital');
    const metricCapitalDelta = document.getElementById('metricCapitalDelta');
    
    if (metricCurrentCapital) {
        metricCurrentCapital.innerText = `$${currentCapital.toFixed(2)}`;
        metricCurrentCapital.style.color = currentCapital >= initialCapital ? '#34d399' : '#f87171';
    }
    if (metricCapitalDelta) {
        metricCapitalDelta.innerText = `(${cumulativeNetPnL >= 0 ? '+' : ''}$${cumulativeNetPnL.toFixed(2)})`;
        metricCapitalDelta.style.color = cumulativeNetPnL >= 0 ? '#34d399' : '#f87171';
    }

    const winRate = totalClosedTrades > 0 ? ((winningTrades / totalClosedTrades) * 100).toFixed(1) : 0;
    const metricWinRate = document.getElementById('metricWinRate');
    const metricSystemEval = document.getElementById('metricSystemEval');
    
    if (metricWinRate) {
        metricWinRate.innerText = `${winRate}%`;
        metricWinRate.style.color = winRate >= 50 ? '#34d399' : (totalClosedTrades > 0 ? '#f87171' : 'var(--text-primary)');
    }
    
    if (metricSystemEval && totalClosedTrades >= 5) {
        if (winRate < 40) {
            metricSystemEval.innerText = "🚨 Poor Performance. Stop trading. Review your setups and reduce leverage.";
            metricSystemEval.style.color = "#f87171";
        } else if (winRate >= 40 && winRate < 55) {
            metricSystemEval.innerText = "⚠️ Break-even territory. Tighten stop losses and filter setups strictly.";
            metricSystemEval.style.color = "#f59e0b";
        } else {
            metricSystemEval.innerText = "✅ Solid Edge. Maintain current discipline and sizing.";
            metricSystemEval.style.color = "#34d399";
        }
    } else if (metricSystemEval) {
        metricSystemEval.innerText = "Requires min. 5 closed trades for eval.";
        metricSystemEval.style.color = "var(--text-secondary)";
    }
    
    const metricTotalTrades = document.getElementById('metricTotalTrades');
    if (metricTotalTrades) metricTotalTrades.innerText = totalClosedTrades;
}

window.deleteTrade = async (id) => {
    if(!currentUserUID) return;
    if(confirm("Permanently delete this trade record?")) {
        try { await deleteDoc(doc(db, "trading_journal", id)); } catch (e) {}
    }
};

window.openEditModal = (id, currentExit, currentEval) => {
    document.getElementById('editTradeId').value = id;
    document.getElementById('editExitPrice').value = currentExit !== null ? currentExit : '';
    document.getElementById('editEvalNote').value = currentEval || '';
    document.getElementById('editTradeModal').classList.add('active');
};
window.closeEditModal = () => { document.getElementById('editTradeModal').classList.remove('active'); };

window.saveTradeUpdate = async () => {
    const id = document.getElementById('editTradeId').value;
    const exitInput = document.getElementById('editExitPrice').value;
    const exit = exitInput ? parseFloat(exitInput) : null;
    const evalNote = document.getElementById('editEvalNote').value;
    const tradeData = globalTradingData.find(t => t.id === id);
    if (!tradeData || !currentUserUID) return;

    let pnlPercentage = null; let nominalPnL = null;
    if (exit !== null) {
        const entry = parseFloat(tradeData.entry_price);
        const margin = parseFloat(tradeData.margin);
        const leverage = parseFloat(tradeData.leverage);
        if (tradeData.position === 'LONG' || tradeData.position === 'SPOT') { pnlPercentage = ((exit - entry) / entry) * 100 * leverage; } 
        else if (tradeData.position === 'SHORT') { pnlPercentage = ((entry - exit) / entry) * 100 * leverage; }
        nominalPnL = (margin * (pnlPercentage / 100));
    }
    try {
        await updateDoc(doc(db, "trading_journal", id), {
            exit_price: exit,
            pnl_percentage: exit !== null ? pnlPercentage.toFixed(2) : null,
            nominal_pnl: exit !== null ? nominalPnL.toFixed(2) : null,
            eval_note: evalNote
        });
        window.closeEditModal();
    } catch (e) {}
};
