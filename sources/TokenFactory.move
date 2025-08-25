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
        event::emit<TokenCreationEvent>(TokenCreationEvent {
            creator: tx_context::sender(ctx),
            name,
            symbol,
            decimals,
            initial_supply,
            metadata_uri,
            description,
        });
    }
}

// 0x37489679a379470471b8e8b58126818527a377ab1e72761927c148dd7c6cbcdb

//v2
// 0x4518f21558d215a71165cf217220ef091958681f688c938bb0fb53548cc81ca5

//v3
// 0xbeb48ddf424923ef4755d084adef1ad3048ca95b887fa99920eeb570294dad42

// old
// 0xc17a461ed86747587def7cd511e42f63fa147fa73d085ebb936162ab6465529a