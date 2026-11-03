from pathlib import Path
import sys

from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
)
from sklearn.model_selection import (
    StratifiedKFold,
    cross_val_score,
    train_test_split,
)

SRC_DIR = Path(__file__).resolve().parent

if str(SRC_DIR) not in sys.path:
    sys.path.insert(0, str(SRC_DIR))

from question_classifier import CodyQuestionClassifier


def main():
    classifier = CodyQuestionClassifier()

    print("=" * 60)
    print("Cody ML Engine - Training and Evaluation")
    print("=" * 60)

    questions, labels = classifier.load_training_data()

    class_names = sorted(set(labels))

    class_counts = {
        category: labels.count(category)
        for category in class_names
    }

    minimum_count = min(class_counts.values())

    if len(class_names) < 2:
        raise ValueError("At least two categories are required.")

    if minimum_count < 2:
        raise ValueError(
            "Every category needs at least two unique examples."
        )

    print(f"\nTotal examples: {len(questions)}")
    print(f"Number of categories: {len(class_names)}")

    print("\nDataset distribution:")
    for category, count in class_counts.items():
        print(f"  {category}: {count}")

    # Keep at least one example from each category in the test set.
    X_train, X_test, y_train, y_test = train_test_split(
        questions,
        labels,
        test_size=0.25,
        random_state=42,
        stratify=labels,
    )

    print(f"\nTraining split: {len(X_train)} examples")
    print(f"Testing split: {len(X_test)} examples")

    print("\nTraining evaluation model...")

    evaluation_model = classifier.build_model()
    evaluation_model.fit(X_train, y_train)

    predictions = evaluation_model.predict(X_test)

    accuracy = accuracy_score(y_test, predictions)

    print("\n" + "=" * 60)
    print("HOLDOUT EVALUATION")
    print("=" * 60)

    print(f"\nAccuracy: {accuracy:.2%}")

    print("\nClassification Report:")
    print(
        classification_report(
            y_test,
            predictions,
            labels=class_names,
            zero_division=0,
        )
    )

    print("\nConfusion Matrix:")
    matrix = confusion_matrix(
        y_test,
        predictions,
        labels=class_names,
    )

    print("Category order:", class_names)
    print(matrix)

    # Cross-validation uses all examples in separate folds.
    # The number of folds cannot exceed the smallest class count.
    folds = min(5, minimum_count)

    print("\n" + "=" * 60)
    print(f"CROSS-VALIDATION ({folds} folds)")
    print("=" * 60)

    cross_validator = StratifiedKFold(
        n_splits=folds,
        shuffle=True,
        random_state=42,
    )

    cross_validation_model = classifier.build_model()

    scores = cross_val_score(
        cross_validation_model,
        questions,
        labels,
        cv=cross_validator,
        scoring="accuracy",
        n_jobs=None,
    )

    print("Fold scores:", [round(float(score), 4) for score in scores])
    print(f"Mean accuracy: {scores.mean():.2%}")
    print(f"Standard deviation: {scores.std():.2%}")

    print("\n" + "=" * 60)
    print("TRAINING FINAL MODEL")
    print("=" * 60)

    training_result = classifier.train()
    saved_path = classifier.save_model()

    print("\nFinal model trained and saved.")
    print(f"Examples used: {training_result['training_examples']}")
    print(f"Categories: {len(training_result['categories'])}")
    print(f"Category counts: {training_result['category_counts']}")
    print(f"Model path: {saved_path}")

    print("\nEvaluation completed.")
    print(
        "Note: These scores estimate performance on this dataset. "
        "They do not guarantee accuracy on new student questions."
    )


if __name__ == "__main__":
    main()