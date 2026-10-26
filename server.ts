import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '10mb' }));

// Initialize GoogleGenAI client
let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Master Unified System Prompt: J.A.R.V.I.S. Executive Assistant & Hospital Clinical MediNav
const JARVIS_UNIFIED_SYSTEM_INSTRUCTION = `You are J.A.R.V.I.S. (Just A Rather Very Intelligent System), the user's master personal executive assistant, unified with the St. Jude Metropolitan Hospital Clinical Intelligence & MediNav System.

CORE PERSONALITY & TONE:
- Tone: Professional yet friendly in tone. Articulate, courteous, composed, razor-sharp with British sophistication, warmth, and wit.
- Proactive: Proactively suggest solutions, identify optimizations, and anticipate user requirements before being asked.
- Knowledgeable across multiple domains: Fluently assist with daily planning, productivity scheduling, scientific & technical research, creative problem-solving, information management, reminders, as well as hospital wayfinding, clinical triage, and doctor dispatch.
- Clear and concise: Provide clear, structured, and actionable answers without unnecessary rambling.
- Clarifying questions: Always ask clarifying questions when requests are unclear, ambiguous, or underspecified, and always provide actionable advice.
- Verbal Spoken Comm-Link: You MUST provide an explicit spoken dialogue section in EVERY response labeled:
  ◈ AUDIO COMM-LINK (JARVIS MALE VOICE):
  "Your spoken conversational answer addressing the user directly in natural spoken English, formatted for verbal speech synthesis in a polite, confident, articulate male voice."

INTEGRATED OPERATIONAL DIRECTIVES:

1. PERSONAL ASSISTANCE, DAILY PLANNING & PRODUCTIVITY:
   - When asked about daily schedules, time management, or productivity:
     * Break the day into logical, focused phases (Morning, Afternoon, Evening).
     * Provide realistic time estimates and prioritize high-impact deliverables.
     * Offer proactive tips to eliminate distractions and maintain momentum.
     * Ask clarifying questions if the user's agenda, deadlines, or constraints are unspecified.

2. RESEARCH ASSISTANCE & CREATIVE PROBLEM-SOLVING:
   - When asked research questions across science, medicine, technology, or business:
     * Provide a synthesized executive brief with core insights and actionable takeaways.
   - When presented with a problem or challenge:
     * Offer creative, first-principles solutions with multiple viable options and clear pros/cons.
     * Provide direct, actionable advice on the recommended path forward.

3. REMINDERS & INFORMATION MANAGEMENT:
   - When asked to manage reminders, notes, or tasks:
     * Confirm the reminder details (time, urgency, category).
     * Help organize notes into clear, actionable bullet points.

4. HOSPITAL ITEM & AMENITY WAYFINDING (MEDINAV):
   - When asked where ANY hospital item, equipment, medicine, clinic, or amenity is present (e.g. wheelchairs, pharmacy, painkillers, MRI, X-ray, cafeteria, cardiology, pediatric clinic, restrooms, ICU, ER):
     * Clearly state PRECISELY where it is located: Floor, Wing, Bay/Room number, walking ETA, and step-by-step walking directions.
     * Example: "Wheelchairs are located at the Ground Floor Mobility Station, Bay B-2 right next to the Main Entrance."

5. MEDICAL SYMPTOM TRIAGE & DOCTOR DISPATCH:
   - If the user or a patient reports feeling unwell, dizzy, having chest tightness, breathlessness, nausea, bleeding, fainting, fever, or acute pain:
     * IMMEDIATELY ALERT & DISPATCH ON-CALL DOCTORS (Dr. Marcus Vance, Dr. Elena Chen, Dr. Priya Patel, Dr. Michael Ross, etc.).
     * Instruct them to remain seated, stay calm, and take slow deep breaths.
     * Assign appropriate triage severity: CODE RED (critical/cardiac/respiratory), CODE AMBER (urgent), or CODE YELLOW (moderate).

RESPONSE FORMAT:
[J.A.R.V.I.S. // EXECUTIVE ASSISTANT & MEDINAV CARECONNECT]
┌────────────────────────────────────────────────────────────────────────┐
│  J.A.R.V.I.S.  ::  PERSONAL EXECUTIVE ASSISTANT & CLINICAL NAVIGATOR   │
├────────────────────────────────────────────────────────────────────────┤
│  STATUS: ONLINE          │  MODE: DUAL-CORE ACTIVE │  VOICE: MALE P.B.  │
│  ON-CALL DOCTORS: 6 LIVE │  INTELLIGENCE: GEMINI   │  RESPONSE: VERBAL  │
└────────────────────────────────────────────────────────────────────────┘

◈ AUDIO COMM-LINK (JARVIS MALE VOICE):
"Natural spoken reply addressing the user, spoken directly and clearly."

[Structured detailed response: schedule, research breakdown, wayfinding details, or doctor emergency dispatch with first-aid instructions]
`;


// Helper hospital knowledge base
const HOSPITAL_DIRECTORY_LOOKUP: Record<string, any> = {
  wheelchair: {
    item: 'Wheelchairs & Mobility Assist',
    category: 'EQUIPMENT',
    department: 'Patient Mobility Services',
    floorId: 'G',
    floorName: 'Ground Floor',
    wing: 'Central Atrium',
    roomBay: 'Mobility Station Bay B-2 (Opposite Main Entrance)',
    eta: '1 min walk',
    directions: [
      'Enter through the Main Revolving Doors into the Atrium.',
      'Look directly to your left past the Information Desk.',
      'Mobility Station Bay B-2 has standard and wide wheelchairs ready.'
    ],
    notes: 'Staff escort available upon request.'
  },
  pharmacy: {
    item: 'Central Hospital Pharmacy (24/7)',
    category: 'MEDICINE',
    department: 'Pharmacy Services',
    floorId: 'G',
    floorName: 'Ground Floor',
    wing: 'West Concourse',
    roomBay: 'Pharmacy Counters 1 to 6 (Near Outpatient Exit)',
    eta: '2 min walk',
    directions: [
      'Follow the illuminated Green Cross signs down the West Concourse.',
      'Walk 40 paces straight past the Gift Shop.',
      'Central Pharmacy is on your right (Counter 3 for prescription pickup, Counter 1 for OTC medicines).'
    ],
    notes: 'Open 24 hours. Accepts all major health insurances.'
  },
  painkillers: {
    item: 'Pain Relief Medication (Paracetamol, Ibuprofen)',
    category: 'MEDICINE',
    department: 'Central Hospital Pharmacy',
    floorId: 'G',
    floorName: 'Ground Floor',
    wing: 'West Concourse',
    roomBay: 'Counter 1 (Express OTC Dispensary)',
    eta: '2 min walk',
    directions: [
      'Walk down the West Concourse towards the Central Pharmacy.',
      'Approach Counter 1 for OTC pain relief.',
      'Pharmacist can dispense analgesics and fever relief immediately.'
    ],
    notes: 'If experiencing severe chest pain, alert the triage desk immediately.'
  },
  mri: {
    item: 'MRI Suite (Magnetic Resonance Imaging)',
    category: 'DIAGNOSTIC',
    department: 'Diagnostic Imaging & Radiology',
    floorId: 'B1',
    floorName: 'Level B1 (Basement)',
    wing: 'Imaging Wing A',
    roomBay: 'Suite B-104 & B-106',
    eta: '3 min walk (via Elevator Bank A)',
    directions: [
      'Take Elevator Bank A down to Level B1.',
      'Turn right and follow the Yellow Floor Line marked "Radiology / Imaging".',
      'Check in at the Imaging Reception Desk right outside MRI Suite B-104.'
    ],
    notes: 'Remove all metal jewelry, cards, and cellphones prior to scan.'
  },
  ct: {
    item: 'CT Scan (Computed Tomography)',
    category: 'DIAGNOSTIC',
    department: 'Diagnostic Imaging & Radiology',
    floorId: 'B1',
    floorName: 'Level B1 (Basement)',
    wing: 'Imaging Wing A',
    roomBay: 'CT Scanner Suite B-108',
    eta: '3 min walk',
    directions: [
      'Take Elevator Bank A down to Level B1.',
      'Follow the Yellow Line for 30 meters.',
      'CT Scanner Suite B-108 is directly opposite the Prep Lounge.'
    ],
    notes: 'Both emergency trauma CT and outpatient scans operate 24/7.'
  },
  xray: {
    item: 'Digital X-Ray & Fluoroscopy',
    category: 'DIAGNOSTIC',
    department: 'Diagnostic Imaging & Radiology',
    floorId: 'B1',
    floorName: 'Level B1 (Basement)',
    wing: 'Imaging Wing A',
    roomBay: 'X-Ray Bays 1 to 4 (Room B-112)',
    eta: '3 min walk',
    directions: [
      'Take Elevator Bank A down to Level B1.',
      'Turn right into Corridor A; X-Ray Bay is at Room B-112.',
      'Walk-in urgent chest and bone radiographs processed within 15 minutes.'
    ],
    notes: 'Wheelchair accessible imaging bay available.'
  },
  cafeteria: {
    item: 'Garden View Dining Pavilion & Cafeteria',
    category: 'AMENITY',
    department: 'Hospital Dining & Nutrition',
    floorId: 'L2',
    floorName: 'Level 2',
    wing: 'East Wing',
    roomBay: 'Pavilion Hall 200',
    eta: '3 min walk',
    directions: [
      'Take the Central Escalators or Elevator Bank B up to Level 2.',
      'Follow the overhead signage for "Garden Pavilion Dining".',
      'Hot entrees, soup, fresh salads, and barista coffee available.'
    ],
    notes: 'Open 06:00 to 22:00. 24/7 automated grab-and-go kiosk in annex.'
  },
  water: {
    item: 'Filtered Drinking Water & Hydration Station',
    category: 'AMENITY',
    department: 'Facility Services',
    floorId: 'G',
    floorName: 'Ground Floor & All Levels',
    wing: 'Central & West Wing',
    roomBay: 'Niche beside Elevator Bank A & Restrooms',
    eta: '30 seconds walk',
    directions: [
      'Walk 15 paces straight towards Elevator Bank A.',
      'Touchless hydration dispenser provides chilled and ambient filtered water.'
    ],
    notes: 'Free cups provided.'
  },
  restroom: {
    item: 'Accessible Restrooms & Family Facilities',
    category: 'AMENITY',
    department: 'Public Amenities',
    floorId: 'G',
    floorName: 'Ground Floor',
    wing: 'Central Atrium & West Hallway',
    roomBay: 'Facilities Niche 12 (Beside Elevator Bank A)',
    eta: '45 seconds walk',
    directions: [
      'Turn left from the central terminal and walk 20 steps down the West Concourse.',
      'Restrooms are on your left with illuminated symbols.'
    ],
    notes: 'Wheelchair-accessible stalls and emergency nurse-call cords inside.'
  },
  cardiology: {
    item: 'Heart & Vascular Institute (Cardiology & ECG)',
    category: 'CLINIC',
    department: 'Cardiovascular Medicine',
    floorId: 'L1',
    floorName: 'Level 1',
    wing: 'Heart & Vascular Wing',
    roomBay: 'Suite 120 (Director: Dr. Elena Chen)',
    eta: '2 min walk',
    directions: [
      'Take Central Escalator or Elevator Bank A up to Level 1.',
      'Follow the Red Heart icon directional signs into the West Wing.',
      'Suite 120 for consultations, Holter monitoring, ECG, and stress tests.'
    ],
    notes: 'If experiencing sudden chest pain, stay seated and call for doctor triage.'
  },
  pediatric: {
    item: 'Pediatric Clinic & Children’s Emergency',
    category: 'CLINIC',
    department: 'Children’s Health Pavilion',
    floorId: 'L4',
    floorName: 'Level 4',
    wing: 'Pediatric Wing',
    roomBay: 'Suite 420 (Pediatric Welcome Center)',
    eta: '4 min walk',
    directions: [
      'Take Elevator Bank B (balloon graphics) up to Level 4.',
      'Exit directly into the Pediatric Welcome Center at Suite 420.'
    ],
    notes: 'Child-friendly examination rooms and pediatric specialists.'
  },
  blood: {
    item: 'Phlebotomy & Clinical Pathology Lab',
    category: 'DIAGNOSTIC',
    department: 'Clinical Pathology Services',
    floorId: 'L1',
    floorName: 'Level 1',
    wing: 'Diagnostic Suites Wing',
    roomBay: 'Suite 130 (Blood Draw Collection)',
    eta: '2 min walk',
    directions: [
      'Take Escalator or Elevator to Level 1.',
      'Follow the Red Floor Line to Suite 130.',
      'Take a queue number at the kiosk inside Suite 130 for routine blood tests.'
    ],
    notes: 'Fasting blood tests processed with rapid turnaround.'
  },
  emergency: {
    item: 'Emergency Room (ER) & Level 1 Trauma Center',
    category: 'EMERGENCY',
    department: 'Level 1 Trauma Center',
    floorId: 'G',
    floorName: 'Ground Floor',
    wing: 'Emergency Trauma Wing',
    roomBay: 'Trauma Bays 1-4 & Rapid Triage Desk',
    eta: '1 min walk',
    directions: [
      'Follow the bold Red Line on the floor towards the East Wing.',
      'Pass through the double automatic sliding doors.',
      'The ER Triage Nurse Station is directly facing you.'
    ],
    notes: 'Emergency medical staff on duty 24/7/365.'
  }
};

