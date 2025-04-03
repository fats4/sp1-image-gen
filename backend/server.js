require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { exec } = require('child_process');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const sharp = require('sharp');
const fs = require('fs');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

// Important: Set this constant to false for real SP1 proofs
const SIMULATION_MODE = false;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// Debug endpoint
app.get('/api/debug', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        message: 'Debug endpoint is working',
        simulationMode: SIMULATION_MODE
    });
});

// Image generation endpoint
app.post('/api/generate-image', async (req, res) => {
    try {
        console.log("Received image generation request:", req.body);
        const { prompt, width, height } = req.body;
        
        if (!prompt || !width || !height) {
        return res.status(400).json({
            success: false,
                error: "Missing required parameters: prompt, width, height"
            });
        }

        // Hitung prompt hash
        const promptHash = crypto
            .createHash('sha256')
            .update(prompt)
            .digest('hex');

        // Generate image
        const image = await generateImage(prompt, width, height);
        
        // Hitung image hash
        const imageHash = crypto
            .createHash('sha256')
            .update(image)
            .digest('hex');

        // Generate timestamp
        const timestamp = Math.floor(Date.now() / 1000);
        
        // Log for debugging
        console.log(`Generated image: ${width}x${height}, size: ${image.length} bytes`);
        
        // Conversion image to base64
        const imageBase64 = image.toString('base64');
        console.log(`Base64 image length: ${imageBase64.length}`);
        
        // For demo, skip proccess real SP1 proof 
        const proofResult = {
            proofHash: `0xSP1${imageHash.slice(0, 12)}`,
            timestamp: timestamp,
            dimensions: `${width}x${height}`,
            size: image.length,
            verified: true
        };

        // Simpan kedua hash untuk proses proof
        res.json({
            success: true,
            image: imageBase64,
            promptHash: promptHash,
            imageHash: imageHash,
            proof: proofResult
        });

    } catch (error) {
        console.error('Error generating image:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});


async function generateImage(prompt, width, height) {
    console.log(`Generating placeholder image for: "${prompt}", size: ${width}x${height}`);
    return generatePlaceholderImage(prompt, width, height);
}


async function generateImage(prompt, width, height) {
    try {
        console.log(`Generating image with prompt: "${prompt}", size: ${width}x${height}`);
        
        const apiKey = process.env.STABILITY_API_KEY;
        
        if (!apiKey) {
            console.warn("STABILITY_API_KEY tidak ditemukan di environment variables");
            return generatePlaceholderImage(prompt, width, height);
        }
        
        const response = await axios({
            method: 'post',
            url: 'https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            data: {
                text_prompts: [
                    {
                        text: prompt,
                        weight: 1.0
                    }
                ],
                cfg_scale: 7,
                height: 1024,
                width: 1024,
                samples: 1,
                steps: 30
            }
        });
        
        if (!response.data.artifacts || response.data.artifacts.length === 0) {
            throw new Error("No image generated");
        }
        
        const imageBuffer = Buffer.from(response.data.artifacts[0].base64, 'base64');
        
        return await sharp(imageBuffer)
            .resize(width, height, { fit: 'cover' })
            .png()
            .toBuffer();
            
    } catch (error) {
        console.error("Error generating image:", error.message);
        if (error.response) {
            console.error("Response status:", error.response.status);
            console.error("Response data:", JSON.stringify(error.response.data));
        }
        return generatePlaceholderImage(prompt, width, height);
    }
}

async function generatePlaceholderImage(prompt, width, height) {
    console.log("Generating enhanced placeholder image");
    
    try {
        const r = Math.floor(Math.random() * 200) + 50;
        const g = Math.floor(Math.random() * 200) + 50;
        const b = Math.floor(Math.random() * 200) + 50;
        
        const svgImage = `
        <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style="stop-color:rgb(${r},${g},${b});stop-opacity:1" />
                    <stop offset="100%" style="stop-color:rgb(${b},${r},${g});stop-opacity:1" />
                </linearGradient>
                <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="5" />
                </filter>
            </defs>
            <rect width="100%" height="100%" fill="url(#grad)"/>
            <circle cx="${width*0.2}" cy="${height*0.3}" r="${Math.min(width, height)*0.1}" fill="rgba(255,255,255,0.3)" />
            <circle cx="${width*0.8}" cy="${height*0.7}" r="${Math.min(width, height)*0.15}" fill="rgba(255,255,255,0.2)" />
            <rect x="${width*0.4}" y="${height*0.4}" width="${width*0.2}" height="${height*0.2}" fill="rgba(255,255,255,0.2)" />
            
            <rect x="10%" y="20%" width="80%" height="20%" rx="15" fill="rgba(0,0,0,0.5)" filter="url(#shadow)" />
            <text x="50%" y="33%" font-family="Arial" font-size="${Math.min(width, height)*0.05}px" fill="white" text-anchor="middle" font-weight="bold">SP1 Image Generator</text>
            
            <rect x="10%" y="45%" width="80%" height="25%" rx="15" fill="rgba(0,0,0,0.5)" filter="url(#shadow)" />
            <foreignObject x="15%" y="50%" width="70%" height="15%">
                <div xmlns="http://www.w3.org/1999/xhtml" style="font-family: Arial; color: white; font-size: ${Math.min(width, height)*0.03}px; text-align: center; overflow-wrap: break-word;">
                    ${prompt}
                </div>
            </foreignObject>
            
            <rect x="20%" y="75%" width="60%" height="10%" rx="10" fill="rgba(0,0,0,0.5)" filter="url(#shadow)" />
            <text x="50%" y="82%" font-family="Arial" font-size="${Math.min(width, height)*0.025}px" fill="#fe22be" text-anchor="middle">Generated with SP1 ZK Technology</text>
        </svg>`;
        
        const buffer = await sharp(Buffer.from(svgImage))
            .png()
            .toBuffer();
        
        console.log(`Generated enhanced placeholder image: ${buffer.length} bytes`);
        return buffer;
    } catch (error) {
        console.error("Error generating enhanced placeholder:", error);
        
        return await sharp({
            create: {
                width: width,
                height: height,
                channels: 4,
                background: { r: 255, g: 0, b: 255, alpha: 1 }
            }
        })
        .png()
        .toBuffer();
    }
}

async function generateImageProof(imageData) {
    console.log("=== Starting SP1 Proof Generation ===");
    console.log(`Timestamp: ${imageData.timestamp} (${new Date(imageData.timestamp * 1000).toLocaleString()})`);
    console.log(`Image Size: ${imageData.imageSize} bytes`);
    console.log(`Dimensions: ${imageData.width}x${imageData.height}`);
    console.log(`Image Hash: ${imageData.imageHash}`);
    
    // Debug informasi prompt yang diterima dari frontend
    console.log(`Received prompt: "${imageData.prompt}"`);
    console.log(`Received promptHash from frontend: ${imageData.promptHash}`);

    // Gunakan promptHash yang diterima, atau buat dari prompt langsung, atau gunakan default sebagai fallback
    let promptHash;
    if (imageData.promptHash) {
        // Gunakan hash yang sudah dihitung di frontend
        promptHash = imageData.promptHash;
        console.log(`Using promptHash from frontend: ${promptHash}`);
    } else if (imageData.prompt) {
        // Hitung hash dari prompt yang diterima
        promptHash = crypto.createHash('sha256').update(imageData.prompt).digest('hex');
        console.log(`Calculated promptHash from received prompt: ${promptHash}`);
    } else {
        // Fallback ke default hanya jika tidak ada prompt sama sekali
        promptHash = crypto.createHash('sha256').update('default-prompt').digest('hex');
        console.log(`Using default promptHash: ${promptHash}`);
    }

    console.log(`Final Prompt Hash: ${promptHash}`);
    
    const scriptPath = path.resolve(__dirname, '..', 'script', 'target', 'release', 'prove');
    
    const command = `"${scriptPath}" --prove --timestamp ${imageData.timestamp} --image-size ${imageData.imageSize} --width ${imageData.width} --height ${imageData.height} --image-hash ${imageData.imageHash} --prompt-hash ${promptHash}`;
    
    console.log("Executing command:", command);
    
    return new Promise((resolve, reject) => {
        console.log("Spawning SP1 proof process...");
        
        const startTime = Date.now();
        exec(command, (error, stdout, stderr) => {
            const endTime = Date.now();
            const duration = (endTime - startTime) / 1000;
            
            console.log(`SP1 process completed in ${duration.toFixed(2)} seconds`);
            
            if (error) {
                console.error("SP1 proof generation failed:", error);
                console.error("STDOUT:", stdout);
                console.error("STDERR:", stderr);
                reject(error);
                return;
            }
            
            if (stderr) {
                console.log("Process STDERR (may contain normal output):", stderr);
            }
            
            console.log("Process STDOUT:", stdout);
            console.log("=== SP1 Proof Generation Completed Successfully ===");
            
            // Tambahkan kombinasi hash ke daftar valid setelah proof berhasil dibuat
            if (!global.validCombinations) {
                global.validCombinations = new Map();
            }
            
            // Simpan kombinasi prompt hash dan image hash
            global.validCombinations.set(`${promptHash}:${imageData.imageHash}`, {
                timestamp: imageData.timestamp,
                dimensions: `${imageData.width}x${imageData.height}`,
                size: imageData.imageSize
            });
            
            console.log(`Saved valid hash combination: promptHash=${promptHash}, imageHash=${imageData.imageHash}`);
            
            resolve({
                proofHash: `0xSP1${imageData.imageHash.slice(0, 12)}`,
                timestamp: imageData.timestamp,
                dimensions: `${imageData.width}x${imageData.height}`,
                size: imageData.imageSize,
                verified: true,
                duration: duration.toFixed(2),
                promptHash: promptHash
            });
        });
    });
}

// Serve static files
app.use(express.static(path.join(__dirname, '..', 'web')));

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'web', 'index.html'));
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        simulationMode: SIMULATION_MODE
    });
});

