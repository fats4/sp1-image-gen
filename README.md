# FocusProof

FocusProof is a web application that can verify and prove your focus time using SP1 zero-knowledge proof technology.

## Features

- Focus timer (1-120 minutes)
- Focus verification with Zero-Knowledge Proofs
- Real and Simulation proof modes
- Detailed focus reports
- Shareable proof results

## Live Demo

A live demo with simulation proofs is available at:
[https://focus-proof.vercel.app](https://focus-proof.vercel.app)

Note: The Vercel deployment only supports simulation proofs. For real SP1 proofs, follow the local setup instructions below.

## Technologies

- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Node.js, Express
- **ZK Proof**: SP1 (Succinct Labs)
- **Programming Language**: Rust, JavaScript

## Local Setup for Real SP1 Proofs

### Requirements

- Node.js (v14+)
- Rust (1.79+)
- SP1 Toolchain

### Installation Steps

1. Clone this repository:
   ```
   git clone https://github.com/username/focus-proof.git
   cd focus-proof
   ```

2. Install backend dependencies:
   ```
   cd backend
   npm install
   ```

3. Install SP1 toolchain (if not already installed):
   ```
   curl -L https://sp1up.succinct.xyz | bash
   sp1up
   ```

4. Build the SP1 program:
   ```
   cd ../program
   cargo prove build
   ```

5. Start the backend server:
   ```
   cd ../backend
   node server.js
   ```

6. Open the application in your browser:
   ```
   http://localhost:3000
   ```

## Usage

1. Define the task you want to focus on and set the duration
2. Click the "Start Session" button
3. When the timer ends or when you click the "Give up!" button
4. Select the proof type (Real/Simulation)
5. View and share the generated SP1 proof

## SP1 Integration

FocusProof uses Succinct Labs' SP1 zero-knowledge proof system. SP1 provides a ZK-VM (zero-knowledge virtual machine) that proves Rust programs are executed correctly.

Our application generates SP1 proofs to verify that the user has actually focused for the specified time. These proofs are transparent and verifiable.

## License

MIT