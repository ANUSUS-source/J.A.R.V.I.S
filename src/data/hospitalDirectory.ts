import { HospitalLocation, DoctorProfile, HospitalFloor } from '../types/hospital';

export const HOSPITAL_FLOORS: HospitalFloor[] = [
  {
    id: 'B1',
    levelNumber: 'Level B1',
    name: 'Diagnostic Imaging & Laboratories',
    description: 'High-field MRI, Multi-slice CT, Digital X-Ray, Nuclear Medicine, Pathology and Central Sterile Supply.',
    accentColor: 'indigo',
    wings: [
      { name: 'Imaging Wing A', services: ['MRI Suites 1 & 2', 'CT Scan Bay 3', 'Digital Radiography'] },
      { name: 'Pathology Wing B', services: ['Central Clinical Lab', 'Blood Bank Storage', 'Histology'] },
      { name: 'Supply Wing C', services: ['Biomedical Equipment Depot', 'Central Sterile Supply (CSSD)'] },
    ],
    keyItems: ['MRI Scan', 'CT Scan', 'X-Ray', 'Ultrasound', 'Blood Bank', 'Specimen Drop-off'],
  },
  {
    id: 'G',
    levelNumber: 'Ground Floor',
    name: 'Emergency Department & Main Atrium',
    description: 'Level 1 Trauma Center, Rapid Triage, Ambulance Bay, Mobility Services, Main Pharmacy, Registration.',
    accentColor: 'emerald',
    wings: [
      { name: 'Emergency Trauma Wing', services: ['ER Resuscitation Bays 1-4', 'Rapid Triage Station', 'Decontamination Suite'] },
      { name: 'Central Atrium', services: ['Main Reception & Admitting', 'Wheelchair Mobility Hub', 'Patient Advocates'] },
      { name: 'Outpatient Services', services: ['Ground Pharmacy (24/7)', 'Emergency Radiology', 'Family Waiting Lounge'] },
    ],
    keyItems: ['Wheelchairs', 'Emergency Care (ER)', '24/7 Pharmacy', 'Information Desk', 'Admitting & Billing', 'Restrooms', 'ATM & Cafeteria Express'],
  },
  {
    id: 'L1',
    levelNumber: 'Level 1',
    name: 'Outpatient Specialty Clinics & Day Surgery',
    description: 'Cardiovascular Institute, Neurosciences, Orthopedics, Endoscopy, Phlebotomy Collection Center.',
    accentColor: 'cyan',
    wings: [
      { name: 'Heart & Vascular Wing', services: ['Cardiology Consult Suites', 'Echocardiogram Labs', 'Pacemaker Clinic'] },
      { name: 'Neuro & Ortho Wing', services: ['Neurology Consult Rooms', 'Orthopedic Cast Clinic', 'Physical Therapy Bay'] },
      { name: 'Diagnostic Suites', services: ['Phlebotomy Blood Draw', 'Pulmonary Function Lab', 'Outpatient Pharmacy'] },
    ],
    keyItems: ['Cardiology / ECG', 'Neurology Clinic', 'Orthopedic / Casts', 'Blood Draw / Phlebotomy', 'Crutches & Walkers', 'Prescription Counter'],
  },
  {
    id: 'L2',
    levelNumber: 'Level 2',
    name: 'Surgical Suites & Intensive Care Units',
    description: 'Operating Rooms 1-12, Post-Anesthesia Care Unit (PACU), Medical/Surgical ICU, Garden View Dining Pavilion.',
    accentColor: 'amber',
    wings: [
      { name: 'Surgical Pavilion', services: ['Main Operating Suites 1-12', 'Robotic Surgery Theater', 'Surgical Pre-Op'] },
      { name: 'Critical Care (ICU)', services: ['Medical ICU (MICU)', 'Cardiothoracic ICU (CTICU)', 'Isolation Rooms'] },
      { name: 'Public Amenities', services: ['Garden View Dining Pavilion & Cafeteria', 'Interfaith Meditation Chapel'] },
    ],
    keyItems: ['Main Cafeteria & Coffee', 'ICU / Intensive Care', 'Surgery Waiting Area', 'Chapel & Quiet Room', 'Vending & Water Stations'],
  },
  {
    id: 'L3',
    levelNumber: 'Level 3',
    name: 'Inpatient Medical & Specialty Care Wards',
    description: 'General Medicine Inpatient Units 301-348, Oncology & Infusion Center, Renal Dialysis Suite.',
    accentColor: 'blue',
    wings: [
      { name: 'East Medical Ward', services: ['Rooms 301-324', 'Nursing Station 3E', 'Physician Workroom'] },
      { name: 'West Specialty Ward', services: ['Oncology Infusion Bay', 'Hemodialysis Center', 'Rehabilitation Gym'] },
    ],
    keyItems: ['Patient Rooms 301-348', 'Dialysis Center', 'Oncology Suite', 'Nurse Station 3', 'Family Consultation Lounge'],
  },
  {
    id: 'L4',
    levelNumber: 'Level 4',
    name: 'Women & Children Pavilion',
    description: 'Labor & Delivery Suites, Neonatal Intensive Care Unit (NICU), Pediatric Inpatient Ward & Play Area.',
    accentColor: 'purple',
    wings: [
      { name: 'Maternity Wing', services: ['Labor & Delivery Suites 401-412', 'Maternal Triage', 'Obstetrics Ultrasound'] },
      { name: 'Pediatric Wing', services: ['Pediatric Inpatient Rooms', 'Pediatric Emergency Fast-Track', 'NICU Level III'] },
    ],
    keyItems: ['Maternity / Labor & Delivery', 'Pediatric Clinic', 'Neonatal ICU (NICU)', 'Lactation Rooms', 'Childrens Play Sanctuary'],
  },
];

