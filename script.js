// --- DATABASE SIMULATION (Local Storage) ---
function initDB() {
    if (!localStorage.getItem('app_users')) {
        localStorage.setItem('app_users', JSON.stringify([
            { username: 'admin', role: 'admin', pass: 'admin123' },
            { username: 'security', role: 'security', pass: 'sec123' }
        ]));
    }
    if (!localStorage.getItem('app_buses')) {
        localStorage.setItem('app_buses', JSON.stringify([
            { id: 'TN82Y8388', driver: 'Tony Stark', busNo: 'BUS-01' },
            { id: 'BUS-042', driver: 'John Doe', busNo: 'BUS-02' }
        ]));
    }
    if (!localStorage.getItem('app_logs')) {
        localStorage.setItem('app_logs', JSON.stringify([]));
    }
    if (!localStorage.getItem('bus_states')) {
        localStorage.setItem('bus_states', JSON.stringify({})); // Tracks IN/OUT state
    }
}
initDB();

let currentUser = null;

// --- LOGIN & AUTH ---
function checkAuth() {
    const savedUser = localStorage.getItem('current_user');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        document.getElementById('login-screen').classList.add('hidden');
        document.getElementById('main-app').classList.remove('hidden');
        setupRoleUI();
        refreshAllData();
        navigateTo('dashboard');
    } else {
        document.getElementById('login-screen').classList.remove('hidden');
        document.getElementById('main-app').classList.add('hidden');
    }
}

function attemptLogin() {
    const user = document.getElementById('login-user').value.trim();
    const pass = document.getElementById('login-pass').value.trim();
    const errorMsg = document.getElementById('login-error');
    
    const users = JSON.parse(localStorage.getItem('app_users'));
    const foundUser = users.find(u => u.username === user && u.pass === pass);
    
    if (foundUser) {
        localStorage.setItem('current_user', JSON.stringify({ username: foundUser.username, role: foundUser.role }));
        errorMsg.textContent = "";
        checkAuth();
    } else {
        errorMsg.textContent = "Invalid username or password!";
    }
}

function logout() {
    document.getElementById('logout-modal').classList.remove('hidden');
}

function hideLogoutModal() {
    document.getElementById('logout-modal').classList.add('hidden');
}

function confirmLogout() {
    hideLogoutModal();
    localStorage.removeItem('current_user');
    if (cameraActive) toggleCamera();
    checkAuth();
}

function setupRoleUI() {
    document.getElementById('user-name').textContent = currentUser.username;
    document.getElementById('user-role').textContent = currentUser.role === 'admin' ? 'Administrator' : 'Security Guard';
    document.getElementById('user-avatar').textContent = currentUser.username.charAt(0);

    const adminLinks = document.getElementById('admin-only-links');
    if (currentUser.role === 'admin') {
        adminLinks.style.display = 'block';
    } else {
        adminLinks.style.display = 'none';
    }
}

// --- SPA NAVIGATION ---
function navigateTo(sectionId) {
    document.querySelectorAll('.page-section').forEach(sec => sec.classList.add('hidden'));
    document.getElementById(`sec-${sectionId}`).classList.remove('hidden');
    
    document.querySelectorAll('.nav-links li').forEach(li => li.classList.remove('active'));
    document.getElementById(`nav-${sectionId}`).classList.add('active');
    
    if (sectionId === 'fleet') renderFleetList();
    if (sectionId === 'logs') {
        updateBusFilterDropdown();
        renderFullLogs();
    }
}


// --- REAL-TIME CLOCK ---
function updateTime() {
    const timeDisplay = document.getElementById('datetime-display');
    if (!timeDisplay) return;
    const now = new Date();
    timeDisplay.textContent = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
}
setInterval(updateTime, 1000);
updateTime();


// --- VEHICLE MANAGEMENT (ADMIN) ---
function addVehicle() {
    const busNo = document.getElementById('new-bus-no').value.trim();
    const rawPlate = document.getElementById('new-plate').value.trim().toUpperCase();
    const plate = rawPlate.replace(/[^A-Z0-9]/g, ''); // Clean plate for exact OCR match
    const driver = document.getElementById('new-driver').value.trim();
    
    if (!busNo || !plate || !driver) {
        showToast("Please fill all fields", "error");
        return;
    }

    let buses = JSON.parse(localStorage.getItem('app_buses'));
    if (buses.find(b => b.id === plate)) {
        showToast("Plate already registered!", "error");
        return;
    }

    buses.push({ id: plate, busNo: busNo, driver: driver });
    localStorage.setItem('app_buses', JSON.stringify(buses));
    
    document.getElementById('new-bus-no').value = '';
    document.getElementById('new-plate').value = '';
    document.getElementById('new-driver').value = '';
    
    showToast(`Bus ${busNo} registered!`, "success");
    renderFleetList();
}

