import pytest
from pydantic import BaseModel
import dataclasses
from services.payload_converter import normalize_payload

class MockMapComposite:
    """Mock for Gemini's MapComposite which implements the Mapping interface."""
    def __init__(self, data):
        self._data = data

    def __getitem__(self, key):
        return self._data[key]

    def __iter__(self):
        return iter(self._data)

    def __len__(self):
        return len(self._data)

    def keys(self):
        return self._data.keys()
        
    def items(self):
        return self._data.items()
        
    def values(self):
        return self._data.values()

# Register as Mapping so isinstance(x, Mapping) is True
from collections.abc import Mapping
Mapping.register(MockMapComposite)


class MockPydanticModel(BaseModel):
    name: str
    age: int


@dataclasses.dataclass
class MockDataclass:
    title: str
    active: bool


def test_dict_payload():
    payload = {"workflow_name": "test", "payload": {"key": "value"}}
    result = normalize_payload(payload)
    assert result == payload
    assert isinstance(result, dict)


def test_mapcomposite_payload():
    payload = MockMapComposite({"name": "John", "role": "admin"})
    result = normalize_payload(payload)
    assert result == {"name": "John", "role": "admin"}
    assert isinstance(result, dict)


def test_nested_mapcomposite():
    inner = MockMapComposite({"detail": "nested value"})
    payload = MockMapComposite({"workflow_name": "test", "payload": inner})
    result = normalize_payload(payload)
    assert result == {"workflow_name": "test", "payload": {"detail": "nested value"}}
    assert isinstance(result["payload"], dict)


def test_pydantic_model_payload():
    payload = MockPydanticModel(name="Alice", age=30)
    result = normalize_payload(payload)
    assert result == {"name": "Alice", "age": 30}


def test_dataclass_payload():
    payload = MockDataclass(title="Task", active=True)
    result = normalize_payload(payload)
    assert result == {"title": "Task", "active": True}


def test_none_payload():
    result = normalize_payload(None)
    assert result == {"status": "error", "error": "Payload cannot be None."}


def test_invalid_payload_not_dict():
    # normalize_payload returns a JSON structured error if top-level isn't dict
    result = normalize_payload(["list", "of", "items"])
    assert result.get("status") == "error"
    assert "Normalized payload must be a dictionary" in result.get("error", "")

def test_mapping_payload():
    class CustomMapping(Mapping):
        def __init__(self, data):
            self.data = data
        def __getitem__(self, key):
            return self.data[key]
        def __iter__(self):
            return iter(self.data)
        def __len__(self):
            return len(self.data)
            
    payload = CustomMapping({"key": "value"})
    result = normalize_payload(payload)
    assert result == {"key": "value"}
