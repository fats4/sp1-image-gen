document.addEventListener('DOMContentLoaded', function() {
    const dropArea = document.getElementById('drop-area');
    const fileInput = document.getElementById('file-input');
    const verifyBtn = document.getElementById('verify-btn');
    const verificationResult = document.getElementById('verification-result');
    const resultContent = verificationResult.querySelector('.result-content');
    
    // Handle drag and drop
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, preventDefaults, false);
    });
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    ['dragenter', 'dragover'].forEach(eventName => {
        dropArea.addEventListener(eventName, highlight, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, unhighlight, false);
    });
    
    function highlight() {
        dropArea.classList.add('highlight');
    }
    
    function unhighlight() {
        dropArea.classList.remove('highlight');
    }
    
    dropArea.addEventListener('drop', handleDrop, false);
    
    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        handleFiles(files);
    }
    
    fileInput.addEventListener('change', function() {
        handleFiles(this.files);
    });
    
    function handleFiles(files) {
        if (files.length) {
            const file = files[0];
            if (file.type.match('image.*')) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    dropArea.innerHTML = `<img src="${e.target.result}" alt="Uploaded image" class="preview-image">`;
                };
                reader.readAsDataURL(file);
            }
        }
    }
    
    // Handle verification
    verifyBtn.addEventListener('click', async function() {
        const promptInput = document.getElementById('verify-prompt');
        const proofInput = document.getElementById('proof-input');
        const imageElement = dropArea.querySelector('img');
        
        if (!imageElement) {
            alert('Please upload an image first');
            return;
        }
        
        const prompt = promptInput.value.trim();
        if (!prompt) {
            alert('Please enter the original prompt');
            return;
        }
        
        // Show loading state
        resultContent.innerHTML = '<div class="loading">Verifying image...</div>';
        verificationResult.classList.remove('hidden');
        
        // Tambahkan opsi untuk memeriksa terhadap hash yang diketahui
        const proofText = proofInput.value.trim();
        
        // Jika ada data proof, coba ekstrak prompt hash
        let knownPromptHash = '';
        if (proofText) {
            const promptHashMatch = proofText.match(/Prompt Hash:\s*([a-f0-9]{64})/i);
            if (promptHashMatch && promptHashMatch[1]) {
                knownPromptHash = promptHashMatch[1];
            }
        }
        
        try {
            // Calculate prompt hash
            const calculatedPromptHash = await calculateHash(prompt);
            
            // Tambahkan logika untuk memverifikasi terhadap known hash jika tersedia
            if (knownPromptHash && calculatedPromptHash !== knownPromptHash) {
                console.warn(`Hash mismatch: Calculated ${calculatedPromptHash}, Expected ${knownPromptHash}`);
                // Tampilkan informasi tambahan
            }
            
            // Get image data
            const imageData = imageElement.src;
            
            // Calculate image hash
            const imageHash = await calculateImageHash(imageData);
            
            // Tambahkan verifikasi kombinasi hash
            const isValidCombination = await verifyImageAndPromptHash(calculatedPromptHash, imageHash);
            
            // In real implementation, we would send this to the server for verification
            // For now, simulate verification with a delay
            setTimeout(() => {
                displayVerificationResult(isValidCombination, {
                    promptHash: calculatedPromptHash,
                    imageHash,
                    prompt,
                    verificationTime: new Date().toLocaleString(),
                    knownPromptHash: knownPromptHash,
                    // Updated error message in English
                    error: isValidCombination ? null : 'Invalid prompt hash and image hash combination'
                });
            }, 2000);
            
        } catch (error) {
            console.error('Verification failed:', error);
            displayVerificationResult(false, { error: error.message });
        }
    });
    
    async function calculateHash(text) {
        // Pastikan input text sama persis seperti di generator
        // Trim whitespace, normalize line endings dan pastikan encoding UTF-8 konsisten
        const trimmedText = text.trim();
        
        // Metode hash yang sama persis dengan di app.js
        const encoder = new TextEncoder(); // UTF-8 encoding
        const data = encoder.encode(trimmedText);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
    
    async function calculateImageHash(dataUrl) {
        // Extract base64 data
        const base64Data = dataUrl.split(',')[1];
        const binaryData = atob(base64Data);
        
        // Convert to array buffer
        const data = new Uint8Array(binaryData.length);
        for (let i = 0; i < binaryData.length; i++) {
            data[i] = binaryData.charCodeAt(i);
        }
        
        // Calculate hash
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
    
    // Buat fungsi untuk verifikasi kombinasi hash
    async function verifyImageAndPromptHash(promptHash, imageHash) {
        // Dalam implementasi nyata, Anda akan melakukan API call ke server
        // untuk memverifikasi kombinasi hash
        
        try {
            // Simulasi check ke server
            const response = await fetch('/api/verify-hash-combination', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ promptHash, imageHash })
            });
            
            // Jika server tidak mendukung endpoint ini, gunakan pendekatan fallback
            if (response.status === 404) {
                // Gunakan verificasi client-side sebagai fallback
                console.log("Server verification endpoint not available, using client-side verification");
                return checkLocalValidCombinations(promptHash, imageHash);
            }
            
            const data = await response.json();
            return data.valid === true;
        } catch (error) {
            console.warn("Server verification failed, falling back to client-side verification", error);
            // Pendekatan fallback jika server error
            return checkLocalValidCombinations(promptHash, imageHash);
        }
    }
    
    // Pendekatan fallback menggunakan verifikasi client-side
    function checkLocalValidCombinations(promptHash, imageHash) {
        // Ini hanya contoh, pada implementasi nyata Anda harus
        // mendapatkan daftar kombinasi valid dari server
        const VALID_COMBINATIONS = [
            // Format: [promptHash, imageHash]
            // Ini hanya contoh dummy
        ];
        
        // Periksa jika kombinasi ada dalam daftar valid
        return VALID_COMBINATIONS.some(([validPromptHash, validImageHash]) => 
            validPromptHash === promptHash && validImageHash === imageHash
        );
    }
    
    // Tambahkan fungsi untuk menampilkan terminal details dalam panel
    function showTerminalDetails(verificationData) {
        const terminalPanel = document.getElementById('terminal-panel');
        const terminalContent = document.getElementById('terminal-content');
        
        // Buat tampilan terminal
        const terminalHTML = `
            <div class="terminal-header">
                <div class="terminal-title">SP1 VERIFICATION SYSTEM</div>
                <div class="terminal-buttons">
                    <div class="terminal-button minimize"></div>
                    <div class="terminal-button maximize"></div>
                    <div class="terminal-button close"></div>
                </div>
            </div>
            <div class="terminal-content">
                <div class="terminal-line">
                    <span class="terminal-prompt">root@sp1:~$</span>
                    <span class="terminal-command">./verify_image.sh --prompt="${escapeHTML(verificationData.prompt)}" --analyze</span>
                </div>
                
                <div class="terminal-line">
                    <span class="terminal-output info">Initializing verification sequence...</span>
                </div>
                
                <div class="terminal-line">
                    <span class="terminal-output">Calculating SHA-256 hash of prompt...</span>
                </div>
                
                <div class="terminal-line">
                    <span class="terminal-output">Prompt hash: <span class="hash-value">${verificationData.promptHash}</span></span>
                </div>
                
                <div class="terminal-line">
                    <span class="terminal-output">Image hash: <span class="hash-value">${verificationData.imageHash}</span></span>
                </div>
                
                <div class="terminal-line">
                    <span class="terminal-output">Querying verification database...</span>
                </div>
                
                ${verificationData.isVerified ? getSuccessTerminal(verificationData) : getFailureTerminal(verificationData)}
                
                <div class="terminal-line" style="margin-top: 15px;">
                    <span class="terminal-prompt">root@sp1:~$</span>
                    <span class="terminal-command">_</span>
                    <span class="terminal-cursor"></span>
                </div>
            </div>
        `;
        
        terminalContent.innerHTML = terminalHTML;
        terminalPanel.classList.remove('hidden');
        
        // Tambahkan efek typing
        setTimeout(() => {
            const lines = document.querySelectorAll('.terminal-line');
            lines.forEach((line, index) => {
                setTimeout(() => {
                    line.style.opacity = '1';
                }, index * 150);
            });
        }, 100);
        
        // Initialize matrix effect jika diinginkan
        if (verificationData.isVerified) {
            setTimeout(() => {
                initMatrixEffect();
            }, 500);
        }
    }
    
    // Update the displayVerificationResult function to use a cleaner display
    function displayVerificationResult(isVerified, data) {
        const resultContent = document.querySelector('.result-content');
        
        // Simpan untuk akses terminal details
        const verificationData = {
            isVerified,
            prompt: data.prompt,
            promptHash: data.promptHash,
            imageHash: data.imageHash,
            verificationTime: data.verificationTime,
            error: data.error
        };
        
        // Tampilkan hasil dalam format yang mirip dengan generator
        let resultHTML = '';
        
        if (isVerified) {
            resultHTML = `
                <div class="verification-success">
                    <div class="verification-icon">✓</div>
                    <h3 class="retro-glow">Verification Successful</h3>
                    <p>This image was cryptographically verified to be generated using the provided prompt.</p>
                    
                    <div class="proof-items">
                        <div class="proof-item"><span>Original Prompt:</span> ${data.prompt}</div>
                        <div class="proof-item"><span>Prompt Hash:</span> <span class="hash-value">${data.promptHash}</span></div>
                        <div class="proof-item"><span>Image Hash:</span> <span class="hash-value">${data.imageHash}</span></div>
                        <div class="proof-item"><span>Verification Time:</span> ${data.verificationTime}</div>
                    </div>
                    
                    <button id="view-terminal-btn" class="secondary-btn">View Technical Details</button>
                </div>
            `;
        } else {
            resultHTML = `
                <div class="verification-failed">
                    <div class="verification-icon">✗</div>
                    <h3 class="retro-glow">Verification Failed</h3>
                    <p>This image could not be verified with the provided prompt.</p>
                    <p class="error-message">Reason: ${data.error || 'Invalid prompt hash and image hash combination'}</p>
                    
                    <div class="proof-items">
                        <div class="proof-item"><span>Prompt Hash:</span> <span class="hash-value">${data.promptHash}</span></div>
                        <div class="proof-item"><span>Image Hash:</span> <span class="hash-value">${data.imageHash}</span></div>
                    </div>
                    
                    <button id="view-terminal-btn" class="secondary-btn">View Technical Details</button>
                </div>
            `;
        }
        
        resultContent.innerHTML = resultHTML;
        document.getElementById('verification-result').classList.remove('hidden');
        
        // Tambahkan event listener untuk tombol terminal details
        document.getElementById('view-terminal-btn').addEventListener('click', function() {
            showTerminalDetails(verificationData);
        });
    }
    
    // Helper function to get success terminal content
    function getSuccessTerminal(data) {
        return `
            <div class="terminal-line">
                <span class="terminal-output success">Verification complete. Hash combination found in database.</span>
            </div>
            
            <div class="terminal-line">
                <span class="terminal-output success">VERIFICATION STATUS: AUTHENTIC ✓</span>
            </div>
            
            <div class="ascii-art">
      ______   _______    __   __   _______   _______    ___   _______   ___   _______   ______  
     |   _  \\ |   ____|  |  | |  | |   ____| |   ____|  |   | |   ____| |   | |   ____| |   _  \\ 
     |  |_)  ||  |__     |  | |  | |  |__    |  |__     |   | |  |__    |   | |  |__    |  |_)  |
     |   ___/ |   __|    |  | |  | |   __|   |   __|    |   | |   __|   |   | |   __|   |      / 
     |  |     |  |____   |  \`-'  | |  |      |  |       |   | |  |      |   | |  |____  |  |\\  \\ 
     |__|     |_______|   \\____/  |__|      |__|       |___| |__|      |___| |_______| |__| \\__\\
            </div>
            
            <div class="terminal-line">
                <span class="terminal-output">Original Prompt: "${escapeHTML(data.prompt)}"</span>
            </div>
            
            <div class="terminal-line">
                <span class="terminal-output">Verification Time: ${data.verificationTime}</span>
            </div>
        `;
    }
    
    // Helper function to get failure terminal content
    function getFailureTerminal(data) {
        return `
            <div class="terminal-line">
                <span class="terminal-output error">VERIFICATION STATUS: FAILED ✗</span>
            </div>
            
            <div class="terminal-line">
                <span class="terminal-output error">Reason: ${data.error || 'Invalid prompt hash and image hash combination'}</span>
            </div>
            
            <div class="terminal-line">
                <span class="terminal-output warning">The system checked the following hash combination:</span>
            </div>
            
            <div class="terminal-line">
                <span class="terminal-output warning">Prompt Hash: <span class="hash-value">${data.promptHash}</span></span>
            </div>
            
            <div class="terminal-line">
                <span class="terminal-output warning">Image Hash: <span class="hash-value">${data.imageHash}</span></span>
            </div>
        `;
    }
    
    // Helper for matrix background effect
    function getMatrixBG() {
        return `<canvas class="matrix-bg" id="matrix-canvas"></canvas>`;
    }
    
    // Escape HTML to prevent XSS
    function escapeHTML(str) {
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
    
    // Initialize matrix effect after verification
    function initMatrixEffect() {
        const canvas = document.getElementById('matrix-canvas');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        canvas.width = canvas.parentElement.offsetWidth;
        canvas.height = canvas.parentElement.offsetHeight;
        
        const chars = '01'.split('');
        const columns = canvas.width / 10;
        const drops = [];
        
        for (let i = 0; i < columns; i++) {
            drops[i] = 1;
        }
        
        function draw() {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            ctx.fillStyle = '#ff69b4';
            ctx.font = '10px monospace';
            
            for (let i = 0; i < drops.length; i++) {
                const text = chars[Math.floor(Math.random() * chars.length)];
                ctx.fillText(text, i * 10, drops[i] * 10);
                
                if (drops[i] * 10 > canvas.height && Math.random() > 0.975) {
                    drops[i] = 0;
                }
                
                drops[i]++;
            }
        }
        
        setInterval(draw, 33);
    }
    
    // Observe DOM changes to initialize matrix effect when canvas is added
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.addedNodes && mutation.addedNodes.length > 0) {
                const canvas = document.getElementById('matrix-canvas');
                if (canvas) {
                    initMatrixEffect();
                    observer.disconnect();
                }
            }
        });
    });
    
    observer.observe(document.body, { childList: true, subtree: true });
    
    // Periksa apakah ada data verifikasi dari halaman utama
    checkForPendingVerification();
});

