
from pathlib import Path
import sys
import math

from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
)
from sklearn.model_selection import (
    train_test_split,
    StratifiedKFold,
    cross_val_score,
)

SRC_DIR = Path(__file__).resolve().parent

if str(SRC_DIR) not in sys.path:
    sys.path.insert(0, str(SRC_DIR))

from question_classifier import CodyQuestionClassifier


def print_separator():
    print("=" * 65)


def print_dataset_summary(labels):
    categories = sorted(set(labels))

    print("\nDATASET SUMMARY")
    print_separator()

    print(f"Total examples: {len(labels)}")
    print(f"Number of categories: {len(categories)}")

    for category in categories:
        count = labels.count(category)
        print(f"  {category}: {count}")

    return categories


def evaluate_holdout(classifier, questions, labels, categories):
    print("\nHOLDOUT EVALUATION")
    print_separator()

    number_of_categories = len(categories)
    total_examples = len(questions)

    # Ensure the test set contains at least one example
    # from every category, while retaining training examples.
    test_count = max(
        number_of_categories,
        math.ceil(total_examples * 0.25)
    )

    minimum_training_count = number_of_categories

    if total_examples - test_count < minimum_training_count:
        raise ValueError(
            "Not enough examples for a reliable stratified "
            "train/test split. Add more training examples."
        )

    test_size = test_count / total_examples

    X_train, X_test, y_train, y_test = train_test_split(
        questions,
        labels,
        test_size=test_size,
        random_state=42,
        stratify=labels,
    )

    print(f"Training examples: {len(X_train)}")
    print(f"Testing examples: {len(X_test)}")

    evaluation_model = classifier.build_model()
    evaluation_model.fit(X_train, y_train)

    predictions = evaluation_model.predict(X_test)

    accuracy = accuracy_score(y_test, predictions)

    print("\nAccuracy:")
    print(f"{accuracy:.2%}")

    print("\nClassification Report:")
    print(
        classification_report(
            y_test,
            predictions,
            labels=categories,
            zero_division=0,
        )
    )

    matrix = confusion_matrix(
        y_test,
        predictions,
        labels=categories,
    )

    print("\nCONFUSION MATRIX")
    print_separator()

    print("Rows = Actual category")
    print("Columns = Predicted category")
    print("\nCategories:")
    print(categories)
    print("\nMatrix:")
    print(matrix)

    return {
        "accuracy": accuracy,
        "training_examples": len(X_train),
        "testing_examples": len(X_test),
    }


def evaluate_cross_validation(classifier, questions, labels):
    print("\nCROSS-VALIDATION")
    print_separator()

    category_counts = {
        category: labels.count(category)
        for category in set(labels)
    }

    minimum_class_count = min(category_counts.values())

    # Cross-validation requires at least two examples
    # in every category.
    number_of_folds = min(5, minimum_class_count)

    if number_of_folds < 2:
        print(
            "Skipped: every category needs at least "
            "two examples."
        )
        return None

    cross_validator = StratifiedKFold(
        n_splits=number_of_folds,
        shuffle=True,
        random_state=42,
    )

    model = classifier.build_model()

    scores = cross_val_score(
        model,
        questions,
        labels,
        cv=cross_validator,
        scoring="accuracy",
        error_score="raise",
    )

    print(f"Number of folds: {number_of_folds}")

    for index, score in enumerate(scores, start=1):
        print(f"Fold {index}: {score:.2%}")

    mean_score = scores.mean()
    std_score = scores.std()

    print(f"\nMean accuracy: {mean_score:.2%}")
    print(f"Standard deviation: {std_score:.2%}")

    return {
        "folds": number_of_folds,
        "mean_accuracy": float(mean_score),
        "standard_deviation": float(std_score),
    }


def train_final_model(classifier):
    print("\nFINAL MODEL TRAINING")
    print_separator()

    result = classifier.train()

    print(result["message"])
    print(f"Training examples: {result['training_examples']}")
    print(f"Categories: {len(result['categories'])}")

    print("\nCategory distribution:")

    for category, count in result["category_counts"].items():
        print(f"  {category}: {count}")

    saved_path = classifier.save_model()

    print(f"\nModel saved at: {saved_path}")

    return result, saved_path


def main():
    print_separator()
    print("CODY ML ENGINE")
    print("Training and Evaluation Pipeline")
    print_separator()

    classifier = CodyQuestionClassifier()

    try:
        questions, labels = classifier.load_training_data()

        categories = print_dataset_summary(labels)

        if len(categories) < 2:
            raise ValueError(
                "At least two categories are required."
            )

        category_counts = {
            category: labels.count(category)
            for category in categories
        }

        for category, count in category_counts.items():
            if count < 2:
                raise ValueError(
                    f"Category '{category}' needs at least "
                    "two examples."
                )

        holdout_result = evaluate_holdout(
            classifier,
            questions,
            labels,
            categories,
        )

        cross_validation_result = evaluate_cross_validation(
            classifier,
            questions,
            labels,
        )

        training_result, saved_path = train_final_model(
            classifier
        )

        print("\nFINAL SUMMARY")
        print_separator()

        print(
            f"Holdout accuracy: "
            f"{holdout_result['accuracy']:.2%}"
        )

        if cross_validation_result is not None:
            print(
                f"Cross-validation mean accuracy: "
                f"{cross_validation_result['mean_accuracy']:.2%}"
            )

        print(
            f"Examples used for final training: "
            f"{training_result['training_examples']}"
        )

        print(f"Saved model: {saved_path}")

        print("\nImportant:")
        print(
            "Evaluation results are estimates based on the "
            "current dataset. More diverse examples are needed "
            "before claiming reliable real-world performance."
        )

        print("\nTraining pipeline completed.")

    except (
        FileNotFoundError,
        ValueError,
        RuntimeError,
        OSError,
    ) as error:
        print(f"\nTraining failed: {error}")
        raise


if __name__ == "__main__":
    main()
