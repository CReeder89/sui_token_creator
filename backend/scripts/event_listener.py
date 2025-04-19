import time
import threading
from typing import Callable
import requests

SUI_FULLNODE = "https://fullnode.testnet.sui.io:443"
PACKAGE_ID = "0x18dfdc7b1568eb9d6eac2057327ee2763e25473c4523bc635743b9b01707a46e"  # TODO: Set after deployment
MODULE_NAME = "factory"
EVENT_STRUCT = "TokenCreationEvent"

# Callback signature: fn(event_dict) -> None
def listen_for_token_creation_events(callback: Callable[[dict], None], poll_interval=5):
    """
    Polls the Sui fullnode for TokenCreationEvent events and calls the callback on each new event.
    Uses a cursor to avoid missing events and to avoid duplicates.
    """
    seen_event_ids = set()
    cursor = None
    print("[EventListener] Starting event listener for TokenCreationEvent...")
    while True:
        try:
            print(f"[EventListener] Polling for events with cursor: {cursor}")
            # JSON-RPC request to suix_queryEvents
            payload = {
                "jsonrpc": "2.0",
                "id": 1,
                "method": "suix_queryEvents",
                "params": [
                    {"MoveEventType": f"{PACKAGE_ID}::{MODULE_NAME}::{EVENT_STRUCT}"},
                    cursor,
                    20,  # batch size
                    False  # descending = False (oldest first)
                ]
            }
            resp = requests.post(SUI_FULLNODE, json=payload, timeout=10)
            resp.raise_for_status()
            result = resp.json().get("result", {})
            events = result.get("data", [])
            next_cursor = result.get("nextCursor", None)
            print(f"[EventListener] Fetched {len(events)} events.")
            print(f"[EventListener] Raw events fetched: {events}")
            for event in events:
                event_id = (event.get("id", {}).get("txDigest"), event.get("id", {}).get("eventSeq"))
                print(f"[EventListener] Event seen: {event_id}")
                if event_id and event_id not in seen_event_ids:
                    print(f"[EventListener] New event detected: {event_id}")
                    seen_event_ids.add(event_id)
                    callback(event)
            cursor = next_cursor
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

    from scripts.deploy_contract import generate_token_contract, deploy_token_contract
    contract_dir = generate_token_contract(name, symbol, decimals, initial_supply, metadata_uri)
    if not contract_dir:
        print("Failed to generate token contract directory.")
        return

    deploy_result = deploy_token_contract(contract_dir, creator)
    if not deploy_result.get('success'):
        print(f"Failed to deploy contract: {deploy_result.get('error')}")
        return
    package_id = deploy_result.get('package_id')

    from scripts.sui_utils import transfer_token_capabilities
    transfer_token_capabilities(package_id, creator)
    print(f"Token contract deployed and capabilities transferred to {creator}")

# To run the listener in a background thread:
def start_event_listener():
    thread = threading.Thread(target=listen_for_token_creation_events, args=(handle_token_creation_event,), daemon=True)
    thread.start()
