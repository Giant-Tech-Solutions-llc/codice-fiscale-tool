'use strict';

const express = require('express');
const router = express.Router();
const toolController = require('../controllers/tool.controller.js');

router.get('/codice-fiscale-generator', toolController.showForm);
router.post('/codice-fiscale-generator', toolController.handleCalculation);

module.exports = router;
