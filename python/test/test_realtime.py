import os, sys
mypath = os.path.join(os.path.dirname(__file__), "..")
sys.path.append(mypath)

import pytest
import json
import time
import threading
from unittest.mock import MagicMock, patch
from modules.realtime import Realtime

@pytest.fixture
def mock_requests_post():
    with patch("requests.post") as mock_post:
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "access_token": "mock_access_token",
            "team_id": "mock_team_id"
        }
        mock_post.return_value = mock_response
        yield mock_post

@pytest.fixture
def mock_websocket():
    with patch("websocket.WebSocketApp") as mock_ws:
        yield mock_ws

@pytest.fixture
def realtime_instance(mock_requests_post, mock_websocket):
    instance = Realtime(team_api_key="mock_api_key")
    instance.socket = MagicMock()  # Ensure socket is mocked properly
    return instance

def test_init_missing_api_key():
    with pytest.raises(ValueError, match="teamApiKey is required for Realtime connection"):
        Realtime(team_api_key=None)

def test_connect_success(realtime_instance, mock_requests_post, mock_websocket):
    realtime_instance.connect()

    assert realtime_instance.is_connecting is True
    mock_requests_post.assert_called_once()
    mock_websocket.assert_called_once()

def test_connect_failure(mock_requests_post):
    mock_requests_post.side_effect = Exception("Connection failed")
    realtime = Realtime(team_api_key="mock_api_key")

    with patch("threading.Timer.start") as mock_timer:
        realtime.connect()
        mock_timer.assert_called_once()

def test_on_open(realtime_instance):
    ws_mock = MagicMock()
    realtime_instance.team_id = "mock_team_id"  # Explicitly set team_id
    realtime_instance.socket = ws_mock  # Ensure socket is assigned before testing
    realtime_instance.on_open(ws_mock)

    assert realtime_instance.is_connecting is False
    assert realtime_instance.last_heartbeat <= time.time()
    ws_mock.send.assert_called_once_with(json.dumps({"action": "subscribe", "channel": "mock_team_id"}))
    
def test_on_message_handle_heartbeat(realtime_instance):
    ws_mock = MagicMock()
    message = json.dumps({"type": "heartbeat"})
    realtime_instance.on_message(ws_mock, message)

    assert realtime_instance.last_heartbeat <= time.time()

def test_on_message_handle_event(realtime_instance):
    ws_mock = MagicMock()
    event_data = {"type": "event", "data": "test"}
    message = json.dumps(event_data)

    mock_callback = MagicMock()
    realtime_instance.listen(mock_callback)
    realtime_instance.on_message(ws_mock, message)

    mock_callback.assert_called_once_with(event_data)

def test_on_close(realtime_instance):
    ws_mock = MagicMock()
    with patch("threading.Timer.start") as mock_timer:
        realtime_instance.on_close(ws_mock, 1000, "Closed")
        mock_timer.assert_called_once()

def test_on_error(realtime_instance):
    ws_mock = MagicMock()
    error = "Test error"
    realtime_instance.on_error(ws_mock, error)

    assert realtime_instance.is_connecting is False

# def test_heartbeat_monitor(realtime_instance):
#     realtime_instance.last_heartbeat = time.time() - 31
#     realtime_instance.socket = MagicMock()

#     with patch("time.sleep", side_effect=InterruptedError):
#         with pytest.raises(InterruptedError):
#             threading.Thread(target=realtime_instance.start_heartbeat_check).start()

#     realtime_instance.socket.close.assert_called_once()

def test_listen(realtime_instance):
    callback = MagicMock()
    realtime_instance.listen(callback)
    assert realtime_instance.handle_event == callback
