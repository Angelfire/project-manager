//! Integration tests for Tauri backend
//!
//! These tests verify that multiple modules work together correctly.
//! Integration tests are separate from unit tests and test the public API.

use runstack_lib::validation;

#[test]
fn test_validation_pid_integration() {
    // Test that validate_pid works correctly
    assert!(validation::validate_pid(0).is_err());
    assert!(validation::validate_pid(1).is_ok());
    assert!(validation::validate_pid(12345).is_ok());
    assert!(validation::validate_pid(10_000_001).is_err());
}

