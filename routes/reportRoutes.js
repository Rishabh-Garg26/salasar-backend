const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');

const localhostOnly = require('../middlewares/localhostOnlyMiddleware');

router.post('/send-report', localhostOnly, reportController.sendReport);

module.exports = router;
