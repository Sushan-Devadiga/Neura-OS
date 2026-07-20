import os
import io
import time
import logging
from typing import List, Optional, Dict, Any
from pypdf import PdfReader
import docx
from langchain_text_splitters import RecursiveCharacterTextSplitter
from sentence_transformers import SentenceTransformer

logger = logging.getLogger(__name__)

# Initialize the embedding model globally so it's only loaded once in memory
# Model size is ~80MB, will be downloaded on first use.
try:
    _embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
except Exception as e:
    logger.error(f"Failed to load embedding model: {e}")
    _embedding_model = None

class RAGService:
    def __init__(self, supabase_client):
        self.supabase = supabase_client
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=2500, # Approx 500-600 tokens
            chunk_overlap=400,
            length_function=len,
            is_separator_regex=False,
        )

    def extract_text(self, file_bytes: bytes, mime_type: str) -> Optional[str]:
        """Extract text from supported file types."""
        try:
            if mime_type == 'application/pdf':
                reader = PdfReader(io.BytesIO(file_bytes))
                text = ""
                for page in reader.pages:
                    extracted = page.extract_text()
                    if extracted:
                        text += extracted + "\n"
                return text
            elif mime_type == 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
                doc = docx.Document(io.BytesIO(file_bytes))
                return "\n".join([paragraph.text for paragraph in doc.paragraphs])
            elif mime_type in ['text/plain', 'text/markdown']:
                return file_bytes.decode('utf-8')
            else:
                logger.warning(f"Unsupported mime_type for extraction: {mime_type}")
                return None
        except Exception as e:
            logger.error(f"Error extracting text: {e}")
            return None

    def chunk_text(self, text: str) -> List[str]:
        """Split text into semantic chunks."""
        return self.text_splitter.split_text(text)

    def get_embedding(self, text: str) -> List[float]:
        """Generate embedding for a given text."""
        if not _embedding_model:
            raise RuntimeError("Embedding model is not loaded.")
        return _embedding_model.encode(text).tolist()

    async def process_document(self, document_id: str, project_id: str, file_path: str, bucket_name: str = 'project_documents') -> bool:
        """Process a document: download, extract, chunk, embed, and store."""
        try:
            # 1. Download document from Supabase Storage
            res = self.supabase.storage.from_(bucket_name).download(file_path)
            if not res:
                logger.error(f"Failed to download document {file_path}")
                return False
            
            # Fetch document metadata to get mime_type
            doc_resp = self.supabase.table('documents').select('mime_type, file_name').eq('id', document_id).execute()
            if not doc_resp.data:
                logger.error(f"Document record not found for id: {document_id}")
                return False
                
            mime_type = doc_resp.data[0]['mime_type']
            file_name = doc_resp.data[0]['file_name']

            # 2. Extract text
            text = self.extract_text(res, mime_type)
            if not text or not text.strip():
                logger.warning(f"No text extracted from document {document_id}")
                # We can still consider it "processed" (just nothing to index)
                return True

            # 3. Chunk text
            chunks = self.chunk_text(text)
            if not chunks:
                return True

            # 4. Generate embeddings and prepare rows
            rows = []
            for idx, chunk in enumerate(chunks):
                # Optionally add file context to each chunk
                chunk_context = f"Document: {file_name}\n\n{chunk}"
                embedding = self.get_embedding(chunk_context)
                
                rows.append({
                    "document_id": document_id,
                    "project_id": project_id,
                    "chunk_index": idx,
                    "content": chunk_context,
                    "embedding": embedding,
                    "metadata": {"file_name": file_name}
                })

            # 5. Insert into Supabase
            if rows:
                max_retries = 3
                for attempt in range(max_retries):
                    try:
                        self.supabase.table("document_chunks").insert(rows).execute()
                        logger.info(f"Successfully processed and indexed {len(rows)} chunks for document {document_id}")
                        break
                    except Exception as e:
                        if attempt == max_retries - 1:
                            logger.error(f"Failed to insert chunks after {max_retries} attempts: {e}")
                            raise e
                        logger.warning(f"Insert attempt {attempt + 1} failed: {e}. Retrying in 2 seconds...")
                        time.sleep(2)
            
            return True

        except Exception as e:
            logger.error(f"Error processing document {document_id}: {e}")
            return False

    def retrieve_relevant_chunks(self, project_id: str, query: str, limit: int = 5) -> List[Dict[str, Any]]:
        """Retrieve most relevant chunks for a given query in a project."""
        try:
            query_embedding = self.get_embedding(query)
            
            # Call the Postgres function
            # The Supabase Python client uses rpc() to call postgres functions
            response = self.supabase.rpc(
                "match_document_chunks",
                {
                    "query_embedding": query_embedding,
                    "match_threshold": 0.1, # Lowered similarity threshold (cosine similarity)
                    "match_count": limit,
                    "p_project_id": project_id
                }
            ).execute()
            
            return response.data or []
        except Exception as e:
            logger.error(f"Error retrieving chunks: {e}")
            return []
