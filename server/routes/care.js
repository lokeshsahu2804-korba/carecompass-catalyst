import express from 'express';
import { careStore } from '../data/store.js';
import { sanitizeString } from '../middleware/security.js';

const router = express.Router();

/**
 * GET /api/care/state
 * Returns full care platform state (profile, medications, todayDoses, adherenceHistory, appointments)
 */
router.get('/state', (req, res) => {
  try {
    const state = careStore.getState();
    res.json({
      success: true,
      data: state,
    });
  } catch (error) {
    console.error('[Care API] Error getting state:', error);
    res.status(500).json({ error: 'Failed to retrieve care state', message: error.message });
  }
});

/**
 * POST /api/care/medications
 * Adds a new medication and schedules its daily dose
 */
router.post('/medications', (req, res) => {
  try {
    const {
      name,
      genericName,
      dosage,
      form,
      frequency,
      instructions,
      simpleGuidance,
      purpose,
      pillColor,
      pillShape,
      pillCount,
      refillAt,
      timeSlots,
      scheduledTimes,
    } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Medication name is required' });
    }

    if (!dosage || typeof dosage !== 'string' || !dosage.trim()) {
      return res.status(400).json({ error: 'Dosage is required (e.g. 10mg)' });
    }

    const cleanMed = {
      name: sanitizeString(name, 100),
      genericName: sanitizeString(genericName || name, 100),
      dosage: sanitizeString(dosage, 50),
      form: sanitizeString(form || 'tablet', 50),
      frequency: sanitizeString(frequency || 'Once daily', 100),
      instructions: sanitizeString(instructions || '', 300),
      simpleGuidance: sanitizeString(simpleGuidance || 'Take with water as directed.', 300),
      purpose: sanitizeString(purpose || 'General Health', 100),
      pillColor: sanitizeString(pillColor || 'bg-teal-500 text-white', 60),
      pillShape: sanitizeString(pillShape || 'Round tablet', 60),
      pillCount: Math.max(1, parseInt(pillCount, 10) || 30),
      refillAt: Math.max(1, parseInt(refillAt, 10) || 7),
      timeSlots: Array.isArray(timeSlots) && timeSlots.length > 0 ? timeSlots : ['morning'],
      scheduledTimes: Array.isArray(scheduledTimes) && scheduledTimes.length > 0 ? scheduledTimes : ['08:00 AM'],
    };

    const newMed = careStore.addMedication(cleanMed);
    res.status(201).json({
      success: true,
      message: 'Medication added successfully',
      medication: newMed,
    });
  } catch (error) {
    console.error('[Care API] Error adding medication:', error);
    res.status(500).json({ error: 'Failed to add medication', message: error.message });
  }
});

/**
 * PUT /api/care/medications/:id
 * Updates an existing medication
 */
router.put('/medications/:id', (req, res) => {
  try {
    const { id } = req.params;
    const cleanId = sanitizeString(id, 60);

    const updates = {};
    if (req.body.name) updates.name = sanitizeString(req.body.name, 100);
    if (req.body.genericName) updates.genericName = sanitizeString(req.body.genericName, 100);
    if (req.body.dosage) updates.dosage = sanitizeString(req.body.dosage, 50);
    if (req.body.form) updates.form = sanitizeString(req.body.form, 50);
    if (req.body.frequency) updates.frequency = sanitizeString(req.body.frequency, 100);
    if (req.body.instructions) updates.instructions = sanitizeString(req.body.instructions, 300);
    if (req.body.simpleGuidance) updates.simpleGuidance = sanitizeString(req.body.simpleGuidance, 300);
    if (req.body.purpose) updates.purpose = sanitizeString(req.body.purpose, 100);
    if (req.body.pillColor) updates.pillColor = sanitizeString(req.body.pillColor, 60);
    if (req.body.pillShape) updates.pillShape = sanitizeString(req.body.pillShape, 60);
    if (req.body.pillCount !== undefined) updates.pillCount = Math.max(0, parseInt(req.body.pillCount, 10) || 0);
    if (req.body.refillAt !== undefined) updates.refillAt = Math.max(1, parseInt(req.body.refillAt, 10) || 7);
    if (Array.isArray(req.body.timeSlots)) updates.timeSlots = req.body.timeSlots;
    if (Array.isArray(req.body.scheduledTimes)) updates.scheduledTimes = req.body.scheduledTimes;

    const updated = careStore.updateMedication(cleanId, updates);
    if (!updated) {
      return res.status(404).json({ error: `Medication not found with id: ${cleanId}` });
    }

    res.json({
      success: true,
      message: 'Medication updated successfully',
      medication: updated,
    });
  } catch (error) {
    console.error('[Care API] Error updating medication:', error);
    res.status(500).json({ error: 'Failed to update medication', message: error.message });
  }
});

/**
 * DELETE /api/care/medications/:id
 * Removes a medication and its daily doses
 */
