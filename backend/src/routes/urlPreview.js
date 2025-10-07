const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { checkRole } = require('../middleware/roles');
const {
  getUrlPreview,
  checkUrl,
  getPreviewSettings,
  savePreviewSettings,
  hideUrlPreview,
  addBlacklistedUrl,
  getBlacklistedUrls,
  removeBlacklistedUrl,
  
  getProxyUrls,
  addProxyUrl,
  addProxyUrlsBulk,
  removeProxyUrl,
  updateProxyUrl,
  getProxyHealth,
  testProxies
} = require('../controllers/urlPreviewController');


router.get('/', getUrlPreview);
router.get('/check', checkUrl);


router.get('/settings', authMiddleware, getPreviewSettings);
router.post('/settings', authMiddleware, savePreviewSettings);
router.post('/hide-preview', authMiddleware, hideUrlPreview);


router.post('/blacklist', authMiddleware, checkRole(["admin"]), addBlacklistedUrl);
router.get('/blacklist', authMiddleware, checkRole(["admin"]), getBlacklistedUrls);
router.delete('/blacklist/:id', authMiddleware, checkRole(["admin"]), removeBlacklistedUrl);


router.get('/proxy', authMiddleware, checkRole(['admin']), getProxyUrls);
router.get('/proxy/:id/health', authMiddleware, checkRole(['admin']), getProxyHealth);
router.post('/proxy', authMiddleware, checkRole(['admin']), addProxyUrl);
router.post('/proxy/bulk', authMiddleware, checkRole(['admin']), addProxyUrlsBulk);
router.post('/proxy/test', authMiddleware, checkRole(['admin']), testProxies);
router.delete('/proxy/:id', authMiddleware, checkRole(['admin']), removeProxyUrl);
router.put('/proxy/:id', authMiddleware, checkRole(['admin']), updateProxyUrl);

module.exports = router;
