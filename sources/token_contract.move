module token_contract::fungable_token {
    use std::option;
    use sui::coin;
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use sui::url::{Self, Url};

    struct FUNGABLE_TOKEN has drop {}

    /// Properly marked as public entry!
      fun init(witness: FUNGABLE_TOKEN, ctx: &mut TxContext) {
        let (treasury_cap, metadata) = coin::create_currency<FUNGABLE_TOKEN>(
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

        // Freeze metadata so it's immutable
        transfer::public_freeze_object(metadata);

        // Mint tokens and transfer to sender
        let initial_amount = 1_000_000_000;
        let deployer = tx_context::sender(ctx);
        coin::mint_and_transfer(&mut treasury_cap, initial_amount, deployer, ctx);

        // Send treasury cap to deployer
        transfer::public_transfer(treasury_cap, deployer);
    }

    /// Optional: public mint function for future use
    public entry fun mint(
        treasury_cap: &mut coin::TreasuryCap<FUNGABLE_TOKEN>,
        amount: u64,
        recipient: address,
        ctx: &mut TxContext
    ) {
        coin::mint_and_transfer(treasury_cap, amount, recipient, ctx);
    }
}