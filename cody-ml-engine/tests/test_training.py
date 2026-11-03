
import sys
from pathlib import Path

import pytest

SRC_DIR = Path(__file__).resolve().parents[1] / "src"

if str(SRC_DIR) not in sys.path:
    sys.path.insert(0, str(SRC_DIR))

from question_classifier import CodyQuestionClassifier


def test_training_returns_expected_information():
    classifier = CodyQuestionClassifier()

    result = classifier.train()

    assert result["success"] is True
    assert result["training_examples"] > 0
    assert len(result["categories"]) >= 2

    assert classifier.is_trained is True
    assert classifier.model is not None


def test_training_returns_category_distribution():
    classifier = CodyQuestionClassifier()

    result = classifier.train()

    assert isinstance(result["category_counts"], dict)

    assert set(result["category_counts"]) == set(
        result["categories"]
    )

    assert sum(
        result["category_counts"].values()
    ) == result["training_examples"]


def test_model_can_train_and_save(tmp_path):
    classifier = CodyQuestionClassifier()
    classifier.train()

    model_path = tmp_path / "test_model.joblib"

    saved_path = classifier.save_model(model_path)

    assert saved_path == model_path
    assert model_path.exists()
    assert model_path.stat().st_size > 0


def test_model_can_load_and_predict_after_saving(tmp_path):
    classifier = CodyQuestionClassifier()
    classifier.train()

    model_path = tmp_path / "test_model.joblib"
    classifier.save_model(model_path)

    loaded_classifier = CodyQuestionClassifier()
    loaded_classifier.load_model(model_path)

    assert loaded_classifier.is_trained is True
    assert loaded_classifier.model is not None

    prediction = loaded_classifier.predict("What is Python?")

    assert prediction["success"] is True
    assert prediction["category"] == "programming"


def test_loaded_model_keeps_same_prediction(tmp_path):
    classifier = CodyQuestionClassifier()
    classifier.train()

    question = "What is a variable?"

    original_prediction = classifier.predict(question)

    model_path = tmp_path / "test_model.joblib"
    classifier.save_model(model_path)

    loaded_classifier = CodyQuestionClassifier()
    loaded_classifier.load_model(model_path)

    loaded_prediction = loaded_classifier.predict(question)

    assert (
        loaded_prediction["category"]
        == original_prediction["category"]
    )

    assert (
        loaded_prediction["confidence"]
        == original_prediction["confidence"]
    )

    assert (
        loaded_prediction["needs_review"]
        == original_prediction["needs_review"]
    )


def test_save_requires_training(tmp_path):
    classifier = CodyQuestionClassifier()

    model_path = tmp_path / "not_trained.joblib"

    with pytest.raises(RuntimeError):
        classifier.save_model(model_path)


def test_load_missing_model_raises_error(tmp_path):
    classifier = CodyQuestionClassifier()

    missing_path = tmp_path / "missing_model.joblib"

    with pytest.raises(FileNotFoundError):
        classifier.load_model(missing_path)


def test_model_can_predict_arabic_after_loading(tmp_path):
    classifier = CodyQuestionClassifier()
    classifier.train()

    model_path = tmp_path / "arabic_model.joblib"
    classifier.save_model(model_path)

    loaded_classifier = CodyQuestionClassifier()
    loaded_classifier.load_model(model_path)

    prediction = loaded_classifier.predict(
        "يعني ايه لغة بايثون؟"
    )

    assert prediction["category"] == "programming"
    assert isinstance(prediction["confidence"], float)


def test_training_can_be_repeated():
    classifier = CodyQuestionClassifier()

    first_result = classifier.train()
    second_result = classifier.train()

    assert first_result["success"] is True
    assert second_result["success"] is True
    assert classifier.is_trained is True


def test_failed_training_does_not_replace_existing_model(
    tmp_path
):
    classifier = CodyQuestionClassifier()
    classifier.train()

    previous_model = classifier.model

    invalid_file = tmp_path / "invalid.json"
    invalid_file.write_text(
        '{"examples": []}',
        encoding="utf-8"
    )

    classifier.training_file = invalid_file

    with pytest.raises(ValueError):
        classifier.train()

    assert classifier.model is previous_model
    assert classifier.is_trained is True


def test_prediction_contains_top_three_results():
    classifier = CodyQuestionClassifier()
    classifier.train()

    result = classifier.predict("What is Python?")

    assert len(result["top_predictions"]) <= 3

    assert result["top_predictions"][0]["category"] == (
        result["category"]
    )


def test_prediction_has_review_information():
    classifier = CodyQuestionClassifier()
    classifier.train()

    result = classifier.predict(
        "اشرح لي المتغيرات في البرمجة"
    )

    assert "needs_review" in result
    assert isinstance(result["needs_review"], bool)
    assert "confidence_margin" in result
