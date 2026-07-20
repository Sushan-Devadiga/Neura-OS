# Dependencies

### Backend (`requirements.txt`)
- **FastAPI**: The core web framework for the backend API. Fast, async-ready, and generates OpenAPI docs.
- **Uvicorn**: The ASGI server that runs the FastAPI application.
- **Supabase**: The official Python client for interacting with the Supabase database and authentication.
- **google-generativeai**: The official Google SDK for communicating with Gemini models.
- **pydantic**: Used by FastAPI for data validation and schema definition.
- **python-dotenv**: Loads environment variables from `.env` files.
- **sentence-transformers**: Used for generating local vector embeddings for RAG.
- **pypdf**: Used for extracting text from PDF documents for RAG.
- **python-docx**: Used for extracting text from Word documents for RAG.
- **langchain-text-splitters**: Used to chunk documents into smaller pieces before vector embedding.

### Frontend (`package.json`)
- **React 19 & Vite**: Core frontend framework and bundler.
- **@tanstack/react-router**: Used for declarative routing in the React app.
- **@supabase/supabase-js**: Used for frontend authentication and direct database queries if any.
- **TailwindCSS**: Core styling framework.
- **Radix UI**: Unstyled UI primitives used to build accessible components (Accordion, Dialog, Select, etc.).
- **react-force-graph-2d**: Used to visualize the knowledge graph.
- **Lucide React**: Icon library.
- **Zod**: Schema validation on the frontend.
