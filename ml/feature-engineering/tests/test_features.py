"""
Unit tests for feature engineering functions
"""
import unittest
from src.identity_features import (
    extract_pairwise_features,
    compute_name_similarity,
    compute_email_username_similarity,
    normalize_phone,
    normalize_email
)


class TestFeatureEngineering(unittest.TestCase):
    
    def test_name_similarity_exact(self):
        """Test exact name match"""
        similarity = compute_name_similarity('John Doe', 'John Doe')
        self.assertEqual(similarity, 1.0)
    
    def test_name_similarity_similar(self):
        """Test similar names"""
        similarity = compute_name_similarity('John Doe', 'John D.')
        self.assertGreater(similarity, 0.7)
        self.assertLess(similarity, 1.0)
    
    def test_name_similarity_different(self):
        """Test different names"""
        similarity = compute_name_similarity('John Doe', 'Jane Smith')
        self.assertLess(similarity, 0.5)
    
    def test_email_username_similarity(self):
        """Test email username similarity"""
        similarity = compute_email_username_similarity(
            'john.doe@example.com',
            'johndoe@example.com'
        )
        self.assertGreater(similarity, 0.5)
    
    def test_normalize_phone(self):
        """Test phone normalization"""
        normalized = normalize_phone('+91 98765 43210')
        self.assertEqual(normalized, '919876543210')
    
    def test_normalize_email(self):
        """Test email normalization"""
        normalized = normalize_email('  John.Doe@Example.COM  ')
        self.assertEqual(normalized, 'john.doe@example.com')
    
    def test_extract_pairwise_features(self):
        """Test full feature extraction"""
        profile_a = {
            'full_name': 'John Doe',
            'city': 'Mumbai',
            'state': 'Maharashtra',
            'first_seen_at': '2024-01-01T00:00:00Z'
        }
        
        profile_b = {
            'full_name': 'John D.',
            'city': 'Mumbai',
            'state': 'Maharashtra',
            'first_seen_at': '2024-01-05T00:00:00Z'
        }
        
        identifiers_a = [
            {'type': 'phone', 'value': '+919876543210', 'value_hash': 'hash_a'},
            {'type': 'email', 'value': 'john@example.com', 'value_hash': 'hash_email_a'}
        ]
        
        identifiers_b = [
            {'type': 'phone', 'value': '+919876543210', 'value_hash': 'hash_a'},
            {'type': 'email', 'value': 'john.doe@example.com', 'value_hash': 'hash_email_b'}
        ]
        
        features = extract_pairwise_features(
            profile_a, profile_b, identifiers_a, identifiers_b
        )
        
        # Check that features are extracted
        self.assertIn('phone_exact', features)
        self.assertIn('email_exact', features)
        self.assertIn('name_sim', features)
        self.assertIn('city_match', features)
        
        # Phone should match
        self.assertEqual(features['phone_exact'], 1.0)
        
        # Email should not match exactly
        self.assertEqual(features['email_exact'], 0.0)
        
        # Name should be similar
        self.assertGreater(features['name_sim'], 0.5)
        
        # City should match
        self.assertEqual(features['city_match'], 1.0)


if __name__ == '__main__':
    unittest.main()