export const ON_CALL_DOCTORS: DoctorProfile[] = [
  {
    id: 'doc-vance',
    name: 'Dr. Marcus Vance, MD',
    title: 'Chief of Emergency Medicine & Trauma',
    department: 'Emergency & Trauma Services',
    specialty: 'Trauma Resuscitation & Critical Care',
    pager: 'PGR-102',
    room: 'ER Trauma Bay 1',
    status: 'AVAILABLE',
    etaMinutes: '1 min',
    avatarColor: 'red',
  },
  {
    id: 'doc-chen',
    name: 'Dr. Elena Chen, MD, FACC',
    title: 'Director of Acute Cardiology',
    department: 'Heart & Vascular Institute',
    specialty: 'Interventional Cardiology & ECG Triage',
    pager: 'PGR-804',
    room: 'Cardiac Suite 120 / Level 1',
    status: 'AVAILABLE',
    etaMinutes: '2 mins',
    avatarColor: 'rose',
  },
  {
    id: 'doc-patel',
    name: 'Dr. Priya Patel, MD, PhD',
    title: 'Attending Neuro-Intensivist',
    department: 'Comprehensive Stroke Center',
    specialty: 'Acute Stroke & Neurology Triage',
    pager: 'PGR-315',
    room: 'Neuro Center Suite 115',
    status: 'AVAILABLE',
    etaMinutes: '2 mins',
    avatarColor: 'purple',
  },
  {
    id: 'doc-ross',
    name: 'Dr. Michael Ross, MD',
    title: 'Lead Hospitalist & Rapid Response',
    department: 'Internal Medicine',
    specialty: 'Acute Diagnostics & Infectious Disease',
    pager: 'PGR-220',
    room: 'Inpatient Medicine Level 3',
    status: 'AVAILABLE',
    etaMinutes: '3 mins',
    avatarColor: 'blue',
  },
  {
    id: 'doc-jenkins',
    name: 'Dr. Sarah Jenkins, MD, FAAP',
    title: 'Pediatric Emergency Specialist',
    department: 'Children’s Health Pavilion',
    specialty: 'Pediatric Urgent Care & Resuscitation',
    pager: 'PGR-409',
    room: 'Pediatric Bay Level 4',
    status: 'AVAILABLE',
    etaMinutes: '2 mins',
    avatarColor: 'teal',
  },
  {
    id: 'doc-miller',
    name: 'Dr. David Miller, MD',
    title: 'Orthopedic Trauma Surgeon',
    department: 'Orthopedic Surgery',
    specialty: 'Complex Fractures & Joint Stabilization',
    pager: 'PGR-512',
    room: 'Bone & Joint Clinic Suite 140',
    status: 'AVAILABLE',
    etaMinutes: '3 mins',
    avatarColor: 'amber',
  },
];

