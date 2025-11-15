import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
import joblib
import warnings
warnings.filterwarnings('ignore')

def generate_synthetic_data(n_samples=5000):
    """Generate synthetic fever patient data"""
    np.random.seed(42)
    
    n = n_samples
    data = {
        'temperature': np.random.normal(38.5, 1.2, n),  # Fever range
        'duration_days': np.random.exponential(3, n),   # Most fevers short duration
        'headache': np.random.choice([0, 1], n, p=[0.3, 0.7]),
        'body_pain': np.random.choice([0, 1], n, p=[0.2, 0.8]),
        'rash': np.random.choice([0, 1], n, p=[0.7, 0.3]),
        'nausea_vomiting': np.random.choice([0, 1], n, p=[0.6, 0.4]),
        'breathing_difficulty': np.random.choice([0, 1], n, p=[0.85, 0.15]),
        'platelet_count': np.random.normal(200, 80, n),  # Thousands
        'travel_history': np.random.choice([0, 1], n, p=[0.7, 0.3]),
        'mosquito_exposure': np.random.choice([0, 1], n, p=[0.6, 0.4]),
    }
    
    df = pd.DataFrame(data)
    
    # Ensure realistic values
    df['temperature'] = np.clip(df['temperature'], 36, 42)
    df['duration_days'] = np.clip(df['duration_days'], 1, 14)
    df['platelet_count'] = np.clip(df['platelet_count'], 20, 400)
    
    # Create disease labels based on symptom patterns
    conditions = []
    for idx, row in df.iterrows():
        # Dengue pattern: high fever + rash + low platelets + mosquito exposure
        dengue_score = (row['temperature'] > 39) + row['rash'] + (row['platelet_count'] < 150) + row['mosquito_exposure']
        
        # Malaria pattern: high fever + travel history + mosquito exposure
        malaria_score = (row['temperature'] > 39.5) + row['travel_history'] + row['mosquito_exposure']
        
        # Typhoid pattern: prolonged fever + headache + abdominal symptoms
        typhoid_score = (row['duration_days'] > 5) + row['headache'] + row['nausea_vomiting']
        
        # Viral pattern: moderate fever + body pain
        viral_score = (row['temperature'] <= 39) + row['body_pain'] + (not row['rash'])
        
        scores = {
            'Dengue': dengue_score + np.random.normal(0, 0.5),
            'Malaria': malaria_score + np.random.normal(0, 0.5),
            'Typhoid': typhoid_score + np.random.normal(0, 0.5),
            'Viral_Fever': viral_score + np.random.normal(0, 0.5)
        }
        
        # Add some COVID cases
        if row['breathing_difficulty'] and row['temperature'] > 38:
            scores['COVID'] = 5 + np.random.normal(0, 0.5)
        else:
            scores['COVID'] = np.random.normal(0, 1)
            
        conditions.append(max(scores, key=scores.get))
    
    df['condition'] = conditions
    
    return df

def train_model():
    """Train and save the Random Forest model"""
    print("Generating synthetic data...")
    df = generate_synthetic_data(5000)
    
    # Features for training
    feature_cols = ['temperature', 'duration_days', 'headache', 'body_pain', 
                   'rash', 'nausea_vomiting', 'breathing_difficulty', 
                   'platelet_count', 'travel_history', 'mosquito_exposure']
    
    X = df[feature_cols]
    y = df['condition']
    
    print(f"Training on {len(X)} samples...")
    print(f"Class distribution:\n{y.value_counts()}")
    
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    
    # Train Random Forest
    clf = RandomForestClassifier(
        n_estimators=200,
        max_depth=8,
        min_samples_split=5,
        min_samples_leaf=2,
        random_state=42
    )
    
    clf.fit(X_train, y_train)
    
    # Calculate accuracy
    train_score = clf.score(X_train, y_train)
    test_score = clf.score(X_test, y_test)
    
    print(f"Training accuracy: {train_score:.3f}")
    print(f"Test accuracy: {test_score:.3f}")
    
    # Save model
    joblib.dump(clf, 'models/ftis_model.joblib')
    print("Model saved as 'models/ftis_model.joblib'")
    
    return clf, feature_cols

if __name__ == "__main__":
    train_model()