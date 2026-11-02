from pathlib import Path
import sys

from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, confusion_matrix

SRC_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SRC_DIR.parent

if str(SRC_DIR) not in sys.path:
    sys.path.insert(0, str(SRC_DIR))

from question_classifier import CodyQuestionClassifier


def main():
    classifier = CodyQuestionClassifier()

    print("=" * 50)
    print("Cody ML Engine - Training")
    print("=" * 50)

    questions, labels = classifier.load_training_data()

    if len(questions) < 12:
        raise ValueError("Not enough training examples.")

    class_counts = {}
    for label in labels:
        class_counts[label] = class_counts.get(label, 0) + 1

    for label, count in class_counts.items():
        if count < 2:
            raise ValueError(
                f"Category '{label}' needs at least 2 examples."
            )

    X_train, X_test, y_train, y_test = train_test_split(
        questions,
        labels,
        test_size=0.25,
        random_state=42,
        stratify=labels
    )

    print(f"\nTraining examples: {len(X_train)}")
    print(f"Testing examples: {len(X_test)}")

    # Evaluate using training data only
    evaluation_model = classifier.build_model()
    evaluation_model.fit(X_train, y_train)

    predictions = evaluation_model.predict(X_test)

    print("\nClassification Report:")
    print(
        classification_report(
            y_test,
            predictions,
            zero_division=0
        )
    )

    print("\nConfusion Matrix:")
    category_names = sorted(set(labels))

    print(confusion_matrix(
        y_test,
        predictions,
        labels=category_names
    ))

    # Train the final model using all available data
    print("\nTraining final model with all data...")

    classifier.train()
    classifier.save_model()

    print("\nTraining completed successfully!")
    print("Model saved in: models/")


if __name__ == "__main__":
    main()