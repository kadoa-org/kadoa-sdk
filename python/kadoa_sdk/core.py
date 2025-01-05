from .realtime import Realtime

class Kadoa:
    def __init__(self, api_key=None, team_api_key=None):
        if not api_key and not team_api_key:
            raise ValueError("apiKey or teamApiKey must be passed")

        self.team_api_key = team_api_key
        self._realtime = None

    @property
    def realtime(self):
        if not self._realtime:
            self._realtime = Realtime(self.team_api_key)
        return self._realtime
