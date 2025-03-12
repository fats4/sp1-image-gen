use alloy_sol_types::SolType;
use clap::Parser;
use focus_proof_lib::PublicValuesStruct;
use sp1_sdk::{include_elf, ProverClient, SP1Stdin};

/// RISC-V ELF file for the Focus proof program.
pub const FOCUS_PROOF_ELF: &[u8] = include_elf!("focus_proof_program");

/// Command line arguments
#[derive(Parser, Debug)]
#[clap(author, version, about, long_about = None)]
struct Args {
    #[clap(long)]
    execute: bool,

    #[clap(long)]
    prove: bool,

    #[clap(long, default_value = "0")]
    start_time: u32,

    #[clap(long, default_value = "0")]
    end_time: u32,

    #[clap(long, default_value = "0")]
    duration: u32,

    #[clap(long, default_value = "0000000000000000000000000000000000000000000000000000000000000000")]
    task_hash: String,
}

fn main() {
    // Setup logger
    sp1_sdk::utils::setup_logger();
    dotenv::dotenv().ok();

    // Parse command line arguments
    let args = Args::parse();

    if args.execute == args.prove {
        eprintln!("Error: You must specify either --execute or --prove");
        std::process::exit(1);
    }

    // Setup prover client
    let client = ProverClient::from_env();

    // Parse task hash - fixed
    let task_hash_bytes: [u8; 32] = hex::decode(&args.task_hash)
        .expect("Invalid task hash hex string")
        .try_into()
        .expect("Invalid task hash length");

    // Prepare inputs
    let mut stdin = SP1Stdin::new();
    stdin.write(&args.start_time);
    stdin.write(&args.end_time);
    stdin.write(&args.duration);
    stdin.write(&task_hash_bytes);

    println!("Focus Session Data: Start Time = {}, End Time = {}, Duration = {}s, Task Hash = {}",
             args.start_time, args.end_time, args.duration, args.task_hash);

    if args.execute {
        // Run program without generating proof
        let (output, report) = client.execute(FOCUS_PROOF_ELF, &stdin).run().unwrap();
        println!("Program executed successfully.");

        // Read output
        let decoded = PublicValuesStruct::abi_decode(output.as_slice(), true).unwrap();
        let PublicValuesStruct { startTime, endTime, duration, completed, taskHash } = decoded;
        
        println!("Session Verification Result:");
        println!("Start Time: {}", startTime);
        println!("End Time: {}", endTime);
        println!("Planned Duration: {}s", duration);
        println!("Actual Duration: {}s", endTime - startTime);
        println!("Completion Status: {}", if completed == 1 { "SUCCESS" } else { "FAILED" });
        println!("Task Hash: 0x{}", hex::encode(taskHash.0)); // Fixed with .0

        // Log executed instruction count
        println!("Number of instructions executed: {}", report.total_instruction_count());
    } else {
        // Setup program for proof generation
        let (pk, vk) = client.setup(FOCUS_PROOF_ELF);

        // Generate proof
        let proof = client
            .prove(&pk, &stdin)
            .run()
            .expect("proof generation failed");

        println!("Proof successfully generated!");

        // Verify proof
        client.verify(&proof, &vk).expect("proof verification failed");
        println!("Proof successfully verified!");
        
        // Save proof to disk
        let proof_path = "focus_session_proof.bin";
        proof.save(proof_path).expect("failed to save proof");
        println!("Proof saved to file: {}", proof_path);
    }
}