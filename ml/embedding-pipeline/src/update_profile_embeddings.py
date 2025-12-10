"""
Incremental Profile Embedding Updates
Updates embeddings for new or modified profiles
"""
import os
import sys
import psycopg2
import psycopg2.extras
from sentence_transformers import SentenceTransformer
from typing import List, Dict
from dotenv import load_dotenv
import json

load_dotenv()

EMBEDDING_MODEL = os.getenv('EMBEDDING_MODEL', 'all-mpnet-base-v2')


class IncrementalEmbeddingUpdater:
    """Update embeddings for new/modified profiles"""
    
    def __init__(self):
        self.model = SentenceTransformer(EMBEDDING_MODEL)
        self.conn = psycopg2.connect(
            host=os.getenv('POSTGRES_HOST', 'localhost'),
            port=int(os.getenv('POSTGRES_PORT', 5432)),
            database=os.getenv('POSTGRES_DB', 'retail_brain'),
            user=os.getenv('POSTGRES_USER', 'retail_brain_user'),
            password=os.getenv('POSTGRES_PASSWORD', 'retail_brain_pass')
        )
    
    def generate_profile_text(self, profile: Dict) -> str:
        """Generate text representation of profile"""
        parts = []
        
        if profile.get('full_name'):
            parts.append(f"Customer name: {profile['full_name']}")
        
        if profile.get('city') and profile.get('state'):
            parts.append(f"Location: {profile['city']}, {profile['state']}")
        
        if profile.get('segment'):
            parts.append(f"Segment: {profile['segment']}")
        
        if profile.get('ltv'):
            parts.append(f"Lifetime value: {profile['ltv']}")
        
        return ". ".join(parts) if parts else "Customer profile"
    
    def update_profile(self, profile_id: str):
        """Update embedding for a single profile"""
        with self.conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                """
                SELECT 
                    id,
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
                return
            
            text = self.generate_profile_text(dict(profile))
            embedding = self.model.encode(text, normalize_embeddings=True)
            
            cur.execute(
                """
                UPDATE customer_profile
                SET embedding = %s::vector
                WHERE id = %s
                """,
                [str(embedding.tolist()), profile_id]
            )
            
            self.conn.commit()
    
    def update_new_profiles(self, since_timestamp: str):
        """Update embeddings for profiles created/updated since timestamp"""
        with self.conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                """
                SELECT 
                    id,
                    full_name,
                    city,
                    state,
                    segment,
                    ltv,
                    total_orders
                FROM customer_profile
                WHERE (created_at >= %s OR updated_at >= %s)
                    AND is_merged = false
                    AND embedding IS NULL
                """,
                [since_timestamp, since_timestamp]
            )
            
            profiles = cur.fetchall()
            
            for profile in profiles:
                text = self.generate_profile_text(dict(profile))
                embedding = self.model.encode(text, normalize_embeddings=True)
                
                cur.execute(
                    """
                    UPDATE customer_profile
                    SET embedding = %s::vector
                    WHERE id = %s
                    """,
                    [str(embedding.tolist()), profile['id']]
                )
            
            self.conn.commit()
            return len(profiles)
    
    def close(self):
        """Close database connection"""
        if self.conn:
            self.conn.close()


if __name__ == '__main__':
    import argparse
    
    parser = argparse.ArgumentParser(description='Update embeddings incrementally')
    parser.add_argument('--profile-id', type=str, help='Update specific profile')
    parser.add_argument('--since', type=str, help='Update profiles since timestamp (ISO format)')
    
    args = parser.parse_args()
    
    updater = IncrementalEmbeddingUpdater()
    
    try:
        if args.profile_id:
            updater.update_profile(args.profile_id)
            print(f"✅ Updated embedding for profile {args.profile_id}")
        elif args.since:
            count = updater.update_new_profiles(args.since)
            print(f"✅ Updated embeddings for {count} profiles")
        else:
            print("Please provide --profile-id or --since")
    
    finally:
        updater.close()