// Fungsi untuk memuat data verifikasi yang tersimpan
function checkForPendingVerification() {
    const savedImage = localStorage.getItem('sp1_verify_image');
    const savedPrompt = localStorage.getItem('sp1_verify_prompt');
    const savedProof = localStorage.getItem('sp1_verify_proof');
    
    if (savedImage && savedPrompt) {
        // Tampilkan gambar
        dropArea.innerHTML = `<img src="data:image/png;base64,${savedImage}" alt="Image to verify" class="preview-image">`;
        
        // Isi prompt
        document.getElementById('verify-prompt').value = savedPrompt;
        
        // Isi proof data jika ada
        if (savedProof) {
            try {
                const proofData = JSON.parse(savedProof);
                const proofText = `SP1 ZERO-KNOWLEDGE PROOF CERTIFICATE
==================================

PROOF OF AI GENERATION
----------------------
This certificate cryptographically verifies that the accompanying image was generated using
the exact prompt specified below. The proof was created using SP1 Zero-Knowledge technology.

Prompt: ${savedPrompt}
Prompt Hash: ${proofData.promptHash}
Image Hash: ${proofData.imageHash || proofData.proofHash.replace('0xSP1', '')}
Proof Hash: ${proofData.proofHash}
Timestamp: ${new Date(proofData.timestamp * 1000).toLocaleString()}
Dimensions: ${proofData.dimensions}
Size: ${(proofData.size / 1024).toFixed(2)} KB
Status: ${proofData.verified ? 'Verified ✓' : 'Failed ✗'}
`;
                document.getElementById('proof-input').value = proofText;
            } catch (e) {
                console.error('Error parsing proof data:', e);
            }
        }
        
        // Hapus data dari localStorage
        localStorage.removeItem('sp1_verify_image');
        localStorage.removeItem('sp1_verify_prompt');
        localStorage.removeItem('sp1_verify_proof');
        
        // Otomatis verifikasi
        verifyBtn.click();
    }
} 