router.delete('/medications/:id', (req, res) => {
  try {
    const { id } = req.params;
    const cleanId = sanitizeString(id, 60);

    const deleted = careStore.deleteMedication(cleanId);
    if (!deleted) {
      return res.status(404).json({ error: `Medication not found with id: ${cleanId}` });
    }

    res.json({
      success: true,
      message: 'Medication removed successfully',
    });
  } catch (error) {
    console.error('[Care API] Error deleting medication:', error);
    res.status(500).json({ error: 'Failed to delete medication', message: error.message });
  }
});

/**
 * POST /api/care/adherence
 * Logs a medication dose as taken (from PIN pad, dashboard button, or 1-click email)
 */
router.post('/adherence', (req, res) => {
  try {
    const { doseId, medicationId, method } = req.body;
    const targetId = doseId || medicationId;

    if (!targetId) {
      return res.status(400).json({ error: 'doseId or medicationId is required' });
    }

    const cleanTargetId = sanitizeString(targetId.toString(), 60);
    const cleanMethod = sanitizeString(method || 'caretaker_dashboard', 50);

    const record = careStore.markDoseTaken(cleanTargetId, cleanMethod);
    if (!record) {
      return res.status(404).json({ error: `No active dose found matching ${cleanTargetId}` });
    }

    res.json({
      success: true,
      message: 'Dose marked as taken successfully',
      adherenceRecord: record,
    });
  } catch (error) {
    console.error('[Care API] Error recording adherence:', error);
    res.status(500).json({ error: 'Failed to record adherence', message: error.message });
  }
});

/**
 * POST /api/care/appointments
 * Adds a new medical appointment
 */
router.post('/appointments', (req, res) => {
  try {
    const { doctorName, specialty, clinicName, date, time, location, phone, reason, preparationList } = req.body;

    if (!doctorName || typeof doctorName !== 'string' || !doctorName.trim()) {
      return res.status(400).json({ error: 'Doctor name is required' });
    }

    const cleanAppt = {
      doctorName: sanitizeString(doctorName, 100),
      specialty: sanitizeString(specialty || 'General Practitioner', 100),
      clinicName: sanitizeString(clinicName || 'Medical Center', 150),
      date: sanitizeString(date || new Date().toISOString().split('T')[0], 30),
      time: sanitizeString(time || '10:00 AM', 30),
      location: sanitizeString(location || 'Medical Suite', 200),
      phone: sanitizeString(phone || '(555) 000-0000', 30),
      reason: sanitizeString(reason || 'Routine Checkup', 200),
      preparationList: Array.isArray(preparationList)
        ? preparationList.map((p) => sanitizeString(p, 150))
        : ['Bring medication list', 'Arrive 15 minutes early'],
    };

    const newAppt = careStore.addAppointment(cleanAppt);
    res.status(201).json({
      success: true,
      message: 'Appointment added successfully',
      appointment: newAppt,
    });
  } catch (error) {
    console.error('[Care API] Error adding appointment:', error);
    res.status(500).json({ error: 'Failed to add appointment', message: error.message });
  }
});

/**
 * PATCH /api/care/appointments/:id/checklist
 * Updates preparation checklist items for an appointment
 */
router.patch('/appointments/:id/checklist', (req, res) => {
  try {
    const { id } = req.params;
    const { preparationList } = req.body;

    if (!Array.isArray(preparationList)) {
      return res.status(400).json({ error: 'preparationList must be an array of strings' });
    }

    const cleanList = preparationList.map((p) => sanitizeString(p, 150));
    const cleanId = sanitizeString(id, 60);

    const updated = careStore.updateAppointment(cleanId, { preparationList: cleanList });
    if (!updated) {
      return res.status(404).json({ error: `Appointment not found with id: ${cleanId}` });
    }

    res.json({
      success: true,
      message: 'Checklist updated successfully',
      appointment: updated,
    });
  } catch (error) {
    console.error('[Care API] Error updating checklist:', error);
    res.status(500).json({ error: 'Failed to update checklist', message: error.message });
  }
});

/**
 * DELETE /api/care/appointments/:id
 * Removes a medical appointment
 */
router.delete('/appointments/:id', (req, res) => {
  try {
    const { id } = req.params;
    const cleanId = sanitizeString(id, 60);

    const deleted = careStore.deleteAppointment(cleanId);
    if (!deleted) {
      return res.status(404).json({ error: `Appointment not found with id: ${cleanId}` });
    }

    res.json({
      success: true,
      message: 'Appointment removed successfully',
    });
  } catch (error) {
    console.error('[Care API] Error deleting appointment:', error);
    res.status(500).json({ error: 'Failed to delete appointment', message: error.message });
  }
});

/**
 * POST /api/care/reset
 * Resets the in-memory/JSON store to default demo data
 */
router.post('/reset', (req, res) => {
  try {
    const defaultState = careStore.reset();
    res.json({
      success: true,
      message: 'Platform state reset to initial demo dataset',
      data: defaultState,
    });
  } catch (error) {
    console.error('[Care API] Error resetting state:', error);
    res.status(500).json({ error: 'Failed to reset state', message: error.message });
  }
});

export default router;
