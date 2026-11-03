import json
import re
from pathlib import Path
from typing import Any

import joblib
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.pipeline import FeatureUnion, Pipeline
from sklearn.linear_model import LogisticRegression


class CodyQuestionClassifier:
    CATEGORIES = {
        "programming",
        "math",
        "science",
        "general_knowledge",
        "lesson_help",
        "code_debugging",
    }

    CONFIDENCE_THRESHOLD = 0.45
    MARGIN_THRESHOLD = 0.12
    MIN_EXAMPLES_PER_CATEGORY = 2

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
        """Normalize Arabic and English text before training or prediction."""
        text = text.strip().lower()

        arabic_digits = str.maketrans(
            "٠١٢٣٤٥٦٧٨٩",
            "0123456789",
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

        # Normalize repeated whitespace without removing useful punctuation.
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

        unique_examples: dict[str, str] = {}

        for index, item in enumerate(data):
            if not isinstance(item, dict):
                raise ValueError(
                    f"Invalid dataset item at index {index}."
                )

            question = item.get("question") or item.get("text")
            category = item.get("category") or item.get("label")

            if not isinstance(question, str) or not question.strip():
                raise ValueError(
                    f"Invalid question at index {index}."
                )

            if not isinstance(category, str) or not category.strip():
                raise ValueError(
                    f"Invalid category at index {index}."
                )

            category = category.strip()

            if category not in self.CATEGORIES:
                raise ValueError(
                    f"Unknown category at index {index}: {category}"
                )

            normalized_question = self.normalize_text(question)

            if not normalized_question:
                raise ValueError(
                    f"Question at index {index} is empty after normalization."
                )

            # Identical normalized questions cannot have different labels.
            if normalized_question in unique_examples:
                previous_category = unique_examples[normalized_question]

                if previous_category != category:
                    raise ValueError(
                        "Conflicting duplicate question found at "
                        f"index {index}: '{question}'. "
                        f"Existing category: {previous_category}; "
                        f"new category: {category}."
                    )

                # Same question and same category: skip duplicate.
                continue

            unique_examples[normalized_question] = category

        category_counts: dict[str, int] = {
            category: 0 for category in self.CATEGORIES
        }

        for category in unique_examples.values():
            category_counts[category] += 1

        missing_categories = [
            category
            for category, count in category_counts.items()
            if count < self.MIN_EXAMPLES_PER_CATEGORY
        ]

        if missing_categories:
            details = ", ".join(
                f"{category}: {category_counts[category]}"
                for category in sorted(missing_categories)
            )
            raise ValueError(
                "Each category must contain at least "
                f"{self.MIN_EXAMPLES_PER_CATEGORY} unique examples. "
                f"Insufficient data: {details}"
            )

        texts = list(unique_examples.keys())
        labels = list(unique_examples.values())

        return texts, labels

    def build_model(self) -> Pipeline:
        text_features = FeatureUnion(
            [
                (
                    "character_features",
                    TfidfVectorizer(
                        analyzer="char",
                        ngram_range=(2, 5),
                        max_features=20000,
                        sublinear_tf=True,
                    ),
                ),
                (
                    "word_features",
                    TfidfVectorizer(
                        analyzer="word",
                        ngram_range=(1, 2),
                        max_features=15000,
                        sublinear_tf=True,
                        token_pattern=r"(?u)\b\w+\b",
                    ),
                ),
            ]
        )

        return Pipeline(
            [
                ("features", text_features),
                (
                    "classifier",
                    LogisticRegression(
                        max_iter=2000,
                        class_weight="balanced",
                        random_state=42,
                    ),
                ),
            ]
        )

    def train(self) -> dict[str, Any]:
        texts, labels = self.load_training_data()

        # Train a separate model first. Keep the old model if training fails.
        new_model = self.build_model()
        new_model.fit(texts, labels)

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
            raise ValueError("Question cannot be empty after normalization.")

        probabilities = self.model.predict_proba(
            [normalized_question]
        )[0]

        classes = self.model.classes_

        ranked_indices = probabilities.argsort()[::-1]

        top_predictions = [
            {
                "category": str(classes[index]),
                "confidence": round(float(probabilities[index]), 4),
            }
            for index in ranked_indices[:3]
        ]

        best_index = int(ranked_indices[0])
        confidence = float(probabilities[best_index])
        category = str(classes[best_index])

        if len(ranked_indices) > 1:
            second_index = int(ranked_indices[1])
            second_category = str(classes[second_index])
            second_confidence = float(probabilities[second_index])
            confidence_margin = confidence - second_confidence
        else:
            second_category = None
            second_confidence = 0.0
            confidence_margin = confidence

        needs_review = (
            confidence < self.CONFIDENCE_THRESHOLD
            or confidence_margin < self.MARGIN_THRESHOLD
        )

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
        output_file: str | Path | None = None,
    ) -> Path:
        if not self.is_trained or self.model is None:
            raise RuntimeError("Train the model before saving it.")

        destination = (
            Path(output_file)
            if output_file
            else Path(__file__).resolve().parents[1]
            / "models"
            / "cody_question_classifier.joblib"
        )

        destination.parent.mkdir(parents=True, exist_ok=True)

        # Save to a temporary file first to avoid replacing a valid model
        # with an incomplete file if saving is interrupted.
        temporary_path = destination.with_name(
            destination.name + ".tmp"
        )

        try:
            joblib.dump(self.model, temporary_path)
            temporary_path.replace(destination)
        finally:
            if temporary_path.exists():
                temporary_path.unlink()

        return destination

    def load_model(self, model_file: str | Path) -> None:
        path = Path(model_file)

        if not path.is_file():
            raise FileNotFoundError(f"Model not found: {path}")

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
                "Invalid model: it contains unsupported categories."
            )

        self.model = loaded_model
        self.is_trained = True


def main() -> None:
    classifier = CodyQuestionClassifier()

    try:
        result = classifier.train()

        print("\n=== Cody ML Engine ===")
        print(result["message"])
        print(f"Training examples: {result['training_examples']}")
        print(f"Categories: {', '.join(result['categories'])}")
        print(f"Category counts: {result['category_counts']}")

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
            print(f"Confidence: {prediction['confidence']:.2%}")
            print(
                f"Second category: {prediction['second_category']}"
            )
            print(
                f"Confidence margin: "
                f"{prediction['confidence_margin']:.2%}"
            )

            if prediction["needs_review"]:
                print("This question needs further review.")

            print("Top predictions:")
            for item in prediction["top_predictions"]:
                print(
                    f"- {item['category']}: "
                    f"{item['confidence']:.2%}"
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