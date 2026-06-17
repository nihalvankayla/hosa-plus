const EVENT_CONCEPTS = {
  'behavioral-health': [
    ['DSM-5 Criteria', 'Diagnostic criteria define symptom clusters, duration, impairment, and exclusion rules for mental health disorders.', 'diagnosis'],
    ['Cognitive Behavioral Therapy', 'CBT helps patients identify distorted thoughts and replace them with healthier behaviors.', 'treatment'],
    ['Medication-Assisted Treatment', 'MAT combines approved medications with counseling to treat substance use disorders.', 'substance-use'],
    ['Crisis Intervention', 'Crisis intervention focuses on immediate safety, stabilization, and connection to ongoing care.', 'crisis'],
    ['Mental Health Parity', 'Parity laws require many insurance plans to cover mental health care comparably to medical care.', 'law-and-ethics'],
    ['Trauma-Informed Care', 'Trauma-informed care avoids retraumatization by emphasizing safety, choice, collaboration, and trust.', 'patient-care'],
    ['Suicide Risk Assessment', 'Risk assessment checks ideation, plan, intent, means, past attempts, and protective factors.', 'crisis'],
    ['Substance Withdrawal', 'Withdrawal is a group of physical and psychological symptoms after stopping substance use.', 'substance-use'],
  ],
  'biomedical-equipment': [
    ['Preventive Maintenance', 'Preventive maintenance is scheduled inspection and service that reduces equipment failure.', 'maintenance'],
    ['Electrical Safety', 'Electrical safety checks grounding, leakage current, insulation, and safe device operation.', 'safety'],
    ['Calibration', 'Calibration compares a device measurement to a known standard and adjusts it if needed.', 'quality-control'],
    ['Infusion Pump', 'An infusion pump delivers fluids or medications at controlled rates and requires accuracy checks.', 'devices'],
    ['Defibrillator Analyzer', 'A defibrillator analyzer verifies delivered energy, waveform, charge time, and sync function.', 'devices'],
    ['Work Order Documentation', 'Work orders record the device, problem, action taken, parts used, and final status.', 'documentation'],
    ['Medical Device Recall', 'A recall removes or corrects a device with a known safety or performance risk.', 'safety'],
    ['Asset Inventory', 'Asset inventory tracks device identifiers, locations, service history, and ownership.', 'operations'],
  ],
  'dental-terminology': [
    ['Gingiva', 'Gingiva is the gum tissue surrounding the teeth.', 'oral-anatomy'],
    ['Occlusion', 'Occlusion describes how upper and lower teeth contact when the mouth closes.', 'oral-anatomy'],
    ['Caries', 'Dental caries are tooth decay caused by bacterial acid demineralizing enamel.', 'pathology'],
    ['Prophylaxis', 'Dental prophylaxis is professional cleaning to prevent oral disease.', 'procedures'],
    ['Periodontitis', 'Periodontitis is inflammatory disease that damages gum tissue and supporting bone.', 'pathology'],
    ['Endodontics', 'Endodontics focuses on the dental pulp and root canal therapy.', 'specialties'],
    ['Mandible', 'The mandible is the lower jawbone.', 'oral-anatomy'],
    ['Malocclusion', 'Malocclusion is abnormal alignment of teeth or jaws.', 'pathology'],
  ],
  'health-informatics': [
    ['Electronic Health Record', 'An EHR is a digital patient record used across clinical care, documentation, and reporting.', 'ehr'],
    ['Interoperability', 'Interoperability is the ability of systems to exchange and use health information.', 'data-exchange'],
    ['HL7', 'HL7 is a standards family for exchanging clinical and administrative health data.', 'standards'],
    ['Clinical Decision Support', 'Clinical decision support gives reminders, alerts, or guidance based on patient data.', 'clinical-systems'],
    ['Data Privacy', 'Data privacy protects patient information from unauthorized access or disclosure.', 'security'],
    ['Audit Trail', 'An audit trail records who accessed or changed health data and when.', 'security'],
    ['Telehealth', 'Telehealth delivers health services using electronic communication technology.', 'care-delivery'],
    ['Health Information Exchange', 'HIE allows health information to move between organizations for coordinated care.', 'data-exchange'],
  ],
  'healthcare-administration': [
    ['Revenue Cycle', 'The revenue cycle manages scheduling, coding, billing, payment, and denial follow-up.', 'finance'],
    ['Patient Flow', 'Patient flow tracks how patients move through registration, care, discharge, and follow-up.', 'operations'],
    ['Quality Improvement', 'Quality improvement uses data to make care safer, faster, more reliable, and more effective.', 'quality'],
    ['Staffing Matrix', 'A staffing matrix matches patient volume and acuity to staffing needs.', 'operations'],
    ['Compliance', 'Compliance means following laws, regulations, policies, and accreditation requirements.', 'compliance'],
    ['Accreditation', 'Accreditation is external review that verifies healthcare quality and safety standards.', 'quality'],
    ['Denial Management', 'Denial management corrects and prevents rejected insurance claims.', 'finance'],
    ['Patient Satisfaction', 'Patient satisfaction measures how patients perceive communication, access, and care experience.', 'quality'],
  ],
  'human-growth-development': [
    ['Developmental Milestone', 'A developmental milestone is a skill most children reach by a certain age.', 'pediatrics'],
    ['Erikson Stages', 'Erikson stages describe psychosocial conflicts across the lifespan.', 'theory'],
    ['Piaget Stages', 'Piaget stages describe how thinking develops from sensorimotor to formal operations.', 'theory'],
    ['Puberty', 'Puberty is the hormonal transition that produces sexual maturation and rapid growth.', 'adolescence'],
    ['Aging', 'Aging involves physical, cognitive, and social changes over time.', 'older-adults'],
    ['Attachment', 'Attachment is the emotional bond between child and caregiver.', 'infancy'],
    ['Fine Motor Skills', 'Fine motor skills use small muscles for tasks like grasping, writing, and buttoning.', 'pediatrics'],
    ['Cognitive Development', 'Cognitive development is growth in thinking, memory, language, and problem-solving.', 'theory'],
  ],
  'medical-law-ethics': [
    ['Informed Consent', 'Informed consent requires explanation of risks, benefits, alternatives, and voluntary agreement.', 'consent'],
    ['Confidentiality', 'Confidentiality protects private patient information from inappropriate disclosure.', 'privacy'],
    ['HIPAA', 'HIPAA sets national standards for protecting health information privacy and security.', 'privacy'],
    ['Scope of Practice', 'Scope of practice defines what a healthcare worker is legally allowed to do.', 'professionalism'],
    ['Negligence', 'Negligence is failure to meet a duty of care that causes harm.', 'liability'],
    ['Beneficence', 'Beneficence means acting to benefit the patient.', 'ethics'],
    ['Nonmaleficence', 'Nonmaleficence means avoiding harm.', 'ethics'],
    ['Advance Directive', 'An advance directive states patient wishes for care if they cannot communicate.', 'consent'],
  ],
  'medical-math': [
    ['Dose Formula', 'Dose ordered divided by dose on hand times quantity equals dose to give.', 'dosage'],
    ['Metric Conversion', 'Metric conversion moves between units such as kilograms, grams, milligrams, and micrograms.', 'conversions'],
    ['IV Flow Rate', 'IV flow rate calculates drops per minute using volume, drop factor, and time.', 'iv-therapy'],
    ['Body Weight Conversion', 'Pounds convert to kilograms by dividing by 2.2.', 'conversions'],
    ['Ratio and Proportion', 'Ratio and proportion solves medication problems by comparing equivalent relationships.', 'dosage'],
    ['Intake and Output', 'Intake and output compares fluids consumed with fluids eliminated.', 'patient-care'],
    ['Military Time', 'Military time uses a 24-hour clock to reduce scheduling confusion.', 'time'],
    ['Pediatric Dose', 'Pediatric dosing often uses body weight in kilograms.', 'dosage'],
  ],
  'medical-reading': [
    ['Main Idea', 'The main idea is the central point the author wants the reader to understand.', 'reading-skills'],
    ['Inference', 'An inference is a conclusion based on evidence and reasoning from the passage.', 'reading-skills'],
    ['Clinical Abstract', 'A clinical abstract summarizes the purpose, method, results, and conclusion of a study.', 'research'],
    ['Bias', 'Bias is a systematic influence that can distort interpretation or results.', 'research'],
    ['Evidence Strength', 'Evidence strength depends on study design, sample size, consistency, and relevance.', 'research'],
    ['Context Clues', 'Context clues help determine meaning from surrounding words and sentences.', 'vocabulary'],
    ['Author Purpose', 'Author purpose explains whether the text informs, persuades, explains, or argues.', 'reading-skills'],
    ['Data Table', 'A data table organizes values so patterns and comparisons are easier to see.', 'data-literacy'],
  ],
  'medical-spelling': [
    ['Tachycardia', 'Tachycardia is spelled t-a-c-h-y-c-a-r-d-i-a and means rapid heart rate.', 'cardiovascular'],
    ['Hemorrhage', 'Hemorrhage is spelled h-e-m-o-r-r-h-a-g-e and means severe bleeding.', 'blood'],
    ['Pneumonia', 'Pneumonia is spelled p-n-e-u-m-o-n-i-a and means lung infection.', 'respiratory'],
    ['Arrhythmia', 'Arrhythmia is spelled a-r-r-h-y-t-h-m-i-a and means irregular heart rhythm.', 'cardiovascular'],
    ['Anesthesia', 'Anesthesia is spelled a-n-e-s-t-h-e-s-i-a and means loss of sensation.', 'procedures'],
    ['Leukocyte', 'Leukocyte is spelled l-e-u-k-o-c-y-t-e and means white blood cell.', 'blood'],
    ['Osteoporosis', 'Osteoporosis is spelled o-s-t-e-o-p-o-r-o-s-i-s and means porous bones.', 'musculoskeletal'],
    ['Gastroenterology', 'Gastroenterology is spelled g-a-s-t-r-o-e-n-t-e-r-o-l-o-g-y and studies the digestive system.', 'digestive'],
  ],
  nutrition: [
    ['Macronutrient', 'Macronutrients are carbohydrates, proteins, and fats needed in large amounts.', 'nutrients'],
    ['Micronutrient', 'Micronutrients are vitamins and minerals needed in smaller amounts.', 'nutrients'],
    ['Basal Metabolic Rate', 'Basal metabolic rate is the energy used at rest for vital body functions.', 'energy-balance'],
    ['Dietary Fiber', 'Dietary fiber supports digestion, bowel regularity, and heart health.', 'digestion'],
    ['Protein', 'Protein supports tissue growth, repair, enzymes, hormones, and immune function.', 'nutrients'],
    ['Electrolyte', 'Electrolytes are charged minerals that support fluid balance and nerve function.', 'hydration'],
    ['MyPlate', 'MyPlate is a nutrition guide for balanced food groups and portions.', 'guidelines'],
    ['Food Label', 'A food label lists serving size, calories, nutrients, and percent daily values.', 'guidelines'],
  ],
  pathophysiology: [
    ['Homeostasis', 'Homeostasis is the body maintaining stable internal conditions.', 'core-processes'],
    ['Inflammation', 'Inflammation is a protective response involving redness, heat, swelling, pain, and loss of function.', 'immune'],
    ['Hypoxia', 'Hypoxia is inadequate oxygen delivery to tissues.', 'respiratory'],
    ['Ischemia', 'Ischemia is reduced blood flow to tissue.', 'cardiovascular'],
    ['Shock', 'Shock is inadequate tissue perfusion that can lead to organ failure.', 'cardiovascular'],
    ['Edema', 'Edema is swelling caused by excess fluid in tissues.', 'fluid-balance'],
    ['Acidosis', 'Acidosis is excess acidity in body fluids.', 'acid-base'],
    ['Cell Injury', 'Cell injury occurs when stress exceeds a cell ability to adapt.', 'cellular'],
  ],
  pharmacology: [
    ['Pharmacokinetics', 'Pharmacokinetics describes absorption, distribution, metabolism, and excretion of drugs.', 'drug-principles'],
    ['Therapeutic Effect', 'A therapeutic effect is the intended beneficial action of a medication.', 'drug-principles'],
    ['Adverse Effect', 'An adverse effect is an unintended harmful medication response.', 'safety'],
    ['Contraindication', 'A contraindication is a condition where a medication should not be used.', 'safety'],
    ['Half-Life', 'Half-life is the time required for half of a drug amount to be eliminated.', 'drug-principles'],
    ['Antibiotic', 'An antibiotic treats bacterial infection and should be used appropriately to reduce resistance.', 'drug-classes'],
    ['Analgesic', 'An analgesic reduces pain.', 'drug-classes'],
    ['Medication Reconciliation', 'Medication reconciliation compares medication lists to prevent omissions, duplications, and interactions.', 'safety'],
  ],
  'world-health-disparities': [
    ['Health Disparity', 'A health disparity is a preventable difference in health outcomes between populations.', 'equity'],
    ['Social Determinants', 'Social determinants are conditions where people live, learn, work, and age that shape health.', 'equity'],
    ['Health Equity', 'Health equity means everyone has a fair opportunity to reach optimal health.', 'equity'],
    ['Maternal Mortality', 'Maternal mortality measures deaths related to pregnancy or childbirth.', 'global-health'],
    ['Food Insecurity', 'Food insecurity is limited reliable access to enough nutritious food.', 'access'],
    ['Vaccine Access', 'Vaccine access affects prevention of infectious disease across communities.', 'prevention'],
    ['Global Burden of Disease', 'Global burden of disease measures illness, death, and disability across populations.', 'global-health'],
    ['Cultural Competence', 'Cultural competence supports respectful care that considers patient beliefs and context.', 'care-delivery'],
  ],
}

