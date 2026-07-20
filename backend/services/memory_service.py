import os
import json
import logging
import google.generativeai as genai
from typing import List, Dict, Any, Optional

logger = logging.getLogger(__name__)

class MemoryService:
    def __init__(self, supabase_client):
        self.supabase = supabase_client
        self.api_key = os.getenv("GEMINI_API_KEY")
        if self.api_key and self.api_key != "YOUR_GEMINI_API_KEY_HERE":
            genai.configure(api_key=self.api_key)
            # Use flash for fast extraction
            self.model = genai.GenerativeModel(model_name="gemini-2.5-flash")
        else:
            self.model = None

    def retrieve_relevant_memories(self, project_id: str) -> str:
        """
        Fetch memories for the project to inject into the context engine.
        Prioritizes pinned and high-importance memories, and recently updated ones.
        """
        try:
            # Fetch unarchived memories for the project
            resp = self.supabase.table("memories") \
                .select("*") \
                .eq("project_id", project_id) \
                .eq("is_archived", False) \
                .order("is_pinned", desc=True) \
                .order("importance", desc=True) \
                .order("updated_at", desc=True) \
                .limit(20) \
                .execute()
            
            memories = resp.data or []
            if not memories:
                return ""
            
            context_lines = ["\n--- LONG-TERM MEMORY ---", "The following are important facts, preferences, and decisions remembered from past conversations:"]
            
            for mem in memories:
                badge = ""
                if mem.get("is_pinned"):
                    badge += "[PINNED] "
                badge += f"[{mem.get('category').upper()}]"
                
                context_lines.append(f"- {badge} {mem.get('content')}")
            
            context_lines.append("Use these memories to inform your responses, ensuring you follow user preferences and acknowledge past decisions.")
            context_lines.append("------------------------\n")
            
            return "\n".join(context_lines)
            
        except Exception as e:
            logger.error(f"Failed to retrieve memories: {e}")
            return ""

    async def extract_and_save_memories(self, user_message: str, ai_response: str, project_id: str, user_id: str):
        """
        Analyzes the conversation and extracts any new, meaningful memories.
        """
        if not self.model:
            logger.warning("MemoryService: Gemini API key not configured, skipping extraction.")
            return

        system_prompt = """
        You are the Memory Extraction Engine for NeuraOS.
        Your job is to analyze the latest exchange between a User and the AI Assistant.
        Identify any NEW, MEANINGFUL long-term memories that should be retained for future interactions.
        
        Categories:
        - preference: How the user likes things done (e.g., "always use TypeScript").
        - project decision: A concrete decision made about the project (e.g., "we decided to use PostgreSQL").
        - architecture: System architecture choices.
        - goal: Long term or short term goals of the project.
        - fact: Important context or facts given by the user.
        - coding style: Rules about coding (e.g., "use 2 spaces for indentation").
        - writing style: Rules about tone/writing (e.g., "keep responses concise").
        
        Rules:
        - Only extract TRULY IMPORTANT information.
        - Ignore greetings, temporary context, complaints, or small talk.
        - If nothing new/important is found, return an empty list.
        - Output your response exactly as a JSON array of objects. Do not include markdown formatting (like ```json), just the raw JSON array.
        
        Format:
        [
            {
                "content": "The extracted memory concisely written",
                "category": "preference|project decision|architecture|goal|fact|coding style|writing style",
                "importance": "low|medium|high"
            }
        ]
        """
        
        prompt = f"""
        User Message: {user_message}
        
        AI Response: {ai_response}
        
        Extract any new memories based on the system instructions.
        """

        try:
            response = self.model.generate_content(
                contents=[
                    {"role": "user", "parts": [system_prompt]},
                    {"role": "user", "parts": [prompt]}
                ]
            )
            
            response_text = response.text.strip()
            # Clean up markdown if the LLM still added it
            if response_text.startswith("```json"):
                response_text = response_text[7:]
            if response_text.startswith("```"):
                response_text = response_text[3:]
            if response_text.endswith("```"):
                response_text = response_text[:-3]
                
            memories_to_add = json.loads(response_text.strip())
            
            if not memories_to_add or not isinstance(memories_to_add, list):
                return
                
            # Insert into database
            rows = []
            for mem in memories_to_add:
                # Sanitize category/importance
                cat = mem.get("category", "fact").lower()
                imp = mem.get("importance", "medium").lower()
                
                valid_cats = ["preference", "project decision", "architecture", "goal", "fact", "coding style", "writing style"]
                valid_imps = ["low", "medium", "high"]
                
                if cat not in valid_cats: cat = "fact"
                if imp not in valid_imps: imp = "medium"
                
                rows.append({
                    "user_id": user_id,
                    "project_id": project_id,
                    "content": mem.get("content"),
                    "category": cat,
                    "importance": imp
                })
                
            if rows:
                self.supabase.table("memories").insert(rows).execute()
                logger.info(f"Successfully extracted and saved {len(rows)} new memories.")
                
        except json.JSONDecodeError:
            logger.warning("MemoryService: Failed to parse LLM memory output as JSON.")
        except Exception as e:
            logger.error(f"MemoryService: Error extracting memories: {e}")
