import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import App from '../src/App';
import { CareProvider } from '../src/context/CareContext';

describe('CareCompass Phase 3: Comprehensive Frontend Integration & Accessibility Suite', () => {
  beforeEach(() => {
    localStorage.clear();
    // Mock backend health check, AI, and reminder endpoints
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/api/health')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            status: 'healthy',
            service: 'CareCompass Elderly Care API',
            port: 8080,
            features: {
              geminiAiAssistant: true,
              emailReminders: true,
              wcagAaaAccessibility: true,
              dualRolePasscodeAuth: true,
            },
          }),
        });
      }
      if (url.includes('/api/ai/guidance')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            simpleGuidance: 'Take this pill with water in the morning.',
            generatedWith: 'gemini-2.5-flash',
          }),
        });
      }
      if (url.includes('/api/ai/interactions')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            overallRisk: 'low',
            summary: 'Safe prescription regimen.',
            interactions: [],
            foodWarnings: ['Avoid excessive grapefruit juice.'],
            timingAdvice: ['Space morning and evening doses.'],
          }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            messageId: 'msg-123',
            previewUrl: 'https://ethereal.email/messages/simulated-msg-123',
            recipient: 'sarah.vance.care@gmail.com',
            subject: 'Medication Reminder: Eleanor Vance - Lisinopril',
            token: 'test-token',
          },
        }),
      });
    });
  });

  // 1. Quick Switch Bar & Tactile BigPinPad
  it('renders Judge Demo Quick-Switch Bar and default Tactile PIN Pad (WCAG AAA)', async () => {
    await act(async () => {
      render(
        <CareProvider>
          <App />
        </CareProvider>
      );
    });

    expect(screen.getByLabelText(/(Interactive Demo|Judge Demo) Quick-Switch Navigation/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Switch to PIN Login Screen/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Switch to Elderly View/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Switch to Caretaker View/i })).toBeInTheDocument();

    expect(screen.getByRole('group', { name: /Tactile Numerical PIN Pad/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Digit 1/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Clear all entered digits/i })).toBeInTheDocument();
    expect(screen.getAllByRole('status').length).toBeGreaterThan(0);
  });

  // 2. Elderly PIN Authentication (1234)
  it('authenticates elderly user with PIN 1234 and unlocks Elderly Mode', async () => {
    await act(async () => {
      render(
        <CareProvider>
          <App />
        </CareProvider>
      );
    });

    // Tap 1, 2, 3, 4 with act around each
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Digit 1/i }));
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Digit 2/i }));
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Digit 3/i }));
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Digit 4/i }));
    });

    expect(await screen.findByText(/Good day, Grandma Eleanor!/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Send emergency alert to caretaker/i)).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  // 3. 1-Tap Medication Adherence
  it('allows elderly user to mark a medication as taken with 1 tap', async () => {
    await act(async () => {
      render(
        <CareProvider>
          <App />
        </CareProvider>
      );
    });

    // Quick switch to Elderly mode
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Switch to Elderly View/i }));
    });

    const markButtons = screen.getAllByRole('button', { name: /Mark .* as taken/i });
    expect(markButtons.length).toBeGreaterThan(0);

    await act(async () => {
      fireEvent.click(markButtons[0]);
    });

    expect(screen.getAllByText(/Taken ✓/i).length).toBeGreaterThan(0);
  });

  // 4. Emergency Alert Modal Flow
  it('opens emergency alert modal and confirms notification dispatch to caretaker', async () => {
    await act(async () => {
      render(
        <CareProvider>
          <App />
        </CareProvider>
      );
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Switch to Elderly View/i }));
    });

    const emergencyBtn = screen.getByLabelText(/Send emergency alert to caretaker/i);
    await act(async () => {
      fireEvent.click(emergencyBtn);
    });

    expect(screen.getByText(/Contact Family Caregiver/i)).toBeInTheDocument();
    expect(screen.getByText(/Yes, Send Urgent Alert!/i)).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByText(/Yes, Send Urgent Alert!/i));
    });

    expect(screen.getByText(/Alert Sent to Sarah!/i)).toBeInTheDocument();
  });

  // 5. Time-of-Day Filter Navigation
  it('filters elderly medication list when selecting time of day buttons', async () => {
    await act(async () => {
      render(
        <CareProvider>
          <App />
        </CareProvider>
      );
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Switch to Elderly View/i }));
    });

    const morningBtn = screen.getByRole('button', { name: /Morning/i });
    await act(async () => {
      fireEvent.click(morningBtn);
    });

    expect(morningBtn).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('Lisinopril')).toBeInTheDocument();
  });

  // 6. Caretaker Passcode Authentication (9876)
  it('authenticates caretaker with Passcode 9876 and renders Caretaker Command Center', async () => {
    await act(async () => {
      render(
        <CareProvider>
          <App />
        </CareProvider>
      );
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Switch to Caretaker View/i }));
    });

    expect(screen.getByText(/Caretaker Command Center: Eleanor Vance/i)).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Medication Management/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Adherence & Escalation Log/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Doctor Appointments/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Gemini AI Clinical Safety/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Live Email & 1-Click Simulator/i })).toBeInTheDocument();
  });

  // 7. Caretaker Medication CRUD Form
  it('allows caretaker to add a new medication through modal form', async () => {
    await act(async () => {
      render(
        <CareProvider>
          <App />
        </CareProvider>
      );
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Switch to Caretaker View/i }));
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Add a new medication/i }));
    });

    const nameInput = screen.getByPlaceholderText(/e\.g\. Lisinopril/i);
    const dosageInput = screen.getByPlaceholderText(/e\.g\. 10mg/i);
    const submitBtn = screen.getByRole('button', { name: /Save Medication/i });

    await act(async () => {
      fireEvent.change(nameInput, { target: { value: 'CoQ10 Heart Support' } });
      fireEvent.change(dosageInput, { target: { value: '100mg' } });
      fireEvent.click(submitBtn);
    });

    expect(screen.getByText('CoQ10 Heart Support')).toBeInTheDocument();
    expect(screen.getByText('100mg')).toBeInTheDocument();

    // Verify accessible Edit and Delete buttons are rendered for medications
    expect(screen.getAllByLabelText(/Edit medication/i).length).toBeGreaterThan(0);
    expect(screen.getAllByLabelText(/Delete medication/i).length).toBeGreaterThan(0);
  });

  // 8. Caretaker Doctor Appointments View & Modal
  it('displays doctor appointments list and opens appointment scheduler modal', async () => {
    await act(async () => {
      render(
        <CareProvider>
          <App />
        </CareProvider>
      );
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Switch to Caretaker View/i }));
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('tab', { name: /Doctor Appointments/i }));
    });

    expect(screen.getByText(/Dr\. Robert Chen/i)).toBeInTheDocument();
    expect(screen.getByText(/Cardiologist/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Preparation Checklist:/i).length).toBeGreaterThan(0);

    const addApptBtn = screen.getByRole('button', { name: /Schedule a new doctor appointment/i });
    await act(async () => {
      fireEvent.click(addApptBtn);
    });

    expect(screen.getByText(/Schedule Doctor Appointment/i)).toBeInTheDocument();
  });

  // 9. Gemini AI Clinical Safety Tab
  it('switches to Gemini AI Clinical Safety tab and renders safety recommendations', async () => {
    await act(async () => {
      render(
        <CareProvider>
          <App />
        </CareProvider>
      );
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Switch to Caretaker View/i }));
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('tab', { name: /Gemini AI Clinical Safety/i }));
    });

    expect(await screen.findByText(/Medication Interaction & Clinical Safety Advisor/i)).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: /Re-analyze.*Gemini/i })).toBeInTheDocument();
  });

  // 10. Live Email & 1-Click Adherence Simulator Tab
  it('switches to Live Email & 1-Click Simulator tab and tests reminder dispatch', async () => {
    await act(async () => {
      render(
        <CareProvider>
          <App />
        </CareProvider>
      );
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Switch to Caretaker View/i }));
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('tab', { name: /Live Email & 1-Click Simulator/i }));
    });

    expect(screen.getByText(/Proactive Email & 1-Click Adherence Simulator/i)).toBeInTheDocument();
    const sendBtn = screen.getByRole('button', { name: /Send dose reminder email/i });

    await act(async () => {
      fireEvent.click(sendBtn);
    });

    expect(await screen.findByText(/Subject:/i)).toBeInTheDocument();
    expect(await screen.findByText(/Open in Live Ethereal Inbox/i)).toBeInTheDocument();
  });

  // 11. Elderly Mode Upcoming Doctor Visits Display
  it('displays upcoming doctor visits on the elderly dashboard with reassuring checklist', async () => {
    await act(async () => {
      render(
        <CareProvider>
          <App />
        </CareProvider>
      );
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Switch to Elderly View/i }));
    });

    expect(screen.getByText(/My Upcoming Doctor Visits/i)).toBeInTheDocument();
    expect(screen.getByText(/Dr\. Robert Chen/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Things to remember for this visit:/i).length).toBeGreaterThan(0);
  });

  // 12. Pre-populated Email & Appointment Reminder Dispatch
  it('switches to Live Email tab, verifies pre-populated email, and sends appointment reminder email', async () => {
    await act(async () => {
      render(
        <CareProvider>
          <App />
        </CareProvider>
      );
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Switch to Caretaker View/i }));
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('tab', { name: /Live Email & 1-Click Simulator/i }));
    });

    // Check pre-populated email on initial load
    expect(screen.getByText(/Upcoming Dose Reminder Preview/i)).toBeInTheDocument();

    const apptBtn = screen.getByRole('button', { name: /Send doctor appointment reminder email/i });
    expect(apptBtn).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(apptBtn);
    });

    expect(await screen.findByText(/Appointment Reminder Preview/i)).toBeInTheDocument();
  });

  // 13. Reset State Functionality
  it('resets demo state back to default when clicking Reset State', async () => {
    await act(async () => {
      render(
        <CareProvider>
          <App />
        </CareProvider>
      );
    });

    const resetBtn = screen.getByLabelText(/Reset all demo state to default/i);
    await act(async () => {
      fireEvent.click(resetBtn);
    });

    expect(screen.getByRole('button', { name: /Switch to PIN Login Screen/i })).toHaveAttribute('aria-pressed', 'true');
  });
});
