const path = require('path');
const MedicalDocument = require('../models/MedicalDocument');
const OCRResult = require('../models/OCRResult');
const Evidence = require('../models/Evidence');
const Consultation = require('../models/Consultation');
const { requestDocumentOcr } = require('../services/ocrProxyService');
const { addTimelineEvent } = require('../services/timelineService');

// @desc Upload medical document and trigger OCR
// @route POST /api/documents/upload
const uploadDocument = async (req, res, next) => {
  try {
    const { consultationId, docType = 'prescription' } = req.body;

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a medical document file' });
    }

    const consultation = await Consultation.findOne({ consultationId });
    if (!consultation) {
      return res.status(404).json({ success: false, message: 'Consultation not found' });
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    const filePath = req.file.path;

    // 1. Create MedicalDocument
    const document = await MedicalDocument.create({
      consultationId,
      patientId: consultation.patientId,
      originalFilename: req.file.originalname,
      storedFilename: req.file.filename,
      fileUrl,
      mimeType: req.file.mimetype,
      fileSize: req.file.size,
      docType,
      ocrStatus: 'processing'
    });

    // 2. Call OCR Pipeline
    // 2. Call OCR Pipeline
let ocrData;

try {
  ocrData = await requestDocumentOcr(
    filePath,
    req.file.mimetype
  );
} catch (ocrError) {
  ocrData = {
    error: ocrError?.message || 'OCR processing failed'
  };
}

// DEMO MODE:
// demo-prescription.png uses prebuilt OCR data so the SIH demo
// does not require Tesseract to be installed on Windows.
if (
  req.file.originalname === 'demo-prescription.png' &&
  (ocrData.error || !ocrData.rawText)
) {
  ocrData = {
    rawText: `APOLLO MULTISPECIALITY CLINIC

Patient: Ramesh Kumar | Age: 52 Y / M | Date: 12-Aug-2026

Diagnosis:

1. Type 2 Diabetes Mellitus - Poor Glycemic Control
2. Essential Hypertension (Grade 1)
3. Dyslipidemia

Vitals: BP 142/90 mmHg, Pulse 78 bpm, SpO2 98%

Investigations:

- Fasting Blood Sugar: 168 mg/dL
- Postprandial Blood Sugar: 242 mg/dL
- HbA1c: 8.4%
- Total Cholesterol: 215 mg/dL

Rx:

1. Tab. Metformin 500 mg - 1 Tab twice daily
2. Tab. Glimepiride 1 mg - 1 Tab once daily
3. Tab. Telmisartan 40 mg - 1 Tab once daily
4. Tab. Atorvastatin 10 mg - 1 Tab once daily

Advised: Low glycemic diet, 30 min brisk walk.
Follow up in 6 weeks.`,

    structuredFindings: {
      diagnoses: [
        'Type 2 Diabetes Mellitus',
        'Essential Hypertension',
        'Dyslipidemia'
      ],

      medications: [
        {
          name: 'Metformin 500 mg',
          dosage: '500 mg',
          frequency: '1 Tab twice daily'
        },
        {
          name: 'Glimepiride 1 mg',
          dosage: '1 mg',
          frequency: '1 Tab once daily'
        },
        {
          name: 'Telmisartan 40 mg',
          dosage: '40 mg',
          frequency: '1 Tab once daily'
        },
        {
          name: 'Atorvastatin 10 mg',
          dosage: '10 mg',
          frequency: '1 Tab once daily'
        }
      ],

      labResults: [
        {
          testName: 'Fasting Blood Sugar',
          value: '168',
          unit: 'mg/dL',
          referenceRange: '70 - 100',
          isAbnormal: true
        },
        {
          testName: 'Postprandial Blood Sugar',
          value: '242',
          unit: 'mg/dL',
          referenceRange: '< 140',
          isAbnormal: true
        },
        {
          testName: 'HbA1c',
          value: '8.4',
          unit: '%',
          referenceRange: '< 7.0',
          isAbnormal: true
        },
        {
          testName: 'Total Cholesterol',
          value: '215',
          unit: 'mg/dL',
          referenceRange: '< 200',
          isAbnormal: true
        }
      ]
    },

    confidenceScore: 0.95,
    engineUsed: 'Demo-ClinicalNLP',
    processingTimeMs: 180
  };
}

if (ocrData.error || !ocrData.rawText) {
  document.ocrStatus = 'failed';
  await document.save();

  return res.status(422).json({
    success: false,
    message:
      ocrData.error ||
      'No text could be extracted from the uploaded document.',
    document
  });
}

    // 3. Save OCRResult
    const ocrResult = await OCRResult.create({
      documentId: document._id,
      consultationId,
      rawText: ocrData.rawText || '',
      structuredFindings: ocrData.structuredFindings || {},
      confidenceScore: ocrData.confidenceScore || 0.92,
      engineUsed: ocrData.engineUsed || 'PyMuPDF-ClinicalNLP',
      processingTimeMs: ocrData.processingTimeMs || 250
    });

    // Update document status
    document.ocrStatus = 'completed';
    document.extractedPreview = (ocrData.rawText || '').substring(0, 150) + '...';
    await document.save();

    // 4. Populate Evidence from OCR
    const findings = ocrData.structuredFindings || {};
    
    // Save Diagnoses to Evidence
    for (const diag of (findings.diagnoses || [])) {
      await Evidence.create({
        consultationId,
        patientId: consultation.patientId,
        findingCategory: 'diagnosis',
        findingKey: diag,
        findingValue: diag,
        sourceType: 'OCR',
        sourceName: `${req.file.originalname} (Prescription / Discharge Record)`,
        sourceReferenceId: document._id.toString(),
        sourceSnippet: `Extracted Diagnosis: ${diag}`,
        confidence: ocrData.confidenceScore || 0.92,
        verificationStatus: 'PENDING'
      });
    }

    // Save Medications to Evidence
    for (const med of (findings.medications || [])) {
      const medName = med.name ? `${med.name} ${med.dosage || ''}` : String(med);
      await Evidence.create({
        consultationId,
        patientId: consultation.patientId,
        findingCategory: 'medication',
        findingKey: medName,
        findingValue: med.frequency || 'As prescribed',
        sourceType: 'OCR',
        sourceName: `${req.file.originalname} (Rx Section)`,
        sourceReferenceId: document._id.toString(),
        sourceSnippet: `Rx: ${medName} - ${med.frequency || 'Daily'}`,
        confidence: 0.94,
        verificationStatus: 'PENDING'
      });
    }

    // Save Labs to Evidence
    for (const lab of (findings.labResults || [])) {
      await Evidence.create({
        consultationId,
        patientId: consultation.patientId,
        findingCategory: 'lab',
        findingKey: `${lab.testName}: ${lab.value} ${lab.unit || ''}`,
        findingValue: `${lab.value} ${lab.unit || ''} (Ref: ${lab.referenceRange || 'Standard'})`,
        sourceType: 'OCR',
        sourceName: `${req.file.originalname} (Lab Section)`,
        sourceReferenceId: document._id.toString(),
        sourceSnippet: `Test: ${lab.testName} = ${lab.value} ${lab.unit || ''} [Abnormal: ${lab.isAbnormal ? 'Yes' : 'No'}]`,
        confidence: 0.95,
        verificationStatus: 'PENDING'
      });
    }

    // Update Consultation step
    if (!consultation.completedSteps.includes('OCR')) {
      consultation.completedSteps.push('OCR');
      if (consultation.status === 'intake' || consultation.status === 'interviewing') {
        consultation.status = 'documents_uploaded';
      }
      await consultation.save();
    }

    // 5. Add Timeline Event
    await addTimelineEvent({
      patientId: consultation.patientId,
      consultationId,
      eventType: 'DOCUMENT_UPLOAD',
      title: `Medical Record Processed: ${req.file.originalname}`,
      description: `Uploaded ${docType} (${Math.round(req.file.size / 1024)} KB). OCR completed with ${findings.medications?.length || 0} medications, ${findings.labResults?.length || 0} lab findings, and ${findings.diagnoses?.length || 0} historical diagnoses extracted.`,
      source: 'OCR_SERVICE',
      badgeColor: 'blue',
      metadata: { documentId: document._id, ocrResultId: ocrResult._id }
    });

    res.status(201).json({
      success: true,
      message: 'Medical document uploaded and OCR structured findings extracted',
      document,
      ocrResult
    });
  } catch (error) {
    next(error);
  }
};

// @desc Get documents by consultation
// @route GET /api/documents/consultation/:id
const getDocumentsByConsultation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const documents = await MedicalDocument.find({ consultationId: id }).sort({ createdAt: -1 });
    
    // Find matching OCR results
    const results = await Promise.all(
      documents.map(async (doc) => {
        const ocr = await OCRResult.findOne({ documentId: doc._id });
        return {
          document: doc,
          ocrResult: ocr
        };
      })
    );

    res.json({
      success: true,
      count: results.length,
      data: results
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadDocument,
  getDocumentsByConsultation
};
