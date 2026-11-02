import sys
from pathlib import Path

import pytest

SRC_DIR = Path(__file__).resolve().parents[1] / "src"
sys.path.insert(0, str(SRC_DIR))

from question_classifier import CodyQuestionClassifier


@pytest.fixture
def classifier():
    return CodyQuestionClassifier()


def test_classifier_can_be_created(classifier):
    assert classifier is not None


def test_classifier_has_required_methods(classifier):
    assert callable(classifier.train)
    assert callable(classifier.predict)
    assert callable(classifier.save_model)
    assert callable(classifier.load_model)


def test_predict_rejects_empty_question(classifier):
    with pytest.raises(ValueError):
        classifier.predict("")


def test_predict_rejects_non_string_question(classifier):
    with pytest.raises((ValueError, TypeError)):
        classifier.predict(None)


def test_training_data_is_not_empty(classifier):
    questions, labels = classifier.load_training_data()

    assert len(questions) > 0
    assert len(labels) > 0
    assert len(questions) == len(labels)


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


def test_training_data_contains_valid_text(classifier):
    questions, labels = classifier.load_training_data()

    assert all(isinstance(q, str) and q.strip() for q in questions)
    assert all(isinstance(label, str) for label in labels)