export function getGeneratedStudyDeck(eventId) {
  const concepts = EVENT_CONCEPTS[eventId] || []
  const flashcards = concepts.flatMap(([term, definition, topic], index) => {
    const baseDifficulty = index % 5 === 0 ? 'hard' : index % 3 === 0 ? 'medium' : 'easy'
    const topicLabel = topic.replaceAll('-', ' ')

    return [
      {
        id: `${eventId}-core-${index + 1}`,
        eventId,
        term,
        definition,
        topic,
        keywords: getKeywords(definition),
        example: `In ${topicLabel}, ${term.toLowerCase()} is a high-yield HOSA concept.`,
        difficulty: baseDifficulty,
        memoryHint: `First recall the plain-language meaning, then connect it to ${topicLabel}.`,
        competitionNote: 'Definition card: know the exact meaning before moving to application.',
        breakdown: [`Topic: ${topicLabel}`, 'Task: define it without looking'],
      },
      {
        id: `${eventId}-application-${index + 1}`,
        eventId,
        term: `${term}: Application`,
        definition: `Apply ${term} by recognizing when ${definition.charAt(0).toLowerCase()}${definition.slice(1)}`,
        topic,
        keywords: getKeywords(definition),
        example: `Scenario clue: a HOSA question may describe ${topicLabel} and ask which concept fits.`,
        difficulty: baseDifficulty === 'easy' ? 'medium' : baseDifficulty,
        memoryHint: `Ask: what clue in the scenario points to ${term}?`,
        competitionNote: 'Application card: practice translating scenario wording into the correct concept.',
        breakdown: ['Spot the clinical or administrative clue', `Match it back to ${term}`],
      },
      {
        id: `${eventId}-trap-${index + 1}`,
        eventId,
        term: `${term}: Common Trap`,
        definition: `Do not confuse ${term} with a nearby concept; use its keywords: ${getKeywords(definition).slice(0, 3).join(', ')}.`,
        topic,
        keywords: getKeywords(definition),
        example: `Timed tests often hide ${term.toLowerCase()} inside similar answer choices.`,
        difficulty: 'hard',
        memoryHint: `Say the keywords before picking an answer: ${getKeywords(definition).slice(0, 2).join(' + ')}.`,
        competitionNote: 'Trap card: this belongs in Weak Drill until you can explain the difference fast.',
        breakdown: ['Find the tempting wrong answer', 'Use keywords to eliminate it'],
      },
    ]
  })

  const quizQuestions = flashcards.slice(0, 12).map((card, index) => ({
    id: `${card.id}-quiz`,
    question: `What best describes ${card.term}?`,
    options: buildOptions(card, flashcards, index),
    answerIndex: 0,
    explanation: card.definition,
    relatedCardId: card.id,
  }))

  return { flashcards, quizQuestions }
}

function buildOptions(card, cards, index) {
  const wrong = cards
    .filter((item) => item.id !== card.id)
    .slice(index + 1)
    .concat(cards)
    .filter((item) => item.id !== card.id)
    .slice(0, 3)
    .map((item) => item.definition)

  return [card.definition, ...wrong]
}

function getKeywords(definition) {
  return definition
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter((word, index, words) => word.length > 4 && words.indexOf(word) === index)
    .slice(0, 6)
}