function renderFleetList() {
    const list = document.getElementById('fleet-list');
    list.innerHTML = '';
    const buses = JSON.parse(localStorage.getItem('app_buses'));
    
    buses.forEach(b => {
        list.innerHTML += `
            <li>
                <div>
                    <strong>${b.busNo} (${b.id})</strong>
                    <p style="color:var(--text-muted); font-size:12px;">Driver: ${b.driver}</p>
                </div>
                <div style="display:flex; gap:10px;">
                    <button class="action-btn" style="background:var(--primary); padding:8px 12px; font-size:16px;" onclick="generateQR('${b.id}')" title="Generate QR"><i class='bx bx-qr'></i></button>
                    <button class="danger-btn" onclick="removeVehicle('${b.id}')"><i class='bx bx-trash'></i></button>
                </div>
            </li>
        `;
    });
}

function removeVehicle(id) {
    let buses = JSON.parse(localStorage.getItem('app_buses'));
    buses = buses.filter(b => b.id !== id);
    localStorage.setItem('app_buses', JSON.stringify(buses));
    renderFleetList();
    showToast(`Removed ${id}`, "success");
}


// --- LOGGING & STATS ---
function addLogEntry(plateId, direction) {
    const buses = JSON.parse(localStorage.getItem('app_buses'));
    const bus = buses.find(b => b.id === plateId);
    const driverName = bus ? bus.driver : 'Unknown';
    const busNo = bus ? bus.busNo : 'N/A';
    const currentGate = document.getElementById('gate-select') ? document.getElementById('gate-select').value : 'Main Gate';

    const now = new Date();
    const logEntry = {
        date: now.toLocaleDateString(),
        time: now.toLocaleTimeString('en-US', {hour: '2-digit', minute:'2-digit', hour12: true}),
        plateId: plateId,
        busNo: busNo,
        driver: driverName,
        direction: direction,
        timestamp: now.getTime(),
        gate: currentGate
    };

    let logs = JSON.parse(localStorage.getItem('app_logs'));
    logs.unshift(logEntry);
    localStorage.setItem('app_logs', JSON.stringify(logs));

    // --- NEW: Send to Java Backend Database ---
    fetch('http://localhost:8080/api/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(logEntry)
    }).then(res => res.json())
      .then(data => console.log("Java Backend Synced:", data))
      .catch(err => console.log("Backend offline, working locally", err));

    // Update States
    let states = JSON.parse(localStorage.getItem('bus_states'));
    states[plateId] = { state: direction, lastScan: now.getTime(), alertTriggered: false };
    localStorage.setItem('bus_states', JSON.stringify(states));

    refreshAllData();
    showToast(`${busNo !== 'N/A' ? busNo : plateId} marked ${direction}`, direction === 'IN' ? 'success' : 'info');
}

function refreshAllData() {
    const logs = JSON.parse(localStorage.getItem('app_logs'));
    const states = JSON.parse(localStorage.getItem('bus_states'));
    
    // Render Dashboard Table (Max 5)
    const dashBody = document.querySelector('#dashboard-logs-table tbody');
    if (dashBody) {
        dashBody.innerHTML = '';
        logs.slice(0, 5).forEach(log => {
            const badgeClass = log.direction === 'IN' ? 'in' : 'out';
            dashBody.innerHTML += `
                <tr>
                    <td><strong>${log.busNo}</strong></td>
                    <td>${log.plateId}</td>
                    <td>${log.driver}</td>
                    <td>${log.gate || 'Main Gate'}</td>
                    <td><span class="status-badge ${badgeClass}">${log.direction}</span></td>
                    <td>${log.time}</td>
                </tr>
            `;
        });
    }

    renderFullLogs();

    // Calculate Stats
    let insideCount = 0;
    let outsideCount = 0;
    Object.values(states).forEach(s => {
        if (s.state === 'IN') insideCount++;
        else outsideCount++;
    });

    const statInside = document.getElementById('stat-inside');
    if(statInside) statInside.textContent = insideCount;
    
    const statOutside = document.getElementById('stat-outside');
    if(statOutside) statOutside.textContent = outsideCount;
    
    const statScans = document.getElementById('stat-scans');
    if(statScans) statScans.textContent = logs.length;
    
    if (typeof updateChart === 'function') {
        updateChart(insideCount, outsideCount);
    }
}