// Pre-defined database for instant hospital item & service lookups
export const KNOWN_HOSPITAL_LOCATIONS: Record<string, HospitalLocation> = {
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
      'Enter through the Main Automatic Revolving Doors into the Atrium.',
      'Look directly to your left past the Information Desk.',
      'Mobility Station Bay B-2 has standard and wide wheelchairs available free of charge. Staff can also push if requested.'
    ],
    notes: 'Attendant on duty 24/7. motorized escorts available upon request.',
    iconName: 'wheelchair',
  },
  pharmacy: {
    item: 'Central Hospital Pharmacy',
    category: 'MEDICINE',
    department: 'Pharmacy Services (24/7 Dispensing)',
    floorId: 'G',
    floorName: 'Ground Floor',
    wing: 'West Concourse',
    roomBay: 'Pharmacy Counters 1 to 6 (Near Outpatient Exit)',
    eta: '2 min walk',
    directions: [
      'From the Main Lobby, follow the illuminated Green Cross signs along the West Concourse.',
      'Walk 40 paces straight past the Gift Shop.',
      'Central Pharmacy is on your right at Counter 3 for prescription pickup, Counter 1 for OTC painkillers & first-aid.'
    ],
    notes: 'Open 24 hours. Accepts all major prescription insurances and OTC purchases.',
    iconName: 'pill',
  },
  painkillers: {
    item: 'Pain Relief & Over-The-Counter Medicine',
    category: 'MEDICINE',
    department: 'Central Hospital Pharmacy',
    floorId: 'G',
    floorName: 'Ground Floor',
    wing: 'West Concourse',
    roomBay: 'Counter 1 (OTC Medication & First-Aid)',
    eta: '2 min walk',
    directions: [
      'Head to Ground Floor Central Pharmacy (follow Green Cross signs along West Concourse).',
      'Approach Counter 1 marked "Express OTC Dispensary".',
      'Pharmacist can dispense Paracetamol, Ibuprofen, Aspirin, Antacids, and Ice packs immediately.'
    ],
    notes: 'If experiencing severe, sudden, or crushing chest pain, please inform staff immediately for triage.',
    iconName: 'pill',
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
      'Take Elevator Bank A (Glass elevators behind the Main Atrium) down to Level B1.',
      'Turn right exiting the elevator and follow the Yellow Floor Line marked "Radiology / Imaging".',
      'Check in at the Imaging Reception Desk right outside MRI Suite B-104.'
    ],
    notes: 'Please remove all metal objects, watches, and cards before entering the magnetic zone.',
    iconName: 'scan',
  },
  ct: {
    item: 'CT Scan (Computed Tomography)',
    category: 'DIAGNOSTIC',
    department: 'Diagnostic Imaging & Radiology',
    floorId: 'B1',
    floorName: 'Level B1 (Basement)',
    wing: 'Imaging Wing A',
    roomBay: 'CT Scanner Suite B-108',
    eta: '3 min walk (via Elevator Bank A)',
    directions: [
      'Take Elevator Bank A down to Level B1.',
      'Follow the Yellow Line marked "Radiology / Imaging" for 30 meters.',
      'CT Scan Suite B-108 is directly opposite the Imaging Prep Lounge.'
    ],
    notes: 'Both emergency trauma CT and outpatient scheduled scans operate here 24/7.',
    iconName: 'scan',
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
      'Turn right down Corridor A; X-Ray Bay 1-4 is at Room B-112.',
      'Scan your appointment barcode or present paper requisition to the triage nurse.'
    ],
    notes: 'Walk-in urgent X-rays for chest, limbs, and spine are processed within 15 minutes.',
    iconName: 'scan',
  },
  cafeteria: {
    item: 'Garden View Dining Pavilion & Cafeteria',
    category: 'AMENITY',
    department: 'Hospital Dining & Nutrition Services',
    floorId: 'L2',
    floorName: 'Level 2',
    wing: 'East Wing',
    roomBay: 'Pavilion Hall 200',
    eta: '3 min walk',
    directions: [
      'Take Elevator Bank B or the Main Atrium Central Escalators up to Level 2.',
      'Follow the signage for "Garden Pavilion Dining".',
      'The cafeteria features hot entrees, fresh salads, gourmet coffee bar, kosher/halal/vegan stations, and outdoor terrace seating.'
    ],
    notes: 'Open 06:00 to 22:00 daily. 24/7 automated grab-and-go kiosk available in the annex.',
    iconName: 'coffee',
  },
  water: {
    item: 'Filtered Drinking Water & Hydration Station',
    category: 'AMENITY',
    department: 'Facility Services',
    floorId: 'G',
    floorName: 'Ground Floor & Every Level',
    wing: 'Central & West Wing',
    roomBay: 'Niche beside Elevator Bank A & Restrooms',
    eta: '30 seconds walk',
    directions: [
      'Nearest station is located 15 paces from this terminal, directly beside the elevator lobby.',
      'Touchless sensor dispensing cold, room-temperature, and hot filtered water.',
      'Recyclable cups available in the dispenser slot.'
    ],
    notes: 'Free filtered water stations are located adjacent to every elevator lobby on all 5 floors.',
    iconName: 'droplet',
  },
  restroom: {
    item: 'Accessible Restrooms & Family Care Rooms',
    category: 'AMENITY',
    department: 'Public Amenities',
    floorId: 'G',
    floorName: 'Ground Floor',
    wing: 'Central Atrium & West Hallway',
    roomBay: 'Facilities Niche 12 (Beside Elevator Bank A)',
    eta: '45 seconds walk',
    directions: [
      'Turn left from the central terminal and walk 20 steps down the West Concourse.',
      'Restrooms are clearly indicated on the wall on your left.',
      'Features gender-neutral, ADA wheelchair-accessible stalls, infant changing stations, and emergency nurse call cords.'
    ],
    notes: 'Equipped with emergency pull-strings inside each stall if assistance is required.',
    iconName: 'door',
  },
  blood: {
    item: 'Phlebotomy & Blood Collection Lab',
    category: 'DIAGNOSTIC',
    department: 'Clinical Pathology Services',
    floorId: 'L1',
    floorName: 'Level 1',
    wing: 'Diagnostic Suites Wing',
    roomBay: 'Suite 130 (Specimen Collection & Blood Lab)',
    eta: '2 min walk',
    directions: [
      'Take Escalator or Elevator to Level 1.',
      'Walk straight down the main corridor following the Red Floor Line to Suite 130.',
      'Take a queue number at the kiosk inside Suite 130 for fasting blood tests and lab work.'
    ],
    notes: 'Routine blood draws take under 10 minutes. Results sent directly to your patient portal.',
    iconName: 'droplet',
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
      'Check in at Cardiology Reception Suite 120 for consultations, Holter monitoring, ECG, and stress tests.'
    ],
    notes: 'If you are currently experiencing active chest pressure, do not walk! Press the red SOS button to dispatch Dr. Chen.',
    iconName: 'heart',
  },
  emergency: {
    item: 'Emergency Room (ER) & Trauma Resuscitation',
    category: 'EMERGENCY',
    department: 'Level 1 Trauma Center',
    floorId: 'G',
    floorName: 'Ground Floor',
    wing: 'Emergency Trauma Wing',
    roomBay: 'Triage Desk & Trauma Bays 1-4',
    eta: '1 min walk',
    directions: [
      'Follow the bold Red Line on the floor leading directly to the Emergency Entrance.',
      'Pass through the double automatic sliding glass doors.',
      'The Triage Nurse Station is immediately facing you for rapid medical evaluation.'
    ],
    notes: 'Always staffed 24/7 by trauma surgeons, critical care nurses, and emergency physicians.',
    iconName: 'alert',
  },
  pediatric: {
    item: 'Pediatric Clinic & Children’s Emergency',
    category: 'CLINIC',
    department: 'Children’s Health Pavilion',
    floorId: 'L4',
    floorName: 'Level 4',
    wing: 'Pediatric Wing',
    roomBay: 'Suite 420 & Pediatric Triage',
    eta: '4 min walk (via Elevator Bank B)',
    directions: [
      'Take Elevator Bank B (decorated with colorful balloon decals) up to Level 4.',
      'Exit into the Pediatric Welcome Center.',
      'Child-friendly check-in, pediatric urgent care, and specialized nurses are stationed in Suite 420.'
    ],
    notes: 'Equipped with child-safe examination bays, sensory quiet rooms, and board-certified pediatricians.',
    iconName: 'baby',
  },
  maternity: {
    item: 'Maternity, Labor & Delivery Ward',
    category: 'CLINIC',
    department: 'Obstetrics & Gynecology',
    floorId: 'L4',
    floorName: 'Level 4',
    wing: 'Maternity Wing',
    roomBay: 'Suites 401-412 (Labor & Delivery)',
    eta: '4 min walk',
    directions: [
      'Take Elevator Bank B up to Level 4.',
      'Turn left at the reception desk towards the secured Maternity Wing.',
      'Press the intercom buzzer marked "Labor & Delivery Admission" for immediate admittance.'
    ],
    notes: 'Security access controlled. Spouses and birthing partners receive immediate access badges.',
    iconName: 'heart',
  },
  billing: {
    item: 'Patient Billing, Insurance & Registration',
    category: 'FACILITY',
    department: 'Patient Financial Services',
    floorId: 'G',
    floorName: 'Ground Floor',
    wing: 'Central Atrium',
    roomBay: 'Counters 7 to 14 (Administrative Concourse)',
    eta: '1 min walk',
    directions: [
      'Located in the Main Atrium directly across from the Central Pharmacy.',
      'Take a ticket from the touchscreen kiosk marked "Registration & Billing".',
      'Patient navigators assist with insurance verification, copays, discharge clearances, and financial counseling.'
    ],
    notes: 'Open Monday to Friday 07:00 to 20:00, Saturday/Sunday 08:00 to 17:00.',
    iconName: 'file',
  },
  crutches: {
    item: 'Crutches, Walkers & Orthopedic Braces',
    category: 'EQUIPMENT',
    department: 'Orthopedic Appliance & Mobility Depot',
    floorId: 'L1',
    floorName: 'Level 1',
    wing: 'Neuro & Ortho Wing',
    roomBay: 'Bone & Joint Clinic Suite 140 (Appliance Desk)',
    eta: '2 min walk',
    directions: [
      'Take elevator to Level 1 and turn right into the Orthopedic Wing.',
      'Suite 140 has a dedicated Orthotic & Appliance fitting counter.',
      'Physical therapy staff provide immediate sizing and gait training.'
    ],
    notes: 'Available on prescription or direct discharge loaner program.',
    iconName: 'activity',
  },
  blanket: {
    item: 'Warm Blankets & Patient Comfort Supplies',
    category: 'EQUIPMENT',
    department: 'Hospital Volunteer & Hospitality Desk',
    floorId: 'G',
    floorName: 'Ground Floor',
    wing: 'Central Atrium',
    roomBay: 'Hospitality Station Niche 4 (Adjacent to ER Waiting Lounge)',
    eta: '1 min walk',
    directions: [
      'Walk towards the ER Waiting Area on the Ground Floor.',
      'The Hospitality Station has a heated blanket warming cabinet.',
      'Volunteers or nursing aides will provide clean warm blankets, pillows, and bottled water immediately.'
    ],
    notes: 'Complimentary for all patients, family members, and visitors.',
    iconName: 'heart',
  },
};

