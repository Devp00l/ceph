# -*- coding: utf-8 -*-
from collections import defaultdict

from .. import mgr
from . import ControllerTestCase
from ..controllers.cephfs import CephFS


class MetaDataMock(object):
    def get(self, _x, _y):
        return 'bar'


class CephFsTest(ControllerTestCase):
    cephFs = CephFS()

    @classmethod
    def setup_server(cls):
        mgr.get_metadata.side_effect = lambda key, meta_key: {
            'mds': {
                None: None,  # Unknown key
                'foo': MetaDataMock()
            }[meta_key]
        }[key]
        # pylint: disable=protected-access
        CephFS._cp_config['tools.authenticate.on'] = False
        cls.setup_controllers([CephFS])

    def test_append_of_mds_metadata_if_key_is_not_found(self):
        mds_versions = defaultdict(list)
        self.cephFs._append_mds_metadata(mds_versions, None)
        self.assertEqual(len(mds_versions), 0)

    def test_append_of_mds_metadata_with_existing_metadata(self):
        mds_versions = defaultdict(list)
        self.cephFs._append_mds_metadata(mds_versions, 'foo')
        self.assertEqual(len(mds_versions), 1)
        self.assertEqual(mds_versions['bar'], ['foo'])
