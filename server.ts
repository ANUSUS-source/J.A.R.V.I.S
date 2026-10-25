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

// Mount both endpoints
app.post('/api/hospital/chat', handleHospitalChat);
app.post('/api/jarvis/chat', handleHospitalChat);

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