// Helper function to resolve hospital queries to location
export function resolveHospitalItem(query: string): HospitalLocation | null {
  const q = query.toLowerCase().trim();

  if (q.includes('wheelchair') || q.includes('chair') || q.includes('walker') || q.includes('stretcher') || q.includes('mobility')) {
    return KNOWN_HOSPITAL_LOCATIONS.wheelchair;
  }
  if (q.includes('pharmacy') || q.includes('prescription') || q.includes('chemist') || q.includes('drug store')) {
    return KNOWN_HOSPITAL_LOCATIONS.pharmacy;
  }
  if (q.includes('painkiller') || q.includes('ibuprofen') || q.includes('paracetamol') || q.includes('tylenol') || q.includes('aspirin') || q.includes('medicine') || q.includes('tablet') || q.includes('pill')) {
    return KNOWN_HOSPITAL_LOCATIONS.painkillers;
  }
  if (q.includes('mri') || q.includes('magnetic')) {
    return KNOWN_HOSPITAL_LOCATIONS.mri;
  }
  if (q.includes('ct') || q.includes('cat scan') || q.includes('computed tomography')) {
    return KNOWN_HOSPITAL_LOCATIONS.ct;
  }
  if (q.includes('x-ray') || q.includes('xray') || q.includes('radiology') || q.includes('scan') || q.includes('ultrasound') || q.includes('imaging')) {
    return KNOWN_HOSPITAL_LOCATIONS.xray;
  }
  if (q.includes('cafeteria') || q.includes('canteen') || q.includes('coffee') || q.includes('food') || q.includes('eat') || q.includes('lunch') || q.includes('dinner') || q.includes('snack')) {
    return KNOWN_HOSPITAL_LOCATIONS.cafeteria;
  }
  if (q.includes('water') || q.includes('drink') || q.includes('thirst') || q.includes('fountain') || q.includes('bottle')) {
    return KNOWN_HOSPITAL_LOCATIONS.water;
  }
  if (q.includes('restroom') || q.includes('toilet') || q.includes('washroom') || q.includes('bathroom') || q.includes('loo') || q.includes('wc')) {
    return KNOWN_HOSPITAL_LOCATIONS.restroom;
  }
  if (q.includes('blood') || q.includes('pathology') || q.includes('lab') || q.includes('specimen') || q.includes('phlebotomy') || q.includes('urine test')) {
    return KNOWN_HOSPITAL_LOCATIONS.blood;
  }
  if (q.includes('cardio') || q.includes('heart') || q.includes('ecg') || q.includes('ekg') || q.includes('cardiovascular')) {
    return KNOWN_HOSPITAL_LOCATIONS.cardiology;
  }
  if (q.includes('emergency') || q.includes('er') || q.includes('trauma') || q.includes('resuscitation') || q.includes('ambulance') || q.includes('casualty')) {
    return KNOWN_HOSPITAL_LOCATIONS.emergency;
  }
  if (q.includes('pediatric') || q.includes('child') || q.includes('kid') || q.includes('baby') || q.includes('infant')) {
    return KNOWN_HOSPITAL_LOCATIONS.pediatric;
  }
  if (q.includes('maternity') || q.includes('pregnant') || q.includes('labor') || q.includes('delivery') || q.includes('birth') || q.includes('obstetric')) {
    return KNOWN_HOSPITAL_LOCATIONS.maternity;
  }
  if (q.includes('billing') || q.includes('insurance') || q.includes('cashier') || q.includes('payment') || q.includes('cost') || q.includes('discharge') || q.includes('admit') || q.includes('registration')) {
    return KNOWN_HOSPITAL_LOCATIONS.billing;
  }
  if (q.includes('crutch') || q.includes('cast') || q.includes('splint') || q.includes('brace') || q.includes('bone') || q.includes('ortho')) {
    return KNOWN_HOSPITAL_LOCATIONS.crutches;
  }
  if (q.includes('blanket') || q.includes('pillow') || q.includes('cold') || q.includes('shivering') || q.includes('warm')) {
    return KNOWN_HOSPITAL_LOCATIONS.blanket;
  }

  return null;
}

