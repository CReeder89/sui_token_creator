import time
import threading
from typing import Callable
import requests
from database import add_token_record, get_all_tokens

SUI_FULLNODE = "https://fullnode.testnet.sui.io:443"
PACKAGE_ID = "0xc17a461ed86747587def7cd511e42f63fa147fa73d085ebb936162ab6465529a"  # TODO: Set after deployment
MODULE_NAME = "factory"
EVENT_STRUCT = "TokenCreationEvent"

print("[EventListener] Module loaded. If you see this, event_listener.py is being imported or run.")

# Callback signature: fn(event_dict) -> None
def listen_for_token_creation_events(callback: Callable[[dict], None], poll_interval=5):
    print("[EventListener] listen_for_token_creation_events() called. Starting main loop...")
    """
    Polls the Sui fullnode for TokenCreationEvent events and calls the callback on each new event.
    Uses a cursor to avoid missing events and to avoid duplicates.
    Only processes events that are newly generated since the listener started.
    """
    seen_event_ids = set()
    cursor = None
    print("[EventListener] Starting event listener for TokenCreationEvent...")
    # On first run, get the latest event's cursor so we only process new events
    try:
        payload = {
            "jsonrpc": "2.0",
            "id": 1,
            "method": "suix_queryEvents",
            "params": [
                {"MoveEventType": f"{PACKAGE_ID}::{MODULE_NAME}::{EVENT_STRUCT}"},
                None,
                1,  # fetch only the latest event
                True  # descending = True (newest first)
            ]
        }
        resp = requests.post(SUI_FULLNODE, json=payload, timeout=10)
        resp.raise_for_status()
        result = resp.json().get("result", {})
        events = result.get("data", [])
        if events:
            # Set cursor to the latest event's cursor so we only get new ones
            cursor = result.get("nextCursor", None)
            print(f"[EventListener] Initial cursor set to {cursor} (skipping historical events)")
    except Exception as e:
        print(f"[EventListener] Error initializing cursor: {e}")

    while True:
        try:
            print(f"[EventListener] Polling for events with cursor: {cursor}")
            payload = {
                "jsonrpc": "2.0",
                "id": 1,
                "method": "suix_queryEvents",
                "params": [
                    {"MoveEventType": f"{PACKAGE_ID}::{MODULE_NAME}::{EVENT_STRUCT}"},
                    cursor,
                    20,
                    False
                ]
            }
            resp = requests.post(SUI_FULLNODE, json=payload, timeout=10)
            resp.raise_for_status()
            result = resp.json().get("result", {})
            events = result.get("data", [])
            next_cursor = result.get("nextCursor", None)
            print(f"[EventListener] Fetched {len(events)} events.")
            new_event_processed = False
            for event in events:
                event_id = (event.get("id", {}).get("txDigest"), event.get("id", {}).get("eventSeq"))
                if event_id and event_id not in seen_event_ids:
                    print(f"[EventListener] New event detected: {event_id}")
                    seen_event_ids.add(event_id)
                    callback(event)
                    new_event_processed = True
            cursor = next_cursor
            # Only sleep if no new event was processed (for near real-time processing)
            if not new_event_processed:
                time.sleep(poll_interval)
        except Exception as e:
            print(f"[EventListener] Error polling for events: {e}")
            time.sleep(poll_interval)

# Example callback for event processing
def handle_token_creation_event(event):
    print(f"[EventListener] Callback received event: {event}")
    event_fields = event.get('parsedJson', {})
    print(f"[EventListener] Parsed fields: {event_fields}")
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

    # --- Prevent duplicate deployment/recording ---
    all_tokens = get_all_tokens()
    duplicate = any(
        t.get('creator') == creator and t.get('symbol') == symbol and t.get('name') == name
        for t in all_tokens
    )
    if duplicate:
        print(f"[EventListener][DEBUG] Duplicate token event detected for creator={creator}, symbol={symbol}, name={name}; skipping deploy and DB record.")
        return

    try:
        from scripts.deploy_contract import generate_token_contract, deploy_token_contract
        print("[EventListener] Calling generate_token_contract...")
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
        print(f"[EventListener] Contract directory generated: {contract_dir}")
        import os
        if os.path.exists(contract_dir):
            print(f"[EventListener][DEBUG] Directory {contract_dir} exists and was created successfully.")
        else:
            print(f"[EventListener][DEBUG] Directory {contract_dir} was NOT created!")
        print("[EventListener] Calling deploy_token_contract...")
        deploy_result = deploy_token_contract(contract_dir, creator)
        if deploy_result.get('success'):
            package_id = deploy_result.get('package_id')
            treasury_cap_id = deploy_result.get('treasury_cap_id')
            print(f"[EventListener][DEBUG] Contract deployed successfully! Package ID: {package_id}, TreasuryCap ID: {treasury_cap_id}")
            token_info = {
                "creator": creator,
                "name": name,
                "symbol": symbol,
                "decimals": decimals,
                "description": description,
                "metadata_uri": metadata_uri,
                "initial_supply": initial_supply,
                "package_id": package_id,
                "treasury_cap_id": treasury_cap_id
            }
            print(f"[EventListener][DEBUG] Token info: {token_info}")
            add_token_record(token_info)
        else:
            print(f"[EventListener][DEBUG] Contract deployment failed: {deploy_result.get('error')}")
    except Exception as e:
        print(f"[EventListener] Failed to deploy contract: {e}")

# To run the listener in a background thread:
def start_event_listener():
    print("[EventListener] start_event_listener() called. Launching thread...")
    thread = threading.Thread(target=listen_for_token_creation_events, args=(handle_token_creation_event,), daemon=True)
    thread.start()
    print("[EventListener] Background listener thread started!")
