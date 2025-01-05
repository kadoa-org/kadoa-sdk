# Python SDK

## Usage

### Installation

`pip install kadoa-sdk`

### Usage

```python
from kadoa_sdk import Kadoa
kadoa_props = {
    "api_key": None,
    "team_api_key": os.getenv("KADOA_TEAM_API_KEY")
}
kadoa_client = Kadoa(**kadoa_props)
kadoa_client.realtime.listen(process_event)
```

## Examples

### Requirements

- uv https://github.com/astral-sh/uv
- Kadoa API key configured


Create a `.env` file, add the following content:

```bash
KADOA_TEAM_API_KEY=<YOUR_TEAM_API_KEY>
```

### Get started

Install dependencies

`uv sync`

Start example

`uv run examples/realtime_events.py`
