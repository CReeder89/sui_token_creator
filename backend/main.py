import uvicorn
from app import app
from scripts.event_listener import start_event_listener

if __name__ == "__main__":
    # Start the event listener in a background thread
    start_event_listener()
    # Start the FastAPI server
    uvicorn.run(app, host="0.0.0.0", port=8000)

# import threading
# import uvicorn
# from app import app
# from scripts.event_listener import listen_for_token_creation_events, handle_token_creation_event

# def start_event_listener():
#     thread = threading.Thread(target=listen_for_token_creation_events, args=(handle_token_creation_event,), daemon=True)
#     thread.start()

# if __name__ == "__main__":
#     start_event_listener()
#     uvicorn.run(app, host="0.0.0.0", port=8000)