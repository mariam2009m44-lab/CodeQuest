

import json
import re
from pathlib import Path
from typing import Any

import joblib

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline, FeatureUnion


class CodyQuestionClassifier:
    CATEGORIES = {
        "programming",
        "math",
        "science",
        "general_knowledge",
        "lesson_help",
        "code_debugging",
    }

    # A prediction is reviewed if confidence is low
    # or if the top two categories are too close.
    CONFIDENCE_THRESHOLD = 0.45
    MIN_CONFIDENCE_MARGIN = 0.12

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
        if not isinstance(text, str):
            raise TypeError("Text must be a string.")

        text = text.strip().lower()

        # Convert Arabic digits into standard digits.
        arabic_digits = str.maketrans(
            "٠١٢٣٤٥٦٧٨٩",
            "0123456789"
        )
        text = text.translate(arabic_digits)

        # Remove Arabic diacritics and tatweel.
        text = re.sub(r"[\u064B-\u065F\u0670]", "", text)
        text = text.replace("ـ", "")

        # Normalize common Arabic letter variations.
        text = (
            text.replace("أ", "ا")
            .replace("إ", "ا")
            .replace("آ", "ا")
            .replace("ى", "ي")
        )

        # Normalize repeated whitespace.
        text = re.sub(r"\s+", " ", text)

        return text.strip()

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

        seen_examples: dict[str, str] = {}

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
                    f"Empty normalized question at index {index}."
                )

            # Avoid the same normalized question having
            # conflicting labels.
            previous_label = seen_examples.get(normalized_text)

            if previous_label is not None:
                if previous_label != label:
                    raise ValueError(
                        "Conflicting labels for duplicate question "
                        f"at index {index}."
                    )

                continue

            seen_examples[normalized_text] = label

            texts.append(normalized_text)
            labels.append(label)

        if len(set(labels)) < 2:
            raise ValueError(
                "At least two categories are required."
            )

        category_counts = {
            category: labels.count(category)
            for category in set(labels)
        }

        for category, count in category_counts.items():
            if count < 2:
                raise ValueError(
                    f"Category '{category}' needs at least "
                    "2 training examples."
                )

        return texts, labels

    def build_model(self) -> Pipeline:
        text_features = FeatureUnion([
            (
                "character_features",
                TfidfVectorizer(
                    analyzer="char",
                    ngram_range=(2, 5),
                    max_features=15000,
                    sublinear_tf=True,
                ),
            ),
            (
                "word_features",
                TfidfVectorizer(
                    analyzer="word",
                    ngram_range=(1, 2),
                    max_features=10000,
                    sublinear_tf=True,
                    token_pattern=r"(?u)\b\w+\b",
                ),
            ),
        ])

        return Pipeline([
            ("features", text_features),
            (
                "classifier",
                LogisticRegression(
                    max_iter=2000,
                    class_weight="balanced",
                    random_state=42,
                ),
            ),
        ])

    def train(self) -> dict[str, Any]:
        texts, labels = self.load_training_data()

        new_model = self.build_model()
        new_model.fit(texts, labels)

        # Assign only after successful training.
        self.model = new_model
        self.is_trained = True

        category_counts = {
            category: labels.count(category)
            for category in sorted(set(labels))
        }

        return {
            "success": True,
            "message": "Cody Question Classifier trained successfully.",
            "training_examples": len(texts),
            "categories": sorted(set(labels)),
            "category_counts": category_counts,
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

        if not normalized_question:
            raise ValueError(
                "Question contains no usable text."
            )

        probabilities = self.model.predict_proba(
            [normalized_question]
        )[0]

        classes = self.model.classes_

        ranked_indices = probabilities.argsort()[::-1]

        best_index = int(ranked_indices[0])
        confidence = float(probabilities[best_index])
        category = str(classes[best_index])

        if len(ranked_indices) > 1:
            second_index = int(ranked_indices[1])
            second_confidence = float(probabilities[second_index])
            confidence_margin = confidence - second_confidence
            second_category = str(classes[second_index])
        else:
            second_confidence = 0.0
            confidence_margin = confidence
            second_category = None

        needs_review = (
            confidence < self.CONFIDENCE_THRESHOLD
            or confidence_margin < self.MIN_CONFIDENCE_MARGIN
        )

        top_predictions = [
            {
                "category": str(classes[int(index)]),
                "confidence": round(
                    float(probabilities[int(index)]), 4
                ),
            }
            for index in ranked_indices[:3]
        ]

        return {
            "success": True,
            "question": clean_question,
            "category": category,
            "confidence": round(confidence, 4),
            "second_category": second_category,
            "second_confidence": round(second_confidence, 4),
            "confidence_margin": round(confidence_margin, 4),
            "top_predictions": top_predictions,
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

        loaded_categories = set(loaded_model.classes_)

        if not loaded_categories.issubset(self.CATEGORIES):
            raise ValueError(
                "Model contains unsupported categories."
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

        print("\nCategory distribution:")

        for category, count in result["category_counts"].items():
            print(f"  {category}: {count}")

        saved_path = classifier.save_model()
        print(f"\nModel saved at: {saved_path}")

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

            print(f"\nCategory: {prediction['category']}")
            print(
                f"Confidence: {prediction['confidence']:.2%}"
            )
            print(
                f"Confidence margin: "
                f"{prediction['confidence_margin']:.2%}"
            )

            print("\nTop predictions:")

            for item in prediction["top_predictions"]:
                print(
                    f"  {item['category']}: "
                    f"{item['confidence']:.2%}"
                )

            if prediction["needs_review"]:
                print(
                    "\nThis question needs further review."
                )
            else:
                print("\nClassification accepted.")

    except (
        FileNotFoundError,
        ValueError,
        RuntimeError,
        OSError,
    ) as error:
        print(f"Error: {error}")


if __name__ == "__main__":
    main()
