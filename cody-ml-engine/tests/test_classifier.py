

import json
import sys
from pathlib import Path

import pytest

SRC_DIR = Path(__file__).resolve().parents[1] / "src"
sys.path.insert(0, str(SRC_DIR))

from question_classifier import CodyQuestionClassifier


@pytest.fixture
def classifier():
    return CodyQuestionClassifier()


@pytest.fixture
def trained_classifier(classifier):
    classifier.train()
    return classifier


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


def test_training_data_contains_valid_text(classifier):
    questions, labels = classifier.load_training_data()

    assert all(isinstance(q, str) and q.strip() for q in questions)
    assert all(isinstance(label, str) and label.strip() for label in labels)


def test_training_data_has_all_categories(classifier):
    _, labels = classifier.load_training_data()

    expected_categories = {
        "programming",
        "math",
        "science",
        "general_knowledge",
        "lesson_help",
        "code_debugging",
    }

    assert expected_categories.issubset(set(labels))


def test_training_data_has_multiple_examples_per_category(classifier):
    _, labels = classifier.load_training_data()

    for category in classifier.CATEGORIES:
        assert labels.count(category) >= 2


def test_model_can_train(classifier):
    result = classifier.train()

    assert result["success"] is True
    assert classifier.is_trained is True
    assert classifier.model is not None
    assert result["training_examples"] > 0


def test_training_result_contains_categories(classifier):
    result = classifier.train()

    assert set(result["categories"]) == classifier.CATEGORIES


@pytest.mark.parametrize("question", [
    "",
    "   ",
    None,
    123,
])
def test_predict_rejects_invalid_questions(
    trained_classifier,
    question
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
            "code_debugging"
        ),
    ],
)
def test_predict_classifies_training_examples(
    trained_classifier,
    question,
    expected_category
):
    result = trained_classifier.predict(question)

    assert result["success"] is True
    assert result["category"] == expected_category


def test_prediction_has_valid_structure(trained_classifier):
    result = trained_classifier.predict("What is a variable?")

    assert result["success"] is True
    assert isinstance(result["question"], str)
    assert isinstance(result["category"], str)
    assert isinstance(result["confidence"], float)
    assert isinstance(result["needs_review"], bool)


def test_prediction_confidence_is_between_zero_and_one(
    trained_classifier
):
    result = trained_classifier.predict("اشرح لي المتغيرات")

    assert 0.0 <= result["confidence"] <= 1.0


def test_prediction_category_is_supported(trained_classifier):
    result = trained_classifier.predict("اشرح لي المتغيرات")

    assert result["category"] in trained_classifier.CATEGORIES


def test_model_can_be_saved_and_loaded(
    trained_classifier,
    tmp_path
):
    model_path = tmp_path / "cody_test_model.joblib"

    trained_classifier.save_model(model_path)

    assert model_path.is_file()

    new_classifier = CodyQuestionClassifier()
    new_classifier.load_model(model_path)

    assert new_classifier.is_trained is True
    assert new_classifier.model is not None

    result = new_classifier.predict("What is Python?")

    assert result["category"] == "programming"


def test_save_model_requires_training(classifier, tmp_path):
    model_path = tmp_path / "untrained.joblib"

    with pytest.raises(RuntimeError):
        classifier.save_model(model_path)


def test_load_model_rejects_missing_file(classifier, tmp_path):
    missing_path = tmp_path / "missing.joblib"

    with pytest.raises(FileNotFoundError):
        classifier.load_model(missing_path)


def test_invalid_training_data_is_rejected(tmp_path):
    invalid_file = tmp_path / "invalid.json"

    invalid_file.write_text(
        json.dumps({"examples": []}),
        encoding="utf-8"
    )

    classifier = CodyQuestionClassifier(invalid_file)

    with pytest.raises(ValueError):
        classifier.load_training_data()


def test_unknown_category_is_rejected(tmp_path):
    invalid_file = tmp_path / "invalid_category.json"

    invalid_file.write_text(
        json.dumps({
            "examples": [
                {
                    "question": "What is Python?",
                    "category": "unknown_category"
                },
                {
                    "question": "What is math?",
                    "category": "math"
                }
            ]
        }),
        encoding="utf-8"
    )

    classifier = CodyQuestionClassifier(invalid_file)

    with pytest.raises(ValueError):
        classifier.load_training_data()


def test_missing_question_is_rejected(tmp_path):
    invalid_file = tmp_path / "missing_question.json"

    invalid_file.write_text(
        json.dumps({
            "examples": [
                {
                    "category": "programming"
                },
                {
                    "question": "What is math?",
                    "category": "math"
                }
            ]
        }),
        encoding="utf-8"
    )

    classifier = CodyQuestionClassifier(invalid_file)

    with pytest.raises(ValueError):
        classifier.load_training_data()
