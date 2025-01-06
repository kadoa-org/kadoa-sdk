# Kadoa node SDK

## Get Started

`npm install @kadoa/node`

It is recommended to store Kadoa credentials in an `.env` file and use a library like `dotenv` to load environment variables at runtime. Ensure these `.env` files are excluded from version control.

### Client Initialization

```typescript
import dotenv from 'dotenv';
dotenv.config();
import { Kadoa } from '@kadoa/node';
import type {IKadoaProps} from '@kadoa/node';

const kadoaProps: IKadoaProps = {
  teamApiKey: process.env.KADOA_TEAM_API_KEY,
};
const kadoaClient = new Kadoa(kadoaProps);
```
- `teamApiKey` is required for enterprise features, where applicable.

## Features

### Real-time Events Monitoring

You can bring your own processing function to handle real-time monitoring events, as shown below:

```typescript
function customProcessEvent(event: any) {
  console.log("Event received:", event);
}

kadoaClient.realtime.listen(customProcessEvent);
```

If authentication succeeds for `realtime.listen`, you should see "Connected" displayed and receive heartbeat events similar to this:

```
Heartbeat received { type: 'heartbeat', timestamp: 1736101321032 }
```
periodically (e.g., every 15 seconds).

The client will automatically attempt to reconnect if it does not receive a heartbeat.

Note that if a monitoring message is not delivered during the reconnection process, it will be delivered as soon as the client reconnects (either manually when restarting the program or automatically if no heartbeat is received).

