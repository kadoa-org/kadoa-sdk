# Python SDK

## Get Started

`pip install kadoa-sdk`

It's recommended to store Kadoa credentials in a `.env` file and use `python-dotenv` library to make api key available to the runtime. Also make sure those .env files are excluded from version control.

### Client initialization

```python
import os
from kadoa_sdk import Kadoa
kadoa_props = {
    "api_key": None,
    "team_api_key": os.getenv("KADOA_TEAM_API_KEY")
}
kadoa_client = Kadoa(**kadoa_props)
```
- `team_api_key` is required for enterprise features, where applicable
- `api_key` stands for personal API key, used where personal API key is applicable

## Features

### Realtime events monitoring

You can bring your own processing function to process real-time monitoring events as below:

```python
def custom_process_env(event):
    # process event

kadoa_client.realtime.listen(custom_process_env)
```

If authentication worked for realtime.listen, you should see "Connected" displayed and Heartbeat events similar to this `Heartbeat received {'type': 'heartbeat', 'timestamp': 1736101321032}` on a periodic basis (e.g.: every 15s).

The client will automatically try to reconnect if it doesn't receive a heartbeat.
Note that, if a monitoring message isn't delivered during that reconnection process, it'll be delivered as soon as the client reconnects (manually when restarting the program or automatically if no heartbeat is received).

