import React, { useState } from 'react';
import {
  Box, Button, TextField, Typography, Grid, FormControlLabel, Checkbox, Divider
} from '@mui/material';

const DEFAULT_DECIMALS = 9;

export default function TokenForm({ onSuccess, onSnackbar, deployerAddress, setDeployerAddress }) {
  const [form, setForm] = useState({
    name: '',
    symbol: '',
    decimals: DEFAULT_DECIMALS,
    description: '',
    icon_url: '',
    initial_supply: 1000000,
    mint: true,
    burn: true,
    transfer: true,
    private_key: '',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // 1. Generate contract
      const res = await fetch('/generate_contract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          decimals: Number(form.decimals),
          initial_supply: Number(form.initial_supply),
        }),
      });
      const data = await res.json();
      if (!data.contract_path) throw new Error('Failed to generate contract');

      // 2. Deploy contract
      const deployRes = await fetch('/deploy_contract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contract_path: data.contract_path,
          deployer_address: deployerAddress,
          private_key: form.private_key,
          name: form.name,
          symbol: form.symbol,
          decimals: form.decimals,
          description: form.description,
        }),
      });
      const deployData = await deployRes.json();
      if (deployData.status !== 'success') throw new Error(deployData.detail || 'Deployment failed');
      onSnackbar('Token deployed successfully!', 'success');
      if (onSuccess) onSuccess();
    } catch (err) {
      onSnackbar(err.message || 'Error occurred', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Typography variant="h5" mb={2}>Create Your Custom Sui Token</Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextField label="Token Name" name="name" fullWidth required value={form.name} onChange={handleChange} />
        </Grid>
        <Grid item xs={12} sm={3}>
          <TextField label="Symbol" name="symbol" fullWidth required value={form.symbol} onChange={handleChange} />
        </Grid>
        <Grid item xs={12} sm={3}>
          <TextField label="Decimals" name="decimals" type="number" fullWidth required value={form.decimals} onChange={handleChange} inputProps={{ min: 0, max: 18 }} />
        </Grid>
        <Grid item xs={12}>
          <TextField label="Description" name="description" fullWidth required value={form.description} onChange={handleChange} />
        </Grid>
        <Grid item xs={12}>
          <TextField label="Icon URL" name="icon_url" fullWidth value={form.icon_url} onChange={handleChange} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField label="Initial Supply" name="initial_supply" type="number" fullWidth required value={form.initial_supply} onChange={handleChange} inputProps={{ min: 1 }} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField label="Deployer Address" name="deployerAddress" fullWidth required value={deployerAddress} onChange={e => { setDeployerAddress(e.target.value); localStorage.setItem('deployerAddress', e.target.value); }} />
        </Grid>
        <Grid item xs={12}>
          <TextField label="Private Key" name="private_key" fullWidth required value={form.private_key} onChange={handleChange} type="password" />
        </Grid>
        <Grid item xs={12}>
          <FormControlLabel control={<Checkbox checked={form.mint} onChange={handleChange} name="mint" />} label="Enable Mint" />
          <FormControlLabel control={<Checkbox checked={form.burn} onChange={handleChange} name="burn" />} label="Enable Burn" />
          <FormControlLabel control={<Checkbox checked={form.transfer} onChange={handleChange} name="transfer" />} label="Enable Transfer" />
        </Grid>
      </Grid>
      <Divider sx={{ my: 2 }} />
      <Button type="submit" variant="contained" color="primary" disabled={loading}>
        {loading ? 'Deploying...' : 'Generate & Deploy Token'}
      </Button>
    </Box>
  );
}
