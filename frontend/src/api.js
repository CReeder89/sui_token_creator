import { BACKEND_URL } from './config';

export async function generateContract(params) {
  const res = await fetch(`${BACKEND_URL}/generate_contract`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  });
  return res.json();
}

export async function deployContract(params) {
  const res = await fetch(`${BACKEND_URL}/deploy_contract`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  });
  return res.json();
}

export async function getMyTokens(address) {
  const res = await fetch(`${BACKEND_URL}/my_tokens`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address })
  });
  return res.json();
}

import TokenForm from './components/TokenForm.jsx';
import TokenList from './components/TokenList.jsx';
