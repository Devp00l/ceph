# -*- coding: utf-8 -*-
from __future__ import absolute_import

from .helper import DashboardTestCase, JObj, JList, JLeaf


class CephfsTest(DashboardTestCase):
    CEPHFS = True

    AUTH_ROLES = ['cephfs-manager']

    @DashboardTestCase.RunAs('test', 'test', ['block-manager'])
    def test_access_permissions(self):
        fs_id = self.fs.get_namespace_id()
        self._get("/api/cephfs/{}/clients".format(fs_id))
        self.assertStatus(403)
        self._get("/api/cephfs/{}".format(fs_id))
        self.assertStatus(403)
        self._get("/api/cephfs/{}/mds_counters".format(fs_id))
        self.assertStatus(403)

    def test_cephfs_clients(self):
        fs_id = self.fs.get_namespace_id()
        data = self._get("/api/cephfs/{}/clients".format(fs_id))
        self.assertStatus(200)

        self.assertIn('status', data)
        self.assertIn('data', data)

    def test_cephfs_evict_client_does_not_exist(self):
        fs_id = self.fs.get_namespace_id()
        data = self._delete("/api/cephfs/{}/client/1234".format(fs_id))
        self.assertStatus(404)

    def test_cephfs_get(self):
        fs_id = self.fs.get_namespace_id()
        data = self._get("/api/cephfs/{}/".format(fs_id))
        self.assertStatus(200)

        self.assertIn('cephfs', data)
        self.assertIn('standbys', data)
        self.assertIn('versions', data)
        self.assertIsNotNone(data['cephfs'])
        self.assertIsNotNone(data['standbys'])
        self.assertIsNotNone(data['versions'])

    def test_cephfs_mds_counters(self):
        fs_id = self.fs.get_namespace_id()
        data = self._get("/api/cephfs/{}/mds_counters".format(fs_id))
        self.assertStatus(200)

        self.assertIsInstance(data, dict)
        self.assertIsNotNone(data)

    def test_cephfs_mds_counters_wrong(self):
        self._get("/api/cephfs/baadbaad/mds_counters")
        self.assertStatus(400)
        self.assertJsonBody({
            "component": 'cephfs',
            "code": "invalid_cephfs_id",
            "detail": "Invalid cephfs ID baadbaad"
        })

    def test_cephfs_list(self):
        data = self._get("/api/cephfs/")
        self.assertStatus(200)
        self.assertIsInstance(data, list)

        cephfs = data[0]
        self.assertIn('id', cephfs)
        self.assertIn('mdsmap', cephfs)
        self.assertIsNotNone(cephfs['id'])
        self.assertIsNotNone(cephfs['mdsmap'])

    def test_ls_mk_rm_dir(self):
        data = self._get("/api/cephfs/1/ls_dir", params={'path': '/'})
        self.assertStatus(200)
        self.assertIsInstance(data, list)
        self.assertEqual(len(data), 0)

        self._post("/api/cephfs/1/mk_dirs", params={'path': '/pictures/birds'})
        self.assertStatus(200)

        data = self._get("/api/cephfs/1/ls_dir", params={'path': '/pictures'})
        self.assertStatus(200)
        self.assertIsInstance(data, list)
        self.assertEqual(len(data), 1)

        self._post("/api/cephfs/1/rm_dir", params={'path': '/pictures'})
        self.assertStatus(500)
        self._post("/api/cephfs/1/rm_dir", params={'path': '/pictures/birds'})
        self.assertStatus(200)
        self._post("/api/cephfs/1/rm_dir", params={'path': '/pictures'})
        self.assertStatus(200)

        data = self._get("/api/cephfs/1/ls_dir", params={'path': '/'})
        self.assertStatus(200)
        self.assertIsInstance(data, list)
        self.assertEqual(len(data), 0)

    def test_snapshots(self):
        self._post("/api/cephfs/1/mk_dirs", params={'path': '/movies/dune'})
        self.assertStatus(200)

        self._post("/api/cephfs/1/mk_snapshot",
                   params={'path': '/movies/dune', 'name': 'test'})
        self.assertStatus(200)

        data = self._get("/api/cephfs/1/ls_dir", params={'path': '/movies'})
        self.assertStatus(200)
        self.assertIsInstance(data, list)
        self.assertEqual(len(data), 1)
        self.assertSchema(data[0], JObj(sub_elems={
            'name': JLeaf(str),
            'path': JLeaf(str),
            'snapshots': JList(JObj(sub_elems={
                'name': JLeaf(str),
                'path': JLeaf(str),
                'created': JLeaf(str)
            })),
            'quotas': JObj(sub_elems={
                'max_bytes': JLeaf(int),
                'max_files': JLeaf(int)
            })
        }))
        snapshots = data[0]['snapshots']
        self.assertEqual(len(snapshots), 1)
        snapshot = snapshots[0]
        self.assertEqual(snapshot['name'], "test")
        self.assertEqual(snapshot['path'], "/movies/dune/.snap/test")

        self._post("/api/cephfs/1/rm_snapshot",
                   params={'path': '/movies/dune', 'name': 'test'})
        self.assertStatus(200)

        data = self._get("/api/cephfs/1/ls_dir", params={'path': '/movies'})
        self.assertStatus(200)
        self.assertEqual(len(data[0]['snapshots']), 0)
