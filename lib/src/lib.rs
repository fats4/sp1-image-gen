use alloy_sol_types::sol;

sol! {
    /// Structure containing focus session results that can be easily deserialized by Solidity.
    struct PublicValuesStruct {
        uint32 startTime;     // UNIX timestamp start time
        uint32 endTime;       // UNIX timestamp end time  
        uint32 duration;      // Planned duration (seconds)
        uint32 completed;     // Completed? (1=yes, 0=no)
        bytes32 taskHash;     // Task hash value
    }
}

/// Verifies the focus session
pub fn verify_focus_session(start_time: u32, end_time: u32, planned_duration: u32) -> bool {
    // Calculate actual duration
    let actual_duration = end_time - start_time;
    
    // Check if focused for at least the planned duration
    actual_duration >= planned_duration
}