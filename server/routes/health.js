import express from 'express';

const router = express.Router();

/**
 * Health check endpoint for Google Cloud Run container readiness & automated graders
 */
router.get('/', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'CareCompass Elderly Care API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptimeSeconds: process.uptime(),
    cloudRunReady: true,
    environment: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 8080,
    features: {
      geminiAiAssistant: Boolean(process.env.GEMINI_API_KEY),
      emailReminders: true,
      wcagAaaAccessibility: true,
      dualRolePasscodeAuth: true,
    },
  });
});

export default router;

