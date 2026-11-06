from pathlib import Path
import sys

import pytest
from fastapi.testclient import TestClient

ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from backend.main import app, load_curriculum, verify_firebase_token


@pytest.fixture
def client():
    with TestClient(app) as client:
        yield client
    app.dependency_overrides.clear()


@pytest.mark.parametrize('route,body', [
    ('/api/cody/chat', {'question': 'What is Python?'}),
    ('/api/quiz/check', {'language': 'python', 'lessonId': 'py-1-1', 'selectedIndex': 0}),
    ('/api/code/run', {'language': 'python', 'sourceCode': 'print(1)'}),
])
def test_private_routes_require_authentication(client, route, body):
    assert client.post(route, json=body).status_code == 401


def test_health_does_not_require_authentication(client):
    assert client.get('/health').status_code == 200


def test_invalid_bearer_header_is_rejected(client):
    response = client.post('/api/cody/chat', json={'question': 'Hello'}, headers={'Authorization': 'Basic abc'})
    assert response.status_code == 401


@pytest.mark.parametrize('language', ['python', 'javascript', 'cpp'])
def test_correct_quiz_answer(client, language):
    app.dependency_overrides[verify_firebase_token] = lambda: {'uid': 'test-user'}
    lesson = load_curriculum(language)['chapters'][0]['lessons'][0]
    response = client.post('/api/quiz/check', json={
        'language': language, 'lessonId': lesson['id'],
        'selectedIndex': lesson['quiz']['correct_index']
    })
    assert response.status_code == 200
    assert response.json()['correct'] is True


def test_quiz_rejects_out_of_range_selection(client):
    app.dependency_overrides[verify_firebase_token] = lambda: {'uid': 'test-user'}
    response = client.post('/api/quiz/check', json={
        'language': 'python', 'lessonId': 'py-1-1', 'selectedIndex': 100
    })
    assert response.status_code == 400


def test_malformed_curriculum_returns_controlled_error(client, monkeypatch, tmp_path):
    import backend.main as api
    (tmp_path / 'python_curriculum.json').write_text('[]')
    monkeypatch.setattr(api, 'CURRICULUM_DIR', tmp_path)
    app.dependency_overrides[verify_firebase_token] = lambda: {'uid': 'test-user'}
    response = client.post('/api/quiz/check', json={
        'language': 'python', 'lessonId': 'py-1-1', 'selectedIndex': 0
    })
    assert response.status_code == 500
    assert response.json()['detail'] == 'Curriculum JSON contains invalid data.'