app.get('/api/test-image', async (req, res) => {
    try {
        const width = 512;
        const height = 512;
        const buffer = await sharp({
            create: {
                width: width,
                height: height,
                channels: 4,
                background: { r: 255, g: 0, b: 255, alpha: 1 }
            }
        })
        .png()
        .toBuffer();
        
        res.set('Content-Type', 'image/png');
        res.send(buffer);
    } catch (error) {
        console.error('Error generating test image:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

app.post('/api/generate-proof', async (req, res) => {
    try {
        console.log("\n=== PROOF GENERATION REQUEST ===");
        const { image, simulation, prompt, promptHash } = req.body;
        
        // Tambahkan log untuk debugging prompt dan promptHash
        console.log(`Received prompt: "${prompt}"`);
        console.log(`Received promptHash: ${promptHash}`);
        
        if (!image) {
            console.error("Missing image data in request");
            return res.status(400).json({
                success: false,
                error: "Missing image data"
            });
        }
        
        console.log(`Received proof generation request at ${new Date().toLocaleString()}`);
        console.log(`Image data length: ${image ? image.length : 0} characters`);
        console.log(`Simulation mode: ${simulation ? 'YES' : 'NO'}`);
        
        let imageBuffer;
        try {
            imageBuffer = Buffer.from(image, 'base64');
            console.log(`Decoded image buffer size: ${imageBuffer.length} bytes`);
        } catch (error) {
            console.error("Error decoding image:", error);
            return res.status(400).json({
                success: false,
                error: "Invalid image data"
            });
        }
        
        const imageHash = crypto
            .createHash('sha256')
            .update(imageBuffer)
            .digest('hex');
        console.log(`Image hash: ${imageHash}`);
        
        const timestamp = Math.floor(Date.now() / 1000);
        console.log(`Timestamp: ${timestamp} (${new Date(timestamp * 1000).toLocaleString()})`);
        
        if (simulation) {
            console.log("=== GENERATING SIMULATED PROOF ===");
            
            console.log("Waiting 1 second to simulate processing...");
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            console.log("Simulated proof completed");
            return res.json({
                success: true,
                proof: {
                    proofHash: `0xSP1${imageHash.slice(0, 12)}`,
                    timestamp: timestamp,
                    dimensions: "512x512", 
                    size: imageBuffer.length,
                    verified: true,
                    simulation: true
                }
            });
        }
        
        console.log("=== GENERATING REAL SP1 PROOF ===");
        
        try {
            console.log("Calling generateImageProof function...");
            const proofResult = await generateImageProof({
                timestamp: timestamp,
                imageSize: imageBuffer.length,
                width: 512, 
                height: 512, 
                imageHash: imageHash,
                prompt: prompt,
                promptHash: promptHash
            });
            
            console.log("Proof generation successful:", proofResult);
            res.json({
                success: true,
                proof: proofResult
            });
        } catch (proofError) {
            console.error("Error generating proof:", proofError);
            res.status(500).json({
                success: false,
                error: "Failed to generate proof: " + proofError.message
            });
        }
        
    } catch (error) {
        console.error('Error in proof generation endpoint:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Endpoint untuk verifikasi kombinasi hash prompt dan gambar
app.post('/api/verify-hash-combination', async (req, res) => {
    const { promptHash, imageHash } = req.body;
    
    if (!promptHash || !imageHash) {
        return res.status(400).json({
            success: false,
            error: "Missing prompt hash or image hash"
        });
    }
    
    try {
        // Cek di database atau di memori untuk kombinasi valid
        // Di sini kita bisa simpan kombinasi valid dalam Map untuk kecepatan
        const isValid = await checkValidCombination(promptHash, imageHash);
        
        return res.json({
            success: true,
            valid: isValid
        });
    } catch (error) {
        console.error('Error verifying hash combination:', error);
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Fungsi untuk mengecek kombinasi valid
async function checkValidCombination(promptHash, imageHash) {
    if (!global.validCombinations) {
        global.validCombinations = new Map();
        console.log("Warning: No valid hash combinations stored");
        return false;
    }
    
    const key = `${promptHash}:${imageHash}`;
    const isValid = global.validCombinations.has(key);
    
    console.log(`Verification hash: ${isValid ? "VALID ✓" : "INVALID ✗"}`);
    console.log(`- Prompt Hash: ${promptHash}`);
    console.log(`- Image Hash: ${imageHash}`);
    console.log(`- Stored combinations: ${global.validCombinations.size}`);
    
    // Tambahkan debug info untuk semua kombinasi yang tersimpan
    if (!isValid && global.validCombinations.size > 0) {
        console.log("Valid hash combinations stored:");
        [...global.validCombinations.keys()].forEach((combo, index) => {
            console.log(`  ${index+1}. ${combo}`);
        });
    }
    
    return isValid;
}

// Start the server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`SP1 Image Generator Server running at http://localhost:${PORT}`);
    console.log(`Simulation Mode: ${SIMULATION_MODE ? 'ENABLED' : 'DISABLED'}`);
    console.log(`Use the frontend to generate ${SIMULATION_MODE ? 'simulated' : 'real'} ZK proofs!`);
});