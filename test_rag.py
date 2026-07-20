import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv("backend/.env")

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_ANON_KEY")

supabase = create_client(url, key)

# Let's get the project id from the documents table
docs = supabase.table("documents").select("project_id").limit(1).execute()
if not docs.data:
    print("No documents found")
    exit(1)
    
project_id = docs.data[0]["project_id"]
print(f"Testing with project_id: {project_id}")

# Let's get the actual chunks to see what's in there
chunks = supabase.table("document_chunks").select("content").eq("project_id", project_id).execute()
print(f"Chunks found: {len(chunks.data)}")
if chunks.data:
    print("Sample content length:", len(chunks.data[0]["content"]))
    print("Sample content preview:", chunks.data[0]["content"][:100])
