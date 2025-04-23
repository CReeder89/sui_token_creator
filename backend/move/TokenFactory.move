module TokenFactory::factory {
    use sui::tx_context::{Self, TxContext};
    use sui::event;
    use sui::clock;

    /// Event emitted when a token creation request is received
    public struct TokenCreationEvent has copy, drop, store {
        creator: address,
        name: vector<u8>,
        symbol: vector<u8>,
        decimals: u8,
        initial_supply: u64,
        timestamp: u64,
        metadata_uri: vector<u8>,
        description: vector<u8>,
    }

    /// Entry point for users to request token creation (event only)
    public entry fun create_token(
        ctx: &mut TxContext,
        name: vector<u8>,
        symbol: vector<u8>,
        decimals: u8,
        initial_supply: u64,
        metadata_uri: vector<u8>,
        description: vector<u8>,
    ) {
        let timestamp = clock::now_ms();
        event::emit<TokenCreationEvent>(TokenCreationEvent {
            creator: tx_context::sender(ctx),
            name,
            symbol,
            decimals,
            initial_supply,
            timestamp,
            metadata_uri,
            description,
        });
    }
}