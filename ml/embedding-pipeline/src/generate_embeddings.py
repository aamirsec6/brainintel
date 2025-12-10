"""
Batch Embedding Generation Pipeline
Generates embeddings for profiles and events using SentenceTransformers
"""
import os
import sys
import psycopg2
import psycopg2.extras
import numpy as np
from sentence_transformers import SentenceTransformer
from typing import List, Dict, Optional
from tqdm import tqdm
from dotenv import load_dotenv
import json

load_dotenv()

# Model configuration
EMBEDDING_MODEL = os.getenv('EMBEDDING_MODEL', 'all-mpnet-base-v2')
EMBEDDING_DIM = 768  # all-mpnet-base-v2 dimension


class EmbeddingGenerator:
    """Generate embeddings using SentenceTransformers"""
    
    def __init__(self):
        self.model = None
        self.conn = None
        self._load_model()
        self._connect_db()
    
    def _load_model(self):
        """Load SentenceTransformer model"""
        print(f"Loading embedding model: {EMBEDDING_MODEL}...")
        try:
            self.model = SentenceTransformer(EMBEDDING_MODEL)
            print(f"✅ Model loaded successfully (dimension: {self.model.get_sentence_embedding_dimension()})")
        except Exception as e:
            print(f"❌ Failed to load model: {e}")
            raise
    
    def _connect_db(self):
        """Connect to PostgreSQL"""
        self.conn = psycopg2.connect(
            host=os.getenv('POSTGRES_HOST', 'localhost'),
            port=int(os.getenv('POSTGRES_PORT', 5432)),
            database=os.getenv('POSTGRES_DB', 'retail_brain'),
            user=os.getenv('POSTGRES_USER', 'retail_brain_user'),
            password=os.getenv('POSTGRES_PASSWORD', 'retail_brain_pass')
        )
    
    def generate_profile_text(self, profile: Dict) -> str:
        """Generate text representation of profile for embedding"""
        parts = []
        
        if profile.get('full_name'):
            parts.append(f"Customer name: {profile['full_name']}")
        
        if profile.get('city') and profile.get('state'):
            parts.append(f"Location: {profile['city']}, {profile['state']}")
        
        if profile.get('segment'):
            parts.append(f"Segment: {profile['segment']}")
        
        if profile.get('ltv'):
            parts.append(f"Lifetime value: {profile['ltv']}")
        
        if profile.get('total_orders'):
            parts.append(f"Total orders: {profile['total_orders']}")
        
        return ". ".join(parts) if parts else "Customer profile"
    
    def generate_event_text(self, event: Dict) -> str:
        """Generate text representation of event for embedding"""
        parts = []
        
        if event.get('event_type'):
            parts.append(f"Event: {event['event_type']}")
        
        if event.get('payload'):
            payload = event['payload']
            if isinstance(payload, str):
                payload = json.loads(payload)
            
            if payload.get('product_name'):
                parts.append(f"Product: {payload['product_name']}")
            if payload.get('category'):
                parts.append(f"Category: {payload['category']}")
            if payload.get('sku'):
                parts.append(f"SKU: {payload['sku']}")
        
        return ". ".join(parts) if parts else "Event"
    
    def generate_embeddings_batch(self, texts: List[str], batch_size: int = 32) -> np.ndarray:
        """Generate embeddings for a batch of texts"""
        if not texts:
            return np.array([])
        
        embeddings = self.model.encode(
            texts,
            batch_size=batch_size,
            show_progress_bar=True,
            convert_to_numpy=True,
            normalize_embeddings=True
        )
        
        return embeddings
    
    def update_profile_embeddings(self, limit: Optional[int] = None):
        """Generate and update embeddings for all profiles"""
        print("\n📊 Generating profile embeddings...")
        
        with self.conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            query = """
                SELECT 
                    id,
                    full_name,
                    city,
                    state,
                    segment,
                    ltv,
                    total_orders,
                    tags
                FROM customer_profile
                WHERE is_merged = false
            """
            
            if limit:
                query += f" LIMIT {limit}"
            
            cur.execute(query)
            profiles = cur.fetchall()
            
            print(f"Found {len(profiles)} profiles to process")
            
            # Process in batches
            batch_size = 32
            texts = []
            profile_ids = []
            
            for profile in tqdm(profiles, desc="Processing profiles"):
                text = self.generate_profile_text(dict(profile))
                texts.append(text)
                profile_ids.append(profile['id'])
                
                if len(texts) >= batch_size:
                    embeddings = self.generate_embeddings_batch(texts, batch_size)
                    self._save_profile_embeddings(profile_ids, embeddings)
                    texts = []
                    profile_ids = []
            
            # Process remaining
            if texts:
                embeddings = self.generate_embeddings_batch(texts, batch_size)
                self._save_profile_embeddings(profile_ids, embeddings)
            
            print(f"✅ Updated embeddings for {len(profiles)} profiles")
    
    def _save_profile_embeddings(self, profile_ids: List[str], embeddings: np.ndarray):
        """Save embeddings to database"""
        with self.conn.cursor() as cur:
            for i, profile_id in enumerate(profile_ids):
                embedding_vector = embeddings[i].tolist()
                
                cur.execute(
                    """
                    UPDATE customer_profile
                    SET embedding = %s::vector
                    WHERE id = %s
                    """,
                    [str(embedding_vector), profile_id]
                )
            
            self.conn.commit()
    
    def update_event_embeddings(self, limit: Optional[int] = None):
        """Generate embeddings for recent events"""
        print("\n📊 Generating event embeddings...")
        
        with self.conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            query = """
                SELECT 
                    e.id,
                    e.event_type,
                    e.payload,
                    e.event_ts
                FROM events e
                WHERE e.payload IS NOT NULL
                ORDER BY e.event_ts DESC
            """
            
            if limit:
                query += f" LIMIT {limit}"
            
            cur.execute(query)
            events = cur.fetchall()
            
            print(f"Found {len(events)} events to process")
            
            # For events, we'll store in a separate table or add embedding column
            # For now, just log that we processed them
            texts = []
            event_ids = []
            
            for event in tqdm(events, desc="Processing events"):
                text = self.generate_event_text(dict(event))
                texts.append(text)
                event_ids.append(event['id'])
            
            if texts:
                embeddings = self.generate_embeddings_batch(texts)
                print(f"✅ Generated embeddings for {len(events)} events")
                # Note: Event embeddings would need a separate table or column
    
    def close(self):
        """Close database connection"""
        if self.conn:
            self.conn.close()


def main():
    """Main function"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Generate embeddings for profiles and events')
    parser.add_argument('--profiles', action='store_true', help='Generate profile embeddings')
    parser.add_argument('--events', action='store_true', help='Generate event embeddings')
    parser.add_argument('--all', action='store_true', help='Generate all embeddings')
    parser.add_argument('--limit', type=int, default=None, help='Limit number of records')
    
    args = parser.parse_args()
    
    generator = EmbeddingGenerator()
    
    try:
        if args.all or args.profiles:
            generator.update_profile_embeddings(limit=args.limit)
        
        if args.all or args.events:
            generator.update_event_embeddings(limit=args.limit)
        
        print("\n✅ Embedding generation complete!")
    
    finally:
        generator.close()


if __name__ == '__main__':
    main()

