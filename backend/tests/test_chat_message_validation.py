
import pytest
from pydantic import ValidationError

from app.routers.chat import SendMessageRequest


def test_valid_message_is_accepted():
    request = SendMessageRequest(text="Hello")
    assert request.text == "Hello"


def test_empty_message_is_rejected():
    with pytest.raises(ValidationError):
        SendMessageRequest(text="")


def test_whitespace_only_message_is_rejected():
    with pytest.raises(
        ValidationError,
        match="Message cannot be empty or whitespace only",
    ):
        SendMessageRequest(text="   ")


def test_message_over_2000_characters_is_rejected():
    with pytest.raises(ValidationError):
        SendMessageRequest(text="x" * 2001)


def test_message_with_exactly_2000_characters_is_accepted():
    message = "x" * 2000
    request = SendMessageRequest(text=message)
    assert len(request.text) == 2000
