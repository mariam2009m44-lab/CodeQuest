
from pathlib import Path
import sys

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

    assert loaded_prediction["category"] == original_prediction["category"]


def test_save_requires_training(tmp_path):
    classifier = CodyQuestionClassifier()
    model_path = tmp_path / "not_trained.joblib"

    try:
        classifier.save_model(model_path)
        assert False, "Saving an untrained model should fail."
    except RuntimeError:
        pass


def test_load_missing_model_raises_error(tmp_path):
    classifier = CodyQuestionClassifier()
    missing_path = tmp_path / "missing_model.joblib"

    try:
        classifier.load_model(missing_path)
        assert False, "Loading a missing model should fail."
    except FileNotFoundError:
        pass
