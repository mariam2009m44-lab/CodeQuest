
import json
import sys
from pathlib import Path

import pytest

SRC_DIR = Path(__file__).resolve().parents[1] / "src"

if str(SRC_DIR) not in sys.path:
    sys.path.insert(0, str(SRC_DIR))

from question_classifier import CodyQuestionClassifier


@pytest.fixture
def classifier():
    return CodyQuestionClassifier()


@pytest.fixture
def trained_classifier(classifier):
    classifier.train()
    return classifier


def write_dataset(path, examples):
    path.write_text(
        json.dumps(
            {"examples": examples},
            ensure_ascii=False,
            indent=2
        ),
        encoding="utf-8"
    )


def test_classifier_can_be_created(classifier):
    assert classifier is not None
    assert classifier.is_trained is False
    assert classifier.model is None


def test_classifier_has_required_methods(classifier):
    methods = [
        "load_training_data",
        "build_model",
        "train",
        "predict",
        "save_model",
        "load_model",
        "normalize_text",
    ]

    for method in methods:
        assert callable(getattr(classifier, method))


def test_training_data_is_not_empty(classifier):
    questions, labels = classifier.load_training_data()

    assert len(questions) > 0
    assert len(labels) > 0
    assert len(questions) == len(labels)


def test_training_data_contains_valid_text(classifier):
    questions, labels = classifier.load_training_data()

    assert all(
        isinstance(question, str) and question.strip()
        for question in questions
    )

    assert all(
        isinstance(label, str) and label.strip()
        for label in labels
    )


def test_training_data_contains_all_categories(classifier):
    _, labels = classifier.load_training_data()

    assert classifier.CATEGORIES.issubset(set(labels))


def test_training_data_has_multiple_examples_per_category(
    classifier
):
    _, labels = classifier.load_training_data()

    for category in classifier.CATEGORIES:
        assert labels.count(category) >= 2


def test_training_data_has_no_duplicate_questions(classifier):
    questions, _ = classifier.load_training_data()

    assert len(questions) == len(set(questions))


def test_normalize_arabic_text():
    normalized = CodyQuestionClassifier.normalize_text(
        "إِزّاي أَحْسِب ٥ + ٣؟"
    )

    assert normalized == "ازاي احسب 5 + 3؟"


def test_normalize_english_text():
    normalized = CodyQuestionClassifier.normalize_text(
        "   What   IS   Python?   "
    )

    assert normalized == "what is python?"


def test_normalize_rejects_non_string():
    with pytest.raises(TypeError):
        CodyQuestionClassifier.normalize_text(123)


def test_model_can_train(classifier):
    result = classifier.train()

    assert result["success"] is True
    assert classifier.is_trained is True
    assert classifier.model is not None
    assert result["training_examples"] > 0


def test_training_result_contains_category_counts(classifier):
    result = classifier.train()

    assert set(result["categories"]) == classifier.CATEGORIES
    assert set(result["category_counts"]) == classifier.CATEGORIES

    assert sum(
        result["category_counts"].values()
    ) == result["training_examples"]


@pytest.mark.parametrize(
    "question",
    [
        "",
        "   ",
        None,
        123,
    ],
)
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
        (
            "What is the capital of Egypt?",
            "general_knowledge"
        ),
        (
            "Explain this lesson simply",
            "lesson_help"
        ),
        (
            "Why does my Python code show an error?",
            "code_debugging"
        ),
        (
            "يعني ايه لغة بايثون؟",
            "programming"
        ),
        (
            "ناتج خمسة زائد سبعة كام؟",
            "math"
        ),
        (
            "اشرح لي البناء الضوئي",
            "science"
        ),
    ],
)
def test_predict_classifies_known_examples(
    trained_classifier,
    question,
    expected_category
):
    result = trained_classifier.predict(question)

    assert result["success"] is True
    assert result["category"] == expected_category


def test_prediction_has_valid_structure(trained_classifier):
    result = trained_classifier.predict(
        "What is a variable?"
    )

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

    assert result["success"] is True
    assert isinstance(result["question"], str)
    assert isinstance(result["category"], str)
    assert isinstance(result["confidence"], float)
    assert isinstance(result["confidence_margin"], float)
    assert isinstance(result["needs_review"], bool)


def test_prediction_confidence_is_valid(trained_classifier):
    result = trained_classifier.predict(
        "اشرح لي المتغيرات في البرمجة"
    )

    assert 0.0 <= result["confidence"] <= 1.0
    assert 0.0 <= result["second_confidence"] <= 1.0
    assert 0.0 <= result["confidence_margin"] <= 1.0


