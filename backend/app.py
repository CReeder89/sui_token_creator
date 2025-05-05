import os
import shutil
import uuid
from fastapi import FastAPI, HTTPException, Request, Body
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
from scripts.sui_utils import get_user_tokens, mint_token, burn_token, transfer_token
from scripts.move_package_utils import create_move_package
from database import add_token_record, get_tokens_by_deployer, get_tokens_by_owner, get_all_tokens, delete_token_record, update_token_owner
from scripts.event_listener import start_event_listener
from scripts.sui_txn_utils import get_transactions_by_object, get_transactions_by_address, get_transaction_details

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://token-forge-pearl.vercel.app","http://localhost:5173", "http://localhost:5174"],  # Add your frontend URL here
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    print("[App] FastAPI startup event triggered. Starting event listener...")
    start_event_listener()

# Directory paths
TEMPLATE_PATH = os.path.join(os.path.dirname(__file__), 'templates', 'fungible_token_template.move')
GENERATED_DIR = os.path.join(os.path.dirname(__file__), 'generated')

os.makedirs(GENERATED_DIR, exist_ok=True)

class ContractParams(BaseModel):
    name: str
    symbol: str
    decimals: int
    description: str
    initial_supply: int
    icon_url: Optional[str] = ""
    mint: bool = True
    burn: bool = True
    transfer: bool = True
    module_name: Optional[str] = None  # If not provided, will be auto-generated
    move_code: Optional[str] = None  # For direct code submission

class DeployParams(BaseModel):
    move_code: str  # The code to deploy
    module_name: str
    deployer_address: str
    private_key: str
    # Optionally, add more fields for richer metadata

class UserTokensRequest(BaseModel):
    address: str

class OwnerTokensParams(BaseModel):
    owner_address: str

class MintParams(BaseModel):
    package_id: str
    module_name: str
    treasury_cap_id: str
    amount: int
    recipient: str
    sender_address: str
    # Optionally, add gas_budget, etc.

class BurnParams(BaseModel):
    package_id: str
    module_name: str
    treasury_cap_id: str
    amount: int
    sender_address: str

class TransferParams(BaseModel):
    package_id: str
    module_name: str
    coin_object_id: str
    amount: int
    recipient: str
    sender_address: str

class TokenUpdateParams(BaseModel):
    package_id: str
    new_owner: str = None  # Optional for transfer

@app.post("/mint")
def mint(params: MintParams):
    try:
        tx_hash = mint_token(params)
        return {"status": "success", "tx_hash": tx_hash}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/burn")
def burn(params: BurnParams):
    try:
        tx_hash = burn_token(params)
        return {"status": "success", "tx_hash": tx_hash}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/transfer")
def transfer(params: TransferParams):
    try:
        tx_hash = transfer_token(params)
        return {"status": "success", "tx_hash": tx_hash}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/my_tokens")
def my_tokens(req: UserTokensRequest):
    try:
        tokens = get_tokens_by_deployer(req.address)
        return {"tokens": tokens}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/user_tokens")
def get_user_tokens(address: str):
    try:
        tokens = get_tokens_by_deployer(address)
        print("[DEBUG] /api/user_tokens tokens:", tokens)  # Debug print
        return {"tokens": tokens}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/all_tokens")
def get_all_tokens_api():
    try:
        tokens = get_all_tokens()
        return {"tokens": tokens}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/transactions/by_object/{object_id}")
def api_transactions_by_object(object_id: str):
    try:
        txns = get_transactions_by_object(object_id)
        return {"transactions": txns}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/transactions/by_address/{address}")
def api_transactions_by_address(address: str):
    try:
        txns = get_transactions_by_address(address)
        return {"transactions": txns}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/transactions/details/{tx_digest}")
def api_transaction_details(tx_digest: str):
    try:
        details = get_transaction_details(tx_digest)
        return {"transaction": details}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/delete_token")
def delete_token(params: TokenUpdateParams):
    try:
        delete_token_record(params.package_id)
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/update_token_owner")
def update_token_owner_api(params: TokenUpdateParams):
    try:
        if not params.new_owner:
            raise HTTPException(status_code=400, detail="new_owner is required")
        update_token_owner(params.package_id, params.new_owner)
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/my_owned_tokens")
def my_owned_tokens(params: OwnerTokensParams):
    try:
        tokens = get_tokens_by_owner(params.owner_address)
        return {"tokens": tokens}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