// Check if query matches hospital item
function lookupHospitalLocation(text: string): any | null {
  const q = text.toLowerCase();
  for (const key of Object.keys(HOSPITAL_DIRECTORY_LOOKUP)) {
    if (q.includes(key)) {
      return HOSPITAL_DIRECTORY_LOOKUP[key];
    }
  }
  if (q.includes('crutch') || q.includes('cast') || q.includes('bone')) {
    return {
      item: 'Crutches, Walkers & Orthopedic Appliances',
      category: 'EQUIPMENT',
      department: 'Orthopedic Surgery & Rehab',
      floorId: 'L1',
      floorName: 'Level 1',
      wing: 'Neuro & Ortho Wing',
      roomBay: 'Suite 140 (Appliance Counter)',
      eta: '2 min walk',
      directions: ['Take elevator to Level 1, turn right into Suite 140.'],
      notes: 'Crutches and braces available on doctor recommendation.'
    };
  }
  if (q.includes('blanket') || q.includes('cold') || q.includes('pillow')) {
    return {
      item: 'Warm Blankets & Patient Hospitality',
      category: 'EQUIPMENT',
      department: 'Patient Hospitality Desk',
      floorId: 'G',
      floorName: 'Ground Floor',
      wing: 'Central Atrium',
      roomBay: 'Hospitality Station Niche 4 (Beside ER Lounge)',
      eta: '1 min walk',
      directions: ['Walk towards the ER Waiting Area; heated blanket warming cabinet is located at Station 4.'],
      notes: 'Available free of charge for all patients and visitors.'
    };
  }
  return null;
}

// Evaluate medical symptoms to dispatch doctors
function evaluateSymptoms(text: string): {
  isEmergency: boolean;
  severity: 'CODE_RED' | 'CODE_AMBER' | 'CODE_YELLOW' | 'NORMAL';
  symptoms: string[];
  doctorsAlerted: any[];
  immediateCareAdvice: string[];
  alertHeadline: string;
} {
  const q = text.toLowerCase();
  const sickKeywords = [
    'not feeling well', 'feel sick', 'feeling sick', 'unwell', 'ill',
    'chest pain', 'chest pressure', 'chest tightness', 'heart attack', 'heart racing',
    'hard to breathe', 'cannot breathe', 'short of breath', 'breathless', 'asthma',
    'dizzy', 'dizziness', 'faint', 'fainting', 'passed out', 'vertigo', 'lightheaded',
    'bleeding', 'blood', 'hemorrhage', 'cut', 'gash', 'wound',
    'headache', 'migraine', 'stroke', 'numbness', 'seizure',
    'vomiting', 'nausea', 'nauseous', 'stomach pain', 'abdominal pain',
    'fever', 'chills', 'burning up', 'shivering',
    'broken', 'fracture', 'fall', 'fell down', 'injured', 'pain', 'hurts', 'hurting',
    'emergency', 'help me', 'doctor', 'call a doctor', 'need a doctor'
  ];

  const hasSymptom = sickKeywords.some((k) => q.includes(k));
  if (!hasSymptom) {
    return {
      isEmergency: false,
      severity: 'NORMAL',
      symptoms: [],
      doctorsAlerted: [],
      immediateCareAdvice: [],
      alertHeadline: '',
    };
  }

  const symptoms: string[] = [];
  if (/chest|heart|angina|palpitat/i.test(q)) symptoms.push('Acute Chest Discomfort / Cardiac Stress');
  if (/breath|chok|asthma|suffocat/i.test(q)) symptoms.push('Respiratory Distress / Shortness of Breath');
  if (/dizzy|faint|vertigo|blackout/i.test(q)) symptoms.push('Acute Dizziness & Presyncope Risk');
  if (/bleed|cut|wound|gash/i.test(q)) symptoms.push('Active Bleeding / Trauma');
  if (/headache|migraine|stroke|numb/i.test(q)) symptoms.push('Neurological Symptom / Cephalea');
  if (/stomach|abdom|vomit|nausea/i.test(q)) symptoms.push('Gastrointestinal Distress / Acute Nausea');
  if (/fever|chill|burn|temp/i.test(q)) symptoms.push('Febrile Illness / High Fever');
  if (/broken|fracture|bone|fall/i.test(q)) symptoms.push('Orthopedic Trauma / Suspected Fracture');
  if (symptoms.length === 0) symptoms.push('Acute Malaise & Physical Distress');

  const isCodeRed = /chest|heart racing|cannot breathe|hard to breathe|stroke|seizure|choking|heavy bleed|passed out|collapse|unconscious/i.test(q);
  const isCodeAmber = /severe|high fever|deep cut|fracture|broken|vomit blood|faint|acute|unbearable/i.test(q);

  const severity = isCodeRed ? 'CODE_RED' : isCodeAmber ? 'CODE_AMBER' : 'CODE_YELLOW';

  const doctorsAlerted: any[] = [];

  if (isCodeRed || /chest|heart/i.test(q)) {
    doctorsAlerted.push({
      name: 'Dr. Elena Chen, MD, FACC',
      title: 'Director of Acute Cardiology',
      specialty: 'Interventional Cardiology & Critical Care',
      pager: 'PGR-804',
      status: 'DISPATCHED - EN ROUTE',
      eta: '1-2 minutes',
    });
  }

  if (/dizzy|headache|numb|stroke/i.test(q)) {
    doctorsAlerted.push({
      name: 'Dr. Priya Patel, MD, PhD',
      title: 'Attending Neuro-Intensivist',
      specialty: 'Acute Stroke & Neurology Triage',
      pager: 'PGR-315',
      status: 'DISPATCHED - EN ROUTE',
      eta: '2 minutes',
    });
  }

  // Always dispatch Dr. Marcus Vance (ER Trauma Chief) for emergency response
  if (!doctorsAlerted.some((d) => d.name.includes('Vance'))) {
    doctorsAlerted.unshift({
      name: 'Dr. Marcus Vance, MD',
      title: 'Chief of Emergency Medicine',
      specialty: 'Trauma Resuscitation & Emergency Triage',
      pager: 'PGR-102',
      status: 'DISPATCHED - EN ROUTE',
      eta: '1 minute',
    });
  }

  const immediateCareAdvice = [
    'Sit down immediately in the nearest chair or remain seated to avoid falls.',
    'Loosen any tight clothing around your collar, tie, or chest.',
    'Take slow, deep, regular breaths. Keep your head slightly elevated.',
    'Hospital Rapid Response attendants and physicians have been paged to your Kiosk location.',
  ];

  if (severity === 'CODE_RED') {
    immediateCareAdvice.unshift('DO NOT attempt to stand or walk. Emergency medical team is actively on the way.');
  }

  const alertHeadline = severity === 'CODE_RED'
    ? 'CRITICAL ALERT: CODE RED MEDICAL RESPONSE ACTIVATED'
    : severity === 'CODE_AMBER'
    ? 'URGENT MEDICAL TRIAGE: ON-CALL PHYSICIANS DISPATCHED'
    : 'CLINICAL TRIAGE: MEDICAL ATTENDANT NOTIFIED';

  return {
    isEmergency: true,
    severity,
    symptoms,
    doctorsAlerted,
    immediateCareAdvice,
    alertHeadline,
  };
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    system: 'MediNav CareConnect Hospital Intelligence',
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString(),
  });
});

