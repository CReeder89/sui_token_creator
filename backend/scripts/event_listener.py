import time
import threading
from typing import Callable
import requests
from database import add_token_record, get_all_tokens

# A dictionary to hold the configurations for each network you want to watch
NETWORK_CONFIGS = {
    "testnet": {
        "url": "https://fullnode.testnet.sui.io:443",
        "package_id": "0x564792b9df6493b449f7c6e58431dbe6b286ad27e22075d0b6d188d8bb8ac6f4",
    },
    "mainnet": {
        "url": "https://fullnode.mainnet.sui.io:443",
        "package_id": "0x87674074df26ae54e80c328631a55b51e0122ada8a89a43a673c0f6be6bf7d51",  # TODO: Set after deployment on Mainnet
    }
}

MODULE_NAME = "factory"
EVENT_STRUCT = "TokenCreationEvent"

# Callback signature now includes the network name
def handle_token_creation_event(event: dict, network: str):
    print(f"[EventListener][{network}] Callback received event: {event}")
    event_fields = event.get('parsedJson', {})
    print(f"[EventListener][{network}] Parsed fields: {event_fields}")
    creator = event_fields.get('creator')
    name = event_fields.get('name')
    symbol = event_fields.get('symbol')
    decimals = event_fields.get('decimals')
    initial_supply = event_fields.get('initial_supply')
    metadata_uri = event_fields.get('metadata_uri')
    description = event_fields.get('description', '')

    def decode_bytes(val):
        if isinstance(val, list):
            try:
                return bytes(val).decode('utf-8')
            except Exception:
                return str(val)
        return val

    name = decode_bytes(name)
    symbol = decode_bytes(symbol)
    description = decode_bytes(description)
    metadata_uri = decode_bytes(metadata_uri)

    if initial_supply is not None:
        initial_supply = str(initial_supply)

    all_tokens = get_all_tokens()
    duplicate = any(
        t.get('creator') == creator and t.get('symbol') == symbol and t.get('name') == name
        for t in all_tokens
    )
    if duplicate:
        print(f"[EventListener][{network}][DEBUG] Duplicate token event detected for creator={creator}, symbol={symbol}, name={name}; skipping deploy and DB record.")
        return

    try:
        from scripts.deploy_contract import generate_token_contract, deploy_token_contract
        print(f"[EventListener][{network}] Calling generate_token_contract...")
        contract_dir = generate_token_contract(
            name=name,
            symbol=symbol,
            decimals=decimals,
            initial_supply=initial_supply,
            metadata_uri=metadata_uri,
            description=description,
            deployer_address=creator,
            module_name=None
        )
        print(f"[EventListener][{network}] Contract directory generated: {contract_dir}")

        print(f"[EventListener][{network}] Calling deploy_token_contract...")
        deploy_result = deploy_token_contract(contract_dir, creator)

        if deploy_result.get('success'):
            package_id = deploy_result.get('package_id')
            treasury_cap_id = deploy_result.get('treasury_cap_id')
            print(f"[EventListener][{network}][DEBUG] Contract deployed successfully! Package ID: {package_id}, TreasuryCap ID: {treasury_cap_id}")
            token_info = {
                "creator": creator,
                "name": name,
                "symbol": symbol,
                "decimals": decimals,
                "description": description,
                "metadata_uri": metadata_uri,
                "initial_supply": initial_supply,
                "network": network,
                "package_id": package_id,
                "treasury_cap_id": treasury_cap_id
            }
            print(f"[EventListener][{network}][DEBUG] Token info: {token_info}")
            add_token_record(token_info)
        else:
            print(f"[EventListener][{network}][DEBUG] Contract deployment failed: {deploy_result.get('error')}")
    except Exception as e:
        print(f"[EventListener][{network}] Failed to deploy contract: {e}")

# This is the new, generic polling function
def poll_events(network_name: str, fullnode_url: str, package_id: str, callback: Callable[[dict, str], None], poll_interval=5):
    """
    Polls a single Sui fullnode for TokenCreationEvent events.
    """
    if package_id == "0x0":
        print(f"[EventListener][{network_name}] WARNING: Package ID is a placeholder ('0x0'). Skipping event listener.")
        return

    print(f"[EventListener][{network_name}] Starting event listener for TokenCreationEvent...")
    seen_event_ids = set()
    cursor = None
    
    try:
        payload = {
            "jsonrpc": "2.0",
            "id": 1,
            "method": "suix_queryEvents",
            "params": [
                {"MoveEventType": f"{package_id}::{MODULE_NAME}::{EVENT_STRUCT}"},
                None,
                1,
                True
            ]
        }
        resp = requests.post(fullnode_url, json=payload, timeout=10)
        resp.raise_for_status()
        result = resp.json().get("result", {})
        if result.get("data"):
            cursor = result.get("nextCursor", None)
            print(f"[EventListener][{network_name}] Initial cursor set to {cursor} (skipping historical events)")
    except Exception as e:
        print(f"[EventListener][{network_name}] Error initializing cursor: {e}")

    while True:
        try:
            print(f"[EventListener][{network_name}] Polling for events with cursor: {cursor}")
            payload = {
                "jsonrpc": "2.0",
                "id": 1,
                "method": "suix_queryEvents",
                "params": [
                    {"MoveEventType": f"{package_id}::{MODULE_NAME}::{EVENT_STRUCT}"},
                    cursor,
                    20,
                    False
                ]
            }
            resp = requests.post(fullnode_url, json=payload, timeout=10)
            resp.raise_for_status()
            result = resp.json().get("result", {})
            events = result.get("data", [])
            next_cursor = result.get("nextCursor", None)
            print(f"[EventListener][{network_name}] Fetched {len(events)} events.")
            new_event_processed = False
            for event in events:
                event_id = (event.get("id", {}).get("txDigest"), event.get("id", {}).get("eventSeq"))
                if event_id and event_id not in seen_event_ids:
                    print(f"[EventListener][{network_name}] New event detected: {event_id}")
                    seen_event_ids.add(event_id)
                    callback(event, network_name) # Pass the network name to the callback
                    new_event_processed = True
            cursor = next_cursor
            if not new_event_processed:
                time.sleep(poll_interval)
        except Exception as e:
            print(f"[EventListener][{network_name}] Error polling for events: {e}")
            time.sleep(poll_interval)

# This is the new entry point that starts all listeners
def start_event_listener():
    print("[EventListener] start_all_listeners() called. Launching threads...")
    threads = []
    for network_name, config in NETWORK_CONFIGS.items():
        thread = threading.Thread(
            target=poll_events,
            args=(network_name, config["url"], config["package_id"], handle_token_creation_event,),
            daemon=True
        )
        threads.append(thread)
        thread.start()
        print(f"[EventListener] Background listener thread for {network_name} started!")
    
    return threads # Return threads if you need to manage their lifecycle