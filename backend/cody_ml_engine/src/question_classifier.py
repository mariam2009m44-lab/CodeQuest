
import json
import re
from pathlib import Path
from typing import Any

import joblib
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline


class CodyQuestionClassifier:
    CATEGORIES = {
        "programming",
        "math",
        "science",
        "general_knowledge",
        "lesson_help",
        "code_debugging",
    }

    CONFIDENCE_THRESHOLD = 0.40

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

    @staticmethod
    def normalize_text(text: str) -> str:
        text = text.strip().lower()

        arabic_digits = str.maketrans(
            "٠١٢٣٤٥٦٧٨٩",
            "0123456789"
        )
        text = text.translate(arabic_digits)

        text = re.sub(r"[\u064B-\u065F\u0670]", "", text)
        text = text.replace("ـ", "")

        text = (
            text.replace("أ", "ا")
            .replace("إ", "ا")
            .replace("آ", "ا")
            .replace("ى", "ي")
        )

        return text

    def load_training_data(self) -> tuple[list[str], list[str]]:
        if not self.training_file.is_file():
            raise FileNotFoundError(
                f"Training dataset not found: {self.training_file}"
            )

        with self.training_file.open("r", encoding="utf-8") as file:
            data: Any = json.load(file)

        if isinstance(data, dict):
            data = data.get("examples")

        if not isinstance(data, list) or not data:
            raise ValueError(
                "Training data must be a non-empty list "
                "or contain an examples list."
            )

        texts: list[str] = []
        labels: list[str] = []

        for index, item in enumerate(data):
            if not isinstance(item, dict):
                raise ValueError(
                    f"Invalid dataset item at index {index}."
                )

            text = item.get("text") or item.get("question")
            label = item.get("label") or item.get("category")

            if not isinstance(text, str) or not text.strip():
                raise ValueError(
                    f"Invalid question at index {index}."
                )

            if not isinstance(label, str):
                raise ValueError(
                    f"Invalid category at index {index}."
                )

            label = label.strip()

            if label not in self.CATEGORIES:
                raise ValueError(
                    f"Unknown category at index {index}: {label}"
                )

            normalized_text = self.normalize_text(text)

            if not normalized_text:
                raise ValueError(
                    f"Invalid question at index {index}."
                )

            texts.append(normalized_text)
            labels.append(label)

        if len(set(labels)) < 2:
            raise ValueError(
                "At least two categories are required."
            )

        return texts, labels

    def build_model(self) -> Pipeline:
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
        texts, labels = self.load_training_data()

        new_model = self.build_model()
        new_model.fit(texts, labels)

        self.model = new_model
        self.is_trained = True

        return {
            "success": True,
            "message": "Cody Question Classifier trained successfully.",
            "training_examples": len(texts),
            "categories": sorted(set(labels)),
        }

    def predict(self, question: str) -> dict[str, Any]:
        if not isinstance(question, str) or not question.strip():
            raise ValueError("Question cannot be empty.")

        if not self.is_trained or self.model is None:
            raise RuntimeError(
                "The classifier must be trained before prediction."
            )

        clean_question = question.strip()
        normalized_question = self.normalize_text(clean_question)

        probabilities = self.model.predict_proba(
            [normalized_question]
        )[0]

        classes = self.model.classes_

        best_index = int(probabilities.argmax())
        confidence = float(probabilities[best_index])
        category = str(classes[best_index])

        needs_review = confidence < self.CONFIDENCE_THRESHOLD

        return {
            "success": True,
            "question": clean_question,
            "category": category,
            "confidence": round(confidence, 4),
            "needs_review": needs_review,
        }

    def save_model(
        self,
        output_file: str | Path | None = None
    ) -> Path:
        if not self.is_trained or self.model is None:
            raise RuntimeError(
                "Train the model before saving it."
            )

        destination = (
            Path(output_file)
            if output_file
            else Path(__file__).resolve().parents[1]
            / "models"
            / "cody_question_classifier.joblib"
        )

        destination.parent.mkdir(
            parents=True,
            exist_ok=True
        )

        joblib.dump(self.model, destination)

        return destination

    def load_model(self, model_file: str | Path) -> None:
        path = Path(model_file)

        if not path.is_file():
            raise FileNotFoundError(
                f"Model not found: {path}"
            )

        loaded_model = joblib.load(path)

        if not isinstance(loaded_model, Pipeline):
            raise ValueError(
                "Invalid model file: expected a scikit-learn Pipeline."
            )

        if not hasattr(loaded_model, "predict_proba"):
            raise ValueError(
                "Invalid model: predict_proba is unavailable."
            )

        if not hasattr(loaded_model, "classes_"):
            raise ValueError(
                "Invalid model: the model has not been fitted."
            )

        self.model = loaded_model
        self.is_trained = True


def main() -> None:
    classifier = CodyQuestionClassifier()

    try:
        result = classifier.train()

        print("\n=== Cody ML Engine ===")
        print(result["message"])
        print(
            f"Training examples: {result['training_examples']}"
        )
        print(
            f"Categories: {', '.join(result['categories'])}"
        )

        saved_path = classifier.save_model()
        print(f"Model saved at: {saved_path}")

        while True:
            question = input(
                "\nAsk Cody (or type exit): "
            ).strip()

            if question.lower() in {"exit", "quit"}:
                print("Goodbye!")
                break

            if not question:
                print("Please enter a question.")
                continue

            prediction = classifier.predict(question)

            print(f"Category: {prediction['category']}")
            print(
                f"Confidence: {prediction['confidence']:.2%}"
            )

            if prediction["needs_review"]:
                print(
                    "This question needs further review."
                )

    except (
        FileNotFoundError,
        ValueError,
        RuntimeError,
        OSError,
    ) as error:
        print(f"Error: {error}")


if __name__ == "__main__":
    main()
