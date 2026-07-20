import logging
import dataclasses
from collections.abc import Mapping
from typing import Any

logger = logging.getLogger(__name__)

def normalize_payload(payload: Any, workflow_name: str = "unknown") -> dict:
    """
    Recursively converts Gemini MapComposite, Pydantic models, dataclasses,
    and other objects into standard Python dictionaries.
    """
    original_type = type(payload).__name__
    
    def _convert(obj: Any) -> Any:
        if isinstance(obj, dict):
            return {k: _convert(v) for k, v in obj.items()}
        elif isinstance(obj, Mapping):
            return {k: _convert(v) for k, v in obj.items()}
        elif isinstance(obj, list):
            return [_convert(x) for x in obj]
        elif hasattr(obj, "dict") and callable(getattr(obj, "dict")):
            return _convert(obj.dict())
        elif hasattr(obj, "model_dump") and callable(getattr(obj, "model_dump")):
            return _convert(obj.model_dump())
        elif dataclasses.is_dataclass(obj) and not isinstance(obj, type):
            return _convert(dataclasses.asdict(obj))
        elif hasattr(obj, "__iter__") and not isinstance(obj, (str, bytes)):
            return [_convert(x) for x in obj]
        else:
            return obj

    try:
        if payload is None:
            return {"status": "error", "error": "Payload cannot be None."}
            
        converted = _convert(payload)
        
        if not isinstance(converted, dict):
            return {"status": "error", "error": f"Normalized payload must be a dictionary, got {type(converted).__name__}"}
            
        # Extract keys for safe preview
        preview = list(converted.keys())
        
        # Determine actual workflow name if it's trigger_workflow
        actual_workflow = converted.get("workflow_name", workflow_name)
        
        logger.info(f"Original payload type: {original_type}")
        logger.info(f"Converted payload type: {type(converted).__name__}")
        logger.info(f"Workflow: {actual_workflow}")
        logger.info(f"Payload preview keys: {preview}")
        
        return converted
    except Exception as e:
        logger.error(f"Payload conversion failed: {str(e)}")
        return {"status": "error", "error": f"Invalid payload format: {str(e)}"}
