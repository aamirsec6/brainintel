"""
Training Data Generation for Identity Resolution
Extracts positive and negative pairs from merge logs
"""
import os
import sys
import psycopg2
import psycopg2.extras
import pandas as pd
import numpy as np
from typing import List, Tuple, Dict, Optional
from datetime import datetime, timedelta
import hashlib
import json
from dotenv import load_dotenv
from tqdm import tqdm

# Add parent directory to path for imports
sys.path.append(os.path.join(os.path.dirname(__file__), '../../feature-engineering/src'))
from identity_features import extract_pairwise_features

load_dotenv()


class TrainingDataGenerator:
    """Generate training pairs from merge logs"""
    
    def __init__(self):
        self.conn = psycopg2.connect(
            host=os.getenv('POSTGRES_HOST', 'localhost'),
            port=int(os.getenv('POSTGRES_PORT', 5432)),
            database=os.getenv('POSTGRES_DB', 'retail_brain'),
            user=os.getenv('POSTGRES_USER', 'retail_brain_user'),
            password=os.getenv('POSTGRES_PASSWORD', 'retail_brain_pass')
        )
    
    def get_positive_pairs(self, limit: Optional[int] = None) -> List[Tuple[str, str]]:
        """
        Get positive pairs from merge logs (known matches)
        
        Returns:
            List of (source_profile_id, target_profile_id) tuples
        """
        with self.conn.cursor() as cur:
            query = """
                SELECT 
                    source_profile_id,
                    target_profile_id
                FROM identity_merge_log
                WHERE merge_type IN ('auto', 'manual')
                    AND rolled_back = false
                    AND confidence_score >= 0.80
            """
            
            if limit:
                query += f" LIMIT {limit}"
            
            cur.execute(query)
            rows = cur.fetchall()
            
            return [(row[0], row[1]) for row in rows]
    
    def get_negative_pairs(
        self, 
        count: int,
        exclude_profile_ids: Optional[List[str]] = None
    ) -> List[Tuple[str, str]]:
        """
        Generate negative pairs (non-matching profiles)
        
        Args:
            count: Number of negative pairs to generate
            exclude_profile_ids: Profile IDs to exclude (already in positive pairs)
        
        Returns:
            List of (profile_a_id, profile_b_id) tuples
        """
        with self.conn.cursor() as cur:
            # Get all profile IDs
            query = "SELECT id FROM customer_profile WHERE is_merged = false"
            if exclude_profile_ids:
                placeholders = ','.join(['%s'] * len(exclude_profile_ids))
                query += f" AND id NOT IN ({placeholders})"
                cur.execute(query, exclude_profile_ids)
            else:
                cur.execute(query)
            
            profile_ids = [row[0] for row in cur.fetchall()]
            
            if len(profile_ids) < 2:
                return []
            
            # Generate random pairs
            negative_pairs = []
            seen_pairs = set()
            
            # Also exclude pairs that are too similar (time-based filtering)
            max_attempts = count * 10
            attempts = 0
            
            while len(negative_pairs) < count and attempts < max_attempts:
                attempts += 1
                
                # Randomly select two profiles
                idx_a, idx_b = np.random.choice(len(profile_ids), size=2, replace=False)
                profile_a = profile_ids[idx_a]
                profile_b = profile_ids[idx_b]
                
                # Ensure consistent ordering
                pair = tuple(sorted([profile_a, profile_b]))
                
                if pair not in seen_pairs:
                    seen_pairs.add(pair)
                    negative_pairs.append(pair)
            
            return negative_pairs[:count]
    
    def get_time_based_negatives(
        self,
        count: int,
        time_gap_days: int = 365
    ) -> List[Tuple[str, str]]:
        """
        Generate negative pairs based on time gap (profiles created far apart)
        
        Args:
            count: Number of pairs to generate
            time_gap_days: Minimum days between profiles
        
        Returns:
            List of (profile_a_id, profile_b_id) tuples
        """
        with self.conn.cursor() as cur:
            query = """
                SELECT 
                    p1.id as profile_a,
                    p2.id as profile_b
                FROM customer_profile p1
                CROSS JOIN customer_profile p2
                WHERE p1.id < p2.id
                    AND p1.is_merged = false
                    AND p2.is_merged = false
                    AND ABS(EXTRACT(EPOCH FROM (p1.first_seen_at - p2.first_seen_at)) / 86400) >= %s
                ORDER BY RANDOM()
                LIMIT %s
            """
            
            cur.execute(query, [time_gap_days, count])
            rows = cur.fetchall()
            
            return [(row[0], row[1]) for row in rows]
    
    def get_profile_data(self, profile_id: str) -> Optional[Dict]:
        """Get profile data"""
        with self.conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                "SELECT * FROM customer_profile WHERE id = %s",
                [profile_id]
            )
            row = cur.fetchone()
            if row:
                return dict(row)
            return None
    
    def get_profile_identifiers(self, profile_id: str) -> List[Dict]:
        """Get identifiers for a profile"""
        with self.conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                """
                SELECT type, value, value_hash
                FROM profile_identifier
                WHERE profile_id = %s
                """,
                [profile_id]
            )
            rows = cur.fetchall()
            return [dict(row) for row in rows]
    
    def get_profile_events(self, profile_id: str, limit: int = 100) -> List[Dict]:
        """Get events for a profile"""
        with self.conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                """
                SELECT 
                    e.event_type,
                    e.payload->>'sku' as sku,
                    e.event_ts
                FROM events e
                WHERE e.profile_id = %s
                ORDER BY e.event_ts DESC
                LIMIT %s
                """,
                [profile_id, limit]
            )
            rows = cur.fetchall()
            return [dict(row) for row in rows]
    
    def generate_dataset(
        self,
        positive_count: Optional[int] = None,
        negative_count: Optional[int] = None,
        negative_ratio: float = 1.0,
        include_time_based: bool = True,
        dataset_id: Optional[str] = None
    ) -> pd.DataFrame:
        """
        Generate complete training dataset
        
        Args:
            positive_count: Number of positive pairs (None = all available)
            negative_count: Number of negative pairs (None = positive_count * negative_ratio)
            negative_ratio: Ratio of negative to positive pairs
            include_time_based: Include time-based negative pairs
            dataset_id: Dataset identifier for versioning
        
        Returns:
            DataFrame with features and labels
        """
        print("Generating training dataset...")
        
        # Generate dataset ID
        if not dataset_id:
            dataset_id = f"dataset_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        print(f"Dataset ID: {dataset_id}")
        
        # Get positive pairs
        print("Extracting positive pairs...")
        positive_pairs = self.get_positive_pairs(limit=positive_count)
        print(f"Found {len(positive_pairs)} positive pairs")
        
        if len(positive_pairs) == 0:
            raise ValueError("No positive pairs found in merge logs")
        
        # Get negative pairs
        if negative_count is None:
            negative_count = int(len(positive_pairs) * negative_ratio)
        
        print(f"Generating {negative_count} negative pairs...")
        
        # Get profile IDs from positive pairs
        positive_profile_ids = set()
        for pair in positive_pairs:
            positive_profile_ids.add(pair[0])
            positive_profile_ids.add(pair[1])
        
        # Random negatives
        negative_pairs = self.get_negative_pairs(
            count=negative_count,
            exclude_profile_ids=list(positive_profile_ids)
        )
        print(f"Generated {len(negative_pairs)} random negative pairs")
        
        # Time-based negatives (if requested)
        time_based_negatives = []
        if include_time_based and len(negative_pairs) < negative_count:
            remaining = negative_count - len(negative_pairs)
            time_based_negatives = self.get_time_based_negatives(count=remaining)
            print(f"Generated {len(time_based_negatives)} time-based negative pairs")
        
        # Combine all pairs
        all_pairs = (
            [(pair, 1) for pair in positive_pairs] +
            [(pair, 0) for pair in negative_pairs] +
            [(pair, 0) for pair in time_based_negatives]
        )
        
        print(f"Total pairs: {len(all_pairs)} ({len(positive_pairs)} positive, {len(negative_pairs) + len(time_based_negatives)} negative)")
        
        # Extract features for each pair
        print("Extracting features...")
        feature_rows = []
        
        for (profile_a_id, profile_b_id), label in tqdm(all_pairs, desc="Processing pairs"):
            try:
                # Get profile data
                profile_a = self.get_profile_data(profile_a_id)
                profile_b = self.get_profile_data(profile_b_id)
                
                if not profile_a or not profile_b:
                    continue
                
                # Get identifiers
                identifiers_a = self.get_profile_identifiers(profile_a_id)
                identifiers_b = self.get_profile_identifiers(profile_b_id)
                
                # Get events
                events_a = self.get_profile_events(profile_a_id)
                events_b = self.get_profile_events(profile_b_id)
                
                # Extract features
                features = extract_pairwise_features(
                    profile_a, profile_b, identifiers_a, identifiers_b, events_a, events_b
                )
                
                # Add metadata
                features['profile_a_id'] = profile_a_id
                features['profile_b_id'] = profile_b_id
                features['label'] = label
                features['dataset_id'] = dataset_id
                features['created_at'] = datetime.now().isoformat()
                
                feature_rows.append(features)
            except Exception as e:
                print(f"Error processing pair ({profile_a_id}, {profile_b_id}): {e}")
                continue
        
        # Create DataFrame
        df = pd.DataFrame(feature_rows)
        
        print(f"Generated dataset with {len(df)} samples")
        print(f"Positive: {len(df[df['label'] == 1])}, Negative: {len(df[df['label'] == 0])}")
        
        return df
    
    def save_dataset(self, df: pd.DataFrame, output_path: str, format: str = 'parquet'):
        """Save dataset to file"""
        if format == 'parquet':
            df.to_parquet(output_path, index=False)
        elif format == 'csv':
            df.to_csv(output_path, index=False)
        else:
            raise ValueError(f"Unsupported format: {format}")
        
        print(f"Dataset saved to {output_path}")
    
    def compute_dataset_hash(self, df: pd.DataFrame) -> str:
        """Compute hash of dataset for versioning"""
        # Sort by profile IDs for consistent hashing
        df_sorted = df.sort_values(['profile_a_id', 'profile_b_id'])
        
        # Create hash from sorted data
        data_str = df_sorted.to_string()
        return hashlib.sha256(data_str.encode()).hexdigest()[:16]
    
    def close(self):
        """Close database connection"""
        if self.conn:
            self.conn.close()