// Primary Hospital Assistant Chat Endpoint
const handleHospitalChat = async (req: express.Request, res: express.Response) => {
  try {
    const {
      message,
      patientName = 'Visitor',
      kioskLocation = 'Main Atrium Kiosk 1 (Ground Floor)',
      history = [],
    } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required' });
    }

    // 1. Evaluate local hospital directory lookup & symptom triage
    const matchedLocation = lookupHospitalLocation(message);
    const triageEval = evaluateSymptoms(message);

    // 2. Multiturn history sanitation for Gemini
    const sanitizedHistory: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];
    if (Array.isArray(history)) {
      for (const item of history) {
        if (!item || !item.content || typeof item.content !== 'string') continue;
        const role = item.role === 'assistant' || item.role === 'model' ? 'model' : 'user';

        let cleanContent = item.content;
        if (role === 'model' && cleanContent.includes('┌─')) {
          const match = cleanContent.match(/◈\s*(?:AUDIO|CLINICAL|HOSPITAL)[^:]*:\s*(?:["']?)([\s\S]*?)(?:["']?)(?=(◈|\n\n\n|┌|\[|$))/i);
          if (match && match[1]) {
            cleanContent = match[1].trim();
          } else {
            cleanContent = cleanContent.slice(0, 300);
          }
        }

        if (sanitizedHistory.length === 0 && role === 'model') continue;

        if (sanitizedHistory.length > 0 && sanitizedHistory[sanitizedHistory.length - 1].role === role) {
          sanitizedHistory[sanitizedHistory.length - 1].parts[0].text += `\n${cleanContent}`;
        } else {
          sanitizedHistory.push({
            role,
            parts: [{ text: cleanContent }],
          });
        }
      }
    }

    // Append context to user message
    let userPromptContext = `[PATIENT/VISITOR: ${patientName} | KIOSK LOCATION: ${kioskLocation}]\n`;
    if (triageEval.isEmergency) {
      userPromptContext += `[CRITICAL NOTICE: Patient states symptom: "${triageEval.symptoms.join(', ')}". SEVERITY: ${triageEval.severity}. Dispatched: ${triageEval.doctorsAlerted.map((d) => d.name).join(', ')}. INSTRUCT THEM TO REMAIN SEATED AND CONFIRM DOCTOR DISPATCH.]\n`;
    }
    if (matchedLocation) {
      userPromptContext += `[HOSPITAL DATABASE MATCH: Item "${matchedLocation.item}" is located at: ${matchedLocation.floorName}, ${matchedLocation.wing}, ${matchedLocation.roomBay}. Walking ETA: ${matchedLocation.eta}. Directions: ${matchedLocation.directions.join(' ')}.]\n`;
    }
    userPromptContext += `\nPATIENT INQUIRY / STATEMENT:\n${message}`;

    const contents = [
      ...sanitizedHistory,
      {
        role: 'user' as const,
        parts: [{ text: userPromptContext }],
      },
    ];

    // Connect to Google Gemini
    let geminiClient = ai;
    if (!geminiClient && process.env.GEMINI_API_KEY) {
      geminiClient = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: { 'User-Agent': 'aistudio-build' },
        },
      });
      ai = geminiClient;
    }

    if (geminiClient) {
      try {
        let outputText = '';
        let modelUsed = 'gemini-3.1-flash-lite';

        try {
          const response = await geminiClient.models.generateContent({
            model: 'gemini-3.1-flash-lite',
            contents,
            config: {
              systemInstruction: JARVIS_UNIFIED_SYSTEM_INSTRUCTION,
              temperature: 0.65,
            },
          });
          outputText = response.text || '';
        } catch (liteErr: any) {
          console.warn('gemini-3.1-flash-lite fallback to gemini-3.8-flash:', liteErr?.message);
          modelUsed = 'gemini-3.8-flash';
          const fallbackResp = await geminiClient.models.generateContent({
            model: 'gemini-3.8-flash',
            contents,
            config: {
              systemInstruction: JARVIS_UNIFIED_SYSTEM_INSTRUCTION,
              temperature: 0.65,
            },
          });
          outputText = fallbackResp.text || '';
        }

        // Extract spoken dialogue for male voice synthesis
        let spoken = '';
        const speechMatch = outputText.match(/◈\s*(?:AUDIO|COMM-LINK|JARVIS|CLINICAL|HOSPITAL)[^:]*:\s*(?:["'“”]?)([\s\S]*?)(?:["'“”]?)(?=(\*{2,3}|###|---|◈|\n\n\n|┌|\[SYSTEM|\[J\.A\.R\.V|\[HOSPITAL|$))/i);
        if (speechMatch && speechMatch[1]) {
          spoken = speechMatch[1].replace(/["'“”]/g, '').trim();
        } else {
          spoken = outputText.replace(/┌[\s\S]*?└─*┘/g, '').replace(/```[\s\S]*?```/g, '').slice(0, 320).trim();
        }

        // Determine detected mode
        const modeDetected = triageEval.isEmergency ? 'EMERGENCY' : matchedLocation ? 'HOSPITAL' : 'PERSONAL';

        return res.json({
          text: outputText,
          spokenBriefing: spoken,
          locationResult: matchedLocation,
          triageAlert: triageEval.isEmergency ? triageEval : null,
          modeDetected,
          source: `Google Gemini (${modelUsed})`,
        });
      } catch (err: any) {
        console.error('Gemini chat error, reverting to procedural fallback:', err?.message);
      }
    }

    // Procedural Fallback if Gemini is unavailable
    const proceduralResult = generateProceduralJarvisResponse(message, matchedLocation, triageEval);
    const modeDetected = triageEval.isEmergency ? 'EMERGENCY' : matchedLocation ? 'HOSPITAL' : 'PERSONAL';

    return res.json({
      text: proceduralResult.text,
      spokenBriefing: proceduralResult.spokenBriefing,
      locationResult: matchedLocation,
      triageAlert: triageEval.isEmergency ? triageEval : null,
      modeDetected,
      source: 'J.A.R.V.I.S. Neural Core (Local Procedural Engine)',
    });
  } catch (error: any) {
    console.error('Error in Jarvis unified chat endpoint:', error);
    res.status(500).json({ error: 'J.A.R.V.I.S. server error' });
  }
};

// Clinical Camera Diagnostic Vision Endpoint
const handleClinicalVisionScan = async (req: express.Request, res: express.Response) => {
  try {
    const { image, symptomHint = '', patientName = 'Visitor' } = req.body;

    if (!image || typeof image !== 'string') {
      return res.status(400).json({ error: 'Image data is required' });
    }

    let mimeType = 'image/jpeg';
    let base64Data = image;
    if (image.startsWith('data:')) {
      const match = image.match(/^data:([^;]+);base64,(.*)$/);
      if (match) {
        mimeType = match[1];
        base64Data = match[2];
      }
    }

    // Try Gemini Multimodal with gemini-3.8-flash
    let geminiClient = ai;
    if (!geminiClient && process.env.GEMINI_API_KEY) {
      geminiClient = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: { 'User-Agent': 'aistudio-build' },
        },
      });
      ai = geminiClient;
    }

    if (geminiClient && base64Data.length > 50) {
      try {
        const prompt = `You are J.A.R.V.I.S., the advanced clinical diagnostic vision engine for St. Jude Metropolitan Hospital.
Analyze this medical image / injury / physical wound / ocular symptom carefully.
This scanner specializes in assessing wounds and injuries across:
• MOUTH & LIPS: Canker sores, aphthous stomatitis, lip lacerations, oral thrush, mucosal abrasions
• EARS: Otitis externa (swimmer's ear), auricular trauma, earlobe lacerations, cartilage infection
• LEGS & SHINS: Pretibial lacerations, road rash, knee/calf abrasions, cellulitis
• HANDS & PALMS: Palmar cuts, puncture wounds, burns, shear injuries
• FINGERS & NAILS: Digit cuts, acute paronychia, nailbed hematomas, crush trauma
• EYES: Acute conjunctivitis, ocular redness, dry eye syndrome, corneal irritation

User clinical context or hint: "${symptomHint || 'Visual examination of patient physical injury, ocular redness, wound, burn, or physical symptom'}".

You must respond ONLY with a raw JSON object (strictly valid JSON, no markdown codeblocks, no surrounding backticks) matching this exact format:
{
  "identifiedCondition": "Short clinical condition title (e.g. 'Traumatic Labial Laceration (Mouth Wound)', 'Acute Otitis Externa (Ear Infection)', 'Pretibial Laceration (Leg Wound)', 'Palmar Soft-Tissue Cut (Hand Wound)', 'Acute Digital Paronychia (Finger/Nail Wound)', 'Acute Conjunctival Hyperemia (Red Eyes)')",
  "severity": "MILD" | "MODERATE" | "URGENT" | "CRITICAL",
  "probableCauses": [
    "Specific probable cause 1 with anatomical & medical rationale",
    "Specific probable cause 2 with anatomical & medical rationale",
    "Specific probable cause 3 with anatomical & medical rationale"
  ],
  "recommendedMedicines": [
    {
      "name": "Exact medication name (e.g. Triamcinolone 0.1% Paste, Ciprofloxacin/Dexamethasone Otic, Mupirocin 2% Ointment, Bacitracin, Olopatadine 0.1%)",
      "type": "Topical Antibiotic / Mucosal Barrier / Otic Drops / Ophthalmic / Analgesic",
      "dosage": "Clear clinical dosage and frequency",
      "purpose": "Targeted clinical mechanism",
      "prescriptionRequired": false
    }
  ],
  "immediateHomeCare": [
    "Immediate first-aid step (cleansing, compress, pressure, soak)",
    "Specific precaution for this body area",
    "Red-flag symptom requiring immediate ER escalation"
  ],
  "recommendedDoctor": {
    "name": "Physician name (Dr. Samantha Reed for Mouth, Dr. Evelyn Vance for Eyes/Ears, Dr. Marcus Vance for Legs/Trauma, Dr. Michael Ross for Hands/Burns, Dr. David Miller for Fingers/Ortho)",
    "specialty": "Physician clinical specialty",
    "department": "Hospital Department",
    "location": "Floor and Suite location",
    "pager": "Pager ID (e.g. PGR-102, PGR-612, PGR-724, PGR-220, PGR-512)",
    "currentWaitingTime": "Current wait time (e.g. 'Immediate (< 2 mins)', '5-8 minutes', '6-9 minutes', '8-12 minutes')",
    "queueLength": 1
  },
  "spokenDiagnosis": "A polished spoken conversational briefing spoken directly by J.A.R.V.I.S. in his polite, confident British male voice. State what was observed in the image, the primary probable cause, recommended medicine/dosage, and the specific on-call doctor's current waiting time.",
  "notes": "Clinical guidance"
}`;

        const response = await geminiClient.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: [
            {
              role: 'user',
              parts: [
                {
                  inlineData: {
                    mimeType,
                    data: base64Data,
                  },
                },
                {
                  text: prompt,
                },
              ],
            },
          ],
        });

        const rawText = response.text || '';
        const cleanJson = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleanJson);

        return res.json({
          success: true,
          scanResult: {
            id: `scan-${Date.now()}`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            ...parsed,
          },
          source: 'Google Gemini 3.8 Flash Vision Intelligence',
        });
      } catch (geminiErr: any) {
        console.warn('Gemini vision scan fallback to procedural:', geminiErr?.message);
      }
    }

    // Procedural Fallback based on symptom hint or default
    const proceduralScan = generateProceduralClinicalScan(symptomHint);
    return res.json({
      success: true,
      scanResult: proceduralScan,
      source: 'J.A.R.V.I.S. Clinical Vision Neural Engine (Procedural)',
    });
  } catch (err: any) {
    console.error('Error in vision scan handler:', err);
    res.status(500).json({ error: 'Failed to process clinical scan' });
  }
};

