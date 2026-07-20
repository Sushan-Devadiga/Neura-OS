# Database Architecture

The project uses **Supabase**, which provides a managed **PostgreSQL** database.

## Connection Flow
- The frontend authenticates via Supabase Auth.
- The frontend sends a JWT token to the backend.
- The FastAPI backend creates a user-scoped Supabase client per request using `create_client` with the JWT token injected in the headers.
- All database queries are executed via this Supabase Python client (`supabase-py`), relying on Row Level Security (RLS) to enforce data privacy.

## ORM / Repositories
- There is no traditional ORM like SQLAlchemy actively defining models.
- The project uses the Supabase query builder (e.g., `supabase.table("projects").select("*").execute()`).
- The database schema is defined directly in SQL migration/setup files located in the `supabase/` folder (e.g., `setup_projects.sql`, `setup_chat.sql`).

## Core Tables & Relationships
- **users** (managed by Supabase Auth): Core user accounts.
- **projects**: Belongs to a user.
- **chat_sessions**: Belongs to a user and a project.
- **messages**: Belongs to a `chat_session` and a user. Contains role (`user` or `assistant`) and content.
- **memories**: Belongs to a project and user. Stores facts extracted from chats.
- **documents**: Belongs to a project and user. Represents uploaded files.
- **document_chunks**: Used for RAG. Belongs to a document. Contains vector embeddings.
- **notes**: Belongs to a project and user.
- **tasks**: Belongs to a project and user. Represents to-dos.
- **knowledge_nodes** & **knowledge_edges**: Belongs to a project. Represents graph database connections for the project's knowledge graph.
