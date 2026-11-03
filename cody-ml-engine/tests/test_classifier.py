import json
import sys
from pathlib import Path

import pytest

SRC_DIR = Path(__file__).resolve().parents[1] / "src"

if str(SRC_DIR) not in sys.path:
    sys.path.insert(0, str(SRC_DIR))

from question_classifier import CodyQuestionClassifier


CATEGORIES = [
    "programming",
    "math",
    "science",
    "general_knowledge",
    "lesson_help",
    "code_debugging",
]


@pytest.fixture
def classifier():
    return CodyQuestionClassifier()


@pytest.fixture
def trained_classifier(classifier):
    classifier.train()
    return classifier


def write_dataset(path, examples):
    path.write_text(
        json.dumps(examples, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )


def make_minimum_dataset():
    examples = []

    sample_questions = {
        "programming": [
            "What is a Python variable?",
            "How do programming loops work?",
        ],
        "math": [
            "Calculate the area of a square.",
            "What is five plus seven?",
        ],
        "science": [
            "Why does water evaporate?",
            "How do plants make food?",
        ],
        "general_knowledge": [
            "What is the capital of Egypt?",
            "Where is the Nile River?",
        ],
        "lesson_help": [
            "Explain this lesson simply.",
            "Summarize the chapter for me.",
        ],
        "code_debugging": [
            "Why does my Python code show an error?",
            "Help me fix this syntax error.",
        ],
    }

    for category, questions in sample_questions.items():
        for question in questions:
            examples.append({
                "question": question,
                "category": category,
            })

    return examples


def test_classifier_can_be_created(classifier):
    assert classifier is not None
    assert classifier.is_trained is False


def test_classifier_has_required_methods(classifier):
    assert callable(classifier.load_training_data)
    assert callable(classifier.build_model)
    assert callable(classifier.train)
    assert callable(classifier.predict)
    assert callable(classifier.save_model)
    assert callable(classifier.load_model)


def test_training_data_is_not_empty(classifier):
    questions, labels = classifier.load_training_data()

    assert len(questions) > 0
    assert len(labels) > 0
    assert len(questions) == len(labels)


def test_training_data_contains_all_categories(classifier):
    _, labels = classifier.load_training_data()

    assert set(labels) == classifier.CATEGORIES


def test_training_data_has_multiple_examples_per_category(classifier):
    _, labels = classifier.load_training_data()

    for category in classifier.CATEGORIES:
        assert labels.count(category) >= 2


def test_training_result_contains_category_counts(classifier):
    result = classifier.train()

    assert result["success"] is True
    assert result["training_examples"] > 0
    assert set(result["categories"]) == classifier.CATEGORIES

    for count in result["category_counts"].values():
        assert count >= 2


def test_model_can_train(classifier):
    result = classifier.train()

    assert result["success"] is True
    assert classifier.is_trained is True
    assert classifier.model is not None


@pytest.mark.parametrize(
    "question",
    ["", "   ", None, 123],
)
def test_predict_rejects_invalid_questions(
    trained_classifier,
    question,
):
    with pytest.raises(ValueError):
        trained_classifier.predict(question)


def test_predict_requires_training(classifier):
    with pytest.raises(RuntimeError):
        classifier.predict("What is Python?")


@pytest.mark.parametrize(
    ("question", "expected_category"),
    [
        ("What is Python?", "programming"),
        ("What is 5 plus 7?", "math"),
        ("Why is the sky blue?", "science"),
        ("What is the capital of Egypt?", "general_knowledge"),
        ("Explain this lesson simply", "lesson_help"),
        (
            "Why does my Python code show an error?",
            "code_debugging",
        ),
    ],
)
def test_predict_classifies_known_questions(
    trained_classifier,
    question,
    expected_category,
):
    result = trained_classifier.predict(question)

    assert result["success"] is True
    assert result["category"] == expected_category


def test_prediction_has_complete_structure(trained_classifier):
    result = trained_classifier.predict("What is a variable?")

    required_fields = {
        "success",
        "question",
        "category",
        "confidence",
        "second_category",
        "second_confidence",
        "confidence_margin",
        "top_predictions",
        "needs_review",
    }

    assert required_fields.issubset(result.keys())


def test_prediction_confidence_is_valid(trained_classifier):
    result = trained_classifier.predict("اشرح لي المتغيرات")

    assert 0.0 <= result["confidence"] <= 1.0
    assert 0.0 <= result["second_confidence"] <= 1.0
    assert 0.0 <= result["confidence_margin"] <= 1.0


def test_top_predictions_are_sorted(trained_classifier):
    result = trained_classifier.predict("What is Python?")

    predictions = result["top_predictions"]

    assert 1 <= len(predictions) <= 3

    confidences = [
        item["confidence"]
        for item in predictions
    ]

    assert confidences == sorted(confidences, reverse=True)


def test_confidence_margin_matches_top_predictions(trained_classifier):
    result = trained_classifier.predict("What is Python?")

    expected_margin = round(
        result["confidence"] - result["second_confidence"],
        4,
    )

    assert result["confidence_margin"] == expected_margin


def test_needs_review_is_boolean(trained_classifier):
    result = trained_classifier.predict("اشرح لي الدرس")

    assert isinstance(result["needs_review"], bool)


def test_arabic_normalization():
    result = CodyQuestionClassifier.normalize_text(
        "إِزّاي أَحْسِب ٥ + ٣؟"
    )

    assert result == "ازاي احسب 5 + 3؟"


def test_normalization_removes_tatweel():
    result = CodyQuestionClassifier.normalize_text("بـرمـجـة")

    assert result == "برمجة"


def test_same_duplicate_question_is_skipped(tmp_path):
    examples = [
        {"question": "What is Python?", "category": "programming"},
        {"question": "How do loops work?", "category": "programming"},
        {"question": "WHAT IS PYTHON?", "category": "programming"},
        {"question": "What is math?", "category": "math"},
        {"question": "Calculate five plus two.", "category": "math"},
    ]

    dataset = tmp_path / "duplicates.json"
    write_dataset(dataset, examples)

    classifier = CodyQuestionClassifier(dataset)
    questions, labels = classifier.load_training_data()

    assert len(questions) == 4
    assert len(labels) == 4
    assert labels.count("programming") == 2
    assert labels.count("math") == 2


def test_conflicting_duplicate_question_is_rejected(tmp_path):
    examples = [
        {"question": "What is Python?", "category": "programming"},
        {"question": "WHAT IS PYTHON?", "category": "math"},
    ]

    dataset = tmp_path / "conflict.json"
    write_dataset(dataset, examples)

    classifier = CodyQuestionClassifier(dataset)

    with pytest.raises(ValueError, match="Conflicting duplicate"):
        classifier.load_training_data()


def test_category_with_insufficient_examples_is_rejected(tmp_path):
    examples = make_minimum_dataset()
    examples = [
        item
        for item in examples
        if not (
            item["category"] == "science"
            and item["question"] == "How do plants make food?"
        )
    ]

    dataset = tmp_path / "insufficient.json"
    write_dataset(dataset, examples)

    classifier = CodyQuestionClassifier(dataset)

    with pytest.raises(ValueError, match="at least"):
        classifier.load_training_data()


def test_unknown_category_is_rejected(tmp_path):
    examples = make_minimum_dataset()
    examples[0]["category"] = "unknown_category"

    dataset = tmp_path / "invalid_category.json"
    write_dataset(dataset, examples)

    classifier = CodyQuestionClassifier(dataset)

    with pytest.raises(ValueError, match="Unknown category"):
        classifier.load_training_data()


def test_missing_question_is_rejected(tmp_path):
    examples = make_minimum_dataset()
    examples[0].pop("question")

    dataset = tmp_path / "missing_question.json"
    write_dataset(dataset, examples)

    classifier = CodyQuestionClassifier(dataset)

    with pytest.raises(ValueError, match="Invalid question"):
        classifier.load_training_data()


def test_invalid_json_structure_is_rejected(tmp_path):
    dataset = tmp_path / "invalid.json"
    write_dataset(dataset, {"wrong_key": []})

    classifier = CodyQuestionClassifier(dataset)

    with pytest.raises(ValueError):
        classifier.load_training_data()


def test_missing_dataset_is_rejected(tmp_path):
    classifier = CodyQuestionClassifier(
        tmp_path / "missing.json"
    )

    with pytest.raises(FileNotFoundError):
        classifier.load_training_data()


def test_model_can_be_saved_and_loaded(
    trained_classifier,
    tmp_path,
):
    model_path = tmp_path / "cody_test_model.joblib"

    trained_classifier.save_model(model_path)

    assert model_path.is_file()

    new_classifier = CodyQuestionClassifier()
    new_classifier.load_model(model_path)

    assert new_classifier.is_trained is True

    result = new_classifier.predict("What is Python?")

    assert result["category"] == "programming"


def test_save_model_requires_training(classifier, tmp_path):
    with pytest.raises(RuntimeError):
        classifier.save_model(tmp_path / "untrained.joblib")


def test_load_model_rejects_missing_file(classifier, tmp_path):
    with pytest.raises(FileNotFoundError):
        classifier.load_model(tmp_path / "missing.joblib")


def test_failed_training_preserves_existing_model(
    trained_classifier,
    monkeypatch,
):
    old_model = trained_classifier.model

    def failing_build_model():
        raise RuntimeError("Simulated training failure")

    monkeypatch.setattr(
        trained_classifier,
        "build_model",
        failing_build_model,
    )

    with pytest.raises(RuntimeError):
        trained_classifier.train()

    assert trained_classifier.model is old_model
    assert trained_classifier.is_trained is True