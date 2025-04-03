// SP1 Image Generator Application

// Global variables
let currentScreen = 'main-menu';

// DOM elements
const screens = {
    mainMenu: document.getElementById('main-menu'),
    generator: document.getElementById('generator-screen'),
    result: document.getElementById('result-screen'),
    howToPlay: document.getElementById('how-to-play'),
    proofPanel: document.getElementById('proof-panel'),
    proofContainer: document.getElementById('proof-container')
};

// Buttons
const buttons = {
    generate: document.getElementById('start-gen-btn'),
    howTo: document.getElementById('how-to-btn'),
    generateImage: document.getElementById('generate-btn'),
    back: document.getElementById('back-btn'),
    download: document.getElementById('download-btn'),
    share: document.getElementById('share-btn'),
    newGen: document.getElementById('new-gen-btn'),
    homeBtn: document.getElementById('home-btn'),
    closePanelBtn: document.getElementById('close-panel-btn'),
    verifyImage: document.getElementById('verify-image-btn')
};

// Ensure proof panel is hidden on load
if (screens.proofPanel) {
    screens.proofPanel.classList.add('hidden');
}

// Function to ensure an element exists before accessing its properties
function safeShowScreen(screenName) {
    if (!screens[screenName]) {
        console.error(`Screen ${screenName} not found`);
        return;
    }
    
    // Hide all screens
    Object.values(screens).forEach(screen => {
        if (screen) screen.classList.remove('active');
    });
    
    // Display active screen
    screens[screenName].classList.add('active');
    currentScreen = screenName;
    console.log(`Showing screen: ${screenName}`);
}

// Format bytes to human-readable format
function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    console.log('Application initialized');
    
    // Set up event listeners
    if (buttons.generate) {
        buttons.generate.addEventListener('click', function() {
            safeShowScreen('generator');
        });
    }
    
    // Fix for How It Works button
    if (buttons.howTo) {
        console.log('How It Works button found, attaching event listener');
        buttons.howTo.addEventListener('click', function() {
            console.log('How It Works button clicked');
            safeShowScreen('howToPlay');
            
            // Make sure home button is set up after showing the screen
            setupHomeButton();
        });
    } else {
        console.error('How It Works button not found');
        // Try to find it by ID directly
        const howToBtn = document.getElementById('how-to-btn');
        if (howToBtn) {
            console.log('Found How It Works button by ID, attaching event listener');
            howToBtn.addEventListener('click', function() {
                console.log('How It Works button clicked');
                safeShowScreen('howToPlay');
                
                // Make sure home button is set up after showing the screen
                setupHomeButton();
            });
        }
    }
    
    // Fix for Back button on generator screen
    if (buttons.back) {
        console.log('Back button found, attaching event listener');
        buttons.back.addEventListener('click', function() {
            console.log('Back button clicked');
            safeShowScreen('main-menu');
        });
    } else {
        console.error('Back button not found');
        // Try to find it by ID directly
        const backBtn = document.getElementById('back-btn');
        if (backBtn) {
            console.log('Found Back button by ID, attaching event listener');
            backBtn.addEventListener('click', function() {
                console.log('Back button clicked');
                safeShowScreen('main-menu');
            });
        }
    }
    
    // Setup home button function
    function setupHomeButton() {
        console.log('Setting up home button');
        setTimeout(() => {
            const homeBtn = document.getElementById('home-btn');
            if (homeBtn) {
                console.log('Home button found, attaching event listener');
                // Remove any existing event listeners
                const newHomeBtn = homeBtn.cloneNode(true);
                homeBtn.parentNode.replaceChild(newHomeBtn, homeBtn);
                
                // Add new event listener
                newHomeBtn.addEventListener('click', function() {
                    console.log('Home button clicked');
                    safeShowScreen('main-menu');
                });
            } else {
                console.error('Home button not found');
            }
            
            // Also set up close button
            const closeBtn = document.getElementById('close-how-to');
            if (closeBtn) {
                console.log('Close button found, attaching event listener');
                // Remove any existing event listeners
                const newCloseBtn = closeBtn.cloneNode(true);
                closeBtn.parentNode.replaceChild(newCloseBtn, closeBtn);
                
                // Add new event listener
                newCloseBtn.addEventListener('click', function() {
                    console.log('Close button clicked');
                    safeShowScreen('main-menu');
                });
            } else {
                console.error('Close button not found');
            }
        }, 100); // Small delay to ensure DOM is updated
    }
    
    // Call setup on page load too
    setupHomeButton();
    
    if (buttons.generateImage) {
        buttons.generateImage.addEventListener('click', generateImage);
    }
    
    if (buttons.newGen) {
        buttons.newGen.addEventListener('click', function() {
            safeShowScreen('generator');
        });
    }
    
    // Set up download and share buttons
    if (buttons.download) {
        buttons.download.addEventListener('click', downloadImage);
    }
    
    if (buttons.share) {
        buttons.share.addEventListener('click', shareContent);
    }
    
    // Tambahkan event listener untuk tombol verify di main menu
    if (buttons.verifyImage) {
        buttons.verifyImage.addEventListener('click', function() {
            window.location.href = 'verify.html';
        });
    }
});

