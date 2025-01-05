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
def realtime_instance(mock_requests_post, mock_websocket, request):
    # Create instance of Realtime class
    instance = Realtime(team_api_key="mock_api_key")
    instance.socket = MagicMock()  # Ensure socket is mocked properly
    
    # Register a finalizer to close the connection after all tests are done
    def close_socket():
        if instance.socket:
            instance.disconnect()  # Ensure the disconnect is called after all tests
    request.addfinalizer(close_socket)
    
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

def test_on_message_handle_event_with_ack(realtime_instance):
    ws_mock = MagicMock()
    event_data = {"type": "event", "data": "test", "id": "1234"}
    message = json.dumps(event_data)

    mock_callback = MagicMock()
    realtime_instance.listen(mock_callback)

    with patch("requests.post") as mock_ack_post:
        mock_ack_response = MagicMock()
        mock_ack_response.status_code = 200
        mock_ack_post.return_value = mock_ack_response

        realtime_instance.on_message(ws_mock, message)

        mock_ack_post.assert_called_once_with(
            "https://realtime.kadoa.com/api/v1/events/ack",
            headers={"Content-Type": "application/json"},
            json={"id": "1234"}
        )
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
    ws_mock.close.assert_called_once()
