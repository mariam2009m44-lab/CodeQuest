
from pathlib import Path
import sys

from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
)
from sklearn.model_selection import train_test_split

SRC_DIR = Path(__file__).resolve().parent

if str(SRC_DIR) not in sys.path:
    sys.path.insert(0, str(SRC_DIR))

from question_classifier import CodyQuestionClassifier


def main():
    classifier = CodyQuestionClassifier()

    print("=" * 55)
    print("Cody ML Engine - Model Training and Evaluation")
    print("=" * 55)

    questions, labels = classifier.load_training_data()

    if len(questions) < 12:
        raise ValueError("At least 12 training examples are required.")

    class_counts = {
        category: labels.count(category)
        for category in set(labels)
    }

    for category, count in class_counts.items():
        if count < 2:
            raise ValueError(
                f"Category '{category}' needs at least 2 examples."
            )

    print(f"\nTotal examples: {len(questions)}")
    print(f"Number of categories: {len(class_counts)}")

    for category, count in sorted(class_counts.items()):
        print(f"  {category}: {count}")

    X_train, X_test, y_train, y_test = train_test_split(
        questions,
        labels,
        test_size=0.25,
        random_state=42,
        stratify=labels,
    )

    print(f"\nTraining examples: {len(X_train)}")
    print(f"Testing examples: {len(X_test)}")

    print("\nTraining evaluation model...")

    evaluation_model = classifier.build_model()
    evaluation_model.fit(X_train, y_train)

    predictions = evaluation_model.predict(X_test)

    accuracy = accuracy_score(y_test, predictions)

    print("\n" + "=" * 55)
    print("MODEL EVALUATION")
    print("=" * 55)

    print(f"\nAccuracy: {accuracy:.2%}")

    print("\nClassification Report:")

    print(
        classification_report(
            y_test,
            predictions,
            labels=sorted(class_counts),
            zero_division=0,
        )
    )

    print("\nConfusion Matrix:")

    category_names = sorted(class_counts)

    matrix = confusion_matrix(
        y_test,
        predictions,
        labels=category_names,
    )

    print("Categories:", category_names)
    print(matrix)

    print("\n" + "=" * 55)
    print("TRAINING FINAL MODEL")
    print("=" * 55)

    training_result = classifier.train()

    saved_path = classifier.save_model()

    print("\nFinal model trained successfully.")
    print(f"Examples used: {training_result['training_examples']}")
    print(f"Categories: {len(training_result['categories'])}")
    print(f"Model saved at: {saved_path}")

    print("\nEvaluation completed.")
    print(
        "Important: The evaluation score is based on the held-out "
        "test set, not the final model's training accuracy."
    )


if __name__ == "__main__":
    main()