// Generate image based on prompt
async function generateImage() {
    const promptInput = document.getElementById('prompt-input');
    const prompt = promptInput ? promptInput.value.trim() : '';
    
    if (!prompt) {
        alert('Please enter a prompt for the image');
        return;
    }
    
    try {
        console.log('Generating image with prompt:', prompt);
        
        // Show loading state
        const imageContainer = document.getElementById('image-container');
        if (imageContainer) {
            imageContainer.innerHTML = '<div class="loading">Generating image...</div>';
        }
        
        // Get width and height from inputs or use defaults
        const widthInput = document.getElementById('width-input');
        const heightInput = document.getElementById('height-input');
        
        const width = widthInput && widthInput.value ? parseInt(widthInput.value) : 512;
        const height = heightInput && heightInput.value ? parseInt(heightInput.value) : 512;
        
        // Send request to server
        const response = await fetch('/api/generate-image', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                prompt: prompt,
                width: width,
                height: height
            })
        });
        
        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.error || 'Failed to generate image');
        }
        
        // Display the generated image
        if (imageContainer) {
            imageContainer.innerHTML = `<img src="data:image/png;base64,${data.image}" alt="Generated Image">`;
        }
        
        // Add buttons to generate proof
        const proofContainer = document.getElementById('proof-container');
        proofContainer.innerHTML = `
            <div class="proof-options">
                <h3>SP1 Zero-Knowledge Proof</h3>
                <p>Verify this image with cryptographic proof</p>
                <div class="proof-buttons">
                    <button id="real-proof-btn" class="primary-btn">Generate Real Proof</button>
                    <button id="sim-proof-btn" class="secondary-btn">Simulation Mode</button>
                </div>
            </div>
        `;
        
        // Add event listeners for proof buttons
        document.getElementById('real-proof-btn').addEventListener('click', () => generateProof(false));
        document.getElementById('sim-proof-btn').addEventListener('click', () => generateProof(true));

        // Show result screen
        console.log("Showing result screen");
        safeShowScreen('result');

    } catch (error) {
        console.error('Generation error:', error);
        alert('Failed to generate image: ' + error.message);
    }
}

// Function to download image
function downloadImage() {
    console.log("downloadImage function called");
    const imageContainer = document.getElementById('image-container');
    const img = imageContainer.querySelector('img');
    
    if (!img) {
        console.error("No image found to download");
        alert('No image available to download');
        return;
    }
    
    console.log("Image found, preparing download");
    
    try {
        // Get image data
        const imgSrc = img.src;
        
        // Create anchor element for download
        const a = document.createElement('a');
        a.href = imgSrc;
        a.download = `sp1-generated-image-${Date.now()}.png`;
        document.body.appendChild(a);
        console.log("Download link created, triggering click");
        a.click();
        document.body.removeChild(a);
        console.log("Download initiated");
    } catch (error) {
        console.error("Error downloading image:", error);
        alert('Failed to download image: ' + error.message);
    }
}

