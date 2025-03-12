//! SP1 proof program for the Focus app.

#![no_main]
sp1_zkvm::entrypoint!(main);

use alloy_sol_types::{SolType, private::FixedBytes};
use focus_proof_lib::{verify_focus_session, PublicValuesStruct};

pub fn main() {
    // Read input data
    let start_time = sp1_zkvm::io::read::<u32>();
    let end_time = sp1_zkvm::io::read::<u32>();
    let planned_duration = sp1_zkvm::io::read::<u32>();
    let task_hash = sp1_zkvm::io::read::<[u8; 32]>();
    
    // Verification process
    let is_valid = verify_focus_session(start_time, end_time, planned_duration);
    
    // Create public values
    let public_values = PublicValuesStruct {
        startTime: start_time,
        endTime: end_time,
        duration: planned_duration,
        completed: if is_valid { 1 } else { 0 },
        taskHash: FixedBytes(task_hash), // Wrapped with FixedBytes
    };
    
    // Debug outputs
    println!("Focus session verification:");
    println!("Start Time: {}", start_time);
    println!("End Time: {}", end_time);
    println!("Planned Duration: {}", planned_duration);
    println!("Actual Duration: {}", end_time - start_time);
    println!("Verification Result: {}", if is_valid { "SUCCESS" } else { "FAILED" });
    
    // Encode results and provide as output
    let bytes = PublicValuesStruct::abi_encode(&public_values);
    sp1_zkvm::io::commit_slice(&bytes);
}