import express from 'express';
import { generateSimpleGuidance, analyzeInteractions } from '../services/geminiService.js';
import { sanitizeString } from '../middleware/security.js';

const router = express.Router();

/**
 * POST /api/ai/guidance
 * Translates prescription instructions into 1-sentence elderly guidance
 */
router.post('/guidance', async (req, res) => {
  try {
    const { medicationName, dosage, instructions, purpose } = req.body;
    if (!medicationName || typeof medicationName !== 'string') {
      return res.status(400).json({ error: 'medicationName is required and must be a string' });
    }

    const cleanName = sanitizeString(medicationName, 100);
    const cleanDosage = sanitizeString(dosage || '', 50);
    const cleanInstructions = sanitizeString(instructions || '', 300);
    const cleanPurpose = sanitizeString(purpose || '', 100);

    if (cleanName.length === 0) {
      return res.status(400).json({ error: 'medicationName cannot be empty' });
    }

    const simpleGuidance = await generateSimpleGuidance(
      cleanName,
      cleanDosage,
      cleanInstructions,
      cleanPurpose
    );

    res.json({
      medicationName: cleanName,
      simpleGuidance,
      generatedWith: process.env.GEMINI_API_KEY ? 'gemini-2.5-flash' : 'clinical-rule-engine',
    });
  } catch (error) {
    console.error('Error generating AI guidance:', error);
    res.status(500).json({ error: 'Failed to generate guidance', details: error.message });
  }
});

/**
 * POST /api/ai/interactions
 * Runs medication regimen interaction check
 */
router.post('/interactions', async (req, res) => {
  try {
    const { medications } = req.body;
    if (!Array.isArray(medications)) {
      return res.status(400).json({ error: 'medications array is required' });
    }

    if (medications.length === 0 || medications.length > 40) {
      return res.status(400).json({ error: 'medications array must contain between 1 and 40 items' });
    }

    // Sanitize every medication item in the list
    const cleanMedications = medications.map((m) => ({
      name: sanitizeString(m?.name || '', 100),
      dosage: sanitizeString(m?.dosage || '', 50),
      instructions: sanitizeString(m?.instructions || '', 300),
    }));

    const report = await analyzeInteractions(cleanMedications);
    res.json(report);
  } catch (error) {
    console.error('Error analyzing interactions:', error);
    res.status(500).json({ error: 'Failed to analyze interactions', details: error.message });
  }
});

export default router;