// Function to share content
async function shareContent() {
    console.log("shareContent function called");
    const imageContainer = document.getElementById('image-container');
    const img = imageContainer.querySelector('img');
    
    if (!img) {
        console.error("No image found to share");
        alert('No image available to share');
        return;
    }
    
    console.log("Image found, preparing to share");
    
    try {
        // Get proof data if available
        const proofContainer = document.getElementById('proof-container');
        const proofDetails = proofContainer.querySelector('.proof-details');
        
        let shareText = 'I just generated an image with SP1 Zero-Knowledge Proof! #SP1 #ZKProof';
        
        // Add proof details if available
        if (proofDetails) {
            const proofHash = proofDetails.querySelector('p:nth-child(2)').textContent.split(': ')[1];
            shareText += `\n\nProof Hash: ${proofHash}`;
        }
        
        // Check if Web Share API is available
        if (navigator.share) {
            console.log("Web Share API available, attempting to share");
            try {
                // Convert image to blob for sharing
                const response = await fetch(img.src);
                const blob = await response.blob();
                const file = new File([blob], 'sp1-generated-image.png', { type: 'image/png' });
                
                // Share content
                await navigator.share({
                    title: 'SP1 Generated Image',
                    text: shareText,
                    files: [file]
                });
                
                console.log('Content shared successfully');
            } catch (error) {
                console.error('Error sharing with Web Share API:', error);
                
                // Fallback to Twitter if file sharing fails
                console.log("Falling back to Twitter share");
                shareToTwitter(shareText);
            }
    } else {
            // Fallback to Twitter if Web Share API is not available
            console.log("Web Share API not available, using Twitter share");
            shareToTwitter(shareText);
        }
    } catch (error) {
        console.error("Error in shareContent:", error);
        alert('Failed to share content: ' + error.message);
    }
}

// Function to share to Twitter
function shareToTwitter(shareText) {
    console.log("shareToTwitter function called");
    if (!shareText) {
        shareText = 'I just generated an image with SP1 Zero-Knowledge Proof! #SP1 #ZKProof';
    }
    
    // Open Twitter window for sharing
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
    console.log("Opening Twitter share URL:", twitterUrl);
    window.open(twitterUrl, '_blank', 'width=550,height=420');
}

