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
        ctx: &mut TxContext
    ) {
        let creator = tx_context::sender(ctx);
        let timestamp = tx_context::epoch_timestamp_ms(ctx);

        event::emit(TokenCreationEvent {
            creator,
            name,
            symbol,
            decimals,
            initial_supply,
            timestamp,
            metadata_uri,
        });
    }
}