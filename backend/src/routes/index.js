"use strict";
// backend/src/routes/index.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const equations_1 = __importDefault(require("./equations"));
const users_1 = __importDefault(require("./users"));
const router = (0, express_1.Router)();
// Health check
router.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        version: process.env.VERSION || '1.0.0',
        service: 'MetroCity Equation Engine'
    });
});
// API versioning
router.use('/v1/equations', equations_1.default);
router.use('/v1/users', users_1.default);
// Default version (current)
router.use('/equations', equations_1.default);
router.use('/users', users_1.default);
exports.default = router;
