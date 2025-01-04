from modules.core import Kadoa
import os

def process_event(event):
    print(f"Received event: {event['id']}, type: {event['type']}")

if __name__ == '__main__':
    from dotenv import load_dotenv
    load_dotenv()
    kadoa_props = {
        "api_key": None,
        "team_api_key": os.getenv("KADOA_TEAM_API_KEY")
    }
    kadoa_client = Kadoa(**kadoa_props)
    kadoa_client.realtime.listen(process_event)