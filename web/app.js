// FocusProof Application

// Global variables
let startTime = 0;
let endTime = 0;
let plannedDuration = 0;
let taskText = '';
let timerInterval = null;
let isTimerRunning = false;
let focusData = null;

// DOM elements
const mainMenuScreen = document.getElementById('main-menu');
const howToPlayScreen = document.getElementById('how-to-play');
const setupScreen = document.getElementById('setup-screen');
const focusScreen = document.getElementById('focus-screen');
const proofSelectionScreen = document.getElementById('proof-selection');
const resultScreen = document.getElementById('result-screen');
const proofPanel = document.getElementById('proof-panel');

// Buttons
const startFocusBtn = document.getElementById('start-focus-btn');
const howToBtn = document.getElementById('how-to-btn');
const backBtn = document.getElementById('back-btn');
const startSessionBtn = document.getElementById('start-session-btn');
const backToMenuBtn = document.getElementById('back-to-menu-btn');
const completeBtn = document.getElementById('complete-btn');
const cancelBtn = document.getElementById('cancel-btn');
const realProofBtn = document.getElementById('real-proof-btn');
const simulationProofBtn = document.getElementById('simulation-proof-btn');
const proofSelectCancelBtn = document.getElementById('proof-select-cancel-btn');
const newSessionBtn = document.getElementById('new-session-btn');
const homeBtn = document.getElementById('home-btn');
const closePanelBtn = document.getElementById('close-panel-btn');

// Other elements
const currentTaskEl = document.getElementById('current-task');
const timerEl = document.getElementById('timer');
const proofContainerEl = document.getElementById('proof-container');
const taskInput = document.getElementById('task-input');
const durationInput = document.getElementById('duration-input');
const proofSelectionTask = document.getElementById('proof-selection-task');
const proofSelectionDuration = document.getElementById('proof-selection-duration');
const proofSelectionActual = document.getElementById('proof-selection-actual');

// Ensure proof panel is hidden on load
if (proofPanel) {
    proofPanel.classList.add('hidden');
}

// Show screen function
function showScreen(screen) {
    // Hide all screens
    document.querySelectorAll('.screen').forEach(s => {
        s.classList.remove('active');
    });
    
    // Show selected screen
    screen.classList.add('active');
    
    console.log('Active screen:', screen.id);
}

