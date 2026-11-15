import express from 'express';
import { sendDoseReminder, sendMissedEscalation, sendAppointmentReminder } from '../services/emailService.js';
import { sanitizeString, isValidEmail } from '../middleware/security.js';
import { careStore } from '../data/store.js';

const router = express.Router();

// In-memory adherence store synchronized with the backend
const verifiedDoses = new Set();

/**
 * POST /api/reminders/send
 * Sends an email reminder with 1-click adherence link
 */
router.post('/send', async (req, res) => {
  try {
    const {
      recipient,
      patientName,
      medicationName,
      dosage,
      scheduledTime,
      simpleGuidance,
      medId,
      doseId,
    } = req.body;

    if (!medicationName || !medId) {
      return res.status(400).json({ error: 'medicationName and medId are required' });
    }

    if (recipient && !isValidEmail(recipient)) {
      return res.status(400).json({ error: 'Invalid recipient email format' });
    }

    const cleanMedName = sanitizeString(medicationName, 100);
    const cleanPatient = sanitizeString(patientName || 'Eleanor Vance', 100);
    const cleanDosage = sanitizeString(dosage || '', 50);
    const cleanTime = sanitizeString(scheduledTime || '', 50);
    const cleanGuidance = sanitizeString(simpleGuidance || '', 300);
    const cleanMedId = sanitizeString(medId, 50);
    const cleanDoseId = sanitizeString(doseId || `dose-${Date.now()}`, 50);

    const host = req.get('host') || 'localhost:8080';
    const protocol = req.protocol || 'http';
    const baseUrl = `${protocol}://${host}`;

    const result = await sendDoseReminder({
      recipient: recipient?.trim(),
      patientName: cleanPatient,
      medicationName: cleanMedName,
      dosage: cleanDosage,
      scheduledTime: cleanTime,
      simpleGuidance: cleanGuidance,
      medId: cleanMedId,
      doseId: cleanDoseId,
      baseUrl,
    });

    res.json({
      success: true,
      message: 'Email reminder dispatched successfully',
      data: result,
    });
  } catch (error) {
    console.error('Error dispatching dose reminder:', error);
    res.status(500).json({ error: 'Failed to send reminder', details: error.message });
  }
});

/**
 * POST /api/reminders/escalate
 * Sends missed dose escalation to caregiver
 */
router.post('/escalate', async (req, res) => {
  try {
    const { recipient, patientName, medicationName, dosage, scheduledTime, minutesOverdue } = req.body;

    if (!medicationName) {
      return res.status(400).json({ error: 'medicationName is required' });
    }

    if (recipient && !isValidEmail(recipient)) {
      return res.status(400).json({ error: 'Invalid recipient email format' });
    }

    const cleanMedName = sanitizeString(medicationName, 100);
    const cleanPatient = sanitizeString(patientName || 'Eleanor Vance', 100);
    const cleanDosage = sanitizeString(dosage || '', 50);
    const cleanTime = sanitizeString(scheduledTime || '', 50);
    const cleanMinutes = Number(minutesOverdue) || 45;

    const result = await sendMissedEscalation({
      recipient: recipient?.trim(),
      patientName: cleanPatient,
      medicationName: cleanMedName,
      dosage: cleanDosage,
      scheduledTime: cleanTime,
      minutesOverdue: cleanMinutes,
    });

    res.json({
      success: true,
      message: 'Escalation email sent to caretaker',
      data: result,
    });
  } catch (error) {
    console.error('Error sending escalation:', error);
    res.status(500).json({ error: 'Failed to send escalation', details: error.message });
  }
});

/**
 * POST /api/reminders/appointment
 * Sends doctor appointment reminder to caretaker
 */
