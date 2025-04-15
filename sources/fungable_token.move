// module fungable_token::fungable_token{
// use std::option;
//     use sui::coin;
//     use sui::transfer;
//     use sui::tx_context::{Self, TxContext};
//     use sui::url::{Self, Url};

//     // Name matches the module name but in UPPERCASE
//     // this is importand to note that the name of the wintness should be the same as the module name but in UPPERCASE
//     public struct FUNGABLE_TOKEN has drop {}

//     // Module initializer is called once on module publish.
//     // A treasury cap is sent to the publisher, who then controls minting and burning.
//     fun init(witness: FUNGABLE_TOKEN, ctx: &mut TxContext) {
//         let (treasury, metadata) = coin::create_currency(witness, 9, b"FGT", b"FUNGABLE_TOKEN", b"", option::some(url::new_unsafe_from_bytes(b"https://silver-blushing-woodpecker-143.mypinata.cloud/ipfs/Qmed2qynTAszs9SiZZpf58QeXcNcYgPnu6XzkD4oeLacU4")), ctx);
//         transfer::public_freeze_object(metadata);
//         transfer::public_transfer(treasury, tx_context::sender(ctx))
//     }

//     public entry fun mint(
//         treasury: &mut coin::TreasuryCap<FUNGABLE_TOKEN>, amount: u64, recipient: address, ctx: &mut TxContext
//     ) {
//         coin::mint_and_transfer(treasury, amount, recipient, ctx)
//     }

// }

module fungable_token::fungable_token {
    use std::option;
    use sui::coin;
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use sui::url::{Self, Url};

    /// Required witness struct to create a custom coin.
    public struct FUNGABLE_TOKEN has drop {}

    /// Called once on module publish. It creates the coin, sends the TreasuryCap to the deployer,
    /// and mints an initial supply directly to the deployer's address.
    fun init(witness: FUNGABLE_TOKEN, ctx: &mut TxContext) {
        let (mut treasury, metadata) = coin::create_currency(
            witness,
            9, // decimals
            b"HAPP", // symbol
            b"HAPPY_TOKEN", // name
            b"this is the custom minted token", // description
            option::some(url::new_unsafe_from_bytes(
                b"https://silver-blushing-woodpecker-143.mypinata.cloud/ipfs/Qmed2qynTAszs9SiZZpf58QeXcNcYgPnu6XzkD4oeLacU4"
            )),
            ctx
        );

        // Freeze metadata so it's immutable.
        transfer::public_freeze_object(metadata);

        // Mint 1,000,000,000 tokens (adjust decimals if needed)
        let initial_amount = 1_000_000_000;
        let deployer = tx_context::sender(ctx);
        coin::mint_and_transfer(&mut treasury, initial_amount, deployer, ctx);

        // Send the treasury cap to the deployer so they can mint more in the future
        transfer::public_transfer(treasury, deployer);
    }
}
