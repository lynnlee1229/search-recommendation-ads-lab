"""Integration with the full service, without starting Jupyter or retraining."""

from urllib.parse import parse_qs, urlsplit
from fastapi.testclient import TestClient
from reclab.service import app
from reclab import notebook


def test_bilingual_reading_routes_are_independent_of_dataset_loading(monkeypatch):
    import reclab.service as service
    def unexpected():
        raise AssertionError('Reading a lesson must not load training data')
    monkeypatch.setattr(service, 'data', unexpected)
    monkeypatch.setattr(notebook, 'ensure_server', unexpected)
    with TestClient(app, base_url='http://localhost') as client:
        for lang in ('en', 'zh'):
            response = client.get('/api/learning', params={'lang': lang})
            assert response.status_code == 200
            assert response.json()['runtime']['can_execute'] is True
            assert len(response.json()['lessons']) == 63
            for target in ('common_31', 'search_35', 'ads_47', 'tower'):
                assert client.get(f'/learn/{target}', params={'lang': lang}).status_code == 200
                lesson = client.get(f'/api/lessons/{target}', params={'lang': lang}).json()
                assert lesson['lang'] == lang and lesson['cells']
        assert client.get('/api/learning?lang=unknown').status_code == 422
        assert client.get('/api/lessons/models').status_code == 404
        assert client.get('/learn/unknown').status_code == 404


def test_english_jupyter_launch_retains_token_login_and_language(monkeypatch):
    monkeypatch.setattr(notebook, 'ensure_server', lambda: {'token': 'test-only-token'})
    with TestClient(app, base_url='http://localhost') as client:
        response = client.get('/notebooks?target=common_31&lang=en', follow_redirects=False)
        assert response.status_code == 303
        parts = urlsplit(response.headers['location'])
        assert parts.netloc == '127.0.0.1:18581'
        params = parse_qs(parts.query)
        assert params['next'] == ['/lab/tree/notebooks/en/31_Common_Tensors.ipynb']
        assert params['token'] == ['test-only-token']
        assert response.headers['referrer-policy'] == 'no-referrer'
        assert client.get('/notebooks?target=common_31&lang=fr', follow_redirects=False).status_code == 422