// Format time (seconds to MM:SS)
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function formatDuration(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes} min ${secs} sec`;
}

// Update timer display
function updateTimer(remainingSeconds) {
    if (timerEl) {
        timerEl.textContent = formatTime(remainingSeconds);
    }
}

// Start focus session
function startFocusSession() {
    // Get task and duration
    taskText = taskInput.value.trim();
    if (!taskText) {
        alert('Please enter a task!');
        return;
    }
    
    const durationMinutes = parseInt(durationInput.value);
    if (isNaN(durationMinutes) || durationMinutes < 1 || durationMinutes > 120) {
        alert('Please set a duration between 1-120 minutes!');
        return;
    }
    
    // Set session parameters
    plannedDuration = durationMinutes * 60; // convert to seconds
    startTime = Math.floor(Date.now() / 1000); // current timestamp in seconds
    
    // Update UI
    if (currentTaskEl) {
        currentTaskEl.textContent = `Task: ${taskText}`;
    }
    updateTimer(plannedDuration);
    
    // Show focus screen
    showScreen(focusScreen);
    
    // Start timer
    let remainingSeconds = plannedDuration;
    isTimerRunning = true;
    
    timerInterval = setInterval(() => {
        remainingSeconds--;
        
        if (remainingSeconds <= 0) {
            // Timer completed
            clearInterval(timerInterval);
            completeFocusSession();
        } else {
            updateTimer(remainingSeconds);
        }
    }, 1000);
}

// Complete focus session and prepare for proof selection
function completeFocusSession() {
    // Stop timer
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    
    isTimerRunning = false;
    
    // Record end time
    endTime = Math.floor(Date.now() / 1000);
    
    // Prepare focus data
    focusData = {
        task: taskText,
        startTime: startTime,
        endTime: endTime,
        duration: plannedDuration
    };
    
    // Prepare proof selection screen
    if (proofSelectionTask) proofSelectionTask.textContent = taskText;
    if (proofSelectionDuration) proofSelectionDuration.textContent = formatDuration(plannedDuration);
    if (proofSelectionActual) proofSelectionActual.textContent = formatDuration(endTime - startTime);
    
    // Go to proof selection screen
    showScreen(proofSelectionScreen);
}

// Generate real SP1 Proof
function generateRealProof() {
    if (!focusData) {
        alert('Focus data not found!');
        return;
    }
    
    // Show proof panel
    if (typeof window.createProofPanel === 'function') {
        window.createProofPanel();
    }
    
    // Show result screen
    showScreen(resultScreen);
    
    // Prepare result screen
    if (proofContainerEl) {
        proofContainerEl.innerHTML = '<div class="loading">Generating real SP1 Proof...</div>';
    }
    
    // Generate real proof
    if (typeof window.generateSP1Proof === 'function') {
        window.generateSP1Proof(focusData, false) // forceSimulation = false
            .then(result => {
                console.log("Proof generation result:", result);
                
                // Update result screen
                if (proofContainerEl && window.SP1Bridge) {
                    // Clear loading message
                    proofContainerEl.innerHTML = '';
                    
                    // Visualize result details
                    const actualDuration = endTime - startTime;
                    const isValid = actualDuration >= plannedDuration;
                    
                    // Create visual result
                    const proofResultElem = window.SP1Bridge.createVisualProofResult(
                        focusData, 
                        result.proofHash || "0xUnknown", 
                        isValid,
                        true // returnOnly parameter
                    );
                    
                    // Add the created result to proofContainerEl
                    if (proofResultElem) {
                        proofContainerEl.appendChild(proofResultElem);
                        
                        // Update Twitter share button
                        const shareButton = proofContainerEl.querySelector('#share-twitter-button');
                        if (shareButton) {
                            shareButton.addEventListener('click', () => {
                                window.SP1Bridge.shareOnTwitter(focusData, endTime - startTime, isValid);
                            });
                        }
                    }
                }
            })
            .catch(error => {
                console.error("Error generating proof:", error);
                if (proofContainerEl) {
                    proofContainerEl.innerHTML = `
                        <div class="error">
                            <p>Proof generation error: ${error.message}</p>
                            <p>Please make sure the SP1 backend is running.</p>
                        </div>
                    `;
                }
                if (typeof window.logToProofPanel === 'function') {
                    window.logToProofPanel(`Error: ${error.message}`);
                }
            });
    } else {
        console.error('generateSP1Proof function not found');
        if (proofContainerEl) {
            proofContainerEl.innerHTML = '<div class="error">SP1 Bridge could not be loaded</div>';
        }
    }
}

// Generate simulation proof
function generateSimulationProof() {
    if (!focusData) {
        alert('Focus data not found!');
        return;
    }
    
    // Show proof panel
    if (typeof window.createProofPanel === 'function') {
        window.createProofPanel();
    }
    
    // Show result screen
    showScreen(resultScreen);
    
    // Prepare result screen
    if (proofContainerEl) {
        proofContainerEl.innerHTML = '<div class="loading">Generating Simulation Proof...</div>';
    }
    
    // Generate simulation proof
    if (typeof window.generateSP1Proof === 'function') {
        window.generateSP1Proof(focusData, true) // forceSimulation = true
            .then(result => {
                console.log("Simulation proof generation result:", result);
                
                // Update result screen
                if (proofContainerEl && window.SP1Bridge) {
                    // Clear loading message
                    proofContainerEl.innerHTML = '';
                    
                    // Visualize result details
                    const actualDuration = endTime - startTime;
                    const isValid = actualDuration >= plannedDuration;
                    
                    // Create visual result
                    const proofResultElem = window.SP1Bridge.createVisualProofResult(
                        focusData, 
                        result.proofHash || "0xSimulated", 
                        isValid,
                        true // returnOnly parameter
                    );
                    
                    // Add the created result to proofContainerEl
                    if (proofResultElem) {
                        proofContainerEl.appendChild(proofResultElem);
                        
                        // Update Twitter share button
                        const shareButton = proofContainerEl.querySelector('#share-twitter-button');
                        if (shareButton) {
                            shareButton.addEventListener('click', () => {
                                window.SP1Bridge.shareOnTwitter(focusData, endTime - startTime, isValid);
                            });
                        }
                    }
                }
            })
            .catch(error => {
                console.error("Error generating simulation proof:", error);
                if (proofContainerEl) {
                    proofContainerEl.innerHTML = `<div class="error">Error generating simulation proof: ${error.message}</div>`;
                }
            });
    } else {
        console.error('generateSP1Proof function not found');
        if (proofContainerEl) {
            proofContainerEl.innerHTML = '<div class="error">SP1 Bridge could not be loaded</div>';
        }
    }
}

// Cancel focus session
function cancelFocusSession() {
    if (confirm('Are you sure you want to cancel the focus session? No proof will be generated!')) {
        // Stop timer
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
        
        isTimerRunning = false;
        
        // Go back to setup screen
        showScreen(setupScreen);
    }
}

// Reset for new session
function resetForNewSession() {
    // Reset variables
    startTime = 0;
    endTime = 0;
    plannedDuration = 0;
    taskText = '';
    focusData = null;
    
    // Reset UI
    if (taskInput) {
        taskInput.value = '';
    }
    if (durationInput) {
        durationInput.value = '25';
    }
    
    // Hide proof panel
    if (typeof window.hideProofPanel === 'function') {
        window.hideProofPanel();
    }
    
    // Show setup screen
    showScreen(setupScreen);
}

// Event listeners
if (startFocusBtn) startFocusBtn.addEventListener('click', () => showScreen(setupScreen));
if (howToBtn) howToBtn.addEventListener('click', () => showScreen(howToPlayScreen));
if (backBtn) backBtn.addEventListener('click', () => showScreen(mainMenuScreen));
if (startSessionBtn) startSessionBtn.addEventListener('click', startFocusSession);
if (backToMenuBtn) backToMenuBtn.addEventListener('click', () => showScreen(mainMenuScreen));
if (completeBtn) completeBtn.addEventListener('click', completeFocusSession);
if (cancelBtn) cancelBtn.addEventListener('click', cancelFocusSession);
if (realProofBtn) realProofBtn.addEventListener('click', generateRealProof);
if (simulationProofBtn) simulationProofBtn.addEventListener('click', generateSimulationProof);
if (proofSelectCancelBtn) proofSelectCancelBtn.addEventListener('click', resetForNewSession);
if (newSessionBtn) newSessionBtn.addEventListener('click', resetForNewSession);
if (homeBtn) homeBtn.addEventListener('click', () => showScreen(mainMenuScreen));
if (closePanelBtn && proofPanel) closePanelBtn.addEventListener('click', () => {
    proofPanel.classList.add('hidden');
});

// Initialize
window.addEventListener('load', () => {
    console.log('FocusProof App loaded!');
    
    // Check if running on Vercel
    const isVercel = window.location.hostname.includes('vercel.app');
    
    // Modify UI for Vercel environment
    if (isVercel) {
        console.log('Running on Vercel - Configuring for simulation-only mode');
        
        // Hide Real SP1 Proof button when on Vercel
        if (realProofBtn) {
            realProofBtn.style.display = 'none';
        }
        
        // Make simulation button more prominent
        if (simulationProofBtn) {
            simulationProofBtn.classList.remove('simulation-btn');
            simulationProofBtn.classList.add('primary-btn');
            simulationProofBtn.textContent = 'Generate Proof';
            simulationProofBtn.style.fontSize = '1.1em';
            simulationProofBtn.style.padding = '14px 24px';
        }
        
        // Add a notification to proof selection screen
        const notificationEl = document.createElement('div');
        notificationEl.className = 'vercel-notification';
        notificationEl.innerHTML = '<strong>Note:</strong> On this deployment, only simulation proofs are available. For real SP1 proofs, please run the application locally.';
        
        if (proofSelectionScreen) {
            const contentDiv = proofSelectionScreen.querySelector('.content');
            if (contentDiv) {
                contentDiv.insertBefore(notificationEl, contentDiv.querySelector('p'));
            }
        }
        
        // Store simulation mode in localStorage
        localStorage.setItem('forceSimulation', 'true');
    }
    
    // Ensure assets directory exists
    const checkAssetsDirectory = () => {
        // This is just a logging function since we can't check directories from browser JS
        console.log('Make sure you have created an "assets" directory and placed "focus-main-logo.png" there.');
    };
    
    checkAssetsDirectory();
    
    // Make sure main menu is shown
    if (mainMenuScreen) {
        showScreen(mainMenuScreen);
        console.log('Main menu screen shown on load');
    }
    
    // Ensure proof panel is hidden initially
    if (proofPanel) {
        proofPanel.classList.add('hidden');
    }
});