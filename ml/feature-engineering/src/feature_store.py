"""
Feature Store Client
Connects to Postgres feature store and Redis cache
"""
import os
import psycopg2
import psycopg2.extras
from typing import Dict, List, Optional, Any
import json
import redis
from dotenv import load_dotenv

load_dotenv()


class FeatureStoreClient:
    """Client for feature store (Postgres + Redis)"""
    
    def __init__(self):
        self.pg_conn = None
        self.redis_client = None
        self._connect()
    
    def _connect(self):
        """Connect to Postgres and Redis"""
        # Postgres connection
        self.pg_conn = psycopg2.connect(
            host=os.getenv('POSTGRES_HOST', 'localhost'),
            port=int(os.getenv('POSTGRES_PORT', 5432)),
            database=os.getenv('POSTGRES_DB', 'retail_brain'),
            user=os.getenv('POSTGRES_USER', 'retail_brain_user'),
            password=os.getenv('POSTGRES_PASSWORD', 'retail_brain_pass')
        )
        
        # Redis connection
        redis_password = os.getenv('REDIS_PASSWORD', '')
        self.redis_client = redis.Redis(
            host=os.getenv('REDIS_HOST', 'localhost'),
            port=int(os.getenv('REDIS_PORT', 6379)),
            password=redis_password if redis_password else None,
            decode_responses=True
        )
    
    def get_profile_features(
        self, 
        profile_id: str, 
        dataset_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Get all features for a profile"""
        # Try Redis cache first
        cache_key = f"feature:profile:{profile_id}:{dataset_id or 'latest'}"
        cached = self.redis_client.get(cache_key)
        if cached:
            return json.loads(cached)
        
        # Query Postgres
        with self.pg_conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            query = """
                SELECT 
                    feature_name,
                    feature_value,
                    feature_type,
                    computed_at,
                    dataset_id
                FROM feature_values
                WHERE profile_id = %s
            """
            params = [profile_id]
            
            if dataset_id:
                query += " AND dataset_id = %s"
                params.append(dataset_id)
            else:
                query += """
                    AND computed_at = (
                        SELECT MAX(computed_at)
                        FROM feature_values fv2
                        WHERE fv2.profile_id = feature_values.profile_id
                            AND fv2.feature_name = feature_values.feature_name
                    )
                """
            
            query += " ORDER BY feature_name"
            
            cur.execute(query, params)
            rows = cur.fetchall()
            
            features = {}
            for row in rows:
                features[row['feature_name']] = {
                    'value': row['feature_value'],
                    'type': row['feature_type'],
                    'computed_at': str(row['computed_at']),
                    'dataset_id': row['dataset_id']
                }
            
            # Cache in Redis (1 hour TTL)
            self.redis_client.setex(cache_key, 3600, json.dumps(features))
            
            return features
    
    def write_features(
        self,
        profile_id: str,
        features: Dict[str, Any],
        dataset_id: Optional[str] = None
    ):
        """Write features for a profile"""
        with self.pg_conn.cursor() as cur:
            for feature_name, feature_data in features.items():
                if isinstance(feature_data, dict):
                    feature_value = feature_data.get('value', feature_data)
                    feature_type = feature_data.get('type', 'numeric')
                else:
                    feature_value = feature_data
                    feature_type = 'numeric'
                
                cur.execute(
                    """
                    INSERT INTO feature_values (
                        profile_id,
                        feature_name,
                        feature_value,
                        feature_type,
                        dataset_id,
                        computed_at
                    ) VALUES (%s, %s, %s, %s, %s, NOW())
                    ON CONFLICT DO NOTHING
                    """,
                    [
                        profile_id,
                        feature_name,
                        json.dumps(feature_value),
                        feature_type,
                        dataset_id
                    ]
                )
            
            self.pg_conn.commit()
            
            # Invalidate cache
            cache_pattern = f"feature:profile:{profile_id}:*"
            for key in self.redis_client.scan_iter(match=cache_pattern):
                self.redis_client.delete(key)
    
    def close(self):
        """Close connections"""
        if self.pg_conn:
            self.pg_conn.close()
        if self.redis_client:
            self.redis_client.close()


if __name__ == '__main__':
    # Example usage
    client = FeatureStoreClient()
    
    # Write features
    client.write_features(
        'test-profile-id',
        {
            'phone_exact': {'value': 1.0, 'type': 'numeric'},
            'email_exact': {'value': 0.0, 'type': 'numeric'},
            'name_sim': {'value': 0.85, 'type': 'numeric'}
        },
        dataset_id='test-dataset-001'
    )
    
    # Read features
    features = client.get_profile_features('test-profile-id')
    print("Features:", features)
    
    client.close()

