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


def test_training_returns_expected_information(classifier):
    result = classifier.train()

    assert result["success"] is True
    assert result["training_examples"] > 0
    assert len(result["categories"]) == 6
    assert classifier.is_trained is True
    assert classifier.model is not None

    assert set(result["category_counts"]) == classifier.CATEGORIES


def test_training_has_multiple_examples_per_category(classifier):
    result = classifier.train()

    for count in result["category_counts"].values():
        assert count >= 2


def test_model_can_train_and_save(classifier, tmp_path):
    classifier.train()

    model_path = tmp_path / "test_model.joblib"
    saved_path = classifier.save_model(model_path)

    assert saved_path == model_path
    assert model_path.exists()
    assert model_path.stat().st_size > 0


def test_model_can_load_and_predict_after_saving(
    classifier,
    tmp_path,
):
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


def test_loaded_model_keeps_same_prediction(classifier, tmp_path):
    classifier.train()

    question = "What is a variable?"
    original_prediction = classifier.predict(question)

    model_path = tmp_path / "test_model.joblib"
    classifier.save_model(model_path)

    loaded_classifier = CodyQuestionClassifier()
    loaded_classifier.load_model(model_path)

    loaded_prediction = loaded_classifier.predict(question)

    assert loaded_prediction["category"] == original_prediction["category"]
    assert (
        loaded_prediction["confidence"]
        == original_prediction["confidence"]
    )


def test_loaded_model_returns_review_information(
    classifier,
    tmp_path,
):
    classifier.train()

    model_path = tmp_path / "review_model.joblib"
    classifier.save_model(model_path)

    loaded_classifier = CodyQuestionClassifier()
    loaded_classifier.load_model(model_path)

    result = loaded_classifier.predict(
        "Can you explain this programming concept?"
    )

    assert "needs_review" in result
    assert "confidence_margin" in result
    assert "top_predictions" in result


def test_repeated_training_works(classifier):
    first_result = classifier.train()
    first_model = classifier.model

    second_result = classifier.train()

    assert first_result["success"] is True
    assert second_result["success"] is True
    assert classifier.is_trained is True
    assert classifier.model is not None
    assert classifier.model is not first_model


def test_failed_training_preserves_previous_model(
    classifier,
    monkeypatch,
):
    classifier.train()
    original_model = classifier.model

    def fail_training():
        raise RuntimeError("Training failed")

    monkeypatch.setattr(
        classifier,
        "build_model",
        fail_training,
    )

    with pytest.raises(RuntimeError):
        classifier.train()

    assert classifier.model is original_model
    assert classifier.is_trained is True


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


def test_prediction_contains_top_three(classifier):
    classifier.train()

    result = classifier.predict("What is Python programming?")

    assert 1 <= len(result["top_predictions"]) <= 3

    for item in result["top_predictions"]:
        assert item["category"] in classifier.CATEGORIES
        assert 0.0 <= item["confidence"] <= 1.0