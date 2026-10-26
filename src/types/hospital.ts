export type TriageSeverity = 'CODE_RED' | 'CODE_AMBER' | 'CODE_YELLOW' | 'NORMAL';

export interface HospitalLocation {
  item: string;
  category: 'MEDICINE' | 'EQUIPMENT' | 'FACILITY' | 'DIAGNOSTIC' | 'CLINIC' | 'EMERGENCY' | 'AMENITY';
  department: string;
  floorId: 'B1' | 'G' | 'L1' | 'L2' | 'L3' | 'L4';
  floorName: string;
  wing: string;
  roomBay: string;
  eta: string;
  directions: string[];
  notes?: string;
  iconName?: string;
}

export interface DoctorProfile {
  id: string;
  name: string;
  title: string;
  department: string;
  specialty: string;
  pager: string;
  room: string;
  status: 'AVAILABLE' | 'ON_CALL' | 'IN_SURGERY' | 'DISPATCHED_EN_ROUTE';
  etaMinutes?: string;
  avatarColor: string;
  currentWaitingTime?: string;
  queueCount?: number;
}

export interface EmergencyTriageAlert {
  id: string;
  timestamp: string;
  severity: TriageSeverity;
  headline: string;
  patientSymptoms: string[];
  doctorsDispatched: DoctorProfile[];
  immediateCareAdvice: string[];
  kioskLocation: string;
  isActive: boolean;
}

export interface HospitalFloor {
  id: 'B1' | 'G' | 'L1' | 'L2' | 'L3' | 'L4';
  levelNumber: string;
  name: string;
  description: string;
  accentColor: string;
  wings: {
    name: string;
    services: string[];
  }[];
  keyItems: string[];
}

export interface DailyPlanItem {
  id: string;
  timeSlot: string;
  title: string;
  description: string;
  period: 'MORNING' | 'AFTERNOON' | 'EVENING';
  priority: 'CRITICAL' | 'HIGH' | 'NORMAL';
  completed: boolean;
}

export interface ReminderItem {
  id: string;
  title: string;
  dueTime: string;
  priority: 'URGENT' | 'HIGH' | 'NORMAL';
  category: 'WORK' | 'HEALTH' | 'PERSONAL';
  completed: boolean;
}

export interface ResearchCard {
  id: string;
  title: string;
  domain: string;
  queryPrompt: string;
  summary: string;
  keyFindings: string[];
}

export interface RecommendedMedicine {
  name: string;
  type: string;
  dosage: string;
  purpose: string;
  prescriptionRequired?: boolean;
}

export interface DoctorWaitEstimate {
  name: string;
  specialty: string;
  department: string;
  location: string;
  pager: string;
  currentWaitingTime: string;
  queueLength: number;
}

export interface ClinicalScanResult {
  id: string;
  timestamp: string;
  imageUrl?: string;
  identifiedCondition: string;
  severity: 'MILD' | 'MODERATE' | 'URGENT' | 'CRITICAL';
  probableCauses: string[];
  recommendedMedicines: RecommendedMedicine[];
  immediateHomeCare: string[];
  recommendedDoctor: DoctorWaitEstimate;
  spokenDiagnosis: string;
  notes?: string;
}

export interface HospitalChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  spokenBriefing?: string;
  locationResult?: HospitalLocation;
  triageAlert?: EmergencyTriageAlert;
  clinicalScanResult?: ClinicalScanResult;
  modeDetected?: 'PERSONAL' | 'HOSPITAL' | 'EMERGENCY' | 'VISION_DIAGNOSTIC';
  source?: string;
}