// Symptom keywords evaluator to detect when a person is not feeling well
export function evaluateSymptomEmergency(query: string): {
  isEmergency: boolean;
  severity: 'CODE_RED' | 'CODE_AMBER' | 'CODE_YELLOW' | 'NORMAL';
  symptoms: string[];
  matchedSpecialists: DoctorProfile[];
  immediateCareAdvice: string[];
} {
  const q = query.toLowerCase();

  const isSickPhrases = [
    'not feeling well',
    'feel sick',
    'feeling sick',
    'i feel ill',
    'feel unwell',
    'not well',
    'in pain',
    'hurts',
    'hurting',
    'dizzy',
    'dizziness',
    'faint',
    'fainting',
    'passed out',
    'chest pain',
    'chest pressure',
    'chest tightness',
    'heart racing',
    'cannot breathe',
    'hard to breathe',
    'short of breath',
    'breathless',
    'bleeding',
    'blood loss',
    'vomiting',
    'nauseous',
    'nausea',
    'headache',
    'migraine',
    'fever',
    'chills',
    'burning up',
    'stomach pain',
    'abdominal pain',
    'seizure',
    'numbness',
    'weakness',
    'blurry vision',
    'allergic',
    'swollen throat',
    'choking',
    'asthma',
    'injured',
    'broken',
    'fell down',
    'collapsed',
    'help me',
    'need doctor',
    'call doctor',
    'need a doctor',
    'emergency'
  ];

  const matchedPhrase = isSickPhrases.some((phrase) => q.includes(phrase));
  if (!matchedPhrase) {
    return {
      isEmergency: false,
      severity: 'NORMAL',
      symptoms: [],
      matchedSpecialists: [],
      immediateCareAdvice: [],
    };
  }

  // Identify specific symptoms
  const symptoms: string[] = [];
  if (q.includes('chest') || q.includes('heart') || q.includes('palpitation') || q.includes('angina')) {
    symptoms.push('Acute Chest Discomfort / Cardiac Stress');
  }
  if (q.includes('breath') || q.includes('chok') || q.includes('asthma') || q.includes('suffocat') || q.includes('gasping')) {
    symptoms.push('Respiratory Distress / Shortness of Breath');
  }
  if (q.includes('dizzy') || q.includes('faint') || q.includes('vertigo') || q.includes('lightheaded') || q.includes('blackout')) {
    symptoms.push('Acute Dizziness & Presyncope Risk');
  }
  if (q.includes('bleed') || q.includes('cut') || q.includes('wound') || q.includes('gash') || q.includes('hemorrhage')) {
    symptoms.push('Active Bleeding / Trauma');
  }
  if (q.includes('headache') || q.includes('migraine') || q.includes('numb') || q.includes('stroke') || q.includes('speech')) {
    symptoms.push('Neurological Symptom / Acute Cephalea');
  }
  if (q.includes('stomach') || q.includes('abdom') || q.includes('cramp') || q.includes('vomit') || q.includes('nausea')) {
    symptoms.push('Acute Abdominal / Gastrointestinal Distress');
  }
  if (q.includes('fever') || q.includes('chill') || q.includes('burn') || q.includes('temperature')) {
    symptoms.push('High Fever / Febrile Illness');
  }
  if (q.includes('broken') || q.includes('fracture') || q.includes('fall') || q.includes('ankle') || q.includes('leg') || q.includes('arm')) {
    symptoms.push('Musculoskeletal Trauma / Possible Fracture');
  }
  if (symptoms.length === 0) {
    symptoms.push('General Malaise / Acute Physical Distress');
  }

  // Determine Severity
  let severity: 'CODE_RED' | 'CODE_AMBER' | 'CODE_YELLOW' = 'CODE_YELLOW';
  const isCodeRed = /chest|heart racing|cannot breathe|hard to breathe|stroke|seizure|choking|heavy bleed|passed out|collapse|unconscious/i.test(q);
  const isCodeAmber = /severe|high fever|deep cut|fracture|broken|vomit blood|faint|acute|unbearable/i.test(q);

  if (isCodeRed) {
    severity = 'CODE_RED';
  } else if (isCodeAmber) {
    severity = 'CODE_AMBER';
  } else {
    severity = 'CODE_YELLOW';
  }

  // Match appropriate physicians
  const matchedDocs: DoctorProfile[] = [];
  if (q.includes('chest') || q.includes('heart') || q.includes('palpitat') || isCodeRed) {
    matchedDocs.push(ON_CALL_DOCTORS[1]); // Dr. Elena Chen (Cardiology)
  }
  if (q.includes('dizzy') || q.includes('headache') || q.includes('numb') || q.includes('stroke')) {
    matchedDocs.push(ON_CALL_DOCTORS[2]); // Dr. Priya Patel (Neurology)
  }
  if (q.includes('child') || q.includes('baby') || q.includes('kid') || q.includes('pediatric')) {
    matchedDocs.push(ON_CALL_DOCTORS[4]); // Dr. Sarah Jenkins (Pediatrics)
  }
  if (q.includes('broken') || q.includes('bone') || q.includes('fall') || q.includes('joint')) {
    matchedDocs.push(ON_CALL_DOCTORS[5]); // Dr. David Miller (Orthopedic Trauma)
  }

  // Always include Dr. Marcus Vance (ER Trauma Chief) for emergency triage
  if (!matchedDocs.some(d => d.id === 'doc-vance')) {
    matchedDocs.unshift(ON_CALL_DOCTORS[0]);
  }

  // Immediate care advice
  const advice: string[] = [
    'Sit down immediately in the nearest chair or remain seated to avoid falls.',
    'Loosen any restrictive collars or tight clothing around your neck and chest.',
    'Breathe slowly and evenly. Keep your head elevated.',
    'A hospital medical attendant has been dispatched to Kiosk Station 1 and is on their way.',
  ];

  if (severity === 'CODE_RED') {
    advice.unshift('DO NOT attempt to stand up or walk alone. Emergency Rapid Response is actively en route.');
  }

  return {
    isEmergency: true,
    severity,
    symptoms,
    matchedSpecialists: matchedDocs.slice(0, 2),
    immediateCareAdvice: advice,
  };
}
