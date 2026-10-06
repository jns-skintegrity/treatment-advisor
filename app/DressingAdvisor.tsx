'use client';

import { useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  AlertTriangle,
  Check,
  ClipboardList,
  Printer,
  RotateCcw,
  ShieldCheck,
} from 'lucide-react';

import { getConsiderations, type Assessment } from './lib/recommendations';
import { recordToolUsage } from './lib/analytics';
import SupportInquiry from './SupportInquiry';

const initialAssessment: Assessment = {
  etiology: '',
  tissue: '',
  exudate: '',
  periwound: '',
  cavity: false,
  fragileSkin: false,
  urgentSigns: [],
};

const urgentOptions = [
  { value: 'acutelyUnwell', label: 'Acutely unwell or systemic symptoms' },
  { value: 'spreadingRedness', label: 'Rapidly spreading redness or swelling' },
  { value: 'severePain', label: 'Severe or rapidly increasing pain' },
  { value: 'compromisedCirculation', label: 'Newly cool, pale, dusky, or poorly perfused tissue' },
  { value: 'deepStructure', label: 'Exposed deep structure or rapidly worsening wound' },
];

function OptionGroup({
  title,
  name,
  value,
  options,
  onChange,
}: {
  title: string;
  name: string;
  value: string;
  options: { value: string; label: string; description?: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <fieldset className="form-field">
      <legend>{title}</legend>
      <div className="option-grid">
        {options.map((option) => (
          <label
            className={`option-card${value === option.value ? ' is-selected' : ''}`}
            key={option.value}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              required
            />
            <span className="option-indicator" aria-hidden="true" />
            <span>
              <span className="option-label">{option.label}</span>
              {option.description && <span className="option-description">{option.description}</span>}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export default function DressingAdvisor() {
  const [assessment, setAssessment] = useState<Assessment>(initialAssessment);
  const [showResults, setShowResults] = useState(false);
  const attemptStartedRef = useRef(false);
  const completionTrackedRef = useRef(false);
  const result = useMemo(() => getConsiderations(assessment), [assessment]);
  const ready =
    Boolean(assessment.etiology) &&
    Boolean(assessment.tissue) &&
    Boolean(assessment.exudate) &&
    Boolean(assessment.periwound);

  function recordAttemptStart() {
    if (attemptStartedRef.current) return;
    attemptStartedRef.current = true;
    void recordToolUsage('started').catch((error) => {
      console.error('Could not record Treatment Advisor usage start:', error);
    });
  }

  function recordCompletion(
    category: 'urgent_review' | 'dressing_guidance' | 'clinical_review' | 'no_guidance'
  ) {
    if (completionTrackedRef.current) return;
    completionTrackedRef.current = true;
    void recordToolUsage('completed', category).catch((error) => {
      console.error('Could not record Treatment Advisor review completion:', error);
    });
  }

  function update<K extends keyof Assessment>(key: K, value: Assessment[K]) {
    recordAttemptStart();
    setAssessment((current) => ({ ...current, [key]: value }));
  }

  function toggleUrgentSign(value: string) {
    recordAttemptStart();
    const isAddingUrgentSign = !assessment.urgentSigns.includes(value);
    setAssessment((current) => ({
      ...current,
      urgentSigns: current.urgentSigns.includes(value)
        ? current.urgentSigns.filter((sign) => sign !== value)
        : [...current.urgentSigns, value],
    }));
    setShowResults(true);
    if (isAddingUrgentSign) recordCompletion('urgent_review');
  }

  function resetAssessment() {
    setAssessment(initialAssessment);
    setShowResults(false);
    attemptStartedRef.current = false;
    completionTrackedRef.current = false;
  }

  function reviewConsiderations() {
    recordAttemptStart();
    setShowResults(true);
    const category = result.urgent
      ? 'urgent_review'
      : result.dressing.length > 0
        ? 'dressing_guidance'
        : result.clinical.length > 0
          ? 'clinical_review'
          : 'no_guidance';
    recordCompletion(category);
  }

  const completedCount = [
    assessment.etiology,
    assessment.tissue,
    assessment.exudate,
    assessment.periwound,
  ].filter(Boolean).length;

  return (
    <main className="app-shell">
      <header className="topbar">
        <Link className="brand" href="/" aria-label="Skintegrity Dressing Advisor home">
          <span className="brand-mark"><Activity size={21} strokeWidth={2.4} /></span>
          <span className="brand-name">skintegrity<span>CLINICAL TOOLS</span></span>
        </Link>
        <div className="topbar-right">
          <span className="secure-label"><ShieldCheck size={16} /> MEMBER WORKSPACE</span>
          <span className="topbar-divider" />
          <span className="tool-label">Dressing Advisor</span>
        </div>
      </header>

      <div className="page-wrap">
        <section className="intro">
          <div className="eyebrow"><span /> CLINICIAN DECISION SUPPORT</div>
          <div className="intro-row">
            <div>
              <h1>Dressing Advisor</h1>
              <p className="intro-copy">
                Organize wound observations into dressing-class considerations and clinical review prompts.
              </p>
            </div>
            <div className="intro-badge"><ClipboardList size={18} /> Point-of-care reference</div>
          </div>
        </section>

        <section className="safety-banner" aria-label="Clinical safety notice">
          <div className="safety-icon"><AlertTriangle size={19} /></div>
          <div>
            <strong>Clinical judgment comes first</strong>
            <p>
              This educational aid does not diagnose, prescribe, stage wounds, or replace a complete assessment,
              an approved care plan, product instructions, or local policy. Do not enter patient identifiers.
            </p>
          </div>
        </section>

        <div className="workspace">
          <section className="assessment-panel" aria-labelledby="assessment-heading">
            <div className="panel-heading">
              <div>
                <span className="section-kicker">ASSESSMENT</span>
                <h2 id="assessment-heading">Wound profile</h2>
              </div>
              <span className="progress-count">{completedCount}<span> / 4</span></span>
            </div>

            <div className="form-content">
              <OptionGroup
                title="1. Primary wound context"
                name="etiology"
                value={assessment.etiology}
                onChange={(value) => update('etiology', value)}
                options={[
                  { value: 'pressure', label: 'Pressure injury' },
                  { value: 'venous', label: 'Venous leg ulcer' },
                  { value: 'diabetic', label: 'Diabetic foot wound' },
                  { value: 'surgical', label: 'Surgical wound' },
                  { value: 'skin-tear', label: 'Skin tear' },
                  { value: 'other', label: 'Other / not established' },
                ]}
              />

              <OptionGroup
                title="2. Predominant visible tissue"
                name="tissue"
                value={assessment.tissue}
                onChange={(value) => update('tissue', value)}
                options={[
                  { value: 'granulation', label: 'Granulation' },
                  { value: 'slough', label: 'Slough present' },
                  { value: 'eschar', label: 'Eschar present' },
                  { value: 'epithelializing', label: 'Epithelializing' },
                  { value: 'unknown', label: 'Unable to determine' },
                ]}
              />

              <OptionGroup
                title="3. Exudate"
                name="exudate"
                value={assessment.exudate}
                onChange={(value) => update('exudate', value)}
                options={[
                  { value: 'dry', label: 'Dry / none' },
                  { value: 'low', label: 'Low' },
                  { value: 'moderate', label: 'Moderate' },
                  { value: 'high', label: 'High / frequent strike-through' },
                ]}
              />

              <OptionGroup
                title="4. Periwound skin"
                name="periwound"
                value={assessment.periwound}
                onChange={(value) => update('periwound', value)}
                options={[
                  { value: 'intact', label: 'Intact' },
                  { value: 'macerated', label: 'Macerated' },
                  { value: 'fragile', label: 'Fragile / at risk' },
                  { value: 'other', label: 'Other / uncertain' },
                ]}
              />

              <div className="optional-section">
                <span className="section-kicker">ADDITIONAL OBSERVATIONS</span>
                <label className="check-row">
                  <input
                    type="checkbox"
                    checked={assessment.cavity}
                    onChange={(event) => update('cavity', event.target.checked)}
                  />
                  <span className="custom-check"><Check size={13} /></span>
                  <span><strong>Cavity or undermining noted</strong><small>Confirm depth and anatomy in person.</small></span>
                </label>
                <label className="check-row">
                  <input
                    type="checkbox"
                    checked={assessment.fragileSkin}
                    onChange={(event) => update('fragileSkin', event.target.checked)}
                  />
                  <span className="custom-check"><Check size={13} /></span>
                  <span><strong>Skin is especially fragile</strong><small>Consider trauma from adhesive and removal.</small></span>
                </label>
              </div>

              <fieldset className="urgent-check">
                <legend><AlertTriangle size={16} /> Urgent concerns</legend>
                <p>If any apply, pause the selector and arrange prompt clinical assessment.</p>
                <div className="urgent-options">
                  {urgentOptions.map((option) => (
                    <label className="urgent-option" key={option.value}>
                      <input
                        type="checkbox"
                        checked={assessment.urgentSigns.includes(option.value)}
                        onChange={() => toggleUrgentSign(option.value)}
                      />
                      <span>{option.label}</span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <div className="form-actions">
                <button
                  className="button button-primary"
                  type="button"
                  onClick={reviewConsiderations}
                  disabled={!ready}
                >
                  Review considerations <span aria-hidden="true">→</span>
                </button>
                <button className="button button-quiet" type="button" onClick={resetAssessment}>
                  <RotateCcw size={15} /> Reset
                </button>
              </div>
            </div>
          </section>

          <aside className="results-column" aria-live="polite">
            <section className="results-card">
              <div className="results-heading">
                <div>
                  <span className="section-kicker">CARE PLANNING</span>
                  <h2>Considerations</h2>
                </div>
                <span className={`status-pill${showResults && ready ? ' status-ready' : ''}`}>
                  <span /> {showResults && ready ? 'REVIEW' : 'PENDING'}
                </span>
              </div>

              {result.urgent ? (
                <div className="urgent-result">
                  <div className="urgent-result-title"><AlertTriangle size={20} /> Prompt clinical assessment</div>
                  <p>The selector is paused because urgent concern(s) were selected:</p>
                  <ul>{result.urgentReasons.map((reason) => <li key={reason}>{reason}</li>)}</ul>
                  <p className="urgent-foot">If the person is acutely unwell, follow emergency procedures. Do not delay care to use this tool.</p>
                </div>
              ) : !showResults || !ready ? (
                <div className="empty-state">
                  <div className="empty-icon"><ClipboardList size={23} /></div>
                  <h3>Start with the assessment</h3>
                  <p>Complete the four profile fields, then review cautious dressing-class considerations.</p>
                  <div className="empty-progress">
                    <span style={{ width: `${completedCount * 25}%` }} />
                  </div>
                  <small>{completedCount} of 4 profile fields selected</small>
                </div>
              ) : (
                <div className="recommendation-content">
                  <div className="result-note">
                    <ShieldCheck size={17} />
                    <span>Discussion prompts only — verify in person and against local protocol.</span>
                  </div>
                  <div className="consideration-group">
                    <span className="result-group-label">DRESSING CLASS TO REVIEW</span>
                    {result.dressing.length > 0 ? result.dressing.map((item) => (
                      <article className="consideration" key={item.title}>
                        <span className="consideration-marker"><Check size={13} /></span>
                        <div><h3>{item.title}</h3><p>{item.detail}</p></div>
                      </article>
                    )) : (
                      <p className="no-specific">No dressing class is suggested from these selections alone. Confirm the care plan and product suitability with the responsible clinician.</p>
                    )}
                  </div>
                  {result.clinical.length > 0 && (
                    <div className="consideration-group clinical-group">
                      <span className="result-group-label">CLINICAL REVIEW PROMPTS</span>
                      {result.clinical.map((item) => (
                        <article className="consideration" key={item.title}>
                          <span className="consideration-marker marker-clinical"><Activity size={13} /></span>
                          <div><h3>{item.title}</h3><p>{item.detail}</p></div>
                        </article>
                      ))}
                    </div>
                  )}
                  <div className="final-check">
                    <strong>Before finalizing</strong>
                    <ul>
                      <li>Reassess the wound and surrounding skin after application.</li>
                      <li>Confirm allergies, contraindications, intended wear time, and removal method.</li>
                      <li>Document clinical reasoning in the approved record, not in this tool.</li>
                    </ul>
                  </div>
                </div>
              )}

              <div className="results-footer">
                <button
                  className="button button-print"
                  type="button"
                  onClick={() => window.print()}
                  disabled={!showResults || !ready}
                >
                  <Printer size={16} /> Print considerations
                </button>
                <span>Nothing is saved by this tool.</span>
              </div>
            </section>

            <div className="privacy-note">
              <ShieldCheck size={16} />
              <p><strong>Privacy by design</strong><br />Assessment selections stay in this browser session and are not stored. Only daily usage counts and broad generated-guidance categories are sent for aggregate reporting. Support inquiries are submitted separately; do not include patient identifiers or PHI.</p>
            </div>
            <SupportInquiry />
          </aside>
        </div>

        <footer className="page-footer">
          <span>SKINTEGRITY <span className="footer-dot">•</span> CLINICAL EDUCATION</span>
          <span>Use current institutional policy and professional judgment.</span>
        </footer>
      </div>
    </main>
  );
}