router.post('/appointment', async (req, res) => {
  try {
    const {
      recipient,
      patientName,
      doctorName,
      specialty,
      clinicName,
      date,
      time,
      location,
      reason,
      preparationList,
    } = req.body;

    if (!doctorName) {
      return res.status(400).json({ error: 'doctorName is required' });
    }

    if (recipient && !isValidEmail(recipient)) {
      return res.status(400).json({ error: 'Invalid recipient email format' });
    }

    const cleanDoctor = sanitizeString(doctorName, 100);
    const cleanPatient = sanitizeString(patientName || 'Eleanor Vance', 100);
    const cleanSpecialty = sanitizeString(specialty || 'Cardiologist', 100);
    const cleanClinic = sanitizeString(clinicName || 'Clinic', 150);
    const cleanDate = sanitizeString(date || '2026-11-18', 50);
    const cleanTime = sanitizeString(time || '10:30 AM', 50);
    const cleanLocation = sanitizeString(location || 'Medical Suite', 200);
    const cleanReason = sanitizeString(reason || 'Routine Checkup', 200);
    const cleanPrepList = Array.isArray(preparationList)
      ? preparationList.map((p) => sanitizeString(p, 150))
      : ['Bring medication pill organizer', 'Arrive 15 minutes early'];

    const result = await sendAppointmentReminder({
      recipient: recipient?.trim(),
      patientName: cleanPatient,
      doctorName: cleanDoctor,
      specialty: cleanSpecialty,
      clinicName: cleanClinic,
      date: cleanDate,
      time: cleanTime,
      location: cleanLocation,
      reason: cleanReason,
      preparationList: cleanPrepList,
    });

    res.json({
      success: true,
      message: 'Appointment reminder email sent',
      data: result,
    });
  } catch (error) {
    console.error('Error sending appointment reminder email:', error);
    res.status(500).json({ error: 'Failed to send appointment reminder', details: error.message });
  }
});

/**
 * GET /api/reminders/verify-adherence
 * 1-Click Email Adherence Handler:
 * Triggered when user/caretaker clicks the button inside the email reminder.
 */
router.get('/verify-adherence', (req, res) => {
  const { medId, doseId, token } = req.query;

  if (!medId || !token) {
    return res.status(400).send(`
      <!DOCTYPE html>
      <html>
        <body style="font-family:sans-serif; text-align:center; padding:50px;">
          <h2 style="color:#ef4444;">Invalid Adherence Link</h2>
          <p>Missing required medication or verification token.</p>
        </body>
      </html>
    `);
  }

  const cleanMedId = sanitizeString(medId.toString(), 50);
  const cleanDoseId = sanitizeString((doseId || 'default').toString(), 50);

  const logKey = `${cleanMedId}:${cleanDoseId}`;
  verifiedDoses.add(logKey);

  // Synchronize 1-Click adherence with real backend store
  careStore.markDoseTaken(cleanDoseId || cleanMedId, 'email_1click');

  // Return a clear, accessible confirmation page
  res.status(200).send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Dose Confirmed | CareCompass</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: #0f172a;
          color: #f8fafc;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          margin: 0;
          padding: 20px;
        }
        .card {
          background: #1e293b;
          border: 3px solid #10b981;
          border-radius: 20px;
          padding: 40px;
          max-width: 520px;
          text-align: center;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.4);
        }
        .check-circle {
          width: 90px;
          height: 90px;
          border-radius: 50%;
          background: #10b981;
          color: white;
          font-size: 50px;
          line-height: 90px;
          margin: 0 auto 24px auto;
          box-shadow: 0 0 20px rgba(16, 185, 129, 0.4);
        }
        h1 { margin: 0 0 12px 0; font-size: 28px; color: #ffffff; }
        p { font-size: 18px; color: #cbd5e1; line-height: 1.5; margin: 8px 0; }
        .badge {
          display: inline-block;
          background: #064e3b;
          color: #34d399;
          padding: 6px 16px;
          border-radius: 9999px;
          font-weight: bold;
          margin-top: 16px;
        }
        .btn {
          display: inline-block;
          margin-top: 32px;
          background: #14b8a6;
          color: #0f172a;
          font-size: 18px;
          font-weight: bold;
          padding: 14px 28px;
          border-radius: 12px;
          text-decoration: none;
        }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="check-circle">&#10003;</div>
        <h1>Dose Marked as Taken!</h1>
        <p>Thank you! Eleanor Vance's medication adherence record has been updated successfully.</p>
        <div class="badge">&#128337; Logged at ${new Date().toLocaleTimeString()}</div>
        <div>
          <a href="/" class="btn">Return to CareCompass Dashboard</a>
        </div>
      </div>
    </body>
    </html>
  `);
});

/**
 * GET /api/reminders/status/:doseId
 * Checks if a dose has been verified via 1-click email
 */
router.get('/status/:doseId', (req, res) => {
  const { doseId } = req.params;
  const cleanId = sanitizeString(doseId, 50);
  const isTaken = Array.from(verifiedDoses).some((key) => key.includes(cleanId));
  res.json({ doseId: cleanId, takenViaEmail: isTaken });
});

export default router;
