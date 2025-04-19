import express, { Request, Response } from 'express';
const axios = require('axios');

const app = express();
const PORT = 3000;

// Update these constants with your actual values
const RPC_URL = 'https://fullnode.devnet.sui.io:443';
const PACKAGE_ID = '0xb7695b31d40c1c1023fb427bc08a8d62dda2087e387136cb05bc7a7eea0dfcf6';
const MODULE_NAME = 'factory';
const EVENT_TYPE = `${PACKAGE_ID}::${MODULE_NAME}::TokenCreationEvent`;

interface TokenCreationEventData {
  creator: string;
  name: string;
  symbol: string;
  decimals: number;
  initial_supply: string;
  timestamp: string;
  metadata_uri: string;
}

interface EventCursor {
  txDigest: string;
  eventSeq: string;
}

let cursor: EventCursor | null = null;
let latestEvents: TokenCreationEventData[] = [];

function parseEvent(event: any): TokenCreationEventData {
  return {
    creator: event.creator,
    name: Buffer.from(event.name).toString('utf8'),
    symbol: Buffer.from(event.symbol).toString('utf8'),
    decimals: event.decimals,
    initial_supply: event.initial_supply.toString(),
    timestamp: event.timestamp.toString(),
    metadata_uri: Buffer.from(event.metadata_uri).toString('utf8'),
  };
}

async function pollTokenCreationEvents() {
  const payload = {
    jsonrpc: "2.0",
    id: 1,
    method: "suix_queryEvents",
    params: [
      { MoveEventType: EVENT_TYPE },
      cursor,
      10,
      false
    ]
  };

  try {
    const response = await axios.post(RPC_URL, payload);
    const result = response.data.result;
    if (result && result.data.length > 0) {
      for (const event of result.data) {
        const parsed = parseEvent(event.parsedJson);
        console.log('TokenCreationEvent:', parsed);
        latestEvents.push(parsed);
      }
      // Keep only the last 100 events in memory
      if (latestEvents.length > 100) {
        latestEvents = latestEvents.slice(-100);
      }
      cursor = result.nextCursor;
    }
  } catch (error) {
    let errorMessage = 'An unknown error occurred while polling TokenCreationEvent';
    if (error instanceof Error) {
      errorMessage = `Error polling TokenCreationEvent: ${error.message}`;
    } else {
      errorMessage = `Error polling TokenCreationEvent: ${String(error)}`;
    }
    console.error(errorMessage);
  }
}

// Poll every 5 seconds
setInterval(pollTokenCreationEvents, 5000);

app.get('/events', (req: Request, res: Response) => {
  res.json(latestEvents);
});

app.listen(PORT, () => {
  console.log(`Express backend listening on http://localhost:${PORT}`);
});
