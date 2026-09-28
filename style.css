@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

:root {
    --bg-main: #0b0f19;
    --bg-card: #111827;
    --text-primary: #f8fafc;
    --text-secondary: #94a3b8;
    
    --accent-blue-muted: rgba(59, 130, 246, 0.08);
    --border-blue-subtle: rgba(30, 58, 138, 0.5);
    
    --accent-green-muted: rgba(16, 185, 129, 0.08);
    --border-green-subtle: rgba(6, 78, 59, 0.5);
    
    --accent-orange-muted: rgba(245, 158, 11, 0.08);
    --border-orange-subtle: rgba(120, 53, 15, 0.5);

    --radius-xl: 16px;
    --radius-2xl: 24px;
    --shadow-soft: 0 4px 20px rgba(0, 0, 0, 0.5);
    --transition-smooth: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

body {
    background-color: var(--bg-main);
    color: var(--text-primary);
    font-family: 'Inter', sans-serif;
    margin: 0;
    padding: 20px;
}

.dashboard-container {
    max-width: 1200px;
    margin: 0 auto;
}

.tab-nav {
    display: flex;
    gap: 12px;
    margin-bottom: 24px;
    border-bottom: 1px solid var(--border-blue-subtle);
    padding-bottom: 16px;
}

.tab-btn {
    background: transparent;
    color: var(--text-secondary);
    border: 1px solid transparent;
    padding: 10px 24px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    border-radius: var(--radius-xl);
    transition: var(--transition-smooth);
}

.tab-btn:hover { color: var(--text-primary); }

.tab-btn.active {
    background: var(--bg-card);
    color: var(--text-primary);
    border: 1px solid var(--border-blue-subtle);
    box-shadow: var(--shadow-soft);
}

.metric-card {
    flex: 1;
    background: var(--bg-card);
    border: 1px solid transparent;
    padding: 20px;
    border-radius: var(--radius-2xl);
    text-align: center;
    cursor: pointer;
    transition: var(--transition-smooth);
    box-shadow: var(--shadow-soft);
}

.metric-card h4 {
    margin: 0;
    color: var(--text-secondary);
    font-size: 13px;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.metric-card h2 {
    margin: 12px 0 0 0;
    color: var(--text-primary);
    font-size: 32px;
    font-weight: 700;
}

.metric-card:hover { transform: translateY(-2px); }

.metric-card.active-all { border: 1px solid rgba(255, 255, 255, 0.15); background: rgba(255, 255, 255, 0.03); }
.metric-card.active-blue { border: 1px solid var(--border-blue-subtle); background: var(--accent-blue-muted); }
.metric-card.active-green { border: 1px solid var(--border-green-subtle); background: var(--accent-green-muted); }
.metric-card.active-orange { border: 1px solid var(--border-orange-subtle); background: var(--accent-orange-muted); }

.control-panel {
    display: flex;
    gap: 12px;
    margin-bottom: 24px;
    background: var(--bg-card);
    padding: 20px;
    border-radius: var(--radius-2xl);
    box-shadow: var(--shadow-soft);
}

.form-input {
    background: var(--bg-main);
    color: var(--text-primary);
    border: 1px solid var(--border-blue-subtle);
    padding: 12px 16px;
    border-radius: var(--radius-xl);
    font-size: 14px;
    outline: none;
    transition: var(--transition-smooth);
    box-sizing: border-box;
}

.form-input:focus { border-color: rgba(96, 165, 250, 0.5); }

.btn-primary {
    background: var(--accent-blue-muted);
    color: #60a5fa; 
    border: 1px solid var(--border-blue-subtle);
    padding: 14px 24px;
    font-size: 14px;
    font-weight: 600;
    border-radius: var(--radius-xl);
    cursor: pointer;
    transition: var(--transition-smooth);
}

.btn-primary:hover {
    background: rgba(59, 130, 246, 0.15);
    box-shadow: 0 0 15px rgba(59, 130, 246, 0.1);
}

.grid-layout {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 16px;
}

.project-card {
    background: var(--bg-card);
    border: 1px solid var(--border-blue-subtle);
    padding: 20px;
    border-radius: var(--radius-xl);
    box-shadow: var(--shadow-soft);
    transition: var(--transition-smooth);
}

.project-card:hover { border-color: rgba(96, 165, 250, 0.4); }

/* Modal Edit Evaluasi Trading */
.modal-overlay {
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(11, 15, 25, 0.85);
    display: flex; justify-content: center; align-items: center;
    z-index: 1000; opacity: 0; pointer-events: none;
    transition: var(--transition-smooth);
}
.modal-overlay.active { opacity: 1; pointer-events: auto; }
.modal-content {
    background: var(--bg-card); border: 1px solid var(--border-blue-subtle);
    padding: 24px; border-radius: var(--radius-2xl); width: 400px;
    box-shadow: var(--shadow-soft);
}
.modal-content h3 { margin-top: 0; color: var(--text-primary); margin-bottom: 16px; }
.modal-content input, .modal-content textarea { width: 100%; margin-bottom: 12px; }
.modal-content textarea { resize: vertical; min-height: 80px; }
.modal-actions { display: flex; gap: 10px; justify-content: flex-end; margin-top: 12px; }
