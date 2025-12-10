"""
Embedding Service
FastAPI service for generating embeddings using SentenceTransformers
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from sentence_transformers import SentenceTransformer
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Embedding Service", version="1.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load model
EMBEDDING_MODEL = os.getenv('EMBEDDING_MODEL', 'all-mpnet-base-v2')
model = None

def load_model():
    """Load SentenceTransformer model"""
    global model
    if model is None:
        print(f"Loading embedding model: {EMBEDDING_MODEL}...")
        model = SentenceTransformer(EMBEDDING_MODEL)
        print(f"✅ Model loaded (dimension: {model.get_sentence_embedding_dimension()})")
    return model

@app.on_event("startup")
async def startup_event():
    """Load model on startup"""
    load_model()

class EmbeddingRequest(BaseModel):
    text: str

class BatchEmbeddingRequest(BaseModel):
    texts: List[str]

@app.get("/health")
async def health():
    return {"status": "healthy", "service": "embedding-service", "model": EMBEDDING_MODEL}

@app.post("/v1/embeddings/generate")
async def generate_embedding(request: EmbeddingRequest):
    """Generate embedding for a single text"""
    try:
        model = load_model()
        embedding = model.encode(
            request.text,
            normalize_embeddings=True,
            convert_to_numpy=True
        )
        
        return {
            "embedding": embedding.tolist(),
            "dimensions": len(embedding),
            "model": EMBEDDING_MODEL
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/v1/embeddings/batch")
async def generate_batch_embeddings(request: BatchEmbeddingRequest):
    """Generate embeddings for multiple texts"""
    try:
        model = load_model()
        embeddings = model.encode(
            request.texts,
            batch_size=32,
            normalize_embeddings=True,
            convert_to_numpy=True,
            show_progress_bar=False
        )
        
        return {
            "embeddings": [emb.tolist() for emb in embeddings],
            "dimensions": len(embeddings[0]) if len(embeddings) > 0 else 0,
            "count": len(embeddings),
            "model": EMBEDDING_MODEL
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/v1/embeddings/profile/{profile_id}")
async def generate_profile_embedding(profile_id: str):
    """Generate embedding for a profile (fetches from database)"""
    try:
        import psycopg2
        import psycopg2.extras
        
        # Connect to database
        conn = psycopg2.connect(
            host=os.getenv('POSTGRES_HOST', 'localhost'),
            port=int(os.getenv('POSTGRES_PORT', 5432)),
            database=os.getenv('POSTGRES_DB', 'retail_brain'),
            user=os.getenv('POSTGRES_USER', 'retail_brain_user'),
            password=os.getenv('POSTGRES_PASSWORD', 'retail_brain_pass')
        )
        
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                """
                SELECT 
                    full_name,
                    city,
                    state,
                    segment,
                    ltv,
                    total_orders
                FROM customer_profile
                WHERE id = %s
                """,
                [profile_id]
            )
            
            profile = cur.fetchone()
            if not profile:
                raise HTTPException(status_code=404, detail="Profile not found")
            
            # Generate text representation
            parts = []
            if profile.get('full_name'):
                parts.append(f"Customer name: {profile['full_name']}")
            if profile.get('city') and profile.get('state'):
                parts.append(f"Location: {profile['city']}, {profile['state']}")
            if profile.get('segment'):
                parts.append(f"Segment: {profile['segment']}")
            if profile.get('ltv'):
                parts.append(f"Lifetime value: {profile['ltv']}")
            
            text = ". ".join(parts) if parts else "Customer profile"
            
            # Generate embedding
            model = load_model()
            embedding = model.encode(text, normalize_embeddings=True, convert_to_numpy=True)
            
            # Update database
            cur.execute(
                """
                UPDATE customer_profile
                SET embedding = %s::vector
                WHERE id = %s
                """,
                [str(embedding.tolist()), profile_id]
            )
            conn.commit()
            conn.close()
            
            return {
                "profile_id": profile_id,
                "embedding": embedding.tolist(),
                "dimensions": len(embedding),
                "model": EMBEDDING_MODEL
            }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv('EMBEDDING_SERVICE_PORT', 3016))
    uvicorn.run(app, host="0.0.0.0", port=port)