def test_prediction_category_is_supported(trained_classifier):
    result = trained_classifier.predict(
        "اشرح لي المتغيرات"
    )

    assert result["category"] in trained_classifier.CATEGORIES


def test_top_predictions_are_sorted(trained_classifier):
    result = trained_classifier.predict(
        "What is Python?"
    )

    predictions = result["top_predictions"]

    assert len(predictions) <= 3

    scores = [
        item["confidence"]
        for item in predictions
    ]

    assert scores == sorted(scores, reverse=True)


def test_top_predictions_have_valid_categories(trained_classifier):
    result = trained_classifier.predict(
        "What is Python?"
    )

    for item in result["top_predictions"]:
        assert item["category"] in trained_classifier.CATEGORIES
        assert 0.0 <= item["confidence"] <= 1.0


def test_confidence_margin_matches_probabilities(
    trained_classifier
):
    result = trained_classifier.predict(
        "What is Python?"
    )

    expected_margin = round(
        result["confidence"] - result["second_confidence"],
        4
    )

    assert result["confidence_margin"] == expected_margin


def test_review_flag_uses_configured_threshold(
    trained_classifier
):
    result = trained_classifier.predict(
        "What is Python?"
    )

    expected_review = (
        result["confidence"]
        < trained_classifier.CONFIDENCE_THRESHOLD
        or result["confidence_margin"]
        < trained_classifier.MIN_CONFIDENCE_MARGIN
    )

    assert result["needs_review"] == expected_review


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


def test_loaded_model_preserves_predictions(
    trained_classifier,
    tmp_path
):
    question = "What is a variable?"

    original = trained_classifier.predict(question)

    model_path = tmp_path / "classifier.joblib"
    trained_classifier.save_model(model_path)

    loaded = CodyQuestionClassifier()
    loaded.load_model(model_path)

    restored = loaded.predict(question)

    assert restored["category"] == original["category"]
    assert restored["confidence"] == original["confidence"]
    assert restored["needs_review"] == original["needs_review"]


def test_invalid_training_data_is_rejected(tmp_path):
    invalid_file = tmp_path / "invalid.json"

    write_dataset(invalid_file, [])

    classifier = CodyQuestionClassifier(invalid_file)

    with pytest.raises(ValueError):
        classifier.load_training_data()


def test_unknown_category_is_rejected(tmp_path):
    invalid_file = tmp_path / "invalid_category.json"

    write_dataset(
        invalid_file,
        [
            {
                "question": "What is Python?",
                "category": "unknown_category"
            },
            {
                "question": "What is math?",
                "category": "math"
            },
        ]
    )

    classifier = CodyQuestionClassifier(invalid_file)

    with pytest.raises(ValueError):
        classifier.load_training_data()


def test_missing_question_is_rejected(tmp_path):
    invalid_file = tmp_path / "missing_question.json"

    write_dataset(
        invalid_file,
        [
            {"category": "programming"},
            {
                "question": "What is math?",
                "category": "math"
            },
        ]
    )

    classifier = CodyQuestionClassifier(invalid_file)

    with pytest.raises(ValueError):
        classifier.load_training_data()


def test_conflicting_duplicate_questions_are_rejected(tmp_path):
    invalid_file = tmp_path / "duplicates.json"

    write_dataset(
        invalid_file,
        [
            {
                "question": "What is Python?",
                "category": "programming"
            },
            {
                "question": "  WHAT IS PYTHON? ",
                "category": "math"
            },
        ]
    )

    classifier = CodyQuestionClassifier(invalid_file)

    with pytest.raises(ValueError):
        classifier.load_training_data()


def test_same_duplicate_question_is_skipped(tmp_path):
    invalid_file = tmp_path / "same_duplicates.json"

    write_dataset(
        invalid_file,
        [
            {
                "question": "What is Python?",
                "category": "programming"
            },
            {
                "question": "  WHAT IS PYTHON? ",
                "category": "programming"
            },
            {
                "question": "What is 2 plus 2?",
                "category": "math"
            },
            {
                "question": "What is 3 plus 3?",
                "category": "math"
            },
        ]
    )

    classifier = CodyQuestionClassifier(invalid_file)
    questions, labels = classifier.load_training_data()

    assert len(questions) == 3
    assert len(labels) == 3


def test_missing_dataset_is_rejected(tmp_path):
    missing_file = tmp_path / "missing.json"

    classifier = CodyQuestionClassifier(missing_file)

    with pytest.raises(FileNotFoundError):
        classifier.load_training_data()

