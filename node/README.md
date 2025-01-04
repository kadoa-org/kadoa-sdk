# NodeJS SDK

## Usage

### Installation

`npm i @kadoa/node`

### Usage

Realtime Events

```typescript
const kClientProps: IKadoaProps = {
  teamApiKey: process.env.KADOA_TEAM_API_KEY,
};
const kClient = new Kadoa(kClientProps);

kClient.realtime.listen((event) => {
  console.log("event received", event);
});
```

## Examples

### Requirements

- Bun https://bun.sh/docs/installation
- Kadoa API key configured

Create a `.env` file, add the following content:

```bash
KADOA_TEAM_API_KEY=<YOUR_TEAM_API_KEY>
```

### Get started

`bun dev`
