# Python SDK

## Requirements

- Python 3.10+

## Get Started

`pip install kadoa-sdk`

It is recommended to store Kadoa credentials in a `.env` file and use the `python-dotenv` library to make the API key available at runtime. Also, ensure that these `.env` files are excluded from version control.

### Client Initialization

```python
import os
from kadoa_sdk import Kadoa
kadoa_props = {
    "api_key": None,
    "team_api_key": os.getenv("KADOA_TEAM_API_KEY")
}
kadoa_client = Kadoa(**kadoa_props)
```
- `team_api_key` is required for enterprise features, where applicable.
- `api_key` represents a personal API key, used where a personal API key is applicable.

## Features

### Real-time Events Monitoring

You can bring your own processing function to handle real-time monitoring events, as shown below:

```python
def custom_process_event(event):
    # Process event

kadoa_client.realtime.listen(custom_process_event)
```

If authentication succeeds for `realtime.listen`, you should see "Connected" displayed and receive heartbeat events similar to this: `Heartbeat received {'type': 'heartbeat', 'timestamp': 1736101321032}` periodically (e.g., every 15 seconds).

The client will automatically attempt to reconnect if it does not receive a heartbeat.

Note that if a monitoring message is not delivered during the reconnection process, it will be delivered as soon as the client reconnects (either manually when restarting the program or automatically if no heartbeat is received).