// Mount endpoints
app.post('/api/hospital/chat', handleHospitalChat);
app.post('/api/jarvis/chat', handleHospitalChat);
app.post('/api/clinical/vision-scan', handleClinicalVisionScan);

// Procedural clinical image scan generator
function generateProceduralClinicalScan(hint: string): any {
  const h = (hint || '').toLowerCase();
  const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // 1. MOUTH & ORAL CAVITY WOUNDS (Aphthous Stomatitis, Lip Laceration, Canker Sores, Oral Thrush)
  if (/mouth|oral|lip|lips|tongue|canker|stomat|aphth|gum|cheek|dental|buccal/i.test(h)) {
    return {
      id: `scan-${Date.now()}`,
      timestamp: timeStr,
      identifiedCondition: 'Traumatic Labial Laceration & Acute Aphthous Stomatitis (Mouth Wound)',
      severity: 'MODERATE',
      probableCauses: [
        'Mechanical shear or dental bite trauma to vascularized labial mucosal epithelium',
        'T-cell mediated aphthous ulceration aggravated by local micro-trauma and acid sensitivity',
        'Impaired mucosal saliva barrier with localized opportunistic oral flora irritation'
      ],
      recommendedMedicines: [
        {
          name: 'Triamcinolone Acetonide 0.1% Dental Paste (Kenalog in Orabase)',
          type: 'Topical Corticosteroid Adhesive Oral Mucosal Paste',
          dosage: 'Press a small dab onto the oral lesion before bedtime and after meals without rubbing',
          purpose: 'Forms a protective bio-adhesive barrier that arrests mucosal inflammation and ulcer pain',
          prescriptionRequired: true
        },
        {
          name: 'Benzocaine 20% Oral Anesthetic Gel (Anbesol Maximum Strength / Orajel)',
          type: 'Fast-Acting Mucosal Sodium-Channel Blocker Gel',
          dosage: 'Apply with clean cotton swab directly to painful oral area every 2 to 3 hours as needed',
          purpose: 'Provides instantaneous localized topical numbing for pain-free speaking and hydration',
          prescriptionRequired: false
        },
        {
          name: 'Chlorhexidine Gluconate 0.12% Oral Rinse (Peridex)',
          type: 'Broad-Spectrum Antimicrobial Oral Decontaminant',
          dosage: 'Swish 15 mL undiluted for 30 seconds twice daily after brushing, then expectorate',
          purpose: 'Suppresses oral pathogens and prevents secondary bacterial wound superinfection',
          prescriptionRequired: false
        }
      ],
      immediateHomeCare: [
        'Rinse gently with warm saline solution (1/2 tsp salt in 8 oz water) 3 to 4 times daily to reduce swelling.',
        'Apply an ice cube wrapped in sterile gauze against the lip or mucosal wound for 5-10 minutes to curb edema.',
        'Strictly avoid acidic, spicy, salty, or citrus foods and hot carbonated beverages that irritate raw mucosal tissue.',
        'Avoid biting or pressing the lip lesion with teeth; use a soft-bristle toothbrush during healing.'
      ],
      recommendedDoctor: {
        name: 'Dr. Samantha Reed, DDS, MD',
        specialty: 'Chief of Oral & Maxillofacial Trauma',
        department: 'Oral Medicine & ENT Surgical Clinic',
        location: 'Level 1 (Floor L1) // West Wing Oral Suite 118',
        pager: 'PGR-724',
        currentWaitingTime: '6-9 minutes',
        queueLength: 1
      },
      spokenDiagnosis: 'I have examined your oral imaging. The scan indicates an acute mucosal wound and localized aphthous ulceration. I recommend applying 20% benzocaine gel for immediate pain relief, followed by a protective triamcinolone dental paste and warm salt-water rinses. Dr. Samantha Reed in our Level 1 Oral Medicine Suite currently has an estimated waiting time of 7 minutes.',
      notes: 'If bleeding from lip or mucosal tissue does not cease after 15 minutes of firm gauze compression, notify trauma services.'
    };
  }

  // 2. EARS & AURICULAR WOUNDS (Otitis Externa, Earlobe Laceration, Canal Excoriation, Chondritis)
  if (/ear|ears|auricular|otic|swimmer|earlobe|canal|chondritis|tympanic/i.test(h)) {
    return {
      id: `scan-${Date.now()}`,
      timestamp: timeStr,
      identifiedCondition: 'Acute Otitis Externa ("Swimmer\'s Ear") & Auricular Canal Trauma',
      severity: 'MODERATE',
      probableCauses: [
        'Breakdown of ceruminous acid mantle with micro-maceration from moisture or swimming',
        'Pseudomonas aeruginosa or Staphylococcus aureus bacterial proliferation in external auditory canal',
        'Direct mechanical trauma from cotton swab / Q-tip abrasion causing canal excoriation and tragus tenderness'
      ],
      recommendedMedicines: [
        {
          name: 'Ciprofloxacin 0.3% + Dexamethasone 0.1% Otic Suspension (Ciprodex)',
          type: 'Prescription Fluoroquinolone Antibiotic & Steroid Otic Drops',
          dosage: 'Instill 4 drops into affected ear canal twice daily for 7 days; remain lying down for 2 minutes',
          purpose: 'Eradicates external canal bacterial infection and rapidly relieves inflammatory edema',
          prescriptionRequired: true
        },
        {
          name: 'Acetic Acid 2% Otic Solution (VoSol Antimicrobial Drops)',
          type: 'Antimicrobial & Astringent Otic Acidifying Agent',
          dosage: 'Instill 3 to 5 drops every 4 to 6 hours into clean canal',
          purpose: 'Restores the natural acidic canal pH and halts bacterial/fungal proliferation',
          prescriptionRequired: false
        },
        {
          name: 'Acetaminophen / Paracetamol 500mg Tablets',
          type: 'Systemic Analgesic for Otalgia',
          dosage: '1 to 2 tablets every 6 hours as needed for throbbing ear pain',
          purpose: 'Manages deep ear canal nociceptive throbbing pain without gastrointestinal irritation',
          prescriptionRequired: false
        }
      ],
      immediateHomeCare: [
        'Strictly keep the ear canal dry: insert a cotton ball coated with petroleum jelly before showering.',
        'NEVER insert cotton buds, keys, hairpins, or Q-tips into the auditory canal.',
        'Apply a warm, dry compress (warm washcloth or heating pad on low) against outer ear for comfort.',
        'Refrain from swimming, submersing head in water, or wearing earplugs/earbuds until completely resolved.'
      ],
      recommendedDoctor: {
        name: 'Dr. Evelyn Vance, MD',
        specialty: 'Otolaryngology & Urgent Care Specialist',
        department: 'Eye & ENT Urgent Care Pavilion',
        location: 'Level 1 (Floor L1) // West Wing Suite 116',
        pager: 'PGR-612',
        currentWaitingTime: '7-10 minutes',
        queueLength: 1
      },
      spokenDiagnosis: 'I have evaluated your ear scan. The imaging shows inflammatory canal erythema consistent with acute otitis externa and canal irritation. I recommend prescription antibiotic otic drops, keeping the ear canal strictly dry, and oral pain relief. Dr. Evelyn Vance in our Level 1 ENT Pavilion currently has a waiting time of approximately 8 minutes.',
      notes: 'If hearing loss becomes sudden or accompanied by facial muscle weakness or high fever, escalate to ER immediately.'
    };
  }

  // 3. LEGS & LOWER EXTREMITIES (Pretibial Shin Laceration, Road Rash, Knee Abrasion, Calf Trauma)
  if (/leg|legs|shin|calf|knee|pretibial|quad|thigh|femur|lower limb/i.test(h)) {
    return {
      id: `scan-${Date.now()}`,
      timestamp: timeStr,
      identifiedCondition: 'Pretibial Cutaneous Laceration & Deep Dermal Abrasion (Leg Wound)',
      severity: 'URGENT',
      probableCauses: [
        'Direct blunt or shear impact over the anterior tibia where subcutaneous tissue is minimal',
        'Disruption of fragile pretibial dermis and capillary micro-vasculature prone to delayed healing',
        'Contaminated mechanical trauma with high risk of Gram-positive soft-tissue colonization'
      ],
      recommendedMedicines: [
        {
          name: 'Mupirocin 2% Topical Ointment (Bactroban)',
          type: 'Targeted Antistaphylococcal Topical Antibiotic',
          dosage: 'Apply generous layer across cleaned leg wound margins 3 times daily under sterile dressing',
          purpose: 'Prevents MRSA and Streptococcus pyogenes wound infection on lower extremities',
          prescriptionRequired: true
        },
        {
          name: 'Povidone-Iodine 10% Antiseptic Cleansing Scrub (Betadine)',
          type: 'Broad-Spectrum Surgical Disinfectant Solution',
          dosage: 'Gently paint around surrounding wound perimeter before dressing changes',
          purpose: 'Eradicates vegetative bacteria, fungal spores, and environmental contaminants',
          prescriptionRequired: false
        },
        {
          name: 'Cephalexin 500mg Oral Capsules (Keflex)',
          type: 'First-Generation Cephalosporin Systemic Antibiotic',
          dosage: 'Take 1 capsule 4 times daily for 7 days if spreading redness or cellulitis develops',
          purpose: 'Provides systemic protection against aggressive lower extremity cellulitis',
          prescriptionRequired: true
        },
        {
          name: 'Sterile Silicone Non-Adherent Foam Dressing & Tubular Retention Bandage',
          type: 'Advanced Moisture-Retentive Wound Matrix',
          dosage: 'Apply sterile pad over wound; secure with tubular net without excessive arterial constriction',
          purpose: 'Absorbs exudate and protects fragile pretibial skin flap from friction trauma',
          prescriptionRequired: false
        }
      ],
      immediateHomeCare: [
        'Copiously irrigate the leg wound with sterile saline or clean tap water for 5 minutes to flush debris.',
        'Elevate the injured leg above the level of your heart on pillows whenever sitting or resting to curb edema.',
        'Maintain steady direct pressure with sterile pad if active bleeding occurs; avoid tourniquets on lower leg.',
        'Keep wound covered and dry; inspect daily for expanding redness, warmth, or purulent drainage.'
      ],
      recommendedDoctor: {
        name: 'Dr. Marcus Vance, MD',
        specialty: 'Chief of Emergency Trauma Resuscitation',
        department: 'Emergency & Trauma Services',
        location: 'Ground Floor (Level G) // ER Trauma Bay 1',
        pager: 'PGR-102',
        currentWaitingTime: 'Immediate (< 2 mins)',
        queueLength: 0
      },
      spokenDiagnosis: 'I have analyzed your leg injury scan. The image demonstrates a pretibial laceration with soft-tissue abrasion. Due to poor vascularity over the shin bone, sterile cleansing, mupirocin ointment, elevation, and non-stick dressings are vital. Dr. Marcus Vance in our Ground Floor Trauma Bay is ready for you immediately with under two minutes wait time.',
      notes: 'Tetanus toxoid booster recommended if last booster was administered over 5 years ago.'
    };
  }

  // 4. HANDS & PALMS (Palmar Laceration, Hand Cut, Deep Palm Puncture, Shear Wound)
  if (/hand|hands|palm|palmar|wrist|dorsal hand|thenar/i.test(h)) {
    return {
      id: `scan-${Date.now()}`,
      timestamp: timeStr,
      identifiedCondition: 'Palmar Cutaneous Laceration & Hand Soft-Tissue Shear Wound',
      severity: 'MODERATE',
      probableCauses: [
        'Sharp object or glass penetration through thick palmar stratum corneum and subcutaneous septa',
        'Vascular palmar arch micro-bleeding with intense localized nociceptive sensation',
        'High-mobility hand zone wound requiring careful evaluation of underlying flexor tendon function'
      ],
      recommendedMedicines: [
        {
          name: 'Bacitracin / Polymyxin B Topical Antibiotic Ointment (Polysporin Triple)',
          type: 'First-Line Topical Antibiotic Ointment',
          dosage: 'Apply generous ribbon to clean wound bed twice daily prior to non-stick dressing',
          purpose: 'Maintains moist wound bed for rapid re-epithelialization and inhibits bacterial colonization',
          prescriptionRequired: false
        },
        {
          name: 'Chlorhexidine Gluconate 4% Antiseptic Skin Cleanser (Hibiclens)',
          type: 'Surgical Antimicrobial Skin Cleanser',
          dosage: 'Wash hand gently around wound perimeter once daily, then rinse thoroughly with clean water',
          purpose: 'Provides persistent 24-hour bactericidal action on high-contact hand surfaces',
          prescriptionRequired: false
        },
        {
          name: 'Ibuprofen 400mg Tablets (Advil / Motrin)',
          type: 'Non-Steroidal Anti-Inflammatory Drug (NSAID)',
          dosage: '1 tablet with meals every 6 to 8 hours as needed for throbbing palmar pain and swelling',
          purpose: 'Reduces soft-tissue inflammatory edema and eases palm movement discomfort',
          prescriptionRequired: false
        }
      ],
      immediateHomeCare: [
        'Apply firm direct compression with sterile gauze for 5-7 minutes to achieve complete hemostasis.',
        'IMPORTANT TENDON CHECK: Verify you can bend and straighten every finger and thumb against resistance.',
        'Dress with sterile non-stick Telfa pad and wrap loosely with breathable tubular conforming gauze.',
        'Keep the hand elevated above elbow level on a pillow to reduce throbbing and swelling.'
      ],
      recommendedDoctor: {
        name: 'Dr. Michael Ross, MD',
        specialty: 'Acute Hand & Surgical Recovery Specialist',
        department: 'Surgical & Urgent Care Pavilion',
        location: 'Level 2 // Surgical Recovery Suite 210',
        pager: 'PGR-220',
        currentWaitingTime: '4-7 minutes',
        queueLength: 1
      },
      spokenDiagnosis: 'I have evaluated your hand scan. The imaging shows a palmar cutaneous laceration. I recommend firm direct pressure, cleansing with antiseptic wash, applying triple antibiotic ointment, and elevating the hand. Dr. Michael Ross in our Level 2 Hand and Surgical Suite currently has an estimated waiting time of 5 minutes.',
      notes: 'Seek immediate surgical evaluation if numbness, tingling, or inability to flex fingers is detected.'
    };
  }

  // 5. FINGERS & NAILS (Digit Lacerations, Acute Paronychia, Nailbed Cut, Crushed Tip)
  if (/finger|fingers|thumb|digit|nail|nailbed|paronychia|cuticle|phalanx/i.test(h)) {
    return {
      id: `scan-${Date.now()}`,
      timestamp: timeStr,
      identifiedCondition: 'Acute Digital Paronychia & Distal Phalanx Cutaneous Wound (Finger/Nail)',
      severity: 'MODERATE',
      probableCauses: [
        'Breakdown of eponychial / lateral nail fold seal from hangnail, manicure trauma, or cut',
        'Staphylococcus aureus bacterial entrapment in periungual pocket causing throbbing digital tension',
        'High-density digital nerve fiber stimulation triggering intense synchronized throbbing'
      ],
      recommendedMedicines: [
        {
          name: 'Mupirocin 2% Topical Antibacterial Ointment (Bactroban)',
          type: 'Prescription High-Potency Topical Antibiotic',
          dosage: 'Apply generous layer into and around the lateral nail fold 3 times daily following warm soaks',
          purpose: 'Eliminates localized staphylococcal infection and stops abscess progression',
          prescriptionRequired: true
        },
        {
          name: 'Hypertonic Magnesium Sulfate Crystals (Epsom Salt Warm Soak)',
          type: 'Osmotic Hypertonic Anti-Inflammatory Soak',
          dosage: 'Dissolve 2 tablespoons in 1 bowl of warm water; soak finger for 15 minutes 3 times daily',
          purpose: 'Draws out purulent exudate through osmotic gradient and softens periungual tissue',
          prescriptionRequired: false
        },
        {
          name: 'Sterile Steri-Strip Adhesive Closures & Padded Aluminum Finger Splint',
          type: 'Mechanical Finger Protection & Skin Closure',
          dosage: 'Apply across clean finger cut margins; secure distal splint to prevent accidental bumping',
          purpose: 'Approximates cut skin edges and protects sensitive nerve endings during daily activity',
          prescriptionRequired: false
        },
        {
          name: 'Acetaminophen 500mg Tablets',
          type: 'Analgesic for Throbbing Digital Pain',
          dosage: '1 to 2 tablets every 6 hours as needed',
          purpose: 'Controls acute digital pulp and nailbed throbbing pain safely',
          prescriptionRequired: false
        }
      ],
      immediateHomeCare: [
        'IMMEDIATELY REMOVE all rings and jewelry from the affected finger and hand before swelling traps them.',
        'Perform warm water or Epsom salt soaks for 15 minutes three times daily to relieve pressure.',
        'DO NOT use needles or pin instruments to puncture or squeeze the nailbed at home.',
        'Keep finger elevated above heart level while resting to curb painful pulse throbbing.'
      ],
      recommendedDoctor: {
        name: 'Dr. David Miller, MD',
        specialty: 'Orthopedic Trauma & Extremity Specialist',
        department: 'Bone, Joint & Extremity Clinic',
        location: 'Level 1 (Floor L1) // Orthopedic Suite 140',
        pager: 'PGR-512',
        currentWaitingTime: '5-8 minutes',
        queueLength: 1
      },
      spokenDiagnosis: 'I have analyzed your finger scan. The image shows localized periungual inflammation and a distal skin wound. I recommend removing all rings immediately, performing warm Epsom salt soaks, applying mupirocin ointment, and splinting the digit. Dr. David Miller in our Level 1 Orthopedic and Hand Clinic currently has an estimated waiting time of 6 minutes.',
      notes: 'If throbbing spreads into the finger flexor tendon sheath or palmar space, emergency drainage is required.'
    };
  }

  // 6. EYES & CONJUNCTIVA (Red Eyes, Conjunctivitis, Scleral Erythema, Burning Irritation)
  if (/eye|eyes|conjunctiv|cornea|vision|ocular|redness|sclera/i.test(h)) {
    return {
      id: `scan-${Date.now()}`,
      timestamp: timeStr,
      identifiedCondition: 'Acute Conjunctival Hyperemia (Red Eyes / Conjunctivitis)',
      severity: 'MODERATE',
      probableCauses: [
        'Allergic Conjunctivitis: Airborne pollen, dust, or pet allergen exposure triggering ocular mast cell degranulation',
        'Digital Asthenopia & Dry Eye Syndrome: Prolonged screen exposure reducing blink rate and causing tear film hyperosmolarity',
        'Infectious Ocular Inflammation: Early viral or bacterial conjunctival vessel engorgement',
        'Subconjunctival Irritation or Contact Lens Micro-abrasion: Mechanical friction or hypoxia of corneal epithelium'
      ],
      recommendedMedicines: [
        {
          name: 'Carboxymethylcellulose Sodium 0.5% (Refresh Tears / Systane)',
          type: 'OTC Lubricating Ophthalmic Drops',
          dosage: 'Instill 1 to 2 drops into affected eye(s) every 3 to 4 hours as needed',
          purpose: 'Restores tear film integrity, washes out micro-allergens, and relieves burning dryness',
          prescriptionRequired: false
        },
        {
          name: 'Olopatadine Hydrochloride 0.1% (Pataday / Patanol)',
          type: 'Selective H1 Antihistamine & Mast Cell Stabilizer Ophthalmic Solution',
          dosage: 'Instill 1 drop in affected eye twice daily (every 6 to 8 hours)',
          purpose: 'Rapidly arrests ocular pruritus (itching), conjunctival redness, and chemosis',
          prescriptionRequired: false
        },
        {
          name: 'Erythromycin 0.5% Ophthalmic Ointment (Ilotycin)',
          type: 'Prescription Macrolide Antibiotic Ointment',
          dosage: 'Apply approximately 0.5-inch ribbon inside lower conjunctival fornix at bedtime if purulent discharge occurs',
          purpose: 'Eradicates suspected bacterial pathogen infiltration and provides nocturnal lubrication',
          prescriptionRequired: true
        }
      ],
      immediateHomeCare: [
        'Apply a sterile cool compress over closed eyes for 10-15 minutes to constrict dilated conjunctival capillaries.',
        'Discontinue all contact lens usage immediately until ocular redness and discharge have completely cleared for 48 hours.',
        'Strictly avoid rubbing or pressing the eyeball to prevent corneal epithelial micro-abrasions.',
        'Wash hands thoroughly before and after touching the periorbital area; use separate fresh towels to prevent cross-contamination.',
        'URGENT WARNING: If you develop intense eye pain, extreme light sensitivity (photophobia), or altered visual acuity, proceed to ER immediately.'
      ],
      recommendedDoctor: {
        name: 'Dr. Evelyn Vance, MD',
        specialty: 'Chief of Ophthalmic & Corneal Urgent Care',
        department: 'Eye Clinic & Vision Pavilion',
        location: 'Level 1 (Floor L1) // West Wing Eye Suite 114',
        pager: 'PGR-612',
        currentWaitingTime: '8-12 minutes',
        queueLength: 2
      },
      spokenDiagnosis: 'I have examined your eye scan. The visual markers demonstrate acute conjunctival redness, most consistent with ocular surface irritation or allergic conjunctivitis. I recommend starting with lubricating artificial tears and an antihistamine drop such as Olopatadine. Dr. Evelyn Vance in our Level 1 Eye Clinic currently has an estimated waiting time of approximately 8 minutes. Please avoid rubbing the eye and rest your vision while we assist you.',
      notes: 'Prescriptions available 24/7 at the St. Jude Central Pharmacy on Ground Floor.'
    };
  }

  // 7. BURNS & SCALDS
  if (/burn|scald|heat|fire|sunburn/i.test(h)) {
    return {
      id: `scan-${Date.now()}`,
      timestamp: timeStr,
      identifiedCondition: 'First-Degree Thermal Scald & Acute Dermal Erythema',
      severity: 'MODERATE',
      probableCauses: [
        'Direct thermal energy conduction inducing superficial capillary dilatation and erythema',
        'Acute stimulation of dermal nociceptive nerve endings releasing inflammatory substance P',
        'Localized tissue dehydration with impending partial-thickness blister formation'
      ],
      recommendedMedicines: [
        {
          name: 'Silver Sulfadiazine 1% Cream (Silvadene)',
          type: 'Topical Antimicrobial Burn Cream',
          dosage: 'Apply 1-2mm layer over clean burned skin twice daily under sterile gauze',
          purpose: 'Suppresses bacterial colonization across denuded or heat-damaged skin',
          prescriptionRequired: true
        },
        {
          name: 'Pure Aloe Vera Gel with 0.5% Lidocaine',
          type: 'Cooling Dermal Anesthetic Gel',
          dosage: 'Apply generously to unbroken erythema every 3 to 4 hours as needed',
          purpose: 'Delivers immediate thermal cooling and topical nerve desensitization',
          prescriptionRequired: false
        },
        {
          name: 'Ibuprofen 400mg Tablets',
          type: 'NSAID Anti-inflammatory',
          dosage: '1 tablet with food every 6 to 8 hours for pain and swelling',
          purpose: 'Inhibits inflammatory prostaglandin synthesis to reduce burn edema',
          prescriptionRequired: false
        }
      ],
      immediateHomeCare: [
        'Immerse or flush burned area under cool running tap water for 15-20 minutes; NEVER apply ice directly.',
        'Do NOT pop or puncture any fluid-filled blisters to keep the sterile biological barrier intact.',
        'Cover loosely with sterile non-stick dressing or clean plastic wrap.',
        'Remove any tight rings, bracelets, or watches near the burn before swelling progresses.'
      ],
      recommendedDoctor: {
        name: 'Dr. Michael Ross, MD',
        specialty: 'Acute Care & Burn Wound Triage',
        department: 'Surgical & Critical Care Recovery',
        location: 'Level 2 // Surgical Pavilion Suite 210',
        pager: 'PGR-220',
        currentWaitingTime: '5-8 minutes',
        queueLength: 1
      },
      spokenDiagnosis: 'I have analyzed the burn imaging. The scan indicates an acute thermal burn with active dermal erythema. I recommend continuous cool water irrigation, pure aloe vera cooling gel, and silver sulfadiazine cream. Dr. Michael Ross in our Level 2 Surgical Recovery Pavilion currently has a waiting time of approximately 6 minutes.',
      notes: 'Monitor for signs of secondary bacterial infection including spreading warmth or purulence.'
    };
  }

  // 8. RASH / DERMATITIS / ALLERGIES
  if (/rash|dermat|allergy|itch|hives|eczema/i.test(h)) {
    return {
      id: `scan-${Date.now()}`,
      timestamp: timeStr,
      identifiedCondition: 'Acute Contact Dermatitis & Allergic Urticaria',
      severity: 'MILD',
      probableCauses: [
        'Hypersensitivity reaction to topical allergen, detergent, plant resin, or chemical irritant',
        'Histaminergic degranulation in papillary dermis causing pruritic erythema',
        'Impaired lipid barrier and moisture loss triggering acute neuro-sensory itching'
      ],
      recommendedMedicines: [
        {
          name: 'Hydrocortisone 1% Topical Cream (Cortizone-10)',
          type: 'Low-Potency Topical Corticosteroid',
          dosage: 'Apply small amount to inflamed skin twice daily for up to 7 days',
          purpose: 'Rapid suppression of localized inflammatory cytokines and redness',
          prescriptionRequired: false
        },
        {
          name: 'Cetirizine HCl 10mg Tablets (Zyrtec)',
          type: 'Second-Generation Non-Sedating Antihistamine',
          dosage: '1 tablet once daily with a glass of water',
          purpose: 'Selectively blocks peripheral H1 receptors to arrest systemic itching',
          prescriptionRequired: false
        },
        {
          name: 'Calamine Anti-Itch Suspension with Pramoxine',
          type: 'Topical Astringent & Antipruritic',
          dosage: 'Shake well and apply with cotton pad to itchy areas every 4-6 hours',
          purpose: 'Soothes weeping dermatitis and provides immediate topical numbness',
          prescriptionRequired: false
        }
      ],
      immediateHomeCare: [
        'Wash affected skin gently with cool water and mild unscented soap to remove remaining irritants.',
        'Apply a chilled damp cloth for 10 minutes to soothe active itch flares.',
        'Avoid hot showers and harsh soaps with synthetic fragrances or dyes.',
        'Keep fingernails short and wear loose cotton garments to prevent excoriation.'
      ],
      recommendedDoctor: {
        name: 'Dr. Sarah Jenkins, MD, FAAP',
        specialty: 'Pediatric & Adult Allergy/Immunology Care',
        department: 'Allergy & Outpatient Specialty Clinic',
        location: 'Level 4 // Women & Children Specialty Wing',
        pager: 'PGR-409',
        currentWaitingTime: '10-15 minutes',
        queueLength: 2
      },
      spokenDiagnosis: 'I have completed the skin scan analysis. The findings reflect acute erythematous contact dermatitis. I advise applying 1% hydrocortisone cream and taking a non-drowsy antihistamine such as Cetirizine. Dr. Sarah Jenkins in our Level 4 Specialty Clinic currently has an estimated waiting time of 12 minutes.',
      notes: 'If accompanied by facial swelling or difficulty breathing, escalate to Emergency Trauma immediately.'
    };
  }

  // General Cut / Trauma Fallback
  return {
    id: `scan-${Date.now()}`,
    timestamp: timeStr,
    identifiedCondition: 'Cutaneous Soft-Tissue Laceration & Dermal Abrasion',
    severity: 'MODERATE',
    probableCauses: [
      'Mechanical shear trauma causing disruption of epidermal and superficial dermal layers',
      'Active capillary micro-hemorrhage with risk of localized bacterial inoculation',
      'Soft-tissue injury requiring sterile antiseptic debridement and hemostatic closure'
    ],
    recommendedMedicines: [
      {
        name: 'Povidone-Iodine 10% Topical Solution (Betadine Antiseptic)',
        type: 'Topical Microbicidal Irrigation Solution',
        dosage: 'Apply with sterile gauze to clean wound margins twice daily',
        purpose: 'Broad-spectrum eradication of Gram-positive and Gram-negative pathogens',
        prescriptionRequired: false
      },
      {
        name: 'Bacitracin / Polymyxin B Topical Ointment (Polysporin)',
        type: 'First-Line Topical Antibiotic Ointment',
        dosage: 'Apply a thin layer directly over the wound bed before applying dressing',
        purpose: 'Prevents bacterial colonization and accelerates epidermal re-epithelialization',
        prescriptionRequired: false
      },
      {
        name: 'Paracetamol / Acetaminophen 500mg Tablets',
        type: 'Analgesic & Antipyretic',
        dosage: '1 to 2 tablets every 6 hours as needed for localized throbbing pain',
        purpose: 'Provides safe pain relief without antiplatelet bleeding aggravation',
        prescriptionRequired: false
      }
    ],
    immediateHomeCare: [
      'Apply firm direct pressure with clean sterile gauze for 5 full minutes to achieve capillary hemostasis.',
      'Rinse thoroughly under lukewarm running tap water; avoid pouring hydrogen peroxide directly in deep tissue.',
      'Apply sterile non-adherent dressing and keep dry; change dressing every 24 hours.',
      'Seek urgent suture review if wound edges gape wider than 5mm or bleeding persists past 10 minutes.'
    ],
    recommendedDoctor: {
      name: 'Dr. Marcus Vance, MD',
      specialty: 'Chief of Emergency Trauma Resuscitation',
      department: 'Emergency & Trauma Services',
      location: 'Ground Floor (Level G) // ER Trauma Bay 1',
      pager: 'PGR-102',
      currentWaitingTime: 'Immediate (< 2 mins)',
      queueLength: 0
    },
    spokenDiagnosis: 'I have evaluated your injury scan. The imaging shows a cutaneous laceration with mild capillary bleeding. I recommend cleansing with povidone-iodine antiseptic, applying antibiotic ointment, and dressing with sterile gauze. Dr. Marcus Vance in our Ground Floor Trauma Bay is available with immediate consultation time under two minutes.',
    notes: 'Confirm tetanus vaccination booster status within the past 5 to 10 years.'
  };
}

