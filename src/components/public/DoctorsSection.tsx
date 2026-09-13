/**
 * Pathologist & Clinical Leadership Section
 */

import React from 'react';
import {
  Award,
  BookOpen,
  CheckCircle,
  FileCheck,
  GraduationCap,
  ShieldCheck,
  Stethoscope,
} from 'lucide-react';

export const DoctorsSection: React.FC = () => {
  const doctors = [
    {
      name: 'Dr. Alistair Vance, MD, FACP',
      role: 'Chief Pathologist & Medical Director',
      qualification: 'MBBS, MD (Pathology), Fellowship in Clinical Chemistry (USA)',
      regNo: 'MCI-REG-847291-PATH',
      experience: '22+ Years Clinical Experience',
      bio: 'Dr. Vance serves as Director of Laboratory Medicine at ApexPath. He previously headed haematology quality assurance at King Edward Memorial Hospital and specializes in autoimmune profiling, diagnostic flow cytometry, and reference intervals.',
      expertise: [
        'Haematology & Coagulation Disorders',
        'Endocrine Biomarkers & Thyroid Profiling',
        'Laboratory Internal Quality Control (IQC)',
        'CAP / NABL Inspection Protocols',
      ],
    },
    {
      name: 'Dr. Priya Sharma, MBBS, MD Pathology',
      role: 'Head of Histopathology & Quality Systems',
      qualification: 'MBBS, MD (Pathology - Gold Medalist), NABL Lead Assessor',
      regNo: 'MMC-2006-08-3291',
      experience: '16+ Years Experience',
      bio: 'Dr. Sharma leads technical verification, pre-analytical sample integrity, and automated analyzer calibrations. She has published over 25 peer-reviewed papers on metabolic disease markers and early oncological cytology.',
      expertise: [
        'Oncopathology & Bone Marrow Aspiration',
        'Molecular & Biochemical Diagnostics',
        '6-Sigma Quality Metrics',
        'Infectious Disease Serology',
      ],
    },
    {
      name: 'Dr. K. N. Iyer, Ph.D. FACB',
      role: 'Consultant Clinical Biochemist',
      qualification: 'M.Sc. Medical Biochemistry, Ph.D., Diplomate ACB',
      regNo: 'ACB-IND-4821',
      experience: '18+ Years Experience',
      bio: 'Dr. Iyer oversees automated chemiluminescence, chromatography assays (HPLC HbA1c), and lipid sub-fraction analytics. He ensures daily calibration validity across high-throughput clinical chemistry analyzers.',
      expertise: [
        'HPLC Glycated Hemoglobin (HbA1c)',
        'Trace Element & Heavy Metal Toxicology',
        'Cardiac Troponin & HS-CRP Risk Analytics',
        'Electrolyte & Osmolality Homeostasis',
      ],
    },
  ];

  return (
    <section className="py-16 px-4 sm:px-6 max-w-7xl mx-auto">
      <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider text-sky-700 bg-sky-50 border border-sky-200 px-3 py-1 rounded-full">
          Medical & Clinical Leadership
        </span>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Qualified Pathologists & Laboratory Directors
        </h2>
        <p className="text-sm text-slate-600 leading-relaxed">
          Every diagnostic report at ApexPath is critically appraised, correlated, and digitally signed by senior board-certified pathologists with decades of academic and tertiary hospital experience.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {doctors.map((doc, idx) => (
          <div
            key={idx}
            className="bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all p-6 sm:p-7 flex flex-col justify-between"
          >
            <div className="space-y-4">
              {/* Doctor Avatar Header */}
              <div className="flex items-center gap-3.5">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-slate-900 to-sky-900 text-sky-300 flex items-center justify-center font-bold text-xl shadow-md border border-slate-700">
                  {doc.name.split(' ')[1]?.charAt(0) || 'D'}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">{doc.name}</h3>
                  <p className="text-xs font-semibold text-sky-700">{doc.role}</p>
                  <p className="text-[11px] text-slate-400 font-medium">{doc.experience}</p>
                </div>
              </div>

              {/* Registration & Credentials */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1 text-xs">
                <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                  <GraduationCap className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span>{doc.qualification}</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                  <FileCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Reg: {doc.regNo}</span>
                </div>
              </div>

              {/* Bio */}
              <p className="text-xs text-slate-600 leading-relaxed">{doc.bio}</p>

              {/* Expertise */}
              <div className="border-t border-slate-100 pt-3">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Areas of Expertise
                </h4>
                <ul className="space-y-1.5 text-xs text-slate-700">
                  {doc.expertise.map((item, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <CheckCircle className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Verified Practitioner
              </span>
              <span className="text-[11px] text-slate-400">Consultation Available</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
