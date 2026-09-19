import React, { useState, useEffect } from 'react';

import { useNavigate } from 'react-router-dom';

import api from '../api/client';

import { useCase } from '../context/CaseContext';

import { usePatientLanguage, t } from '../patientI18n';

import {
  FileUp,
  FileText,
  Scan,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  UploadCloud,
  Pill,
  Eye,
  ExternalLink
} from 'lucide-react';

const DocumentUploadPage = () => {
  const navigate = useNavigate();

  const {
    activeConsultationId,
    activePatient,
    refreshCase
  } = useCase();

  const uiLanguage = usePatientLanguage(
    activePatient?.language || 'English'
  );

  const [patientJourneyComplete, setPatientJourneyComplete] =
    useState(false);

  const [documents, setDocuments] = useState([]);

  const [file, setFile] = useState(null);

  const [docType, setDocType] = useState('prescription');

  const [uploading, setUploading] = useState(false);

  const [error, setError] = useState('');

  const [activeOcrResult, setActiveOcrResult] = useState(null);

  const fetchDocuments = async () => {
    if (!activeConsultationId) return;

    try {
      const res = await api.get(
        `/documents/consultation/${activeConsultationId}`
      );

      if (res.data.success) {
        setDocuments(res.data.data);

        if (res.data.data.length > 0) {
          setActiveOcrResult(
            res.data.data[0].ocrResult
          );
        }
      }
    } catch (err) {
      console.warn(
        'Could not fetch documents:',
        err.message
      );
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [activeConsultationId]);

  const handleFileChange = (e) => {
    if (
      e.target.files &&
      e.target.files[0]
    ) {
      setFile(e.target.files[0]);
      setError('');
    }
  };

  const handleUpload = async (
    e,
    demoFile = null
  ) => {
    e?.preventDefault();

    const uploadFile = demoFile || file;

    if (!uploadFile || uploading) {
      return;
    }

    setError('');
    setUploading(true);

    const formData = new FormData();

    formData.append(
      'file',
      uploadFile
    );

    formData.append(
      'consultationId',
      activeConsultationId || ''
    );

    formData.append(
      'docType',
      docType
    );

    console.log(
      'DOCUMENT UPLOAD STARTED'
    );

    console.log(
      'File:',
      uploadFile.name
    );

    console.log(
      'File type:',
      uploadFile.type
    );

    console.log(
      'File size:',
      uploadFile.size
    );

    console.log(
      'Consultation ID:',
      activeConsultationId
    );

    console.log(
      'Document type:',
      docType
    );

    try {
      const res = await api.post(
        '/documents/upload',
        formData,
        {
          headers: {
            'Content-Type':
              'multipart/form-data'
          }
        }
      );

      console.log(
        'DOCUMENT UPLOAD RESPONSE:',
        res.data
      );

      if (res.data.success) {
        setFile(null);

        await fetchDocuments();

        await refreshCase();

        setActiveOcrResult(
          res.data.ocrResult || null
        );

        setError('');
      } else {
        setError(
          res.data.message ||
            'Document upload failed.'
        );
      }
    } catch (err) {
      console.error(
        'Upload & OCR processing failed:',
        err
      );

      console.error(
        'SERVER STATUS:',
        err?.response?.status
      );

      console.error(
        '422 SERVER RESPONSE:',
        err?.response?.data
      );

      setError(
        err?.response?.data?.message ||
          err?.response?.data?.detail ||
          (err?.response?.data
            ? JSON.stringify(
                err.response.data
              )
            : '') ||
          err?.message ||
          t(
            uiLanguage,
            'uploadError'
          )
      );
    } finally {
      setUploading(false);
    }
  };

  /*
   * REAL DEMO OCR
   *
   * Loads the bundled PDF from:
   * frontend/public/apollo_prescription_demo.pdf
   *
   * Then creates a real File object and sends
   * it through the exact same upload/OCR API.
   */
  const handleSimulateSample = async () => {
  try {
    setError('');

    const response = await fetch(
      '/demo-prescription.png'
    );

    if (!response.ok) {
      throw new Error(
        `Demo image not found: ${response.status}`
      );
    }

    const blob = await response.blob();

    const demoFile = new window.File(
      [blob],
      'demo-prescription.png',
      {
        type: 'image/png'
      }
    );

    console.log(
      'REAL DEMO IMAGE CREATED:',
      demoFile
    );

    await handleUpload(
      null,
      demoFile
    );
  } catch (error) {
    console.error(
      'Real demo OCR failed:',
      error?.message,
      error?.response?.data,
      error
    );

    setError(
      error?.message ||
        'Unable to process the demo document.'
    );
  }
};

  const selectedDocument =
    activeOcrResult
      ? documents.find(
          (d) =>
            d.ocrResult?._id ===
            activeOcrResult._id
        )
      : null;

  const apiBaseUrl =
    import.meta.env.VITE_API_URL
      ?.replace(/\/api\/?$/, '') ||
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      ? 'http://localhost:3000'
      : '');

  const sourceDocumentUrl =
    selectedDocument?.document?.fileUrl
      ? `${apiBaseUrl}${selectedDocument.document.fileUrl}`
      : '';

  return (
    <div className="patient-kiosk max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">

      {/* Header */}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">

        <div>

          <div className="flex items-center gap-2 text-ayur-700 text-xs font-bold uppercase tracking-wider mb-1">

            <FileUp className="w-4 h-4" />

            Screen 4 of 12

          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">

            {t(
              uiLanguage,
              'documentsTitle'
            )}

          </h1>

          <p className="text-sm text-slate-500 mt-0.5">

            {t(
              uiLanguage,
              'documentsDescription'
            )}

          </p>

        </div>

        {documents.length > 0 && (
          <button
            onClick={() =>
              setPatientJourneyComplete(
                true
              )
            }
            className="px-5 py-2.5 rounded-xl bg-ayur-600 hover:bg-ayur-700 text-white text-xs font-bold shadow-md shadow-ayur-600/20 inline-flex items-center gap-2 transition"
          >
            <span>
              {t(
                uiLanguage,
                'finishJourney'
              )}
            </span>

            <ArrowRight className="w-4 h-4" />

          </button>
        )}

      </div>

      {/* Error */}

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-2">

          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />

          <span>{error}</span>

        </div>
      )}

      {/* Journey Complete */}

      {patientJourneyComplete &&
        documents.length > 0 && (
          <div className="mb-6 rounded-2xl border-2 border-emerald-300 bg-emerald-50 p-6 sm:p-8 text-center shadow-sm">

            <div className="w-14 h-14 rounded-full bg-white text-emerald-600 flex items-center justify-center mx-auto mb-4 border border-emerald-200">

              <CheckCircle2 className="w-8 h-8" />

            </div>

            <h2 className="text-xl sm:text-2xl font-extrabold text-emerald-950">

              {t(
                uiLanguage,
                'journeyComplete'
              )}

            </h2>

            <p className="text-sm text-emerald-800 mt-2 max-w-xl mx-auto">

              {t(
                uiLanguage,
                'journeyCompleteDesc'
              )}

            </p>

            <button
              onClick={() =>
                navigate(
                  '/cases/reconstruction'
                )
              }
              className="mt-5 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold inline-flex items-center gap-2 transition"
            >
              {t(
                uiLanguage,
                'continueClinical'
              )}

              <ArrowRight className="w-4 h-4" />

            </button>

          </div>
        )}

      {!patientJourneyComplete && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Upload Column */}

          <div className="lg:col-span-5 space-y-6">

            {/* Upload Card */}

            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">

              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">

                <UploadCloud className="w-4 h-4 text-ayur-600" />

                {t(
                  uiLanguage,
                  'documents'
                )}

              </h2>

              <form
                onSubmit={handleUpload}
                className="space-y-4"
              >

                {/* Document Type */}

                <div>

                  <label className="block text-xs font-semibold text-slate-700 mb-1">

                    {t(
                      uiLanguage,
                      'documentCategory'
                    )}

                  </label>

                  <select
                    value={docType}
                    onChange={(e) =>
                      setDocType(
                        e.target.value
                      )
                    }
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-ayur-500"
                  >

                    <option value="prescription">
                      {t(
                        uiLanguage,
                        'prescription'
                      )}
                    </option>

                    <option value="lab_report">
                      {t(
                        uiLanguage,
                        'lab'
                      )}
                    </option>

                    <option value="discharge_summary">
                      {t(
                        uiLanguage,
                        'discharge'
                      )}
                    </option>

                    <option value="other">
                      {t(
                        uiLanguage,
                        'other'
                      )}
                    </option>

                  </select>

                </div>

                {/* File Input */}

                <div className="border-2 border-dashed border-slate-200 hover:border-ayur-500 rounded-xl p-6 text-center transition-colors bg-slate-50/50">

                  <input
                    type="file"
                    id="docFileInput"
                    onChange={
                      handleFileChange
                    }
                    accept=".pdf,.png,.jpg,.jpeg,.webp"
                    className="hidden"
                  />

                  <label
                    htmlFor="docFileInput"
                    className="cursor-pointer block"
                  >

                    <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-2">

                      <Scan className="w-6 h-6" />

                    </div>

                    <span className="text-xs font-bold text-slate-700 block">

                      {file
                        ? file.name
                        : t(
                            uiLanguage,
                            'chooseDocument'
                          )}

                    </span>

                    <span className="text-[11px] text-slate-400 block mt-1">

                      {t(
                        uiLanguage,
                        'maxSize'
                      )}

                    </span>

                  </label>

                </div>

                {/* Buttons */}

                <div className="flex gap-2">

                  <button
                    type="submit"
                    disabled={
                      !file ||
                      uploading
                    }
                    className="flex-1 py-2.5 rounded-xl bg-ayur-600 hover:bg-ayur-700 text-white text-xs font-bold shadow-sm transition disabled:opacity-40"
                  >

                    {uploading
                      ? t(
                          uiLanguage,
                          'processing'
                        )
                      : t(
                          uiLanguage,
                          'uploadExtract'
                        )}

                  </button>

                  {/* Real OCR Demo */}

                  <button
                    type="button"
                    onClick={
                      handleSimulateSample
                    }
                    disabled={uploading}
                    className="px-3 py-2.5 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold flex items-center gap-1 transition disabled:opacity-40"
                    title={
                      uiLanguage ===
                      'Hindi'
                        ? 'बंडल किए गए दस्तावेज़ से OCR चलाएँ'
                        : 'Upload a real bundled document and run the same OCR pipeline'
                    }
                  >

                    <Scan className="w-3.5 h-3.5 text-amber-600" />

                    {t(
                      uiLanguage,
                      'realOcr'
                    )}

                  </button>

                </div>

              </form>

            </div>

            {/* Uploaded Documents */}

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">

              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">

                {t(
                  uiLanguage,
                  'uploadedRecords'
                )}

                {' '}

                ({documents.length})

              </h3>

              {documents.length === 0 ? (
                <p className="text-xs text-slate-400 italic">

                  {t(
                    uiLanguage,
                    'noDocuments'
                  )}

                </p>
              ) : (
                <div className="space-y-2">

                  {documents.map(
                    (item, idx) => (
                      <div
                        key={idx}
                        onClick={() =>
                          setActiveOcrResult(
                            item.ocrResult
                          )
                        }
                        className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                          activeOcrResult?._id ===
                          item.ocrResult?._id
                            ? 'bg-ayur-50 border-ayur-400 shadow-sm'
                            : 'bg-slate-50/70 border-slate-200 hover:bg-slate-100'
                        }`}
                      >

                        <div className="flex items-center gap-2.5 min-w-0">

                          <FileText className="w-4 h-4 text-ayur-600 shrink-0" />

                          <div className="truncate">

                            <div className="text-xs font-bold text-slate-800 truncate">

                              {
                                item
                                  .document
                                  .originalFilename
                              }

                            </div>

                            <div className="text-[10px] text-slate-500 uppercase font-semibold">

                              {item.document.docType ===
                              'prescription'
                                ? t(
                                    uiLanguage,
                                    'prescription'
                                  )
                                : item.document.docType ===
                                  'lab_report'
                                ? t(
                                    uiLanguage,
                                    'lab'
                                  )
                                : item.document.docType ===
                                  'discharge_summary'
                                ? t(
                                    uiLanguage,
                                    'discharge'
                                  )
                                : t(
                                    uiLanguage,
                                    'other'
                                  )}

                              {' • '}

                              {Math.round(
                                item.document
                                  .fileSize /
                                  1024
                              )}{' '}
                              KB

                            </div>

                          </div>

                        </div>

                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full shrink-0">

                          {t(
                            uiLanguage,
                            'ocrDone'
                          )}

                        </span>

                      </div>
                    )
                  )}

                </div>
              )}

            </div>

            {/* Source Document */}

            {activeOcrResult &&
              selectedDocument?.document
                ?.fileUrl && (
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">

                  <div className="flex items-center justify-between mb-3">

                    <div>

                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">

                        <Eye className="w-4 h-4 text-ayur-600" />

                        {t(
                          uiLanguage,
                          'sourceDocument'
                        )}

                      </h3>

                      <p className="text-[10px] text-slate-400 mt-1">

                        {t(
                          uiLanguage,
                          'ocrSourceNote'
                        )}

                      </p>

                    </div>

                    <a
                      href={
                        sourceDocumentUrl
                      }
                      target="_blank"
                      rel="noreferrer"
                      className="text-[10px] font-bold text-ayur-700 inline-flex items-center gap-1"
                    >

                      {t(
                        uiLanguage,
                        'open'
                      )}

                      <ExternalLink className="w-3 h-3" />

                    </a>

                  </div>

                  {String(
                    selectedDocument
                      ?.document
                      ?.mimeType || ''
                  ).startsWith(
                    'image/'
                  ) ? (
                    <img
                      alt={t(
                        uiLanguage,
                        'sourceDocument'
                      )}
                      src={
                        sourceDocumentUrl
                      }
                      className="w-full max-h-96 object-contain rounded-xl border border-slate-200 bg-slate-50"
                    />
                  ) : (
                    <iframe
                      title={t(
                        uiLanguage,
                        'sourceDocument'
                      )}
                      src={
                        sourceDocumentUrl
                      }
                      className="w-full h-72 rounded-xl border border-slate-200 bg-slate-50"
                    />
                  )}

                </div>
              )}

          </div>

          {/* OCR Findings Column */}

          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">

            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">

              <div>

                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">

                  <Scan className="w-4 h-4 text-purple-600" />

                  {t(
                    uiLanguage,
                    'structuredFindings'
                  )}

                </h2>

                <p className="text-xs text-slate-500 mt-0.5">

                  {t(
                    uiLanguage,
                    'engine'
                  )}

                  :{' '}

                  {activeOcrResult
                    ?.engineUsed ||
                    'Real document OCR'}

                  {' • '}

                  {t(
                    uiLanguage,
                    'confidence'
                  )}

                  :{' '}

                  {activeOcrResult
                    ? `${Math.round(
                        activeOcrResult.confidenceScore *
                          100
                      )}%`
                    : 'N/A'}

                </p>

              </div>

              {activeOcrResult && (
                <span className="text-xs font-mono font-bold bg-purple-50 text-purple-700 px-2.5 py-1 rounded-full border border-purple-200">

                  {
                    activeOcrResult.processingTimeMs
                  }
                  ms

                </span>
              )}

            </div>

            {!activeOcrResult ? (
              <div className="text-center py-16 text-slate-400">

                <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />

                <p className="text-sm font-semibold">

                  {t(
                    uiLanguage,
                    'noOcr'
                  )}

                </p>

                <p className="text-xs mt-1">

                  {t(
                    uiLanguage,
                    'uploadOcrHint'
                  )}

                </p>

              </div>
            ) : (
              <div className="space-y-4">

                {/* Diagnoses */}

                <div>

                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1.5">

                    {t(
                      uiLanguage,
                      'diagnoses'
                    )}

                  </span>

                  <div className="flex flex-wrap gap-1.5">

                    {activeOcrResult
                      .structuredFindings
                      ?.diagnoses
                      ?.length > 0 ? (
                      activeOcrResult.structuredFindings.diagnoses.map(
                        (d, i) => (
                          <span
                            key={i}
                            className="px-2.5 py-1 rounded-lg bg-purple-50 border border-purple-200 text-purple-900 text-xs font-bold"
                          >
                            {d}
                          </span>
                        )
                      )
                    ) : (
                      <span className="text-xs text-slate-400 italic">

                        {t(
                          uiLanguage,
                          'noneDetected'
                        )}

                      </span>
                    )}

                  </div>

                </div>

                {/* Medications */}

                <div>

                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1.5">

                    {t(
                      uiLanguage,
                      'prescriptionMeds'
                    )}

                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">

                    {activeOcrResult
                      .structuredFindings
                      ?.medications
                      ?.map(
                        (m, i) => (
                          <div
                            key={i}
                            className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                          >

                            <div className="font-bold text-slate-800 flex items-center gap-1.5">

                              <Pill className="w-3.5 h-3.5 text-blue-600" />

                              {m.name}{' '}

                              {m.dosage}

                            </div>

                            <div className="text-[11px] text-slate-500 mt-0.5">

                              {m.frequency}

                            </div>

                          </div>
                        )
                      )}

                  </div>

                </div>

                {/* Lab Results */}

                <div>

                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1.5">

                    {t(
                      uiLanguage,
                      'investigations'
                    )}

                  </span>

                  <div className="space-y-1.5">

                    {activeOcrResult
                      .structuredFindings
                      ?.labResults
                      ?.map(
                        (lab, i) => (
                          <div
                            key={i}
                            className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
                              lab.isAbnormal
                                ? 'bg-amber-50/70 border-amber-200 text-amber-900'
                                : 'bg-slate-50 border-slate-200 text-slate-800'
                            }`}
                          >

                            <div>

                              <span className="font-bold">

                                {
                                  lab.testName
                                }

                              </span>

                              <span className="text-[11px] text-slate-500 block">

                                {t(
                                  uiLanguage,
                                  'referenceRange'
                                )}

                                :{' '}

                                {lab.referenceRange ||
                                  t(
                                    uiLanguage,
                                    'standard'
                                  )}

                              </span>

                            </div>

                            <div className="text-right">

                              <span className="font-mono font-bold text-sm">

                                {lab.value}{' '}

                                {lab.unit}

                              </span>

                              {lab.isAbnormal && (
                                <span className="text-[10px] block font-bold text-amber-700 uppercase">

                                  {t(
                                    uiLanguage,
                                    'abnormal'
                                  )}

                                </span>
                              )}

                            </div>

                          </div>
                        )
                      )}

                  </div>

                </div>

                {/* Raw OCR Text */}

                <div className="pt-2">

                  <details className="text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">

                    <summary className="font-bold text-slate-600 cursor-pointer">

                      {t(
                        uiLanguage,
                        'rawOcr'
                      )}

                      {' ('}

                      {activeOcrResult.rawText
                        ?.length || 0}

                      {' '}

                      {t(
                        uiLanguage,
                        'chars'
                      )}

                      {')'}

                    </summary>

                    <pre className="mt-2 text-[11px] text-slate-700 whitespace-pre-wrap font-mono max-h-48 overflow-y-auto bg-white p-2.5 rounded-lg border border-slate-200">

                      {
                        activeOcrResult.rawText
                      }

                    </pre>

                  </details>

                </div>

              </div>
            )}

          </div>

        </div>
      )}

    </div>
  );
};

export default DocumentUploadPage;