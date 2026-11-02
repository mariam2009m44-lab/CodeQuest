
import json
from pathlib import Path
from typing import Any

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline


class CodyQuestionClassifier:
    """
    Cody AI - Question Classification Engine

    Classifies questions into educational categories:
    - programming
    - math
    - science
    - general_knowledge
    - lesson_help
    - code_debugging
    """

    CATEGORIES = {
        "programming",
        "math",
        "science",
        "general_knowledge",
        "lesson_help",
        "code_debugging",
    }

    def __init__(self, training_file: str | Path | None = None):
        self.training_file = (
            Path(training_file)
            if training_file
            else Path(__file__).resolve().parents[1]
            / "data"
            / "training_data.json"
        )

        self.model: Pipeline | None = None
        self.is_trained = False

    def load_training_data(self) -> tuple[list[str], list[str]]:
        """Load and validate the training dataset."""

        if not self.training_file.is_file():
            raise FileNotFoundError(
                f"Training dataset not found: {self.training_file}"
            )

        with self.training_file.open("r", encoding="utf-8") as file:
            data: Any = json.load(file)

        if not isinstance(data, list) or not data:
            raise ValueError("Training dataset must be a non-empty list.")

        texts: list[str] = []
        labels: list[str] = []

        for index, item in enumerate(data):
            if not isinstance(item, dict):
                raise ValueError(f"Invalid dataset item at index {index}.")

            text = item.get("text")
            label = item.get("label")

            if not isinstance(text, str) or not text.strip():
                raise ValueError(f"Invalid question at index {index}.")

            if label not in self.CATEGORIES:
                raise ValueError(
                    f"Unknown category at index {index}: {label}"
                )

            texts.append(text.strip())
            labels.append(label)

        if len(set(labels)) < 2:
            raise ValueError("At least two categories are required.")

        return texts, labels

    def build_model(self) -> Pipeline:
        """Create the machine learning pipeline."""

        return Pipeline([
            (
                "vectorizer",
                TfidfVectorizer(
                    analyzer="char",
                    ngram_range=(2, 5),
                    max_features=15000,
                    sublinear_tf=True,
                ),
            ),
            (
                "classifier",
                LogisticRegression(
                    max_iter=1500,
                    class_weight="balanced",
                    random_state=42,
                ),
            ),
        ])

    def train(self) -> dict[str, Any]:
        """Train the classifier using the local dataset."""

        texts, labels = self.load_training_data()

        self.model = self.build_model()
        self.model.fit(texts, labels)

        self.is_trained = True

        return {
            "success": True,
            "message": "Cody Question Classifier trained successfully.",
            "training_examples": len(texts),
            "categories": sorted(set(labels)),
        }

    def predict(self, question: str) -> dict[str, Any]:
        """Predict the category of a new question."""

        if not self.is_trained or self.model is None:
            raise RuntimeError(
                "The classifier must be trained before prediction."
            )

        if not isinstance(question, str) or not question.strip():
            raise ValueError("Question cannot be empty.")

        probabilities = self.model.predict_proba([question.strip()])[0]
        classes = self.model.classes_

        best_index = int(probabilities.argmax())
        confidence = float(probabilities[best_index])

        category = str(classes[best_index])

        # Low-confidence questions should be handled cautiously.
        if confidence < 0.40:
            category = "general_knowledge"

        return {
            "success": True,
            "question": question.strip(),
            "category": category,
            "confidence": round(confidence, 4),
            "needs_review": confidence < 0.40,
        }

    def save_model(self, output_file: str | Path | None = None) -> Path:
        """Save the trained model locally."""

        if not self.is_trained or self.model is None:
            raise RuntimeError("Train the model before saving it.")

        try:
            import joblib
        except ImportError as exc:
            raise RuntimeError(
                "Install joblib before saving the model."
            ) from exc

        destination = (
            Path(output_file)
            if output_file
            else Path(__file__).resolve().parents[1]
            / "models"
            / "cody_question_classifier.joblib"
        )

        destination.parent.mkdir(parents=True, exist_ok=True)
        joblib.dump(self.model, destination)

        return destination

    def load_model(self, model_file: str | Path) -> None:
        """Load a previously trained model."""

        import joblib

        path = Path(model_file)

        if not path.is_file():
            raise FileNotFoundError(f"Model not found: {path}")

        self.model = joblib.load(path)
        self.is_trained = True


def main() -> None:
    classifier = CodyQuestionClassifier()

    try:
        result = classifier.train()
        print("\n=== Cody ML Engine ===")
        print(result["message"])
        print(f"Training examples: {result['training_examples']}")
        print(f"Categories: {', '.join(result['categories'])}")

        while True:
            question = input("\nAsk Cody (or type exit): ").strip()

            if question.lower() in {"exit", "quit"}:
                print("Goodbye!")
                break

            if not question:
                print("Please enter a question.")
                continue

            prediction = classifier.predict(question)

            print(f"Category: {prediction['category']}")
            print(f"Confidence: {prediction['confidence']:.2%}")

            if prediction["needs_review"]:
                print("This question needs further review.")

    except (FileNotFoundError, ValueError, RuntimeError) as error:
        print(f"Error: {error}")


if __name__ == "__main__":
    main()
