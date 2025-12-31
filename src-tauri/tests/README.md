# Rust Tests Organization

This directory contains **integration tests** for the Tauri backend.

## Test Organization in Rust

Rust follows a two-tier testing approach:

### 1. Unit Tests (in `src/`)

Unit tests are placed in the same file as the code they test, within a `#[cfg(test)] mod tests {}` block.

**Location**: `src/validation.rs`, `src/error.rs`, etc.

**Advantages**:
- Can test private functions
- Tests are close to the code they test
- Only compiled when running tests (`cargo test`)
- Fast execution

**Example**:
```rust
// src/validation.rs
pub fn validate_pid(pid: u32) -> Result<u32, AppError> {
    // ... implementation
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_validate_pid() {
        assert!(validate_pid(0).is_err());
    }
}
```

### 2. Integration Tests (in `tests/`)

Integration tests are separate files that test the public API of your crate.

**Location**: `tests/integration_test.rs`, `tests/another_test.rs`, etc.

**Advantages**:
- Test multiple modules together
- Test the public API as users would use it
- Can test end-to-end workflows
- Separate from implementation details

**Example**:
```rust
// tests/integration_test.rs
use runstack_lib::validation;

#[test]
fn test_validation_integration() {
    assert!(validation::validate_pid(0).is_err());
}
```

## Running Tests

```bash
# Run all tests (unit + integration)
cargo test --manifest-path src-tauri/Cargo.toml

# Run only unit tests
cargo test --manifest-path src-tauri/Cargo.toml --lib

# Run only integration tests
cargo test --manifest-path src-tauri/Cargo.toml --test integration_test

# Run specific test
cargo test --manifest-path src-tauri/Cargo.toml test_validate_pid

# Run with output
cargo test --manifest-path src-tauri/Cargo.toml -- --nocapture
```

## Current Test Coverage

- ✅ `validation.rs` - Unit tests for path and PID validation
- ✅ `error.rs` - Unit tests for error handling
- ✅ `tests/integration_test.rs` - Basic integration tests

## Best Practices

1. **Unit tests** should test individual functions in isolation
2. **Integration tests** should test how modules work together
3. Keep tests focused and readable
4. Use descriptive test names
5. Test both success and failure cases
6. Clean up resources (temp files, etc.) in tests

