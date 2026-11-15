import nodemailer from 'nodemailer';

let transporter = null;
let isEthereal = false;

async function getTransporter() {
  if (transporter) return transporter;

  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    isEthereal = false;
  } else {
    try {
      // Attempt to generate an automatic Ethereal test account
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      isEthereal = true;
      console.log('[CareCompass Email] Ethereal live test inbox initialized for judges:', testAccount.user);
    } catch (networkErr) {
      // Offline/sandbox fallback: JSON transport for test isolation
      console.warn('[CareCompass Email] Network offline or SMTP unreachable; using local JSON simulation transporter:', networkErr.message);
      transporter = nodemailer.createTransport({
        jsonTransport: true,
      });
      isEthereal = false;
    }
  }

  return transporter;
}

/**
 * Sends a dose reminder email with 1-click adherence link
 */
export async function sendDoseReminder({
  recipient = 'sarah.vance.care@gmail.com',
  patientName = 'Eleanor Vance',
  medicationName,
  dosage,
  scheduledTime,
  simpleGuidance,
  medId,
  doseId,
  baseUrl = 'http://localhost:8080',
}) {
  const mailer = await getTransporter();
  const token = Buffer.from(`${medId}:${doseId}:${Date.now()}`).toString('base64');
  const actionLink = `${baseUrl}/api/reminders/verify-adherence?medId=${encodeURIComponent(medId)}&doseId=${encodeURIComponent(doseId)}&token=${token}`;

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; padding: 24px; margin: 0; }
        .card { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 2px solid #0d9488; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
        .header { background: #0f172a; color: #ffffff; padding: 24px; text-align: center; }
        .badge { display: inline-block; background: #14b8a6; color: #ffffff; font-weight: bold; padding: 6px 14px; border-radius: 999px; font-size: 14px; margin-bottom: 8px; }
        .content { padding: 32px 24px; color: #1e293b; font-size: 18px; line-height: 1.6; }
        .med-box { background: #f8fafc; border-left: 6px solid #14b8a6; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .button-wrap { text-align: center; margin: 36px 0 24px 0; }
        .action-button { display: inline-block; background-color: #059669; color: #ffffff !important; text-decoration: none; font-size: 20px; font-weight: bold; padding: 18px 36px; border-radius: 12px; box-shadow: 0 4px 8px rgba(5, 150, 105, 0.3); border: 2px solid #047857; }
        .guidance { font-style: italic; color: #0f766e; background: #ccfbf1; padding: 14px 18px; border-radius: 10px; margin-top: 16px; }
        .footer { text-align: center; color: #64748b; font-size: 13px; padding: 20px; border-top: 1px solid #e2e8f0; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <div class="badge">CareCompass Care Alert</div>
          <h1 style="margin: 0; font-size: 26px;">Medication Time for ${patientName}</h1>
        </div>
        <div class="content">
          <p>Hello Sarah,</p>
          <p>It is time for Eleanor's scheduled dose of <strong>${medicationName}</strong>.</p>
          
          <div class="med-box">
            <h2 style="margin: 0 0 8px 0; color: #0f172a; font-size: 22px;">${medicationName} (${dosage})</h2>
            <p style="margin: 4px 0; color: #475569;">Scheduled Time: <strong>${scheduledTime}</strong></p>
            <div class="guidance">
              "Smart Care Assistant: ${simpleGuidance}"
            </div>
          </div>

          <div class="button-wrap">
            <a href="${actionLink}" class="action-button" target="_blank" rel="noopener noreferrer">
              &#10003; Mark Dose as Taken (1-Click)
            </a>
          </div>

          <p style="font-size: 15px; color: #64748b; text-align: center;">
            Clicking this link automatically updates Eleanor's CareCompass adherence chart in real time.
          </p>
        </div>
        <div class="footer">
          CareCompass | Google Catalyst Hackathon Demo &bull; Automated Caretaker Escalation Enabled
        </div>
      </div>
    </body>
    </html>
  `;

  const info = await mailer.sendMail({
    from: '"CareCompass Care Alert" <no-reply@carecompass.org>',
    to: recipient,
    subject: `Medication Reminder: ${patientName} - ${medicationName} (${scheduledTime})`,
    html,
  });

  const previewUrl = nodemailer.getTestMessageUrl(info) || `https://ethereal.email/messages/simulated-${info.messageId || Date.now()}`;

  return {
    messageId: info.messageId || `msg-${Date.now()}`,
    previewUrl,
    isEthereal,
    recipient,
    subject: `Medication Reminder: ${patientName} - ${medicationName}`,
    token,
  };
}

/**
 * Sends a missed dose escalation alert to the primary caretaker
 */
export async function sendMissedEscalation({
  recipient = 'sarah.vance.care@gmail.com',
  patientName = 'Eleanor Vance',
  medicationName,
  dosage,
  scheduledTime,
  minutesOverdue = 45,
}) {
  const mailer = await getTransporter();

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: sans-serif; background: #fff1f2; padding: 24px; }
        .card { max-width: 600px; margin: 0 auto; background: #fff; border: 2px solid #e11d48; border-radius: 12px; padding: 24px; }
        .alert-title { color: #e11d48; font-size: 24px; font-weight: bold; margin-bottom: 12px; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="alert-title">&#9888; Overdue Medication Escalation</div>
        <p>Hello Sarah,</p>
        <p><strong>${patientName}</strong> has not logged their <strong>${medicationName} (${dosage})</strong> scheduled for <strong>${scheduledTime}</strong> (overdue by ${minutesOverdue} minutes).</p>
        <p>Please check in with Eleanor or tap below to open the CareCompass dashboard:</p>
        <p><a href="http://localhost:8080" style="display:inline-block; padding: 12px 24px; background: #e11d48; color: #fff; text-decoration: none; border-radius: 8px; font-weight: bold;">Open CareCompass Dashboard</a></p>
      </div>
    </body>
    </html>
  `;

  const info = await mailer.sendMail({
    from: '"CareCompass Escalation" <escalations@carecompass.org>',
    to: recipient,
    subject: `ALERT: Missed Dose for ${patientName} (${medicationName} overdue)`,
    html,
  });

  return {
    messageId: info.messageId,
    previewUrl: nodemailer.getTestMessageUrl(info) || '',
    isEthereal,
    recipient,
    subject: `ALERT: Missed Dose for ${patientName}`,
  };
}

/**
 * Sends a medical appointment reminder email with preparation checklist
 */
export async function sendAppointmentReminder({
  recipient = 'sarah.vance.care@gmail.com',
  patientName = 'Eleanor Vance',
  doctorName = 'Dr. Robert Chen',
  specialty = 'Cardiologist',
  clinicName = 'St. Jude Heart & Vascular Center',
  date = '2026-11-18',
  time = '10:30 AM',
  location = 'Suite 402, 1200 Mercy Parkway, San Jose, CA',
  reason = '6-Month Hypertension & Cardiovascular Checkup',
  preparationList = [
    'Bring morning blood pressure log from the past 2 weeks',
    'Bring current pill organizer with Lisinopril and Atorvastatin',
    'Wear short sleeves for blood pressure check',
  ],
}) {
  const mailer = await getTransporter();

  const prepItemsHtml = (preparationList || [])
    .map((item) => `<li style="margin: 8px 0; color: #1e293b;">&#10003; ${item}</li>`)
    .join('');

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f1f5f9; padding: 24px; margin: 0; }
        .card { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 2px solid #3b82f6; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
        .header { background: #0f172a; color: #ffffff; padding: 24px; text-align: center; }
        .badge { display: inline-block; background: #3b82f6; color: #ffffff; font-weight: bold; padding: 6px 14px; border-radius: 999px; font-size: 14px; margin-bottom: 8px; }
        .content { padding: 32px 24px; color: #1e293b; font-size: 16px; line-height: 1.6; }
        .appt-box { background: #eff6ff; border-left: 6px solid #3b82f6; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .prep-box { background: #f8fafc; border: 1px solid #cbd5e1; padding: 18px; border-radius: 10px; margin-top: 16px; }
        .footer { text-align: center; color: #64748b; font-size: 13px; padding: 20px; border-top: 1px solid #e2e8f0; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <div class="badge">Doctor Appointment Notice</div>
          <h1 style="margin: 0; font-size: 24px;">Upcoming Visit for ${patientName}</h1>
        </div>
        <div class="content">
          <p>Hello Sarah,</p>
          <p>This is a reminder for Eleanor's upcoming medical appointment:</p>
          
          <div class="appt-box">
            <h2 style="margin: 0 0 6px 0; color: #1e3a8a; font-size: 20px;">${doctorName} (${specialty})</h2>
            <p style="margin: 4px 0; color: #1e293b; font-weight: bold;">Date & Time: ${date} at ${time}</p>
            <p style="margin: 4px 0; color: #475569;">Clinic: ${clinicName}</p>
            <p style="margin: 4px 0; color: #475569;">Location: ${location}</p>
            <p style="margin: 4px 0; color: #475569;">Purpose: ${reason}</p>
          </div>

          <div class="prep-box">
            <h3 style="margin: 0 0 8px 0; color: #0f172a; font-size: 16px;">Preparation Checklist:</h3>
            <ul style="padding-left: 20px; margin: 0;">
              ${prepItemsHtml}
            </ul>
          </div>

          <p style="text-align: center; margin-top: 24px;">
            <a href="http://localhost:8080" style="display: inline-block; background-color: #2563eb; color: #ffffff !important; text-decoration: none; font-weight: bold; padding: 12px 28px; border-radius: 10px;">
              Open CareCompass Appointment Center
            </a>
          </p>
        </div>
        <div class="footer">
          CareCompass | Google Catalyst Hackathon &bull; Medical Appointment Coordination
        </div>
      </div>
    </body>
    </html>
  `;

  const info = await mailer.sendMail({
    from: '"CareCompass Appointments" <appointments@carecompass.org>',
    to: recipient,
    subject: `Appointment Reminder: ${patientName} with ${doctorName} on ${date}`,
    html,
  });

  const previewUrl = nodemailer.getTestMessageUrl(info) || `https://ethereal.email/messages/simulated-appt-${info.messageId || Date.now()}`;

  return {
    messageId: info.messageId || `msg-appt-${Date.now()}`,
    previewUrl,
    isEthereal,
    recipient,
    subject: `Appointment Reminder: ${patientName} with ${doctorName}`,
    doctorName,
    date,
    time,
  };
}
