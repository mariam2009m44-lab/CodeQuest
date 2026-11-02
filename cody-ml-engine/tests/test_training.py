from pathlib import Path
import sys

SRC_DIR = Path(__file__).resolve().parents[1] / "src"
sys.path.insert(0, str(SRC_DIR))

from question_classifier import CodyQuestionClassifier


def test_model_can_train_and_save(tmp_path):
    classifier = CodyQuestionClassifier()

    classifier.train()

    model_path = tmp_path / "test_model.joblib"
    classifier.save_model(str(model_path))

    assert model_path.exists()


def test_model_can_load_after_training(tmp_path):
    classifier = CodyQuestionClassifier()

    classifier.train()

    model_path = tmp_path / "test_model.joblib"
    classifier.save_model(str(model_path))

    new_classifier = CodyQuestionClassifier()
    new_classifier.load_model(str(model_path))

    assert new_classifier.model is not None