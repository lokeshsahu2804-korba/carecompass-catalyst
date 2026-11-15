import { describe, it, expect } from 'vitest';
import healthRouter from '../server/routes/health.js';
import aiRouter from '../server/routes/ai.js';
import remindersRouter from '../server/routes/reminders.js';
import careRouter from '../server/routes/care.js';
import { careStore } from '../server/data/store.js';
import {
  securityHeaders,
  rateLimiter,
  sanitizeString,
  isValidEmail,
} from '../server/middleware/security.js';
import { generateSimpleGuidance, analyzeInteractions } from '../server/services/geminiService.js';
import { sendDoseReminder, sendAppointmentReminder } from '../server/services/emailService.js';

describe('CareCompass Backend Security, Middleware & Express APIs', () => {
  // 1. Health Endpoint
  it('health check route returns 200 with complete Cloud Run service telemetry', () => {
    let responseStatus = 0;
    let responseBody: any = null;

    const mockReq: any = {};
    const mockRes: any = {
      status(code: number) {
        responseStatus = code;
        return this;
      },
      json(data: any) {
        responseBody = data;
        return this;
      },
    };

    const layer = healthRouter.stack.find((l: any) => l.route?.methods?.get);
    expect(layer).toBeDefined();

    layer!.route!.stack[0].handle(mockReq, mockRes, () => {});

    expect(responseStatus).toBe(200);
    expect(responseBody.status).toBe('healthy');
    expect(responseBody.service).toBe('CareCompass Elderly Care API');
    expect(responseBody.cloudRunReady).toBe(true);
    expect(responseBody.features.wcagAaaAccessibility).toBe(true);
    expect(responseBody.features.geminiAiAssistant).toBeDefined();
  });

  // 2. Security Headers Middleware
  it('security headers middleware applies OWASP-compliant protection headers', () => {
    const headers: Record<string, string> = {};
    const mockReq: any = {};
    const mockRes: any = {
      setHeader(name: string, value: string) {
        headers[name] = value;
      },
    };
    let nextCalled = false;

    securityHeaders(mockReq, mockRes, () => {
      nextCalled = true;
    });

    expect(nextCalled).toBe(true);
    expect(headers['X-Content-Type-Options']).toBe('nosniff');
    expect(headers['X-Frame-Options']).toBe('DENY');
    expect(headers['X-XSS-Protection']).toBe('1; mode=block');
    expect(headers['Referrer-Policy']).toBe('strict-origin-when-cross-origin');
    expect(headers['Strict-Transport-Security']).toContain('max-age=31536000');
    expect(headers['Content-Security-Policy']).toBeDefined();
    expect(headers['Permissions-Policy']).toContain('camera=()');
  });

  // 3. Rate Limiter Middleware
  it('rate limiter sets standard rate-limiting headers on incoming requests', () => {
    const headers: Record<string, string> = {};
    const mockReq: any = {
      ip: '192.168.1.100',
      headers: { 'x-test-rate-limit': 'true' },
    };
    const mockRes: any = {
      setHeader(name: string, value: any) {
        headers[name] = value.toString();
      },
      status: () => mockRes,
      json: () => mockRes,
    };
    let nextCalled = false;

    rateLimiter(mockReq, mockRes, () => {
      nextCalled = true;
    });

    expect(nextCalled).toBe(true);
    expect(headers['X-RateLimit-Limit']).toBe('120');
    expect(headers['X-RateLimit-Remaining']).toBeDefined();
  });

  // 4. Rate Limiter Rejection
  it('rate limiter triggers HTTP 429 when client exceeds request threshold', () => {
    const testIp = '192.168.1.99';
    let lastStatus = 200;
    let lastJson: any = null;

    const mockRes: any = {
      setHeader() {},
      status(code: number) {
        lastStatus = code;
        return this;
      },
      json(data: any) {
        lastJson = data;
        return this;
      },
    };

    // Simulate exceeding 120 calls
    for (let i = 0; i < 125; i++) {
      const mockReq: any = {
        ip: testIp,
        headers: { 'x-test-rate-limit': 'true' },
      };
      rateLimiter(mockReq, mockRes, () => {});
    }

    expect(lastStatus).toBe(429);
    expect(lastJson.error).toBe('Too Many Requests');
  });

  // 5. Input Sanitizer
  it('sanitizeString strips malicious HTML tags and non-printable control characters', () => {
    const maliciousInput = '<script>alert("hack")</script>Metformin 500mg\u0000\u001F';
    const cleaned = sanitizeString(maliciousInput, 50);

    expect(cleaned).toBe('alert("hack")Metformin 500mg');
    expect(cleaned).not.toContain('<script>');
  });

  // 6. Email Validation Utility
  it('isValidEmail enforces valid RFC 5322 structure and rejects malformed emails', () => {
    expect(isValidEmail('sarah.vance@gmail.com')).toBe(true);
    expect(isValidEmail('caretaker+elderly@carecompass.org')).toBe(true);
    expect(isValidEmail('invalid-email')).toBe(false);
    expect(isValidEmail('@nodomain.com')).toBe(false);
    expect(isValidEmail('spaces in@email.com')).toBe(false);
  });

  // 7. AI Guidance Endpoint Validation
  it('/api/ai/guidance validates input and returns 400 when medicationName is missing', async () => {
    let statusCode = 0;
    let jsonBody: any = null;

    const mockReq: any = { body: {} };
    const mockRes: any = {
      status(code: number) {
        statusCode = code;
        return this;
      },
      json(data: any) {
        jsonBody = data;
        return this;
      },
    };

    const layer = aiRouter.stack.find((l: any) => l.route?.path === '/guidance' && l.route?.methods?.post);
    expect(layer).toBeDefined();

    await layer!.route!.stack[0].handle(mockReq, mockRes, () => {});

    expect(statusCode).toBe(400);
    expect(jsonBody.error).toContain('medicationName');
  });

  // 8. AI Guidance Service
  it('Gemini AI service translates clinical prescription into comforting senior advice', async () => {
    const guidance = await generateSimpleGuidance(
      'Metformin',
      '500mg',
      'Take with meals twice daily',
      'Type 2 Diabetes'
    );

    expect(typeof guidance).toBe('string');
    expect(guidance.length).toBeGreaterThan(10);
    expect(guidance).toContain('tummy');
  });

  // 9. AI Interactions Validation
  it('/api/ai/interactions rejects non-array medications with 400', async () => {
    let statusCode = 0;
    let jsonBody: any = null;

    const mockReq: any = { body: { medications: 'not-an-array' } };
    const mockRes: any = {
      status(code: number) {
        statusCode = code;
        return this;
      },
      json(data: any) {
        jsonBody = data;
        return this;
      },
    };

    const layer = aiRouter.stack.find((l: any) => l.route?.path === '/interactions' && l.route?.methods?.post);
    expect(layer).toBeDefined();

    await layer!.route!.stack[0].handle(mockReq, mockRes, () => {});

    expect(statusCode).toBe(400);
    expect(jsonBody.error).toContain('array is required');
  });

  // 10. AI Interactions Service
  it('Gemini AI service analyzes medication regimen interactions with safe clinical fallback', async () => {
    const testMeds = [
      { name: 'Lisinopril', dosage: '10mg', instructions: 'Morning' },
      { name: 'Metformin', dosage: '500mg', instructions: 'Twice daily' },
    ];

    const report = await analyzeInteractions(testMeds);

    expect(report).toBeDefined();
    expect(report.overallRisk).toBe('low');
    expect(Array.isArray(report.foodWarnings)).toBe(true);
    expect(Array.isArray(report.timingAdvice)).toBe(true);
  });

  // 11. Reminders Email Format Validation
  it('/api/reminders/send returns 400 when recipient email format is invalid', async () => {
    let statusCode = 0;
    let jsonBody: any = null;

    const mockReq: any = {
      body: {
        medicationName: 'Lisinopril',
        medId: 'med-01',
        recipient: 'invalid-email-address',
      },
    };
    const mockRes: any = {
      status(code: number) {
        statusCode = code;
        return this;
      },
      json(data: any) {
        jsonBody = data;
        return this;
      },
    };

    const layer = remindersRouter.stack.find((l: any) => l.route?.path === '/send' && l.route?.methods?.post);
    expect(layer).toBeDefined();

    await layer!.route!.stack[0].handle(mockReq, mockRes, () => {});

    expect(statusCode).toBe(400);
    expect(jsonBody.error).toContain('Invalid recipient email format');
  });

  // 12. Email Service Reminder Link
  it('Email service dispatches dose reminder with tokenized action link', async () => {
    const result = await sendDoseReminder({
      recipient: 'sarah.vance.care@gmail.com',
      patientName: 'Eleanor Vance',
      medicationName: 'Lisinopril',
      dosage: '10mg',
      scheduledTime: '08:00 AM',
      simpleGuidance: 'Take this with a glass of water.',
      medId: 'med-01',
      doseId: 'dose-01',
      baseUrl: 'http://localhost:8080',
    });

    expect(result).toBeDefined();
    expect(result.token).toBeDefined();
    expect(result.subject).toContain('Lisinopril');
    expect(result.previewUrl).toBeDefined();
  });

  // 13. 1-Click Verification Link Route
  it('GET /api/reminders/verify-adherence confirms dose and returns accessible HTML landing page', async () => {
    let statusCode = 0;
    let htmlOutput = '';

    const mockReq: any = {
      query: {
        medId: 'med-01',
        doseId: 'dose-01',
        token: 'valid-test-token',
      },
    };
    const mockRes: any = {
      status(code: number) {
        statusCode = code;
        return this;
      },
      send(html: string) {
        htmlOutput = html;
        return this;
      },
    };

    const layer = remindersRouter.stack.find(
      (l: any) => l.route?.path === '/verify-adherence' && l.route?.methods?.get
    );
    expect(layer).toBeDefined();

    layer!.route!.stack[0].handle(mockReq, mockRes, () => {});

    expect(statusCode).toBe(200);
    expect(htmlOutput).toContain('Dose Marked as Taken!');
    expect(htmlOutput).toContain('Eleanor Vance');
  });

  // 14. Email Service Appointment Reminder
  it('Email service dispatches medical appointment reminder with preparation checklist', async () => {
    const result = await sendAppointmentReminder({
      recipient: 'sarah.vance.care@gmail.com',
      patientName: 'Eleanor Vance',
      doctorName: 'Dr. Robert Chen',
      specialty: 'Cardiologist',
      clinicName: 'St. Jude Heart & Vascular Center',
      date: '2026-11-18',
      time: '10:30 AM',
      location: 'Suite 402, 1200 Mercy Parkway, San Jose, CA',
      reason: 'Hypertension Checkup',
      preparationList: ['Bring blood pressure log', 'Wear short sleeves'],
    });

    expect(result).toBeDefined();
    expect(result.subject).toContain('Dr. Robert Chen');
    expect(result.previewUrl).toBeDefined();
  });

  // 15. Appointment Reminder Endpoint Validation
  it('POST /api/reminders/appointment validates doctorName requirement', async () => {
    let statusCode = 0;
    let jsonBody: any = null;

    const mockReq: any = { body: {} };
    const mockRes: any = {
      status(code: number) {
        statusCode = code;
        return this;
      },
      json(data: any) {
        jsonBody = data;
        return this;
      },
    };

    const layer = remindersRouter.stack.find(
      (l: any) => l.route?.path === '/appointment' && l.route?.methods?.post
    );
    expect(layer).toBeDefined();

    await layer!.route!.stack[0].handle(mockReq, mockRes, () => {});

    expect(statusCode).toBe(400);
    expect(jsonBody.error).toContain('doctorName is required');
  });

  // 16. Care State Persistence
  it('GET /api/care/state returns full platform state with profile, medications, doses, and appointments', () => {
    let statusCode = 200;
    let jsonBody: any = null;

    const mockReq: any = {};
    const mockRes: any = {
      status(code: number) {
        statusCode = code;
        return this;
      },
      json(data: any) {
        jsonBody = data;
        return this;
      },
    };

    const layer = careRouter.stack.find((l: any) => l.route?.path === '/state' && l.route?.methods?.get);
    expect(layer).toBeDefined();

    layer!.route!.stack[0].handle(mockReq, mockRes, () => {});

    expect(statusCode).toBe(200);
    expect(jsonBody.success).toBe(true);
    expect(jsonBody.data.profile.name).toBe('Eleanor Vance');
    expect(careStore.getState().profile.name).toBe('Eleanor Vance');
    expect(jsonBody.data.medications.length).toBeGreaterThanOrEqual(1);
    expect(jsonBody.data.todayDoses.length).toBeGreaterThanOrEqual(1);
  });

  // 17. Care Medication Creation CRUD
  it('POST /api/care/medications creates a new sanitized medication and schedules dose', () => {
    let statusCode = 0;
    let jsonBody: any = null;

    const mockReq: any = {
      body: {
        name: 'CoQ10 Heart Support',
        dosage: '100mg',
        instructions: 'Take 1 with lunch',
        purpose: 'Cardiovascular Support',
      },
    };
    const mockRes: any = {
      status(code: number) {
        statusCode = code;
        return this;
      },
      json(data: any) {
        jsonBody = data;
        return this;
      },
    };

    const layer = careRouter.stack.find((l: any) => l.route?.path === '/medications' && l.route?.methods?.post);
    expect(layer).toBeDefined();

    layer!.route!.stack[0].handle(mockReq, mockRes, () => {});

    expect(statusCode).toBe(201);
    expect(jsonBody.success).toBe(true);
    expect(jsonBody.medication.name).toBe('CoQ10 Heart Support');
    expect(jsonBody.medication.dosage).toBe('100mg');
  });

  // 18. Care Medication Update CRUD
  it('PUT /api/care/medications/:id updates an existing medication', () => {
    let statusCode = 200;
    let jsonBody: any = null;

    const mockReq: any = {
      params: { id: 'med-01' },
      body: { dosage: '20mg' },
    };
    const mockRes: any = {
      status(code: number) {
        statusCode = code;
        return this;
      },
      json(data: any) {
        jsonBody = data;
        return this;
      },
    };

    const layer = careRouter.stack.find((l: any) => l.route?.path === '/medications/:id' && l.route?.methods?.put);
    expect(layer).toBeDefined();

    layer!.route!.stack[0].handle(mockReq, mockRes, () => {});

    expect(statusCode).toBe(200);
    expect(jsonBody.success).toBe(true);
    expect(jsonBody.medication.dosage).toBe('20mg');
  });

  // 19. Care Adherence Logging
  it('POST /api/care/adherence logs a dose as taken and persists adherence record', () => {
    let statusCode = 200;
    let jsonBody: any = null;

    const mockReq: any = {
      body: {
        doseId: 'dose-today-03',
        method: 'elderly_pin_pad',
      },
    };
    const mockRes: any = {
      status(code: number) {
        statusCode = code;
        return this;
      },
      json(data: any) {
        jsonBody = data;
        return this;
      },
    };

    const layer = careRouter.stack.find((l: any) => l.route?.path === '/adherence' && l.route?.methods?.post);
    expect(layer).toBeDefined();

    layer!.route!.stack[0].handle(mockReq, mockRes, () => {});

    expect(statusCode).toBe(200);
    expect(jsonBody.success).toBe(true);
    expect(jsonBody.adherenceRecord.status).toBe('taken');
    expect(jsonBody.adherenceRecord.method).toBe('elderly_pin_pad');
  });

  // 20. Appointment Checklist PATCH
  it('PATCH /api/care/appointments/:id/checklist updates appointment preparation checklist', () => {
    let statusCode = 200;
    let jsonBody: any = null;

    const mockReq: any = {
      params: { id: 'appt-01' },
      body: {
        preparationList: [
          'Bring 2-week blood pressure log',
          'Arrive 15 minutes before 10:30 AM',
        ],
      },
    };
    const mockRes: any = {
      status(code: number) {
        statusCode = code;
        return this;
      },
      json(data: any) {
        jsonBody = data;
        return this;
      },
    };

    const layer = careRouter.stack.find(
      (l: any) => l.route?.path === '/appointments/:id/checklist' && l.route?.methods?.patch
    );
    expect(layer).toBeDefined();

    layer!.route!.stack[0].handle(mockReq, mockRes, () => {});

    expect(statusCode).toBe(200);
    expect(jsonBody.success).toBe(true);
    expect(jsonBody.appointment.preparationList).toContain('Bring 2-week blood pressure log');
  });

  // 21. Care Store Reset
  it('POST /api/care/reset restores default demo records', () => {
    let statusCode = 200;
    let jsonBody: any = null;

    const mockReq: any = {};
    const mockRes: any = {
      status(code: number) {
        statusCode = code;
        return this;
      },
      json(data: any) {
        jsonBody = data;
        return this;
      },
    };

    const layer = careRouter.stack.find((l: any) => l.route?.path === '/reset' && l.route?.methods?.post);
    expect(layer).toBeDefined();

    layer!.route!.stack[0].handle(mockReq, mockRes, () => {});

    expect(statusCode).toBe(200);
    expect(jsonBody.success).toBe(true);
    expect(jsonBody.message).toContain('Platform state reset');
  });
});