def main():
    """Main function"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Generate training data for identity resolution')
    parser.add_argument('--output', type=str, default='training_data.parquet', help='Output file path')
    parser.add_argument('--format', type=str, default='parquet', choices=['parquet', 'csv'], help='Output format')
    parser.add_argument('--positive-count', type=int, default=None, help='Number of positive pairs (None = all)')
    parser.add_argument('--negative-count', type=int, default=None, help='Number of negative pairs')
    parser.add_argument('--negative-ratio', type=float, default=1.0, help='Ratio of negative to positive pairs')
    parser.add_argument('--no-time-based', action='store_true', help='Exclude time-based negatives')
    parser.add_argument('--dataset-id', type=str, default=None, help='Dataset ID for versioning')
    
    args = parser.parse_args()
    
    # Generate dataset
    generator = TrainingDataGenerator()
    
    try:
        df = generator.generate_dataset(
            positive_count=args.positive_count,
            negative_count=args.negative_count,
            negative_ratio=args.negative_ratio,
            include_time_based=not args.no_time_based,
            dataset_id=args.dataset_id
        )
        
        # Compute dataset hash
        dataset_hash = generator.compute_dataset_hash(df)
        print(f"Dataset hash: {dataset_hash}")
        
        # Save dataset
        generator.save_dataset(df, args.output, format=args.format)
        
        # Print statistics
        print("\nDataset Statistics:")
        print(f"  Total samples: {len(df)}")
        print(f"  Positive: {len(df[df['label'] == 1])} ({100 * len(df[df['label'] == 1]) / len(df):.1f}%)")
        print(f"  Negative: {len(df[df['label'] == 0])} ({100 * len(df[df['label'] == 0]) / len(df):.1f}%)")
        print(f"\nFeature statistics:")
        for col in df.columns:
            if col not in ['profile_a_id', 'profile_b_id', 'label', 'dataset_id', 'created_at']:
                print(f"  {col}: mean={df[col].mean():.3f}, std={df[col].std():.3f}")
    
    finally:
        generator.close()


if __name__ == '__main__':
    main()