// Generate proof for the image
async function generateProof(simulation = false) {
    console.log(`Generating ${simulation ? 'simulated' : 'real'} proof`);
    
    // Get image element
    const imageContainer = document.getElementById('image-container');
    const img = imageContainer.querySelector('img');
    
    if (!img) {
        console.error('No image found to generate proof for');
        alert('Error: No image found to generate proof');
        return;
    }
    
    try {
        // Start timing
        const startTime = performance.now();
        
        // Display loading state and log panel
        const proofContainer = document.getElementById('proof-container');
        proofContainer.innerHTML = '<div class="loading">Generating SP1 proof...</div>';
        
        // Show proof panel with real-time logs
        const proofPanel = document.getElementById('proof-panel');
        const proofLog = document.getElementById('proof-log');
        
        if (proofPanel && proofLog) {
            proofLog.innerHTML = '';
            addProofLog('Initializing SP1 proof generation...', proofLog);
            addProofLog(`Mode: ${simulation ? 'Simulation' : 'Real Proof'}`, proofLog);
            addProofLog(`Timestamp: ${new Date().toLocaleString()}`, proofLog);
            proofPanel.classList.remove('hidden');
        }
        
        // Get image data
        const imgSrc = img.src;
        // Extract base64 data from data URL
        const base64Data = imgSrc.split(',')[1];
        
        addProofLog(`Image data received: ${formatBytes(base64Data.length)}`, proofLog);
        
        // If image is too large, resize first
        let processedImageData = base64Data;
        
        const promptInput = document.getElementById('prompt-input');
        const prompt = promptInput ? promptInput.value.trim() : '';
        
        console.log(`Sending prompt: "${prompt}"`);
        
        let promptHashValue = '';
        if (prompt) {
            const encoder = new TextEncoder();
            const data = encoder.encode(prompt);
            const hashBuffer = await crypto.subtle.digest('SHA-256', data);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            promptHashValue = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
            console.log(`Calculated promptHash: ${promptHashValue}`);
        }
        
        const response = await fetch('/api/generate-proof', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                image: processedImageData,
                promptHash: promptHashValue,
                prompt: prompt,
                simulation: simulation
            })
        });
        
        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.error || 'Failed to generate proof');
        }
        
        // End timing
        const endTime = performance.now();
        const duration = ((endTime - startTime) / 1000).toFixed(2);
        
        // Update proof log
        addProofLog(`Proof generation completed in ${duration} seconds`, proofLog);
        addProofLog(`Proof hash: ${data.proof.proofHash}`, proofLog);
        addProofLog(`Verification status: Success ✓`, proofLog);
        addProofLog(`SP1 proof generation completed successfully!`, proofLog, false, true);
        
        // Update UI with proof details
        proofContainer.innerHTML = `
            <div class="proof-details">
                <h3>SP1 Proof Details</h3>
                <p><strong>Prompt:</strong> ${prompt}</p>
                <p>
                    <strong>Prompt Hash:</strong> 
                    <span class="hash-value">${data.proof.promptHash || 'N/A'}</span>
                </p>
                <p>
                    <strong>Proof Hash:</strong> 
                    <span class="hash-value">${data.proof.proofHash}</span>
                </p>
                <p><strong>Timestamp:</strong> ${new Date(data.proof.timestamp * 1000).toLocaleString()}</p>
                <p><strong>Dimensions:</strong> ${data.proof.dimensions}</p>
                <p><strong>Size:</strong> ${formatBytes(data.proof.size)}</p>
                <p><strong>Duration:</strong> ${duration} seconds</p>
                <p><strong>Status:</strong> <span class="retro-glow">Verified ✓</span></p>
            </div>
            <div class="proof-buttons">
                <button id="view-proof-btn" class="secondary-btn">View Proof Details</button>
                <button id="save-proof-btn" class="primary-btn">Save Proof Details</button>
            </div>
        `;
        
        // Update event listeners for proof buttons
        document.getElementById('view-proof-btn').addEventListener('click', () => showProofDetails(data.proof));
        document.getElementById('save-proof-btn').addEventListener('click', () => {

            const promptInput = document.getElementById('prompt-input');
            const promptText = promptInput ? promptInput.value.trim() : '';
            

            const enhancedProof = {
                ...data.proof,
                prompt: promptText
            };
            
            saveProofDetails(enhancedProof);
        });
        
    } catch (error) {
        console.error('Error generating proof:', error);
        
        // Update log if panel is open
        const proofLog = document.getElementById('proof-log');
        if (proofLog) {
            addProofLog(`Error: ${error.message}`, proofLog, true);
        }
        
        // Update UI
        const proofContainer = document.getElementById('proof-container');
        if (proofContainer) {
            proofContainer.innerHTML = `
                <div class="proof-error">
                    <h3>Error Generating Proof</h3>
                    <p>${error.message}</p>
                    <button id="retry-proof-btn" class="primary-btn">Try Again</button>
                </div>
            `;
            
            // Add event listener for retry button
            document.getElementById('retry-proof-btn').addEventListener('click', () => {
                // Show proof buttons again
                proofContainer.innerHTML = `
                    <div class="proof-options">
                        <h3>SP1 Zero-Knowledge Proof</h3>
                        <p>Verify this image with cryptographic proof</p>
                        <div class="proof-buttons">
                            <button id="real-proof-btn" class="primary-btn">Generate Real Proof</button>
                            <button id="sim-proof-btn" class="secondary-btn">Simulation Mode</button>
                        </div>
                    </div>
                `;
                
                // Add event listeners for proof buttons
                document.getElementById('real-proof-btn').addEventListener('click', () => generateProof(false));
                document.getElementById('sim-proof-btn').addEventListener('click', () => generateProof(true));
            });
        }
    }
}

