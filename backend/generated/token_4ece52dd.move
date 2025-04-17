module token_4ece52dd::token_4ece52dd {
    use std::option;
    use sui::coin;
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use sui::url::{Self, Url};

    /// Required witness struct to create a custom coin.
    public struct TOKEN_4ECE52DD has drop {}

    /// Called once on module publish. It creates the coin, sends the TreasuryCap to the deployer,
    /// and mints an initial supply directly to the deployer's address.
    fun init(witness: TOKEN_4ECE52DD, ctx: &mut TxContext) {
        let (mut treasury, metadata) = coin::create_currency(
            witness,
            9, // decimals
            b"KGK", // symbol
            b"Gola", // name
            b"gola investment firm", // description
            option::some(url::new_unsafe_from_bytes(
                b""
            )),
            ctx
        );

        // Freeze metadata so it's immutable.
        transfer::public_freeze_object(metadata);

        // Mint initial supply to deployer
        let initial_amount = 1000000;
        let deployer = tx_context::sender(ctx);
        coin::mint_and_transfer(&mut treasury, initial_amount, deployer, ctx);

        // Send the treasury cap to the deployer so they can mint more in the future
        transfer::public_transfer(treasury, deployer);
    }

    {{#if mint}}
    /// Mint new tokens to a recipient (requires TreasuryCap)
    public entry fun mint(
        treasury: &mut coin::TreasuryCap<TOKEN_4ECE52DD>,
        amount: u64,
        recipient: address,
        ctx: &mut TxContext
    ) {
        coin::mint_and_transfer(treasury, amount, recipient, ctx)
    }
    {{/if}}

    {{#if burn}}
    /// Burn tokens from the caller's balance
    public entry fun burn(
        treasury: &mut coin::TreasuryCap<TOKEN_4ECE52DD>,
        coin: coin::Coin<TOKEN_4ECE52DD>,
        ctx: &mut TxContext
    ) {
        coin::burn(treasury, coin, ctx)
    }
    {{/if}}

    {{#if transfer}}
    /// Transfer tokens to another address
    public entry fun transfer(
        coin: coin::Coin<TOKEN_4ECE52DD>,
        recipient: address
    ) {
        transfer::public_transfer(coin, recipient)
    }
    {{/if}}
}
