export type Assessment = {
  etiology: string;
  tissue: string;
  exudate: string;
  periwound: string;
  cavity: boolean;
  fragileSkin: boolean;
  urgentSigns: string[];
};

export type Consideration = {
  title: string;
  detail: string;
};

const urgentSignLabels: Record<string, string> = {
  acutelyUnwell: 'Acutely unwell or systemic symptoms',
  spreadingRedness: 'Rapidly spreading redness or swelling',
  severePain: 'Severe or rapidly increasing pain',
  compromisedCirculation: 'Newly cool, pale, dusky, or poorly perfused tissue',
  deepStructure: 'Exposed deep structure or rapidly worsening wound',
};

export function getConsiderations(assessment: Assessment): {
  urgent: boolean;
  urgentReasons: string[];
  dressing: Consideration[];
  clinical: Consideration[];
} {
  const urgentReasons = assessment.urgentSigns
    .map((sign) => urgentSignLabels[sign])
    .filter((label): label is string => Boolean(label));

  if (urgentReasons.length > 0) {
    return { urgent: true, urgentReasons, dressing: [], clinical: [] };
  }

  const dressing: Consideration[] = [];
  const clinical: Consideration[] = [];

  if (assessment.exudate === 'high') {
    dressing.push({
      title: 'Review an absorbent dressing category',
      detail:
        'Match absorbency and change frequency to the source and volume of drainage; reassess if strike-through or leakage continues.',
    });
  } else if (assessment.exudate === 'moderate') {
    dressing.push({
      title: 'Review a moisture-balancing absorbent category',
      detail:
        'A foam or gelling-fiber category may be considered when appropriate for the wound and local protocol.',
    });
  } else if (assessment.exudate === 'low') {
    dressing.push({
      title: 'Review a protective contact-layer category',
      detail:
        'Consider a low-trauma contact layer that maintains an appropriate moist wound environment without drying the wound bed.',
    });
  } else if (assessment.exudate === 'dry') {
    dressing.push({
      title: 'Pause before selecting an absorbent dressing',
      detail:
        'Confirm perfusion, tissue type, and the intended wound-care plan; do not use an absorbent category solely by default.',
    });
  }

  if (assessment.fragileSkin || assessment.periwound === 'fragile') {
    dressing.push({
      title: 'Protect fragile surrounding skin',
      detail:
        'Review atraumatic fixation and removal, and whether a skin protectant is appropriate for the patient and product instructions.',
    });
  } else if (assessment.periwound === 'macerated') {
    dressing.push({
      title: 'Address excess moisture at the wound edge',
      detail:
        'Reassess drainage management and protect the periwound according to local protocol.',
    });
  }

  if (assessment.cavity) {
    dressing.push({
      title: 'Use a cavity-specific plan',
      detail:
        'Confirm depth and anatomy in person. If a cavity dressing is selected under local protocol, avoid tight packing and ensure the product can be safely accounted for at removal.',
    });
  }

  if (assessment.etiology === 'pressure') {
    clinical.push({
      title: 'Address pressure and shear',
      detail:
        'A dressing does not replace an individualized pressure-redistribution and repositioning plan.',
    });
  } else if (assessment.etiology === 'venous') {
    clinical.push({
      title: 'Confirm vascular assessment before compression decisions',
      detail:
        'This selector does not determine arterial sufficiency or prescribe compression.',
    });
  } else if (assessment.etiology === 'diabetic') {
    clinical.push({
      title: 'Check foot-risk pathway',
      detail:
        'Review perfusion, protective sensation, offloading, and timely specialist follow-up under the local diabetic-foot pathway.',
    });
  } else if (assessment.etiology === 'surgical') {
    clinical.push({
      title: 'Follow the postoperative plan',
      detail:
        'Confirm the surgeon’s instructions and escalate unexpected separation, drainage, or change in wound appearance.',
    });
  } else if (assessment.etiology === 'skin-tear') {
    clinical.push({
      title: 'Preserve fragile tissue where appropriate',
      detail:
        'Assess the flap and surrounding skin in person and use the local skin-tear pathway.',
    });
  }

  if (assessment.tissue === 'eschar' || assessment.tissue === 'slough') {
    clinical.push({
      title: 'Review tissue and perfusion before any debridement decision',
      detail:
        'This tool does not recommend debridement. An eschar or slough finding requires an individualized clinical assessment and local protocol.',
    });
  }

  return { urgent: false, urgentReasons: [], dressing, clinical };
}