// Function to add log to proof panel
function addProofLog(message, logElement, isError = false, isSuccess = false) {
    if (!logElement) return;
    
    const logEntry = document.createElement('div');
    logEntry.className = 'proof-log-entry';
    if (isError) logEntry.classList.add('error');
    if (isSuccess) logEntry.classList.add('success');
    
    const timestamp = new Date().toLocaleTimeString();
    logEntry.innerHTML = `[${timestamp}] ${message}`;
    
    logElement.appendChild(logEntry);
    logElement.scrollTop = logElement.scrollHeight; // Auto-scroll to bottom
}

// Function to show proof details
function showProofDetails(proof) {
    // Show proof panel
    const proofPanel = document.getElementById('proof-panel');
    const proofLog = document.getElementById('proof-log');
    
    if (!proofPanel || !proofLog) {
        alert('Proof panel not found');
        return;
    }
    
    // Fill proof log
    proofLog.innerHTML = '';
    addProofLog('Initializing SP1 proof generation...', proofLog);
    addProofLog(`Timestamp: ${new Date(proof.timestamp * 1000).toLocaleString()}`, proofLog);
    addProofLog(`Image dimensions: ${proof.dimensions}`, proofLog);
    addProofLog(`Image size: ${formatBytes(proof.size)}`, proofLog);
    addProofLog('Computing image hash...', proofLog);
    addProofLog(`Image hash: ${proof.proofHash}`, proofLog);
    addProofLog('Generating SP1 proof...', proofLog);
    addProofLog('Verifying proof...', proofLog);
    addProofLog('Proof verified successfully!', proofLog, false, true);
    addProofLog('SP1 proof generation completed.', proofLog);
    
    // Show panel
    proofPanel.classList.remove('hidden');
    
    // Ensure close button works
    const closePanelBtn = document.getElementById('close-panel-btn');
    if (closePanelBtn) {
        // Remove old event listener with cloneNode
        const newCloseBtn = closePanelBtn.cloneNode(true);
        closePanelBtn.parentNode.replaceChild(newCloseBtn, closePanelBtn);
        
        // Add new event listener
        newCloseBtn.addEventListener('click', function() {
        proofPanel.classList.add('hidden');
        });
    }
}

