import os
import threading
import asyncio
import google.generativeai as genai

def _run_async_tool(coro):
    """Safely runs an async coroutine from a synchronous context that might already have a running event loop."""
    result = []
    exception = []

    def thread_target():
        try:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            res = loop.run_until_complete(coro)
            result.append(res)
        except Exception as e:
            exception.append(e)
        finally:
            loop.close()

    t = threading.Thread(target=thread_target)
    t.start()
    t.join()

    if exception:
        raise exception[0]
    return result[0]

class ChatService:
    """
    The single place that communicates with Gemini.
    """
    def generate_response(self, system_instruction: str, history: list, last_message: str, model_name: str = "gemini-2.5-flash", temperature: float = 0.7, tools: list = None) -> str:
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key or api_key == "YOUR_GEMINI_API_KEY_HERE":
            return f"Simulated backend response. I received your message: '{last_message}'. Please configure GEMINI_API_KEY to get real responses."
            
        try:
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel(
                model_name=model_name,
                system_instruction=system_instruction,
                generation_config=genai.types.GenerationConfig(temperature=temperature),
                tools=tools if tools else None
            )
            
            chat = model.start_chat(history=history)
            response = chat.send_message(last_message)
            
            # Handle tool calling loop
            while True:
                has_function_call = False
                for part in response.parts:
                    if getattr(part, 'function_call', None):
                        has_function_call = True
                        func_name = part.function_call.name
                        func_args = part.function_call.args
                        
                        from services.payload_converter import normalize_payload
                        func_args_normalized = normalize_payload(func_args, workflow_name=func_name)
                        
                        if isinstance(func_args_normalized, dict) and func_args_normalized.get("status") == "error":
                            result = func_args_normalized
                        else:
                            func_args = func_args_normalized
                            # Find the corresponding python function
                            func_to_call = next((f for f in tools if f.__name__ == func_name), None)
                            
                            if func_to_call:
                                try:
                                    if asyncio.iscoroutinefunction(func_to_call):
                                        result = _run_async_tool(func_to_call(**func_args))
                                    else:
                                        result = func_to_call(**func_args)
                                        
                                    if isinstance(result, dict) and result.get("status") == "requires_confirmation":
                                        class RequiresConfirmationError(Exception):
                                            def __init__(self, tool_name, tool_args, message):
                                                self.tool_name = tool_name
                                                self.tool_args = tool_args
                                                self.message = message
                                                super().__init__(self.message)
                                        raise RequiresConfirmationError(func_name, func_args, result.get("error"))
                                except Exception as e:
                                    if type(e).__name__ == "RequiresConfirmationError":
                                        raise e
                                    result = {"status": "error", "error": str(e)}
                            else:
                                result = {"status": "error", "error": f"Function {func_name} not found"}
                            
                        # Send the result back to Gemini
                        response = chat.send_message(
                            {
                                "role": "user",
                                "parts": [
                                    {
                                        "function_response": {
                                            "name": func_name,
                                            "response": {"result": result}
                                        }
                                    }
                                ]
                            }
                        )
                        break # Process the next response from the model
                        
                if not has_function_call:
                    break
                    
            return response.text
        except Exception as e:
            if type(e).__name__ == "RequiresConfirmationError":
                raise e
            error_msg = str(e)
            if "Quota exceeded" in error_msg or "429" in error_msg:
                raise Exception("API rate limit exceeded. Please wait a moment and try again, or check your API key quotas.")
            raise Exception(f"Gemini API Error: {error_msg}")