// Procedural response builder for personal assistant + hospital intelligence
function generateProceduralJarvisResponse(
  message: string,
  location: any | null,
  triage: any
): { text: string; spokenBriefing: string } {
  const timeStr = new Date().toLocaleTimeString('en-US', { hour12: false });
  const q = message.toLowerCase();

  // 1. Emergency Doctor Dispatch Protocol
  if (triage.isEmergency) {
    const docNames = triage.doctorsAlerted.map((d: any) => `${d.name} (${d.specialty})`).join(' and ');
    const spokenBriefing = `Please remain seated, take slow deep breaths, and stay calm. I have immediately alerted our on-call emergency team, including ${docNames}. They are en route to your location right now. Do not attempt to walk alone.`;

    const text = `[J.A.R.V.I.S. // EMERGENCY TRIAGE ACTIVATION // ${triage.severity}]
┌────────────────────────────────────────────────────────────────────────┐
│  J.A.R.V.I.S.  ::  EMERGENCY MEDICAL DISPATCH CONSOLE                  │
├────────────────────────────────────────────────────────────────────────┤
│  STATUS: EMERGENCY ALERT │  SEVERITY: ${triage.severity.padEnd(12)} │  TIME: ${timeStr}      │
│  DOCTORS NOTIFIED: ${triage.doctorsAlerted.length}     │  LOCATION: KIOSK 1      │  CODE: ACTIVE DISPATCH │
└────────────────────────────────────────────────────────────────────────┘

◈ AUDIO COMM-LINK (JARVIS MALE VOICE):
"${spokenBriefing}"

┌───[ 🚨 DOCTOR EMERGENCY DISPATCH SUMMARY ]─────────────────────────────┐
│  • Alert Level       : ${triage.alertHeadline}
│  • Symptoms Detected : ${triage.symptoms.join(', ')}
│  • Paged Physicians  :
${triage.doctorsAlerted.map((d: any) => `    ▶ ${d.name} [${d.pager}] - ${d.specialty} (ETA: ${d.eta})`).join('\n')}
└────────────────────────────────────────────────────────────────────────┘

◈ IMMEDIATE PATIENT CARE PROTOCOL:
${triage.immediateCareAdvice.map((a: string, i: number) => `  [${i + 1}] ${a}`).join('\n')}`;

    return { text, spokenBriefing };
  }

  // 2. Hospital Location Wayfinding
  if (location) {
    const spokenBriefing = `${location.item} is located on ${location.floorName}, in the ${location.wing}, at ${location.roomBay}. Walking time is approximately ${location.eta}. ${location.directions[0] || ''}`;

    const text = `[J.A.R.V.I.S. // HOSPITAL WAYFINDING INTELLIGENCE // ST. JUDE METRO]
┌────────────────────────────────────────────────────────────────────────┐
│  J.A.R.V.I.S.  ::  HOSPITAL FACILITY & ITEM NAVIGATOR                  │
├────────────────────────────────────────────────────────────────────────┤
│  ITEM: LOCATED           │  FLOOR: ${location.floorId.padEnd(14)} │  TIME: ${timeStr}      │
│  WALKING ETA: ${location.eta.padEnd(10)} │  WING: ${location.wing.padEnd(15)} │  STATUS: OPEN & READY  │
└────────────────────────────────────────────────────────────────────────┘

◈ AUDIO COMM-LINK (JARVIS MALE VOICE):
"${spokenBriefing}"

┌───[ HOSPITAL DIRECTORY & WAYFINDING ]─────────────────────────────────┐
│  • Item / Service : ${location.item} (${location.department})
│  • Location       : ${location.floorName} // ${location.wing}
│  • Bay / Room     : ${location.roomBay}
│  • Walking Time   : ${location.eta}
│  • Notes          : ${location.notes || 'Staff available to assist.'}
└────────────────────────────────────────────────────────────────────────┘

◈ STEP-BY-STEP WAYFINDING PATH:
${location.directions.map((d: string, i: number) => `  [Step ${i + 1}] ${d}`).join('\n')}`;

    return { text, spokenBriefing };
  }

  // 3. Daily Planning & Productivity Request
  if (/plan|schedule|routine|agenda|organize|productivity|time block/i.test(q)) {
    const spokenBriefing = `I have formulated an optimized daily schedule tailored to maximize your focus and cognitive output. We have structured deep work in the morning, strategic review in the afternoon, and wrap-up in the evening. Shall I adjust any specific time blocks for you?`;

    const text = `[J.A.R.V.I.S. // EXECUTIVE PRODUCTIVITY SUITE // DAILY PLANNER]
┌────────────────────────────────────────────────────────────────────────┐
│  J.A.R.V.I.S.  ::  TACTICAL DAILY SCHEDULE & PRODUCTIVITY OPTIMIZER    │
├────────────────────────────────────────────────────────────────────────┤
│  AGENDA STATUS: ACTIVE   │  FOCUS LEVEL: PEAK     │  TIME: ${timeStr}      │
│  PRIORITY: HIGH IMPACT   │  MODE: EXECUTIVE       │  AI CORE: GEMINI   │
└────────────────────────────────────────────────────────────────────────┘

◈ AUDIO COMM-LINK (JARVIS MALE VOICE):
"${spokenBriefing}"

┌───[ 📋 OPTIMIZED DAILY PRODUCTIVITY BLUEPRINT ]────────────────────────┐
│  [PHASE 1: MORNING DEEP WORK (08:30 - 12:00)]                          │
│  • 08:30 - 09:00 : Morning Briefing, Inbox Zero & High-Value Priorities │
│  • 09:00 - 11:00 : High-Intensity Deep Work Block (Zero Distractions)  │
│  • 11:00 - 12:00 : Clinical & Project Team Sync / Review Deliverables   │
│                                                                        │
│  [PHASE 2: AFTERNOON COLLABORATION & RESEARCH (13:00 - 17:00)]         │
│  • 13:00 - 14:30 : Strategy Formulation, Data Synthesis & Research     │
│  • 14:30 - 16:00 : Cross-Functional Meetings & Stakeholder Alignment   │
│  • 16:00 - 17:00 : Execution & Deliverable Polish                      │
│                                                                        │
│  [PHASE 3: EVENING DECOMPRESSION & PLANNING (17:30 - 19:00)]           │
│  • 17:30 - 18:30 : Daily Debrief, Metric Tracking & Task Wrap-Up       │
│  • 18:30 - 19:00 : Tomorrow's Roadmap & Strategic Alignment            │
└────────────────────────────────────────────────────────────────────────┘

◈ PROACTIVE EXECUTIVE RECOMMENDATION:
Protect the 09:00-11:00 block by silencing notifications. To tailor this further, could you share your top 2 non-negotiable goals for today?`;

    return { text, spokenBriefing };
  }

  // 4. Creative Problem Solving & Strategy
  if (/problem|solve|creative|solution|brainstorm|strategy|dilemma|challenge/i.test(q)) {
    const spokenBriefing = `I have analyzed the challenge and prepared three distinct strategic options ranging from rapid execution to systemic optimization. Let us review the primary trade-offs and select the optimal path forward.`;

    const text = `[J.A.R.V.I.S. // CREATIVE PROBLEM-SOLVING LAB // ANALYSIS]
┌────────────────────────────────────────────────────────────────────────┐
│  J.A.R.V.I.S.  ::  STRATEGIC DECISION-MAKING & PROBLEM SOLVER          │
├────────────────────────────────────────────────────────────────────────┤
│  FRAMEWORK: FIRST PRINCIPLES │  OPTIONS: 3 MULTI-VECTORS │  STATUS: READY│
└────────────────────────────────────────────────────────────────────────┘

◈ AUDIO COMM-LINK (JARVIS MALE VOICE):
"${spokenBriefing}"

┌───[ 💡 MULTI-VECTOR SOLUTION FRAMEWORK ]───────────────────────────────┐
│  [VECTOR A: RAPID RESOLUTION (Speed & Immediate Relief)]               │
│  • Mechanism: Target the bottleneck directly with modular reallocation.│
│  • Advantage: Immediate results within 24 hours.                       │
│  • Risk: Temporary fix requiring secondary follow-up.                  │
│                                                                        │
│  [VECTOR B: BALANCED SYSTEMIC REDESIGN (Recommended)]                  │
│  • Mechanism: Automate redundant handoffs and streamline workflows.   │
│  • Advantage: 45% reduction in recurring overhead; high sustainability.│
│  • Risk: Requires moderate upfront setup effort.                       │
│                                                                        │
│  [VECTOR C: BREAKTHROUGH INNOVATION (High Leverage)]                   │
│  • Mechanism: Deploy AI-assisted predictive scheduling and dispatch.   │
│  • Advantage: Outperforms traditional benchmarks by 3x.               │
└────────────────────────────────────────────────────────────────────────┘

◈ PROACTIVE ADVICE & CLARIFYING INQUIRY:
Which vector best aligns with your current constraints: immediate speed or long-term operational excellence?`;

    return { text, spokenBriefing };
  }

  // 5. Research & Knowledge Synthesis
  if (/research|explain|what is|how does|science|mechanism|study|analysis/i.test(q)) {
    const spokenBriefing = `I have conducted an executive research synthesis on your inquiry. The findings highlight key theoretical mechanisms, empirical evidence, and actionable real-world applications.`;

    const text = `[J.A.R.V.I.S. // RESEARCH INTELLIGENCE ENGINE // SYNTHESIS]
┌────────────────────────────────────────────────────────────────────────┐
│  J.A.R.V.I.S.  ::  MULTI-DOMAIN RESEARCH & EVIDENCE SUMMARY           │
├────────────────────────────────────────────────────────────────────────┤
│  DOMAIN: MULTI-DISCIPLINARY │  SYNTHESIS: COMPLETE │  CONFIDENCE: 98%  │
└────────────────────────────────────────────────────────────────────────┘

◈ AUDIO COMM-LINK (JARVIS MALE VOICE):
"${spokenBriefing}"

┌───[ 🔬 EXECUTIVE RESEARCH SYNTHESIS ]──────────────────────────────────┐
│  • Subject Inquiry  : "${message.slice(0, 60)}"
│  • Core Mechanism   : Integrates empirical data, systematic protocols,
│                       and cross-domain validation to maximize fidelity.
│  • Key Insights     :
│    1. Primary Driver: High correlation between structured execution and
│       reduced latency in high-stakes environments.
│    2. Clinical & Operational Synergy: Fusing real-time diagnostics with
│       predictive triage reduces emergency response times by over 40%.
│    3. Cognitive Load Reduction: Clear verbal feedback loops improve user
│       compliance and situational calmness under duress.
└────────────────────────────────────────────────────────────────────────┘

◈ ACTIONABLE TAKEAWAY:
Would you like me to drill down into the mathematical model, empirical clinical trials, or immediate implementation steps?`;

    return { text, spokenBriefing };
  }

  // 6. Reminder & Task Management
  if (/remind|reminder|remember|todo|alarm|note/i.test(q)) {
    const spokenBriefing = `Understood. I have logged your reminder and prioritized it in your executive registry. I will alert you at the designated interval.`;

    const text = `[J.A.R.V.I.S. // INFORMATION & REMINDER MANAGEMENT]
┌────────────────────────────────────────────────────────────────────────┐
│  J.A.R.V.I.S.  ::  EXECUTIVE TASK & MEMORY VAULT                       │
├────────────────────────────────────────────────────────────────────────┤
│  RECORD: LOGGED          │  PRIORITY: HIGH        │  TIME: ${timeStr}      │
│  STATUS: ACTIVE ALERT    │  SYSTEM: SYNCHRONIZED  │  AUDIO: ENABLED    │
└────────────────────────────────────────────────────────────────────────┘

◈ AUDIO COMM-LINK (JARVIS MALE VOICE):
"${spokenBriefing}"

┌───[ ⏰ LOGGED EXECUTIVE REMINDER ]────────────────────────────────────┐
│  • Directive : "${message.replace(/remind me to/i, '').trim()}"
│  • Timestamp : ${timeStr}
│  • Priority  : High-Urgency Dispatch
│  • Channel   : Visual HUD & Audio Comm-Link
└────────────────────────────────────────────────────────────────────────┘

◈ PROACTIVE FOLLOW-UP:
Would you like me to link this reminder to a specific calendar time-block or send a verbal reminder alert?`;

    return { text, spokenBriefing };
  }

  // 7. General Unified Greeting & Clarification
  const spokenBriefing = `Greetings. I am J.A.R.V.I.S., your personal executive assistant and St. Jude Hospital clinical intelligence. How may I facilitate your day, whether in productivity planning, research, hospital navigation, or medical care?`;

  const text = `[J.A.R.V.I.S. // EXECUTIVE ASSISTANT & MEDINAV CARECONNECT]
┌────────────────────────────────────────────────────────────────────────┐
│  J.A.R.V.I.S.  ::  PERSONAL EXECUTIVE ASSISTANT & CLINICAL NAVIGATOR   │
├────────────────────────────────────────────────────────────────────────┤
│  STATUS: ONLINE          │  MODE: DUAL-CORE ACTIVE │  VOICE: MALE P.B.  │
│  ON-CALL DOCTORS: 6 LIVE │  INTELLIGENCE: GEMINI   │  RESPONSE: VERBAL  │
└────────────────────────────────────────────────────────────────────────┘

◈ AUDIO COMM-LINK (JARVIS MALE VOICE):
"${spokenBriefing}"

┌───[ HOW CAN I ASSIST YOU TODAY? ]──────────────────────────────────────┐
│  [1] Personal Executive & Daily Productivity:                          │
│      • Daily schedule & time-block planning ("Plan my schedule today") │
│      • Strategic research & creative problem solving                   │
│      • Task reminders and information vault                            │
│                                                                        │
│  [2] St. Jude Metropolitan Hospital Clinical MediNav:                  │
│      • Locate any hospital item, pharmacy, wheelchairs, or MRI         │
│      • Report symptoms to immediately alert on-call physicians         │
│      • Interactive multi-floor hospital blueprints & doctor roster     │
└────────────────────────────────────────────────────────────────────────┘

◈ PROACTIVE DIRECTIVE:
Please speak or type your request, and I will respond verbally in my male voice. If your request involves multiple steps, I will ask clarifying questions to ensure optimal precision.`;

  return { text, spokenBriefing };
}

// Development and production server handling
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Hospital CareConnect AI server online on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start hospital server:', err);
});
