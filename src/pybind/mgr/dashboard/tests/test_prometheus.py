# -*- coding: utf-8 -*-

from mock import patch, mock
from .. import mgr
from ..controllers.prometheus import Prometheus, PrometheusReceiver

from .helper import ControllerTestCase


class PrometheusControllerTest(ControllerTestCase):
    alert_host = 'http://alertmanager:9093/mock'
    alert_host_api = alert_host + '/api/v1'

    prometheus_host = 'http://prometheus:9090/mock'
    prometheus_host_api = prometheus_host + '/api/v1'

    @classmethod
    def setup_server(cls):
        settings = {
            'ALERTMANAGER_API_HOST': cls.alert_host,
            'PROMETHEUS_API_HOST': cls.prometheus_host
        }
        mgr.get_module_option.side_effect = settings.get
        Prometheus._cp_config['tools.authenticate.on'] = False  # pylint: disable=protected-access
        cls.setup_controllers([Prometheus, PrometheusReceiver])

    def test_query(self):
        with patch('requests.request') as mock_request:
            self._get('/api/prometheus/query?query=something')
            mock_request.assert_called_with('GET', self.prometheus_host_api + '/query',
                                            json=None, params={'query': 'something'})

    def test_list(self):
        with patch('requests.request') as mock_request:
            self._get('/api/prometheus')
            mock_request.assert_called_with('GET', self.alert_host_api + '/alerts',
                                            json=None, params={})

    def test_get_silences(self):
        with patch('requests.request') as mock_request:
            self._get('/api/prometheus/silences')
            mock_request.assert_called_with('GET', self.alert_host_api + '/silences',
                                            json=None, params={})

    def test_add_silence(self):
        with patch('requests.request') as mock_request:
            self._post('/api/prometheus/silence', {'id': 'new-silence'})
            mock_request.assert_called_with('POST', self.alert_host_api + '/silences',
                                            params=None, json={'id': 'new-silence'})
    def test_update_silence(self):
        with patch('requests.request') as mock_request:
            self._post('/api/prometheus/silence', {'id': 'update-silence'})
            mock_request.assert_called_with('POST', self.alert_host_api + '/silences',
                                            params=None, json={'id': 'update-silence'})

    def test_expire_silence(self):
        with patch('requests.request') as mock_request:
            self._delete('/api/prometheus/silence/0')
            mock_request.assert_called_with('DELETE', self.alert_host_api + '/silence/0',
                                            json=None, params=None)

    def test_silences_empty_delete(self):
        with patch('requests.request') as mock_request:
            self._delete('/api/prometheus/silence')
            mock_request.assert_not_called()

    def test_post_on_receiver(self):
        PrometheusReceiver.notifications = []
        self._post('/api/prometheus_receiver', {'name': 'foo'})
        self.assertEqual(len(PrometheusReceiver.notifications), 1)
        notification = PrometheusReceiver.notifications[0]
        self.assertEqual(notification['name'], 'foo')
        self.assertTrue(len(notification['notified']) > 20)

    def test_get_last_notification_with_empty_notifications(self):
        PrometheusReceiver.notifications = []
        self._post('/api/prometheus_receiver', {'name': 'foo'})
        self._post('/api/prometheus_receiver', {'name': 'bar'})
        self._post('/api/prometheus/get_notifications_since', {})
        self.assertStatus(200)
        last = PrometheusReceiver.notifications[1]
        self.assertEqual(self.jsonBody(), [last])

    def test_get_no_notification_since_with_last_notification(self):
        PrometheusReceiver.notifications = []
        self._post('/api/prometheus_receiver', {'name': 'foo'})
        notification = PrometheusReceiver.notifications[0]
        self._post('/api/prometheus/get_notifications_since', notification)
        self.assertBody('[]')

    def test_get_empty_list_with_no_notifications(self):
        PrometheusReceiver.notifications = []
        self._post('/api/prometheus/get_notifications_since', {})
        self.assertEqual(self.jsonBody(), [])

    def test_get_notifications_since_last_notification(self):
        PrometheusReceiver.notifications = []
        self._post('/api/prometheus_receiver', {'name': 'foobar'})
        next_to_last = PrometheusReceiver.notifications[0]
        self._post('/api/prometheus_receiver', {'name': 'foo'})
        self._post('/api/prometheus_receiver', {'name': 'bar'})
        self._post('/api/prometheus/get_notifications_since', next_to_last)
        foreLast = PrometheusReceiver.notifications[1]
        last = PrometheusReceiver.notifications[2]
        self.assertEqual(self.jsonBody(), [foreLast, last])
