/**
 * Persistent Database Engine & Schema Manager for ApexPath Diagnostic Laboratories
 * Features file persistence, ACID transactions, slot capacity locking, and rich seed data.
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import type {
  User,
  DiagnosticTest,
  HealthPackage,
  TimeSlot,
  Appointment,
  CallLog,
  DiagnosticReport,
  InAppNotification,
  EmailLog,
  AuditLog,
  Testimonial,
  FAQItem,
  ContactEnquiry,
  Coupon,
  ServiceablePincode,
  WebsiteSettings,
} from '../src/types/index.ts';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'lab_database.json');

export interface DatabaseSchema {
  users: User[];
  tests: DiagnosticTest[];
  packages: HealthPackage[];
  slots: TimeSlot[];
  appointments: Appointment[];
  callLogs: CallLog[];
  reports: DiagnosticReport[];
  notifications: InAppNotification[];
  emailLogs: EmailLog[];
  auditLogs: AuditLog[];
  testimonials: Testimonial[];
  faqs: FAQItem[];
  enquiries: ContactEnquiry[];
  coupons: Coupon[];
  serviceablePincodes: ServiceablePincode[];
  settings: WebsiteSettings;
  blockedDates: string[]; // ["YYYY-MM-DD"]
}

let dbInstance: DatabaseSchema | null = null;

// Password hashing helper using Node.js crypto (PBKDF2)
export function hashPassword(password: string): string {
  const salt = 'apexpath_salt_2026';
  return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
}

export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

// Initial seed data
function getInitialSeedData(): DatabaseSchema {
  const defaultPasswordHash = hashPassword('Patient@123');
  const adminPasswordHash = hashPassword('Admin@123');
  const staffPasswordHash = hashPassword('Staff@123');

  const users: User[] = [
    {
      id: 'usr-admin-01',
      name: 'Dr. Alistair Vance, MD',
      email: 'admin@apexpathlabs.com',
      phone: '+91 98765 43210',
      role: 'SUPER_ADMIN',
      gender: 'Male',
      dateOfBirth: '1978-04-12',
      address: 'Suite 400, Apex Medical Enclave, Main Blvd',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001',
      createdAt: '2025-01-01T08:00:00.000Z',
      isActive: true,
    },
    {
      id: 'usr-labadmin-01',
      name: 'Sarah Jenkins',
      email: 'labadmin@apexpathlabs.com',
      phone: '+91 98765 43211',
      role: 'LAB_ADMIN',
      gender: 'Female',
      dateOfBirth: '1985-09-20',
      address: 'Apex Diagnostic Centre, Block B',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001',
      createdAt: '2025-01-05T08:00:00.000Z',
      isActive: true,
    },
    {
      id: 'usr-path-01',
      name: 'Dr. Priya Sharma, MBBS, MD Pathology',
      email: 'pathologist@apexpathlabs.com',
      phone: '+91 98765 43212',
      role: 'PATHOLOGIST',
      gender: 'Female',
      dateOfBirth: '1982-11-15',
      address: 'Central Histopathology Lab, Sector 3',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001',
      createdAt: '2025-01-10T08:00:00.000Z',
      isActive: true,
    },
    {
      id: 'usr-phleb-01',
      name: 'Rahul Deshmukh (Certified Phlebotomist)',
      email: 'collector@apexpathlabs.com',
      phone: '+91 98765 43213',
      role: 'PHLEBOTOMIST',
      gender: 'Male',
      dateOfBirth: '1992-06-25',
      address: 'Sample Logistics Hub, Chembur',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400071',
      createdAt: '2025-02-01T08:00:00.000Z',
      isActive: true,
    },
    {
      id: 'usr-patient-01',
      name: 'Rohan Mehta',
      email: 'patient@apexpathlabs.com',
      phone: '+91 98201 12345',
      role: 'PATIENT',
      gender: 'Male',
      dateOfBirth: '1989-07-14',
      address: 'Flat 402, Green Meadows, Link Road, Andheri West',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400053',
      emergencyContact: '+91 98201 54321 (Spouse)',
      createdAt: '2025-03-01T10:30:00.000Z',
      isActive: true,
    },
    {
      id: 'usr-patient-02',
      name: 'Ananya Verma',
      email: 'ananya.verma@example.com',
      phone: '+91 98111 88776',
      role: 'PATIENT',
      gender: 'Female',
      dateOfBirth: '1995-03-22',
      address: 'B-12, Palm Residency, Bandra West',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400050',
      createdAt: '2025-03-02T11:00:00.000Z',
      isActive: true,
    },
  ];

  // Store password hashes inside a private table lookup or as an internal map
  // For safety, passwords are verified against these hashes in auth.ts

  const tests: DiagnosticTest[] = [
    {
      id: 't-cbc-01',
      code: 'CBC01',
      name: 'Complete Blood Count (CBC) with ESR',
      category: 'Haematology',
      shortDescription: 'Comprehensive evaluation of red cells, white cells, hemoglobin, and platelets.',
      description: 'Measures RBC, WBC, Hemoglobin, Hematocrit, Platelet count, MCV, MCH, MCHC, and Erythrocyte Sedimentation Rate (ESR). Essential for identifying anaemia, infections, and haematological disorders.',
      preparationRequired: 'No mandatory fasting. Adequate hydration recommended.',
      reportTime: 'Same Day (6–8 Hours)',
      price: 380,
      discountPrice: 320,
      sampleType: 'Whole Blood (EDTA)',
      homeCollectionAvailable: true,
      labVisitAvailable: true,
      popular: true,
      isActive: true,
    },
    {
      id: 't-fbs-02',
      code: 'GLU01',
      name: 'Fasting Blood Sugar (Glucose)',
      category: 'Diabetes',
      shortDescription: 'Measures blood glucose levels after an overnight fast.',
      description: 'Primary screening test for diabetes mellitus and impaired fasting glucose. Evaluates pancreas endocrine function and insulin regulation.',
      preparationRequired: 'Strict overnight fasting of 8–10 hours required. Water is permitted.',
      reportTime: 'Same Day (4 Hours)',
      price: 140,
      discountPrice: 110,
      sampleType: 'Fluoride Plasma',
      homeCollectionAvailable: true,
      labVisitAvailable: true,
      popular: true,
      isActive: true,
    },
    {
      id: 't-hba1c-03',
      code: 'HBA01',
      name: 'HbA1c (Glycated Haemoglobin HPLC)',
      category: 'Diabetes',
      shortDescription: 'Gold-standard test for 3-month average blood glucose control.',
      description: 'Utilizes high-performance liquid chromatography (HPLC) to measure glycated hemoglobin. Crucial for monitoring diabetes therapy adherence.',
      preparationRequired: 'No fasting required. Can be collected any time of day.',
      reportTime: 'Same Day (6 Hours)',
      price: 600,
      discountPrice: 499,
      sampleType: 'Whole Blood (EDTA)',
      homeCollectionAvailable: true,
      labVisitAvailable: true,
      popular: true,
      isActive: true,
    },
    {
      id: 't-lipid-04',
      code: 'LIP01',
      name: 'Lipid Profile Comprehensive',
      category: 'Cardiology',
      shortDescription: 'Total Cholesterol, HDL, LDL, VLDL, Triglycerides & Risk Ratios.',
      description: 'Assesses cardiovascular risk by quantifying lipid fractions. Includes Total Cholesterol, HDL Good Cholesterol, LDL Bad Cholesterol, VLDL, Triglycerides, and Total/HDL ratio.',
      preparationRequired: '10–12 hours strict fasting required. Water is allowed.',
      reportTime: 'Same Day (6–8 Hours)',
      price: 850,
      discountPrice: 699,
      sampleType: 'Serum',
      homeCollectionAvailable: true,
      labVisitAvailable: true,
      popular: true,
      isActive: true,
    },
    {
      id: 't-lft-05',
      code: 'LFT01',
      name: 'Liver Function Test (LFT) with Enzymes',
      category: 'Biochemistry',
      shortDescription: 'Assesses hepatic synthesis, enzyme release, and biliary clearance.',
      description: 'Comprehensive panel measuring Total Bilirubin, Direct/Indirect Bilirubin, SGOT/AST, SGPT/ALT, Alkaline Phosphatase (ALP), Total Protein, Albumin, Globulin, and A/G ratio.',
      preparationRequired: 'Overnight fasting of 8–10 hours recommended.',
      reportTime: 'Same Day (6–8 Hours)',
      price: 900,
      discountPrice: 750,
      sampleType: 'Serum',
      homeCollectionAvailable: true,
      labVisitAvailable: true,
      popular: true,
      isActive: true,
    },
    {
      id: 't-kft-06',
      code: 'KFT01',
      name: 'Kidney Function Test (KFT / RFT) & Electrolytes',
      category: 'Biochemistry',
      shortDescription: 'Evaluates renal filtration, nitrogen excretion, and fluid electrolyte balance.',
      description: 'Measures Blood Urea Nitrogen (BUN), Serum Creatinine, Uric Acid, Calcium, Phosphorus, Sodium, Potassium, and Chloride. Identifies early renal impairment.',
      preparationRequired: 'Fasting not required. Avoid excessive protein intake the evening prior.',
      reportTime: 'Same Day (6–8 Hours)',
      price: 850,
      discountPrice: 720,
      sampleType: 'Serum',
      homeCollectionAvailable: true,
      labVisitAvailable: true,
      popular: true,
      isActive: true,
    },
    {
      id: 't-thy-07',
      code: 'THY01',
      name: 'Thyroid Profile Total (T3, T4, TSH)',
      category: 'Endocrinology',
      shortDescription: 'Screens for hypothyroidism, hyperthyroidism, and metabolic regulation.',
      description: 'Measures total Triiodothyronine (T3), total Thyroxine (T4), and Thyroid Stimulating Hormone (TSH) using ultra-sensitive chemiluminescence immunoassay (CLIA).',
      preparationRequired: 'Morning sample preferred. Fasting optional.',
      reportTime: 'Same Day (6 Hours)',
      price: 600,
      discountPrice: 480,
      sampleType: 'Serum',
      homeCollectionAvailable: true,
      labVisitAvailable: true,
      popular: true,
      isActive: true,
    },
    {
      id: 't-vitd-08',
      code: 'VITD01',
      name: 'Vitamin D (25-Hydroxy Vitamin D CLIA)',
      category: 'Vitamins',
      shortDescription: 'Essential for bone density, immune competence, and musculoskeletal health.',
      description: 'Chemiluminescence measurement of total 25-OH Vitamin D (D2 + D3). Classifies sufficiency, insufficiency, and severe deficiency states.',
      preparationRequired: 'No fasting required.',
      reportTime: 'Same Day (8–10 Hours)',
      price: 1350,
      discountPrice: 999,
      sampleType: 'Serum',
      homeCollectionAvailable: true,
      labVisitAvailable: true,
      popular: true,
      isActive: true,
    },
    {
      id: 't-vitb12-09',
      code: 'VITB01',
      name: 'Vitamin B12 (Cyanocobalamin)',
      category: 'Vitamins',
      shortDescription: 'Key indicator for neurological function, memory, and RBC maturation.',
      description: 'Measures serum Cobalamin concentration. Essential for evaluating megaloblastic anaemia, neuropathy, and chronic fatigue.',
      preparationRequired: 'Overnight fasting of 8 hours recommended.',
      reportTime: 'Same Day (8 Hours)',
      price: 1100,
      discountPrice: 850,
      sampleType: 'Serum',
      homeCollectionAvailable: true,
      labVisitAvailable: true,
      popular: true,
      isActive: true,
    },
    {
      id: 't-urine-10',
      code: 'URN01',
      name: 'Urine Routine & Microscopic Examination',
      category: 'Pathology',
      shortDescription: 'Physical, chemical dipstick, and microscopic urinalysis.',
      description: 'Evaluates color, transparency, pH, specific gravity, protein, glucose, ketones, bile salts, urobilinogen, pus cells, RBCs, epithelial cells, casts, and crystals.',
      preparationRequired: 'Clean-catch midstream urine sample required in sterile container.',
      reportTime: 'Same Day (3–4 Hours)',
      price: 220,
      discountPrice: 180,
      sampleType: 'Midstream Urine',
      homeCollectionAvailable: true,
      labVisitAvailable: true,
      popular: false,
      isActive: true,
    },
    {
      id: 't-iron-11',
      code: 'IRN01',
      name: 'Iron Studies Profile with Ferritin',
      category: 'Haematology',
      shortDescription: 'Serum Iron, TIBC, UIBC, Transferrin Saturation, and Ferritin storage.',
      description: 'Comprehensive evaluation of circulating and cellular iron stores. Identifies iron deficiency anaemia versus chronic disease anaemia.',
      preparationRequired: '10–12 hours overnight fasting required. Morning collection recommended.',
      reportTime: 'Within 24 Hours',
      price: 1400,
      discountPrice: 1150,
      sampleType: 'Serum',
      homeCollectionAvailable: true,
      labVisitAvailable: true,
      popular: false,
      isActive: true,
    },
    {
      id: 't-crp-12',
      code: 'CRP01',
      name: 'C-Reactive Protein (Quantitative HS-CRP)',
      category: 'Immunology',
      shortDescription: 'Highly sensitive marker for systemic inflammation and cardiovascular risk.',
      description: 'Measures low levels of CRP using turbidimetric immunoassay to detect acute infection, auto-inflammatory flare-ups, and baseline vascular inflammation.',
      preparationRequired: 'No fasting required.',
      reportTime: 'Same Day (4 Hours)',
      price: 650,
      discountPrice: 520,
      sampleType: 'Serum',
      homeCollectionAvailable: true,
      labVisitAvailable: true,
      popular: false,
      isActive: true,
    },
  ];

  const packages: HealthPackage[] = [
    {
      id: 'pkg-basic-01',
      code: 'PKG-BSC',
      name: 'Essential Wellness Screening',
      tagline: 'Foundational 45-parameter health evaluation for routine annual monitoring.',
      description: 'Includes Complete Blood Count, Fasting Blood Sugar, Lipid Profile, and Complete Urinalysis. Ideal for early detection of lifestyle markers.',
      testIds: ['t-cbc-01', 't-fbs-02', 't-lipid-04', 't-urine-10'],
      testsIncludedNames: [
        'Complete Blood Count (CBC + ESR)',
        'Fasting Blood Glucose',
        'Lipid Profile Comprehensive (6 Parameters)',
        'Urine Routine & Microscopic',
      ],
      originalPrice: 1590,
      discountedPrice: 999,
      savings: 591,
      preparationInstructions: '10–12 hours overnight fasting required. Drink water to stay well-hydrated.',
      reportTimeline: 'Within 12 Hours (Same Day)',
      recommendedFor: 'Adults aged 18–40 seeking routine annual assessment.',
      popular: true,
      isActive: true,
    },
    {
      id: 'pkg-complete-02',
      code: 'PKG-CMP',
      name: 'Comprehensive Vital Health Check',
      tagline: 'Deep 75-parameter systemic audit across heart, liver, kidney, and thyroid.',
      description: 'Includes CBC + ESR, Fasting Glucose, HbA1c, Full Lipid Profile, Liver Function Test (LFT), Kidney Function Test (KFT), and Thyroid Profile (T3/T4/TSH).',
      testIds: ['t-cbc-01', 't-fbs-02', 't-hba1c-03', 't-lipid-04', 't-lft-05', 't-kft-06', 't-thy-07'],
      testsIncludedNames: [
        'Complete Blood Count (CBC + ESR)',
        'HbA1c & Fasting Blood Sugar',
        'Comprehensive Lipid Profile',
        'Liver Function Test (11 Parameters)',
        'Kidney Function Test with Electrolytes',
        'Thyroid Profile Total (T3, T4, TSH)',
      ],
      originalPrice: 4290,
      discountedPrice: 2299,
      savings: 1991,
      preparationInstructions: 'Strict 10–12 hours overnight fasting. Avoid alcohol 24h prior.',
      reportTimeline: 'Same Day (by 8:00 PM)',
      recommendedFor: 'Individuals aged 30+ or with sedentary routines and family history of chronic illness.',
      popular: true,
      isActive: true,
    },
    {
      id: 'pkg-executive-03',
      code: 'PKG-EXE',
      name: 'Executive Elite Full Body Checkup',
      tagline: 'Our premier 90+ parameter diagnostic audit with Vitamin D, B12, and Iron Stores.',
      description: 'Comprehensive Vital Checkup + Vitamin D 25-OH + Vitamin B12 + Iron Studies with Ferritin + High-Sensitivity CRP. Provides an end-to-end cellular and metabolic portrait.',
      testIds: ['t-cbc-01', 't-fbs-02', 't-hba1c-03', 't-lipid-04', 't-lft-05', 't-kft-06', 't-thy-07', 't-vitd-08', 't-vitb12-09', 't-iron-11', 't-crp-12'],
      testsIncludedNames: [
        'Complete Blood Count & ESR',
        'HbA1c & Fasting Glucose',
        'Lipid Profile Comprehensive',
        'Liver & Kidney Function Panels',
        'Thyroid Profile (T3, T4, TSH)',
        'Vitamin D (25-Hydroxy)',
        'Vitamin B12 (Active Cyanocobalamin)',
        'Iron Studies with Ferritin',
        'HS-CRP Inflammatory Marker',
      ],
      originalPrice: 8790,
      discountedPrice: 3999,
      savings: 4791,
      preparationInstructions: '12 hours fasting. Morning sample collection between 07:00 AM – 10:30 AM.',
      reportTimeline: 'Within 24 Hours with Pathologist Summary',
      recommendedFor: 'Corporate executives, seniors, or anyone seeking total preventive peace of mind.',
      popular: true,
      isActive: true,
    },
    {
      id: 'pkg-diabetes-04',
      code: 'PKG-DIA',
      name: 'Diabetes & Metabolic Care Package',
      tagline: 'Specialized glycemic control, renal filtration, and cardiac risk assessment.',
      description: 'Focuses on glucose homeostasis, kidney microvascular protection, and lipid metabolism: HbA1c, Fasting Sugar, Lipid Profile, Kidney Function Test, and Urine Routine.',
      testIds: ['t-fbs-02', 't-hba1c-03', 't-lipid-04', 't-kft-06', 't-urine-10'],
      testsIncludedNames: [
        'HbA1c (Glycated Haemoglobin)',
        'Fasting Blood Sugar',
        'Lipid Profile Comprehensive',
        'Kidney Function & Micro-filtration',
        'Urine Routine & Microscopic',
      ],
      originalPrice: 2660,
      discountedPrice: 1599,
      savings: 1061,
      preparationInstructions: 'Overnight fasting of 8–10 hours. Carry morning diabetes medicine to take post-sample.',
      reportTimeline: 'Within 8 Hours',
      recommendedFor: 'Individuals diagnosed with or at risk of pre-diabetes and diabetes mellitus.',
      popular: false,
      isActive: true,
    },
    {
      id: 'pkg-women-05',
      code: 'PKG-WMN',
      name: "Women's Vitality & Hormone Wellness",
      tagline: 'Targeted bone density, thyroid balance, iron reserves, and metabolic markers.',
      description: 'Engineered specifically for female physiology: Complete Blood Count, Thyroid Profile, Vitamin D, Vitamin B12, Iron Studies with Ferritin, and Calcium.',
      testIds: ['t-cbc-01', 't-thy-07', 't-vitd-08', 't-vitb12-09', 't-iron-11'],
      testsIncludedNames: [
        'Complete Blood Count (Anaemia screening)',
        'Thyroid Profile Total (T3, T4, TSH)',
        'Vitamin D (Bone strength)',
        'Vitamin B12 (Energy & Nerve health)',
        'Serum Ferritin & Complete Iron Studies',
      ],
      originalPrice: 4830,
      discountedPrice: 2899,
      savings: 1931,
      preparationInstructions: '10 hours overnight fasting recommended. Plenty of water permitted.',
      reportTimeline: 'Same Day (Evening)',
      recommendedFor: 'Women of all age groups, addressing fatigue, hair loss, and hormonal variations.',
      popular: false,
      isActive: true,
    },
  ];

  const slots: TimeSlot[] = [
    {
      id: 'slot-0708',
      timeRange: '07:00 AM – 08:00 AM',
      startTime: '07:00',
      endTime: '08:00',
      maxCapacity: 6,
      homeCapacity: 4,
      isActive: true,
    },
    {
      id: 'slot-0809',
      timeRange: '08:00 AM – 09:00 AM',
      startTime: '08:00',
      endTime: '09:00',
      maxCapacity: 8,
      homeCapacity: 6,
      isActive: true,
    },
    {
      id: 'slot-0910',
      timeRange: '09:00 AM – 10:00 AM',
      startTime: '09:00',
      endTime: '10:00',
      maxCapacity: 8,
      homeCapacity: 6,
      isActive: true,
    },
    {
      id: 'slot-1011',
      timeRange: '10:00 AM – 11:00 AM',
      startTime: '10:00',
      endTime: '11:00',
      maxCapacity: 8,
      homeCapacity: 5,
      isActive: true,
    },
    {
      id: 'slot-1112',
      timeRange: '11:00 AM – 12:00 PM',
      startTime: '11:00',
      endTime: '12:00',
      maxCapacity: 6,
      homeCapacity: 4,
      isActive: true,
    },
    {
      id: 'slot-0203',
      timeRange: '02:00 PM – 03:00 PM',
      startTime: '14:00',
      endTime: '15:00',
      maxCapacity: 5,
      homeCapacity: 3,
      isActive: true,
    },
    {
      id: 'slot-0405',
      timeRange: '04:00 PM – 05:00 PM',
      startTime: '16:00',
      endTime: '17:00',
      maxCapacity: 6,
      homeCapacity: 4,
      isActive: true,
    },
    {
      id: 'slot-0506',
      timeRange: '05:00 PM – 06:00 PM',
      startTime: '17:00',
      endTime: '18:00',
      maxCapacity: 6,
      homeCapacity: 4,
      isActive: true,
    },
  ];

  // Seed sample appointments showcasing complete workflow states
  const appointments: Appointment[] = [
    {
      id: 'apt-001',
      bookingId: 'LAB-2026-000101',
      patientId: 'usr-patient-01',
      patientName: 'Rohan Mehta',
      patientEmail: 'patient@apexpathlabs.com',
      patientPhone: '+91 98201 12345',
      patientGender: 'Male',
      patientDob: '1989-07-14',
      items: [
        {
          type: 'PACKAGE',
          itemId: 'pkg-complete-02',
          name: 'Comprehensive Vital Health Check',
          price: 2299,
        },
      ],
      collectionMethod: 'HOME_COLLECTION',
      appointmentDate: '2026-09-14',
      timeSlotRange: '08:00 AM – 09:00 AM',
      timeSlotId: 'slot-0809',
      collectionAddress: {
        street: 'Flat 402, Green Meadows, Link Road',
        landmark: 'Opposite Infinity Mall',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400053',
      },
      doctorName: 'Dr. S. K. Roy (Cardiologist)',
      specialInstructions: 'Ring doorbell twice. Patient will be fasting for 12 hours.',
      fastingConfirmed: true,
      baseAmount: 2299,
      collectionFee: 0, // Waived in promo
      discountAmount: 200,
      couponCode: 'WELLNESS200',
      taxAmount: 0,
      totalAmount: 2099,
      paymentMethod: 'ONLINE_GATEWAY',
      paymentStatus: 'PAID',
      transactionId: 'TXN_APX_9921827361',
      status: 'CONFIRMED',
      statusNotes: 'Patient confirmed appointment and fasting instructions via phone call.',
      assignedStaffId: 'usr-phleb-01',
      assignedStaffName: 'Rahul Deshmukh (Certified Phlebotomist)',
      confirmedAt: '2026-09-12T14:30:00.000Z',
      confirmationEmailSent: true,
      createdAt: '2026-09-12T11:15:00.000Z',
      updatedAt: '2026-09-12T14:30:00.000Z',
    },
    {
      id: 'apt-002',
      bookingId: 'LAB-2026-000102',
      patientId: 'usr-patient-01',
      patientName: 'Rohan Mehta',
      patientEmail: 'patient@apexpathlabs.com',
      patientPhone: '+91 98201 12345',
      patientGender: 'Male',
      patientDob: '1989-07-14',
      items: [
        {
          type: 'TEST',
          itemId: 't-cbc-01',
          name: 'Complete Blood Count (CBC) with ESR',
          price: 320,
        },
        {
          type: 'TEST',
          itemId: 't-vitd-08',
          name: 'Vitamin D (25-Hydroxy Vitamin D CLIA)',
          price: 999,
        },
      ],
      collectionMethod: 'LAB_VISIT',
      appointmentDate: '2026-09-10',
      timeSlotRange: '09:00 AM – 10:00 AM',
      timeSlotId: 'slot-0910',
      fastingConfirmed: true,
      baseAmount: 1319,
      collectionFee: 0,
      discountAmount: 0,
      taxAmount: 0,
      totalAmount: 1319,
      paymentMethod: 'ONLINE_GATEWAY',
      paymentStatus: 'PAID',
      transactionId: 'TXN_APX_8837192019',
      status: 'REPORT_READY',
      statusNotes: 'Diagnostic report analyzed, verified, and signed by Dr. Alistair Vance.',
      confirmedAt: '2026-09-09T16:00:00.000Z',
      confirmationEmailSent: true,
      createdAt: '2026-09-09T10:00:00.000Z',
      updatedAt: '2026-09-10T17:45:00.000Z',
    },
    {
      id: 'apt-003',
      bookingId: 'LAB-2026-000103',
      patientId: 'usr-patient-02',
      patientName: 'Ananya Verma',
      patientEmail: 'ananya.verma@example.com',
      patientPhone: '+91 98111 88776',
      patientGender: 'Female',
      patientDob: '1995-03-22',
      items: [
        {
          type: 'PACKAGE',
          itemId: 'pkg-women-05',
          name: "Women's Vitality & Hormone Wellness",
          price: 2899,
        },
      ],
      collectionMethod: 'HOME_COLLECTION',
      appointmentDate: '2026-09-15',
      timeSlotRange: '07:00 AM – 08:00 AM',
      timeSlotId: 'slot-0708',
      collectionAddress: {
        street: 'B-12, Palm Residency, Bandra West',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400050',
      },
      fastingConfirmed: true,
      baseAmount: 2899,
      collectionFee: 150,
      discountAmount: 0,
      taxAmount: 0,
      totalAmount: 3049,
      paymentMethod: 'PAY_AT_COLLECTION',
      paymentStatus: 'PAY_AT_COLLECTION',
      status: 'PENDING_CONFIRMATION',
      statusNotes: 'New booking received. Phlebotomy desk dispatch pending contact.',
      confirmationEmailSent: false,
      createdAt: '2026-09-12T18:20:00.000Z',
      updatedAt: '2026-09-12T18:20:00.000Z',
    },
  ];

  const callLogs: CallLog[] = [
    {
      id: 'call-001',
      appointmentId: 'apt-001',
      callDate: '2026-09-12',
      callTime: '14:25',
      staffId: 'usr-labadmin-01',
      staffName: 'Sarah Jenkins',
      callOutcome: 'Call Successful',
      notes: 'Patient confirmed 8:00 AM home collection. Instructed 10-hour fasting. Patient was polite and acknowledged instructions.',
      createdAt: '2026-09-12T14:26:00.000Z',
    },
  ];

  const reports: DiagnosticReport[] = [
    {
      id: 'rep-001',
      bookingId: 'LAB-2026-000102',
      appointmentId: 'apt-002',
      patientId: 'usr-patient-01',
      patientName: 'Rohan Mehta',
      testName: 'Complete Blood Count (CBC) & Vitamin D',
      testDate: '2026-09-10',
      sampleCollectedAt: '2026-09-10 09:15 AM',
      reportDate: '2026-09-10 05:45 PM',
      verifiedBy: 'Dr. Alistair Vance, MD, FACP',
      pathologistRegNo: 'MCI-REG-847291-PATH',
      notes: 'Serum 25-OH Vitamin D indicates mild insufficiency (24.2 ng/mL). CBC parameters demonstrate normocytic normochromic red cells with normal leukocyte differential. Routine follow-up in 3 months recommended.',
      parameters: [
        { name: 'Hemoglobin (Hb)', result: '14.8', unit: 'g/dL', referenceRange: '13.0 – 17.0', flag: 'NORMAL' },
        { name: 'Total Leukocyte Count (WBC)', result: '6,800', unit: '/cumm', referenceRange: '4,000 – 11,000', flag: 'NORMAL' },
        { name: 'Platelet Count', result: '245,000', unit: '/cumm', referenceRange: '150,000 – 450,000', flag: 'NORMAL' },
        { name: 'RBC Count', result: '5.10', unit: 'mil/cumm', referenceRange: '4.50 – 5.90', flag: 'NORMAL' },
        { name: 'Packed Cell Volume (PCV)', result: '44.2', unit: '%', referenceRange: '40.0 – 50.0', flag: 'NORMAL' },
        { name: 'Erythrocyte Sedimentation Rate (ESR)', result: '8', unit: 'mm/1st hr', referenceRange: '0 – 15', flag: 'NORMAL' },
        { name: '25-Hydroxy Vitamin D Total', result: '24.2', unit: 'ng/mL', referenceRange: '30.0 – 100.0 (Sufficient)', flag: 'LOW' },
      ],
      status: 'VERIFIED',
      pdfUrl: '/api/reports/LAB-2026-000102/pdf',
      createdAt: '2026-09-10T17:45:00.000Z',
    },
  ];

  const notifications: InAppNotification[] = [
    {
      id: 'notif-001',
      recipientId: 'usr-patient-01',
      title: 'Appointment Confirmed',
      message: 'Your diagnostic appointment (LAB-2026-000101) is confirmed for Monday, Sep 14 at 08:00 AM.',
      type: 'CONFIRMATION',
      bookingId: 'LAB-2026-000101',
      isRead: false,
      createdAt: '2026-09-12T14:30:00.000Z',
    },
    {
      id: 'notif-002',
      recipientId: 'usr-patient-01',
      title: 'Diagnostic Report Ready',
      message: 'Your clinical lab report for CBC & Vitamin D (LAB-2026-000102) is verified and ready for download.',
      type: 'REPORT',
      bookingId: 'LAB-2026-000102',
      isRead: true,
      createdAt: '2026-09-10T17:50:00.000Z',
    },
    {
      id: 'notif-003',
      recipientId: 'ADMIN',
      title: 'New Booking Request',
      message: 'New home collection request LAB-2026-000103 from Ananya Verma awaits team contact.',
      type: 'BOOKING',
      bookingId: 'LAB-2026-000103',
      isRead: false,
      createdAt: '2026-09-12T18:20:00.000Z',
    },
  ];

  const emailLogs: EmailLog[] = [
    {
      id: 'email-001',
      recipient: 'patient@apexpathlabs.com',
      recipientName: 'Rohan Mehta',
      subject: 'Your Diagnostic Test Booking Request – LAB-2026-000101',
      emailType: 'BOOKING_REQUEST_RECEIVED',
      bookingId: 'LAB-2026-000101',
      htmlContent: '<p>Dear Rohan Mehta, your booking request has been received.</p>',
      status: 'DELIVERED',
      sentAt: '2026-09-12T11:15:30.000Z',
    },
    {
      id: 'email-002',
      recipient: 'patient@apexpathlabs.com',
      recipientName: 'Rohan Mehta',
      subject: 'Your Diagnostic Appointment is Confirmed – LAB-2026-000101',
      emailType: 'APPOINTMENT_CONFIRMED',
      bookingId: 'LAB-2026-000101',
      htmlContent: '<p>Dear Rohan Mehta, your appointment is confirmed for Sep 14 at 08:00 AM.</p>',
      status: 'DELIVERED',
      sentAt: '2026-09-12T14:30:15.000Z',
    },
  ];

  const auditLogs: AuditLog[] = [
    {
      id: 'audit-001',
      adminId: 'usr-admin-01',
      adminName: 'Dr. Alistair Vance, MD',
      action: 'APPOINTMENT_CONFIRMED',
      bookingId: 'LAB-2026-000101',
      details: 'Status moved from UNDER_REVIEW to CONFIRMED. Phlebotomist Rahul Deshmukh assigned.',
      timestamp: '2026-09-12T14:30:00.000Z',
      ipAddress: '127.0.0.1',
    },
    {
      id: 'audit-002',
      adminId: 'usr-path-01',
      adminName: 'Dr. Priya Sharma',
      action: 'REPORT_VERIFIED',
      bookingId: 'LAB-2026-000102',
      details: 'Verified lab report with digital signature. All critical value criteria reviewed.',
      timestamp: '2026-09-10T17:45:00.000Z',
      ipAddress: '127.0.0.1',
    },
  ];

  const testimonials: Testimonial[] = [
    {
      id: 'tstm-01',
      patientName: 'Vikramaditya Singhania',
      location: 'Bandra, Mumbai',
      rating: 5,
      review: 'The phlebotomist arrived precisely at 7:15 AM with a temperature-controlled cold box and vacuum vacutainers. The sample drawing was completely painless. Received CBC and Lipid reports by 4 PM on WhatsApp and dashboard!',
      testTaken: 'Executive Full Body Checkup',
      date: '2026-08-28',
      isPublished: true,
    },
    {
      id: 'tstm-02',
      patientName: 'Dr. Suniti Sen (Retd. Physician)',
      location: 'Juhu, Mumbai',
      rating: 5,
      review: 'As a retired clinician, I am extremely particular about laboratory internal quality controls. ApexPath adheres strictly to 6-sigma methodology and NABL calibration. The digital report formats are exemplary with accurate biological reference intervals.',
      testTaken: 'Comprehensive Vital Health Check',
      date: '2026-09-02',
      isPublished: true,
    },
    {
      id: 'tstm-03',
      patientName: 'Meera Nambiar',
      location: 'Powai, Mumbai',
      rating: 5,
      review: 'Booking home collection through their portal took barely two minutes. The lab staff called promptly to verify fasting, and the report download was instant. Truly high-end healthcare delivery!',
      testTaken: "Women's Vitality Package",
      date: '2026-09-05',
      isPublished: true,
    },
  ];

  const faqs: FAQItem[] = [
    {
      id: 'faq-01',
      category: 'Preparation',
      question: 'What tests require overnight fasting?',
      answer: 'Tests requiring strict 10–12 hour fasting include Fasting Blood Sugar (FBS), Lipid Profile, Comprehensive Metabolic Panels, Iron Studies, and Liver Function Tests. You may drink plain water, but refrain from tea, coffee, juice, food, or smoking during the fast.',
      displayOrder: 1,
      isPublished: true,
    },
    {
      id: 'faq-02',
      category: 'Home Collection',
      question: 'How does certified Home Sample Collection work?',
      answer: 'After you book online, our laboratory coordinator contacts you to verify appointment details and address. A certified, vaccinated phlebotomist arrives at your designated time slot with sterile, barcoded vacutainer tubes and a cold-chain carrier box to guarantee sample stability.',
      displayOrder: 2,
      isPublished: true,
    },
    {
      id: 'faq-03',
      category: 'Reports',
      question: 'How quickly will I receive my diagnostic reports?',
      answer: 'Routine haematology (CBC), blood glucose, and urinalysis reports are typically published within 4 to 6 hours. Specialized profiles such as Vitamin D, Vitamin B12, and comprehensive health packages are delivered within 12 to 24 hours via secure PDF download and dashboard access.',
      displayOrder: 3,
      isPublished: true,
    },
    {
      id: 'faq-04',
      category: 'Booking',
      question: 'Can I pay in cash at the time of sample collection?',
      answer: 'Yes! We provide complete flexibility: you can pay securely online via UPI, Credit/Debit Cards, and NetBanking, or select "Pay at Collection" to settle in cash or mobile UPI with our phlebotomist upon sample collection.',
      displayOrder: 4,
      isPublished: true,
    },
    {
      id: 'faq-05',
      category: 'General',
      question: 'Are your laboratory results accepted by all hospitals and physicians?',
      answer: 'Absolutely. ApexPath Diagnostic Laboratories operates under NABL (ISO 15189:2022) and CAP stringent laboratory guidelines with fully automated, dual-calibrated Roche and Beckman Coulter analyzers. Every single report is individually validated by certified pathologists.',
      displayOrder: 5,
      isPublished: true,
    },
  ];

  const enquiries: ContactEnquiry[] = [
    {
      id: 'enq-001',
      name: 'Kavita Rao',
      phone: '+91 99887 76655',
      email: 'kavita.rao@example.com',
      subject: 'Corporate Health Checkup Inquiry for 50 Employees',
      message: 'Hello, we are interested in scheduling executive health screening packages for our corporate team in Mumbai. Please share bulk group rates and on-site collection availability.',
      status: 'NEW',
      createdAt: '2026-09-11T16:20:00.000Z',
    },
  ];

  const coupons: Coupon[] = [
    {
      code: 'FIRSTTEST',
      discountType: 'PERCENTAGE',
      discountValue: 15,
      minOrderAmount: 499,
      maxDiscount: 300,
      isActive: true,
    },
    {
      code: 'HEALTH10',
      discountType: 'PERCENTAGE',
      discountValue: 10,
      minOrderAmount: 299,
      maxDiscount: 500,
      isActive: true,
    },
    {
      code: 'WELLNESS200',
      discountType: 'FIXED',
      discountValue: 200,
      minOrderAmount: 1500,
      isActive: true,
    },
  ];

  const serviceablePincodes: ServiceablePincode[] = [
    { pincode: '400001', areaName: 'Fort / Colaba', city: 'Mumbai', collectionFee: 0, isActive: true },
    { pincode: '400050', areaName: 'Bandra West', city: 'Mumbai', collectionFee: 0, isActive: true },
    { pincode: '400053', areaName: 'Andheri West', city: 'Mumbai', collectionFee: 0, isActive: true },
    { pincode: '400076', areaName: 'Powai', city: 'Mumbai', collectionFee: 0, isActive: true },
    { pincode: '400071', areaName: 'Chembur', city: 'Mumbai', collectionFee: 0, isActive: true },
    { pincode: '400092', areaName: 'Borivali West', city: 'Mumbai', collectionFee: 100, isActive: true },
    { pincode: '110001', areaName: 'Connaught Place', city: 'New Delhi', collectionFee: 0, isActive: true },
    { pincode: '560001', areaName: 'MG Road / Central', city: 'Bengaluru', collectionFee: 0, isActive: true },
    { pincode: '560034', areaName: 'Koramangala', city: 'Bengaluru', collectionFee: 0, isActive: true },
  ];

  const settings: WebsiteSettings = {
    laboratoryName: 'ApexPath Diagnostic Laboratories',
    tagline: 'Precision Pathology, Uncompromising Accuracy & Compassionate Care',
    heroHeadline: 'Trusted Diagnostics. Conveniently Booked.',
    heroSubtitle: 'Schedule NABL-calibrated blood tests and comprehensive health checkups online with certified home sample collection and rapid digital reports verified by senior pathologists.',
    phone: '+91 (022) 8800-APEX',
    emergencyPhone: '+91 98765 43210',
    email: 'care@apexpathlabs.com',
    address: 'Apex Diagnostic Towers, 4th Floor, Medical Enclave, Main Blvd, Mumbai 400001',
    workingHoursWeekday: '07:00 AM – 08:00 PM',
    workingHoursSaturday: '07:00 AM – 06:00 PM',
    workingHoursSunday: '07:00 AM – 01:00 PM (Emergency & Home Collection only)',
    homeCollectionFee: 150,
    taxPercentage: 0, // Diagnostic healthcare tests exempt from GST in India
    minAdvanceBookingHours: 2,
    maxAdvanceBookingDays: 30,
    cancellationWindowHours: 4,
    reschedulingWindowHours: 2,
    defaultSlotCapacity: 8,
    nablLicense: 'NABL ISO 15189:2022 / MC-4829',
    capAccredited: true,
  };

  return {
    users,
    tests,
    packages,
    slots,
    appointments,
    callLogs,
    reports,
    notifications,
    emailLogs,
    auditLogs,
    testimonials,
    faqs,
    enquiries,
    coupons,
    serviceablePincodes,
    settings,
    blockedDates: [],
  };
}

// Ensure database file is loaded
export function getDb(): DatabaseSchema {
  if (dbInstance) return dbInstance;

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (fs.existsSync(DB_FILE)) {
    try {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      dbInstance = JSON.parse(content);
      return dbInstance!;
    } catch (err) {
      console.error('Failed to parse existing lab_database.json, re-seeding:', err);
    }
  }

  const initial = getInitialSeedData();
  dbInstance = initial;
  saveDb();
  return dbInstance;
}

// Atomic save to persistent disk
export function saveDb(): void {
  if (!dbInstance) return;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const tempPath = `${DB_FILE}.tmp`;
    fs.writeFileSync(tempPath, JSON.stringify(dbInstance, null, 2), 'utf-8');
    fs.renameSync(tempPath, DB_FILE);
  } catch (err) {
    console.error('Failed to save lab_database.json:', err);
  }
}

// Transaction helper for safe booking slot decrement
export function runInTransaction<T>(callback: (db: DatabaseSchema) => T): T {
  const db = getDb();
  // Deep clone database snapshot for rollback safety
  const snapshot = JSON.parse(JSON.stringify(db));
  try {
    const result = callback(db);
    saveDb();
    return result;
  } catch (error) {
    // Rollback
    dbInstance = snapshot;
    throw error;
  }
}
