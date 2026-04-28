-- ============================================================
-- RAG embeddings store (Oracle 19c-compatible)
-- Run manually against the ADB before first use of /api/ai/*
-- ============================================================
CREATE TABLE PROJECT_DOC_EMBEDDINGS (
    ID          NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    SOURCE_TYPE VARCHAR2(20) NOT NULL,
    SOURCE_ID   NUMBER       NOT NULL,
    CONTENT     CLOB         NOT NULL,
    EMBEDDING   BLOB         NOT NULL,
    EMBED_DIM   NUMBER       DEFAULT 1024 NOT NULL,
    UPDATED_AT  TIMESTAMP    DEFAULT SYSTIMESTAMP,
    CONSTRAINT UK_DOC_EMB UNIQUE (SOURCE_TYPE, SOURCE_ID),
    CONSTRAINT CHK_DOC_SRC CHECK (SOURCE_TYPE IN
        ('PROJECT','SPRINT','TASK','USER','KPI_VALUE','DEPLOYMENT','INCIDENT'))
);

CREATE INDEX IDX_PROJ_DOC_TYPE ON PROJECT_DOC_EMBEDDINGS(SOURCE_TYPE);
