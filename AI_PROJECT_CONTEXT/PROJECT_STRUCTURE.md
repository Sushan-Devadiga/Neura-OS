# Project Structure

```
project_root/
├── .env.local
├── package.json
├── package-lock.json
├── vite.config.ts
├── tsconfig.json
├── eslint.config.js
├── backend/
│   ├── .env (contains <REDACTED> keys)
│   ├── requirements.txt
│   ├── main.py
│   ├── context_engine.py
│   ├── routes/
│   │   ├── agents.py
│   │   ├── chat.py
│   │   ├── document.py
│   │   ├── graph.py
│   │   ├── memory.py
│   │   ├── prompts.py
│   │   └── tool_router.py
│   └── services/
│       ├── agent_service.py
│       ├── chat_service.py
│       ├── graph_service.py
│       ├── memory_service.py
│       ├── rag_service.py
│       └── tool_service.py
├── src/
│   ├── assets/
│   ├── components/
│   ├── hooks/
│   ├── integrations/
│   │   ├── lovable/
│   │   └── supabase/
│   ├── lib/
│   ├── routes/
│   ├── types/
│   ├── router.tsx
│   ├── server.ts
│   ├── start.ts
│   └── styles.css
└── supabase/
    ├── config.toml
    ├── fix_everything.sql
    ├── fix_projects_schema.sql
    ├── setup_chat.sql
    ├── setup_documents.sql
    ├── setup_graph.sql
    ├── setup_memories.sql
    ├── setup_notes.sql
    ├── setup_projects.sql
    ├── setup_prompts.sql
    ├── setup_rag.sql
    └── setup_tasks.sql
```
