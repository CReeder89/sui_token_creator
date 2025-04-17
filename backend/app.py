import os
import shutil
import uuid
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel
from typing import Optional, List
from scripts.deploy_contract import deploy_move_contract
from scripts.sui_utils import get_user_tokens
from database import add_token_record, get_tokens_by_deployer

app = FastAPI()

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

class DeployParams(BaseModel):
    contract_path: str
    deployer_address: str
    private_key: str  # In production, use secure key management!

class UserTokensRequest(BaseModel):
    address: str

@app.post("/generate_contract")
def generate_contract(params: ContractParams):
    # Load template
    with open(TEMPLATE_PATH, 'r') as f:
        template = f.read()

    # Generate unique module name if not provided
    module_name = params.module_name or f"token_{uuid.uuid4().hex[:8]}"
    witness_name = module_name.upper()

    # Replace placeholders
    contract_code = template
    contract_code = contract_code.replace("{{module_name}}", module_name)
    contract_code = contract_code.replace("{{witness_name}}", witness_name)
    contract_code = contract_code.replace("{{name}}", params.name)
    contract_code = contract_code.replace("{{symbol}}", params.symbol)
    contract_code = contract_code.replace("{{decimals}}", str(params.decimals))
    contract_code = contract_code.replace("{{description}}", params.description)
    contract_code = contract_code.replace("{{icon_url}}", params.icon_url or "")
    contract_code = contract_code.replace("{{initial_supply}}", str(params.initial_supply))

    # Handle methods
    def handle_method(method, present):
        tag = f"{{{{#{method}}}}}"
        end_tag = f"{{{{/{method}}}}}"
        if present:
            contract = contract_code.split(tag)
            if len(contract) > 1:
                before = contract[0]
                after = tag.join(contract[1:])
                if end_tag in after:
                    method_code, after = after.split(end_tag, 1)
                    contract_code_local = before + method_code + after
                    return contract_code_local
        else:
            contract = contract_code.split(tag)
            if len(contract) > 1:
                before = contract[0]
                after = tag.join(contract[1:])
                if end_tag in after:
                    _, after = after.split(end_tag, 1)
                    contract_code_local = before + after
                    return contract_code_local
        return contract_code

    for method in ["mint", "burn", "transfer"]:
        contract_code = handle_method(method, getattr(params, method))

    # Write to file
    contract_filename = f"{module_name}.move"
    contract_path = os.path.join(GENERATED_DIR, contract_filename)
    with open(contract_path, 'w') as f:
        f.write(contract_code)

    return {"contract_path": contract_path, "module_name": module_name, "witness_name": witness_name}

@app.post("/deploy_contract")
def deploy_contract(params: DeployParams):
    try:
        tx_hash, package_id = deploy_move_contract(params.contract_path, params.deployer_address, params.private_key)
        # Load contract metadata for record
        with open(params.contract_path, 'r') as f:
            contract_code = f.read()
        # Extract metadata from code filename and params
        record = {
            "module_name": os.path.splitext(os.path.basename(params.contract_path))[0],
            "deployer_address": params.deployer_address,
            "tx_hash": tx_hash,
            "package_id": package_id,
            "contract_path": params.contract_path,
            "name": getattr(params, 'name', None),
            "symbol": getattr(params, 'symbol', None),
            "decimals": getattr(params, 'decimals', None),
            "description": getattr(params, 'description', None),
        }
        add_token_record(record)
        return {"status": "success", "tx_hash": tx_hash, "package_id": package_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/my_tokens")
def my_tokens(req: UserTokensRequest):
    try:
        tokens = get_tokens_by_deployer(req.address)
        return {"tokens": tokens}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
