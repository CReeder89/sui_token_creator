module {{module_name}}::{{module_name}} {
    use std::option;
    use sui::coin;
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use sui::url::{Self, Url};

    /// Required witness struct to create a custom coin.
    public struct {{witness_name}} has drop {}

    /// Called once on module publish. It creates the coin, sends the TreasuryCap to the deployer,
    /// and mints an initial supply directly to the deployer's address.
    fun init(witness: {{witness_name}}, ctx: &mut TxContext) {
        let (mut treasury, metadata) = coin::create_currency(
            witness,
            {{decimals}}, // decimals
            b"{{symbol}}", // symbol
            b"{{name}}", // name
            b"{{description}}", // description
            option::some(url::new_unsafe_from_bytes(
                b"{{icon_url}}"
            )),
            ctx
        );

        // Freeze metadata so it's immutable.
        transfer::public_freeze_object(metadata);

        // Mint initial supply to deployer
        let initial_amount = {{initial_supply}};
        let deployer = tx_context::sender(ctx);
        coin::mint_and_transfer(&mut treasury, initial_amount, deployer, ctx);

        // Send the treasury cap to the deployer so they can mint more in the future
        transfer::public_transfer(treasury, deployer);
    }

    {{#if mint}}
    /// Mint new tokens to a recipient (requires TreasuryCap)
    public entry fun mint(
        treasury: &mut coin::TreasuryCap<{{witness_name}}>,
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
        treasury: &mut coin::TreasuryCap<{{witness_name}}>,
        coin: coin::Coin<{{witness_name}}>,
        ctx: &mut TxContext
    ) {
        coin::burn(treasury, coin, ctx)
    }
    {{/if}}

    {{#if transfer}}
    /// Transfer tokens to another address
    public entry fun transfer(
        coin: coin::Coin<{{witness_name}}>,
        recipient: address
    ) {
        transfer::public_transfer(coin, recipient)
    }
    {{/if}}
}
