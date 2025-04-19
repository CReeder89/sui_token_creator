module TokenFactory::factory {
    use sui::tx_context::{Self, TxContext};
    use sui::event;

    /// Event emitted when a token creation request is received
    public struct TokenCreationEvent has copy, drop, store {
        creator: address,
        name: vector<u8>,
        symbol: vector<u8>,
        decimals: u8,
        initial_supply: u64,
        fee_paid: u64,
        timestamp: u64,
        metadata_uri: vector<u8>,
    }

    /// Entry point for users to request token creation (event only)
    public entry fun create_token(
        name: vector<u8>,
        symbol: vector<u8>,
        decimals: u8,
        initial_supply: u64,
        metadata_uri: vector<u8>,
        fee_paid: u64, // Let caller just pass the amount they paid (optional, for logging)
        ctx: &mut TxContext
    ) {
        let creator = tx_context::sender(ctx);
        let timestamp = tx_context::timestamp_ms(ctx);

        event::emit(TokenCreationEvent {
            creator,
            name,
            symbol,
            decimals,
            initial_supply,
            fee_paid,
            timestamp,
            metadata_uri,
        });
    }
}