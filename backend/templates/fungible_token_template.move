module token_contract::{{token_name}} {
    use std::option;
    use sui::coin;
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use sui::url::{Self, Url};

    /// Required witness struct to create a custom coin.
    public struct {{token_name_upper}} has drop {}

    /// Called once on module publish. It creates the coin, sends the TreasuryCap to the deployer,
    /// and mints an initial supply directly to the deployer's address.
    fun init(witness: {{token_name_upper}}, ctx: &mut TxContext) {
        let (mut treasury_cap, metadata) = coin::create_currency(
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
        let deployer: address = @{{deployer_address}};
        coin::mint_and_transfer(&mut treasury_cap, initial_amount, deployer, ctx);

        // Send the treasury cap to the deployer so they can mint more in the future
        transfer::public_transfer(treasury_cap, deployer);
    }

    // {{#if mint}}
    /// Mint new tokens to a recipient (requires TreasuryCap)
    public entry fun mint(
        treasury_cap: &mut coin::TreasuryCap<{{token_name_upper}}>,
        amount: u64,
        recipient: address,
        ctx: &mut TxContext
    ) {
        coin::mint_and_transfer(treasury_cap, amount, recipient, ctx)
    }
    // {{/if}}

    // {{#if burn}}
    /// Burn tokens from the caller's balance
    public entry fun burn(
        treasury_cap: &mut coin::TreasuryCap<{{token_name_upper}}>,
        coin: coin::Coin<{{token_name_upper}}>
    ): u64 {
        coin::burn(treasury_cap, coin)
    }
    // {{/if}}

    // {{#if transfer}}
    /// Transfer tokens to another address
    public entry fun transfer(
        coin: coin::Coin<{{token_name_upper}}>,
        recipient: address
    ) {
        transfer::public_transfer(coin, recipient)
    }
    // {{/if}}
}
