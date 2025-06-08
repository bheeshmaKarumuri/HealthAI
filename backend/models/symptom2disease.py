import numpy as np
import pandas as pd
from sklearn.preprocessing import LabelEncoder
from sklearn.svm import SVC
from sklearn.naive_bayes import GaussianNB
from sklearn.ensemble import RandomForestClassifier
from statistics import mode
from typing import Dict
import warnings

warnings.filterwarnings("ignore")

class DiseasePredictor:
    def __init__(self, training_data_path: str):
        # Load and preprocess the data
        self.data = self._load_data(training_data_path)
        self.encoder = LabelEncoder()
        self.data["prognosis"] = self.encoder.fit_transform(self.data["prognosis"])

        # Split features and target variable
        self.X = self.data.iloc[:, :-1]
        self.y = self.data.iloc[:, -1]

        # Initialize models
        self.models = {
            "SVM": SVC(),
            "Naive Bayes": GaussianNB(),
            "Random Forest": RandomForestClassifier(random_state=18)
        }
        
        # Train models
        self._train_models()

        # Create a symptom index mapping
        self.symptom_index = {symptom: idx for idx, symptom in enumerate(self.X.columns)}
        self.prediction_classes = self.encoder.classes_

    def _load_data(self, path: str) -> pd.DataFrame:
        """Load and clean the dataset."""
        return pd.read_csv(path).dropna(axis=1)

    def _train_models(self):
        """Train the models on the dataset."""
        for model in self.models.values():
            model.fit(self.X, self.y)

    def disease_prediction(self, symptoms: list) -> Dict[str, str]:
        """Predict the disease based on input symptoms."""
        print("Received symptoms:", symptoms)
        input_data = self._prepare_input_data(symptoms)
        
        # Make predictions using all models
        predictions = {name: model.predict(input_data)[0] for name, model in self.models.items()}
        
        # Decode predictions to original class names
        decoded_predictions = {name: self.prediction_classes[pred] for name, pred in predictions.items()}
        
        # Determine final prediction using majority voting
        final_prediction = decoded_predictions["Random Forest"]  # Default to RF
        try:
            final_prediction = self.encoder.inverse_transform([mode(list(predictions.values()))])[0]
        except Exception as e:
            print(f"Error in majority voting: {e}")

        return {
            "rf_model_prediction": decoded_predictions["Random Forest"],
            "naive_bayes_prediction": decoded_predictions["Naive Bayes"],
            "svm_model_prediction": decoded_predictions["SVM"],
            "final_prediction": final_prediction
        }

    def _prepare_input_data(self, symptoms: list) -> np.ndarray:
        """Prepare input data for prediction."""
        input_vector = np.zeros(len(self.symptom_index), dtype=int)
        for symptom in symptoms:
            if symptom in self.symptom_index:
                input_vector[self.symptom_index[symptom]] = 1
        return input_vector.reshape(1, -1)
