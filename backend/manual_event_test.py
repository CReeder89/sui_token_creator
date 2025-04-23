import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '.')))
from scripts.event_listener import handle_token_creation_event

# Example hardcoded event (update fields as needed for your test)
hardcoded_event = {
    'id': {'txDigest': 'dummy', 'eventSeq': '0'},
    'packageId': '0xc17a461ed86747587def7cd511e42f63fa147fa73d085ebb936162ab6465529a',
    'transactionModule': 'factory',
    'sender': '0x66a254f1bcbae153102068f2fb3c9bcc0015f8a91443ba0066f2973ee92924ee',
    'type': '0xc17a461ed86747587def7cd511e42f63fa147fa73d085ebb936162ab6465529a::factory::TokenCreationEvent',
    'parsedJson': {
        'creator': '0x66a254f1bcbae153102068f2fb3c9bcc0015f8a91443ba0066f2973ee92924ee',
        'decimals': 9,
        'fee_paid': '0',
        'initial_supply': '100000000',
        'metadata_uri': [104, 116, 116, 112, 115, 58, 47, 47, 97, 118, 97, 116, 97, 114, 115, 46, 103, 105, 116, 104, 117, 98, 117, 115, 101, 114, 99, 111, 110, 116, 101, 110, 116, 46, 99, 111, 109, 47, 117, 47, 57, 53, 55, 52, 49, 50, 52, 54, 63, 118, 61, 52],
        'name': [78, 70, 84, 65, 115, 115, 101, 116, 115],
        'symbol': [78, 70, 84],
        'timestamp': '1745006485486'
    },
    'bcsEncoding': 'base64',
    'bcs': 'dummy',
    'timestampMs': '1745063149541'
}

if __name__ == "__main__":
    handle_token_creation_event(hardcoded_event)