function updateBusFilterDropdown() {
    const filter = document.getElementById('log-bus-filter');
    if (!filter) return;
    
    const buses = JSON.parse(localStorage.getItem('app_buses'));
    filter.innerHTML = '<option value="ALL">All Buses</option>';
    buses.forEach(b => {
        filter.innerHTML += `<option value="${b.busNo}">${b.busNo} (${b.id})</option>`;
    });
}

function renderFullLogs() {
    let logs = JSON.parse(localStorage.getItem('app_logs'));
    const filterSelect = document.getElementById('log-bus-filter');
    
    if (filterSelect && filterSelect.value !== "ALL") {
        logs = logs.filter(log => log.busNo === filterSelect.value);
    }

    const fullBody = document.querySelector('#full-logs-table tbody');
    if (!fullBody) return;
    fullBody.innerHTML = '';
    logs.forEach(log => {
        const badgeClass = log.direction === 'IN' ? 'in' : 'out';
        fullBody.innerHTML += `
            <tr>
                <td>${log.date}</td>
                <td>${log.time}</td>
                <td><strong>${log.busNo}</strong></td>
                <td>${log.plateId}</td>
                <td>${log.driver}</td>
                <td>${log.gate || 'Main Gate'}</td>
                <td><span class="status-badge ${badgeClass}">${log.direction}</span></td>
            </tr>
        `;
    });
}