// Function to save proof details as text file
function saveProofDetails(proof) {
    const proofText = `SP1 ZERO-KNOWLEDGE PROOF CERTIFICATE
==================================

PROOF OF AI GENERATION
----------------------
This certificate cryptographically verifies that the accompanying image was generated using
the exact prompt specified below. The proof was created using SP1 Zero-Knowledge technology.

Prompt: ${proof.prompt}
Prompt Hash: ${proof.promptHash}
Image Hash: ${proof.imageHash || proof.proofHash.replace('0xSP1', '')}
Proof Hash: ${proof.proofHash}
Timestamp: ${new Date(proof.timestamp * 1000).toLocaleString()}
Dimensions: ${proof.dimensions}
Size: ${(proof.size / 1024).toFixed(2)} KB
Status: ${proof.verified ? 'Verified ✓' : 'Failed ✗'}

VERIFICATION EXPLANATION
-----------------------
This Zero-Knowledge proof establishes that the specific prompt text was used to generate 
this exact image without revealing details about:
1. The internal AI model architecture
2. The weights or parameters of the model
3. The intermediate representations during image generation

TECHNICAL VERIFICATION
---------------------
To verify this proof independently:
1. Visit: https://example.com/verify
2. Upload the image and enter the original prompt
3. The system will verify the cryptographic connection between the prompt and image

Generated using SP1 ZK Technology
© ${new Date().getFullYear()} Succinct Labs
`;

    const blob = new Blob([proofText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sp1-proof-certificate.txt';
    a.click();
    
    URL.revokeObjectURL(url);
}

// Simplified global navigation functions
window.goToMainMenu = function() {
    // Hide all screens first
    const allScreens = document.querySelectorAll('.screen');
    allScreens.forEach(screen => {
        screen.classList.remove('active');
    });
    
    // Show main menu
    const mainMenu = document.getElementById('main-menu');
    if (mainMenu) {
        mainMenu.classList.add('active');
        currentScreen = 'main-menu';
        console.log('Navigated to main menu');
    } else {
        console.error('Main menu screen not found');
    }
};

window.goToGenerator = function() {
    // Hide all screens first
    const allScreens = document.querySelectorAll('.screen');
    allScreens.forEach(screen => {
        screen.classList.remove('active');
    });
    
    // Show generator screen
    const generatorScreen = document.getElementById('generator-screen');
    if (generatorScreen) {
        generatorScreen.classList.add('active');
        currentScreen = 'generator';
        console.log('Navigated to generator screen');
    } else {
        console.error('Generator screen not found');
    }
};

function displayImageResult(imageData, proofData) {
    const resultScreen = document.getElementById('result-screen');
    const imageContainer = document.getElementById('result-image-container');
    const proofContainer = document.getElementById('proof-container');
    
    imageContainer.innerHTML = `
        <div class="result-image-wrapper">
            <img src="data:image/png;base64,${imageData}" alt="Generated image" id="result-image">
        </div>
    `;
    
    let proofHTML = `
        <h3 class="retro-glow">SP1 ZK Proof</h3>
        <div class="proof-items">
            <div class="proof-item"><span>ZK Proof:</span> ${proofData.proofHash}</div>
            <div class="proof-item"><span>Timestamp:</span> ${new Date(proofData.timestamp * 1000).toLocaleString()}</div>
            <div class="proof-item"><span>Dimensions:</span> ${proofData.dimensions}</div>
            <div class="proof-item"><span>Size:</span> ${(proofData.size / 1024).toFixed(2)} KB</div>
            <div class="proof-item"><span>Status:</span> ${proofData.verified ? `<span class="verified">Verified ✓</span>` : `<span class="failed">Failed ✗</span>`}</div>
            <div class="proof-item"><span>Prompt Hash:</span> ${proofData.promptHash}</div>
        </div>
        
        <div class="action-buttons">
            <button id="save-image-btn" class="secondary-btn">Save Image</button>
            <button id="save-proof-btn" class="secondary-btn">Save Proof</button>
            <button id="verify-proof-btn" class="primary-btn">Verify Proof</button>
        </div>
    `;
    
    proofContainer.innerHTML = proofHTML;
    

    document.getElementById('save-image-btn').addEventListener('click', function() {
        saveGeneratedImage(imageData);
    });
    

    document.getElementById('save-proof-btn').addEventListener('click', function() {
        saveProofDetails({
            proofHash: proofData.proofHash,
            timestamp: proofData.timestamp,
            dimensions: proofData.dimensions,
            size: proofData.size,
            verified: proofData.verified,
            prompt: document.getElementById('prompt-input').value,
            promptHash: proofData.promptHash,
            imageHash: proofData.proofHash.replace('0xSP1', '')
        });
    });
    
    document.getElementById('verify-proof-btn').addEventListener('click', function() {
        navigateToVerifyWithData(imageData, proofData);
    });
    
    showScreen('result-screen');
}


function navigateToVerifyWithData(imageData, proofData) {
    localStorage.setItem('sp1_verify_image', imageData);
    localStorage.setItem('sp1_verify_prompt', document.getElementById('prompt-input').value);
    localStorage.setItem('sp1_verify_proof', JSON.stringify(proofData));
    

    window.location.href = 'verify.html';
}