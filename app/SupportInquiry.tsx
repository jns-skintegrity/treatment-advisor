'use client';

import { useState, type FormEvent } from 'react';
import { HelpCircle, Send } from 'lucide-react';

type InquiryCategory = '' | 'clinical' | 'app_support';

export default function SupportInquiry() {
  const [isOpen, setIsOpen] = useState(false);
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState<InquiryCategory>('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'pending' | 'success' | 'failure'>('idle');

  async function submitInquiry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus('pending');
    try {
      const response = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, category, message }),
      });
      if (!response.ok) throw new Error('Inquiry submission failed');
      setStatus('success');
    } catch {
      setStatus('failure');
    }
  }

  function startAnotherInquiry() {
    setSubject('');
    setCategory('');
    setMessage('');
    setStatus('idle');
  }

  return (
    <section className="support-card" aria-labelledby="support-heading">
      <div className="support-card-heading">
        <div className="support-icon" aria-hidden="true"><HelpCircle size={18} /></div>
        <div>
          <span className="section-kicker">NEED ASSISTANCE?</span>
          <h2 id="support-heading">Help &amp; Support</h2>
        </div>
      </div>
      <p>Send a question to the Skintegrity support team.</p>
      <button
        className="button button-quiet support-toggle"
        type="button"
        aria-expanded={isOpen}
        aria-controls="support-inquiry-panel"
        onClick={() => setIsOpen((open) => !open)}
      >
        {isOpen ? 'Close inquiry form' : 'Send an inquiry'}
      </button>

      {isOpen && (
        <div className="support-form-panel" id="support-inquiry-panel">
          <p className="support-warning" role="note">
            Do not include patient identifiers, protected health information (PHI), or case details.
            Assessment selections and results are not included with this inquiry.
          </p>
          {status === 'success' ? (
            <div className="support-status support-success" role="status" aria-live="polite">
              <strong>Your inquiry was sent.</strong>
              <p>The support team will follow up using your account email.</p>
              <button className="button button-quiet" type="button" onClick={startAnotherInquiry}>
                Send another inquiry
              </button>
            </div>
          ) : (
            <form className="support-form" onSubmit={submitInquiry}>
              <label htmlFor="support-category">Category</label>
              <select
                id="support-category"
                value={category}
                onChange={(event) => setCategory(event.target.value as InquiryCategory)}
                required
                disabled={status === 'pending'}
              >
                <option value="" disabled>Select a category</option>
                <option value="clinical">Clinical</option>
                <option value="app_support">App support</option>
              </select>

              <label htmlFor="support-subject">Subject</label>
              <input
                id="support-subject"
                type="text"
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                minLength={5}
                maxLength={120}
                required
                disabled={status === 'pending'}
              />

              <label htmlFor="support-message">Message</label>
              <textarea
                id="support-message"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                minLength={10}
                maxLength={4000}
                rows={5}
                required
                disabled={status === 'pending'}
              />

              <p
                className={`support-status${status === 'failure' ? ' support-failure' : ''}`}
                role={status === 'failure' ? 'alert' : 'status'}
                aria-live="polite"
              >
                {status === 'pending' && 'Sending your inquiry…'}
                {status === 'failure' && 'Your inquiry could not be sent. Please try again.'}
              </p>
              <button className="button button-primary" type="submit" disabled={status === 'pending'}>
                <Send size={15} />
                {status === 'pending' ? 'Sending…' : 'Submit inquiry'}
              </button>
            </form>
          )}
        </div>
      )}
    </section>
  );
}