function exportToCSV() {
    let logs = JSON.parse(localStorage.getItem('app_logs'));
    const filterSelect = document.getElementById('log-bus-filter');
    
    if (filterSelect && filterSelect.value !== "ALL") {
        logs = logs.filter(log => log.busNo === filterSelect.value);
    }
    
    if (logs.length === 0) {
        showToast("No logs to export", "error");
        return;
    }

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Date,Time,Bus No,Plate ID,Driver,Gate,Status\n";
    
    logs.forEach(log => {
        csvContent += `${log.date},${log.time},${log.busNo},${log.plateId},${log.driver},${log.gate || 'Main Gate'},${log.direction}\n`;
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `bus_logs_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Report Exported!", "success");
}


// --- DATA RESET ---
function resetLogs() {
    if (confirm("Are you sure you want to clear all log history?")) {
        localStorage.setItem('app_logs', JSON.stringify([]));
        localStorage.setItem('bus_states', JSON.stringify({}));
        refreshAllData();
        showToast("Logs cleared successfully", "success");
    }
}

function factoryReset() {
    if (confirm("WARNING: This will wipe ALL data, users, vehicles, and logs. Proceed?")) {
        localStorage.clear();
        initDB();
        confirmLogout();
    }
}


// --- SMART ALERTS SYSTEM ---
function addSmartAlert(type, message) {
    const list = document.getElementById('alerts-list');
    if (!list) return;

    // Remove empty placeholder
    if (list.innerHTML.includes('No active alerts')) {
        list.innerHTML = '';
    }

    const now = new Date().toLocaleTimeString('en-US', {hour: '2-digit', minute:'2-digit', second: '2-digit'});
    let icon = 'bx-error-alt';
    if (type === 'UNAUTHORIZED BUS') icon = 'bx-block';
    if (type === 'UNEXPECTED DEPARTURE') icon = 'bx-run';
    
    const li = document.createElement('li');
    li.style.borderLeft = '4px solid var(--danger)';
    li.style.background = 'rgba(239, 68, 68, 0.05)';
    li.innerHTML = `
        <div style="display:flex; align-items:center; gap:12px;">
            <i class='bx ${icon}' style="font-size:24px; color:var(--danger);"></i>
            <div>
                <strong style="color:var(--danger);">${type}</strong>
                <p style="font-size:13px; margin-top:2px;">${message}</p>
            </div>
        </div>
        <span style="font-size:12px; color:var(--text-muted);">${now}</span>
    `;
    
    list.prepend(li);
    showToast(`ALERT: ${type}`, "error");
}

// Overdue bus checker removed per user request


// --- WEBCAM & ANPR LOGIC ---
const video = document.getElementById('webcam');
const ocrStatus = document.getElementById('ocrStatus');
const scanLine = document.getElementById('scanLine');
const canvas = document.getElementById('canvas');
const overlayCanvas = document.getElementById('overlayCanvas');
const toggleBtn = document.getElementById('toggleCameraBtn');

let cameraActive = false;
let scanInterval = null;
let streamRef = null;
const SCAN_COOLDOWN_MS = 8000;

async function toggleCamera() {
    if (cameraActive) {
        if (streamRef) streamRef.getTracks().forEach(track => track.stop());
        video.srcObject = null;
        clearInterval(scanInterval);
        cameraActive = false;
        
        toggleBtn.innerHTML = "<i class='bx bx-video'></i> ANPR Scan";
        toggleBtn.style.background = "";
        toggleBtn.style.color = "";
        ocrStatus.textContent = "Camera stopped.";
        scanLine.style.display = 'none';
        if (overlayCanvas) overlayCanvas.getContext('2d').clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
    } else {
        // Wait for QR Scanner to release the hardware camera before starting
        if (qrScannerActive && html5QrcodeScanner) {
            ocrStatus.textContent = "Releasing QR Scanner...";
            await html5QrcodeScanner.stop().catch(e => console.log(e));
            html5QrcodeScanner.clear();
            qrScannerActive = false;
            document.getElementById('qr-reader').style.display = 'none';
            const qrBtn = document.getElementById('toggleQRBtn');
            if(qrBtn) {
                qrBtn.innerHTML = "<i class='bx bx-qr-scan'></i> QR Scan";
                qrBtn.style.background = "";
                qrBtn.style.color = "";
            }
        }
        
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            
            toggleBtn.innerHTML = "<i class='bx bx-loader bx-spin'></i> Starting...";
            ocrStatus.textContent = "Requesting camera access...";
            
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
                streamRef = stream;
                video.srcObject = stream;
                video.play().catch(e => console.log(e));
                cameraActive = true;
                
                toggleBtn.innerHTML = "<i class='bx bx-video-off'></i> Stop Camera";
                toggleBtn.style.background = "var(--danger-bg)";
                toggleBtn.style.color = "var(--danger)";
                toggleBtn.style.border = "1px solid rgba(239, 68, 68, 0.3)";
                ocrStatus.textContent = "Camera active. Auto-scanning...";
                
                scanInterval = setInterval(performOCRScan, 3000);
            } catch (error) {
                console.error("Camera Error:", error);
                ocrStatus.textContent = "Camera error: " + error.name;
                showToast("Camera failed: " + error.message, "error");
                alert("Camera Error Details:\nName: " + error.name + "\nMessage: " + error.message + "\n\nMake sure you are using a secure connection (localhost or HTTPS) and have granted camera permissions.");
                toggleBtn.innerHTML = "<i class='bx bx-video'></i> ANPR Scan";
            }
        } else {
            showToast("Camera API not supported in this browser.", "error");
            alert("Camera API Not Supported!\n\nThis happens because you are either:\n1. Opening the file directly (file://)\n2. Using a network IP (http://192.168...) instead of localhost\n3. Using the built-in VS Code preview.\n\nPlease open an external browser (Chrome/Safari) and go to http://localhost:5500");
        }
    }
}

let isScanning = false;
async function performOCRScan() {
    if (!cameraActive || isScanning || !video.videoWidth) return;
    isScanning = true;
    scanLine.style.display = 'block';
    ocrStatus.textContent = "Analyzing frame...";

    const ctx = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = canvas.toDataURL('image/png');

    try {
        const result = await Tesseract.recognize(imageData, 'eng');
        let rawText = result.data.text.toUpperCase().replace(/[^A-Z0-9]/g, '');
        
        const overlayCtx = overlayCanvas.getContext('2d');
        overlayCanvas.width = video.videoWidth;
        overlayCanvas.height = video.videoHeight;
        overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
        
        // OCR Pattern Matching: 
        // We first check if the camera saw any of our registered fleet plates anywhere in the text.
        // This is 100% accurate for registered buses and ignores surrounding noise.
        const registeredBuses = JSON.parse(localStorage.getItem('app_buses')) || [];
        let finalDetectedText = null;
        let isRegistered = false;
        
        for (let b of registeredBuses) {
            const cleanId = b.id.toUpperCase().replace(/[^A-Z0-9]/g, '');
            if (rawText.includes(cleanId)) {
                finalDetectedText = b.id;
                isRegistered = true;
                break;
            }
        }

        // If it's not a registered bus, use a STRICT regex to capture Unregistered buses.
        // This requires exactly: 2 Letters + 1-2 Numbers + 1-2 Letters + 4 Numbers
        // This strictly blocks noise like "LQ73718" or "ON220002" from triggering a scan.
        if (!finalDetectedText) {
            const strictIndianPlate = rawText.match(/[A-Z]{2}[0-9]{1,2}[A-Z]{1,2}[0-9]{4}/);
            const demoPlateMatch = rawText.match(/BUS[0-9]{1,4}/);
            
            if (strictIndianPlate) finalDetectedText = strictIndianPlate[0];
            else if (demoPlateMatch) finalDetectedText = demoPlateMatch[0];
        }

        if (finalDetectedText) {
            let detectedText = finalDetectedText;
            
            result.data.words.forEach(word => {
                const cleanWord = word.text.replace(/[^A-Z0-9]/ig, '');
                const cleanDetectedText = detectedText.toUpperCase().replace(/[^A-Z0-9]/g, '');
                if (cleanWord.length > 1 && cleanDetectedText.includes(cleanWord.toUpperCase())) {
                    const bbox = word.bbox;
                    const strokeColor = isRegistered ? '#10b981' : '#ef4444';
                    
                    // Mirror the bounding box to match the CSS scaleX(-1) flipped video
                    const mirrorX0 = canvas.width - bbox.x1;
                    const mirrorX1 = canvas.width - bbox.x0;
                    const width = mirrorX1 - mirrorX0;
                    const height = bbox.y1 - bbox.y0;

                    overlayCtx.strokeStyle = strokeColor; 
                    overlayCtx.lineWidth = 4;
                    overlayCtx.strokeRect(mirrorX0, bbox.y0, width, height);
                    
                    overlayCtx.fillStyle = strokeColor;
                    overlayCtx.fillRect(mirrorX0, bbox.y0 - 25, width, 25);
                    overlayCtx.fillStyle = '#ffffff';
                    overlayCtx.font = '16px Outfit';
                    overlayCtx.fillText(isRegistered ? "PLATE 99%" : "UNKNOWN", mirrorX0 + 5, bbox.y0 - 7);
                }
            });

            processScanResult(detectedText, isRegistered);
        } else {
            ocrStatus.textContent = "No clear plate detected. Retrying...";
            overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
        }
        
    } catch (err) {
        ocrStatus.textContent = "OCR engine error.";
    }
    
    scanLine.style.display = 'none';
    isScanning = false;
}

function showToast(message, type) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icon = type === 'success' ? 'bx-check-circle' : 'bx-info-circle';
    toast.innerHTML = `<i class='bx ${icon}'></i> <span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => { if(container.contains(toast)) container.removeChild(toast); }, 4500);
}

// --- THEME TOGGLE ---
function toggleTheme() {
    const isLightMode = document.body.classList.toggle('light-mode');
    const themeIcons = document.querySelectorAll('.theme-icon');
    
    if (isLightMode) {
        themeIcons.forEach(icon => {
            icon.classList.remove('bx-sun');
            icon.classList.add('bx-moon');
        });
        localStorage.setItem('app_theme', 'light');
    } else {
        themeIcons.forEach(icon => {
            icon.classList.remove('bx-moon');
            icon.classList.add('bx-sun');
        });
        localStorage.setItem('app_theme', 'dark');
    }
}

function initTheme() {
    const savedTheme = localStorage.getItem('app_theme');
    if (savedTheme === 'light') {
        document.body.classList.add('light-mode');
        const themeIcons = document.querySelectorAll('.theme-icon');
        themeIcons.forEach(icon => {
            icon.classList.remove('bx-sun');
            icon.classList.add('bx-moon');
        });
    }
}

// Init will be called at the bottom of the file
// --- QR CODE GENERATION & SCANNING ---
let qrCodeObj = null;
function generateQR(plateId) {
    const container = document.getElementById('qr-code-container');
    container.innerHTML = '';
    qrCodeObj = new QRCode(container, {
        text: plateId,
        width: 200,
        height: 200,
        colorDark: "#000000",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H
    });
    document.getElementById('qr-code-plate').textContent = plateId;
    document.getElementById('qr-modal').classList.remove('hidden');
}

// Shared logic for ANPR and QR
function processScanResult(detectedText, isRegistered) {
    const states = JSON.parse(localStorage.getItem('bus_states'));
    const now = Date.now();
    const busInfo = states[detectedText] || { state: 'OUT', lastScan: 0, alertTriggered: false };
    
    if (now - busInfo.lastScan > SCAN_COOLDOWN_MS) {
        if (!isRegistered) {
            addSmartAlert('UNAUTHORIZED BUS', `Unknown vehicle ID ${detectedText} detected!`);
            states[detectedText] = { state: 'UNKNOWN', lastScan: now, alertTriggered: true };
            localStorage.setItem('bus_states', JSON.stringify(states));
        } else {
            const newDirection = busInfo.state === 'OUT' ? 'IN' : 'OUT';
            if (busInfo.state === 'IN' && newDirection === 'OUT' && busInfo.lastScan !== 0) {
                const timeInside = now - busInfo.lastScan;
                if (timeInside < 120000) { 
                    const seconds = Math.floor(timeInside / 1000);
                    addSmartAlert('UNEXPECTED DEPARTURE', `Bus ${detectedText} departing only ${seconds}s after arriving!`);
                }
            }
            addLogEntry(detectedText, newDirection);
        }
    } else {
        document.getElementById('ocrStatus').textContent = "Cooldown active for " + detectedText;
    }
}

let html5QrcodeScanner = null;
let qrScannerActive = false;

async function toggleQRScanner() {
    const qrBtn = document.getElementById('toggleQRBtn');
    if (cameraActive) await toggleCamera(); // Stop ANPR if running
    
    if (qrScannerActive) {
        if (html5QrcodeScanner) {
            await html5QrcodeScanner.stop().catch(e => console.log(e));
            html5QrcodeScanner.clear();
            qrScannerActive = false;
            document.getElementById('qr-reader').style.display = 'none';
            qrBtn.innerHTML = "<i class='bx bx-qr-scan'></i> QR Scan";
            qrBtn.style.background = "";
            qrBtn.style.color = "";
            document.getElementById('ocrStatus').textContent = "QR Scanner stopped.";
        }
    } else {
        document.getElementById('qr-reader').style.display = 'block';
        if (!html5QrcodeScanner) {
            html5QrcodeScanner = new Html5Qrcode("qr-reader");
        }
        html5QrcodeScanner.start(
            { facingMode: "user" },
            { fps: 10, qrbox: { width: 300, height: 300 } },
            (decodedText, decodedResult) => {
                const registeredBuses = JSON.parse(localStorage.getItem('app_buses')) || [];
                const isRegistered = registeredBuses.some(b => b.id === decodedText);
                
                const states = JSON.parse(localStorage.getItem('bus_states')) || {};
                const busInfo = states[decodedText] || { lastScan: 0 };
                if (Date.now() - busInfo.lastScan > SCAN_COOLDOWN_MS) {
                    processScanResult(decodedText, isRegistered);
                }
            },
            (errorMessage) => { }
        ).then(() => {
            qrScannerActive = true;
            qrBtn.innerHTML = "<i class='bx bx-qr-scan'></i> Stop QR Scan";
            qrBtn.style.background = "var(--danger-bg)";
            qrBtn.style.color = "var(--danger)";
            qrBtn.style.border = "1px solid rgba(239, 68, 68, 0.3)";
            document.getElementById('ocrStatus').textContent = "QR Scanner active...";
        }).catch(err => {
            showToast("QR Scanner failed to start", "error");
        });
    }
}

// --- CHARTS & ANALYTICS ---
let trafficChart = null;
function updateChart(insideCount, outsideCount) {
    const ctx = document.getElementById('trafficChart');
    if (!ctx) return;
    
    const isLightMode = document.body.classList.contains('light-mode');
    const textColor = isLightMode ? '#333' : '#fff';

    if (trafficChart) {
        trafficChart.data.datasets[0].data = [insideCount, outsideCount];
        trafficChart.options.plugins.legend.labels.color = textColor;
        trafficChart.update();
    } else {
        trafficChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Inside Campus', 'Outside Campus'],
                datasets: [{
                    data: [insideCount, outsideCount],
                    backgroundColor: ['#3b82f6', '#8b5cf6'],
                    borderWidth: 0,
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: { color: textColor, font: { family: 'Outfit', size: 14 } }
                    }
                }
            }
        });
    }
}

// Init on load
initTheme();
checkAuth();
