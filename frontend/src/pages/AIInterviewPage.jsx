import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useCase } from '../context/CaseContext';
import VoiceVisualizer from '../components/VoiceVisualizer';
import { usePatientLanguage, t } from '../patientI18n';

import {
  Mic,
  Send,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  Bot,
  User,
  Activity,
  Pill,
  ShieldAlert,
  Clock
} from 'lucide-react';

const AIInterviewPage = () => {
  const navigate = useNavigate();

  const {
    activeConsultationId,
    activePatient,
    refreshCase
  } = useCase();

  const uiLanguage = usePatientLanguage(
    activePatient?.language || 'English'
  );

  const patientLanguage =
    activePatient?.language || uiLanguage;

  const [session, setSession] = useState(null);
  const [messages, setMessages] = useState([]);

  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);

  const [isComplete, setIsComplete] = useState(false);

  const [suggestedOptions, setSuggestedOptions] = useState([]);

  const [extractedSummary, setExtractedSummary] = useState({});

  const [latestAiText, setLatestAiText] = useState('');

  const [redFlags, setRedFlags] = useState([]);

  /*
   * Confirmation state
   */
  const [confirmationRequired, setConfirmationRequired] =
    useState(false);

  const [pendingAnswer, setPendingAnswer] =
    useState('');

  const [correctionMode, setCorrectionMode] =
    useState(false);

  /*
   * IMPORTANT:
   * Hooks MUST be inside the component.
   *
   * confirmationRef prevents duplicate voice transcripts
   * from replacing the answer currently waiting for confirmation.
   */
  const chatEndRef = useRef(null);
  const confirmationRef = useRef(false);

  /*
   * Initialize interview session
   */
  useEffect(() => {
    if (!activeConsultationId) return;

    const initSession = async () => {
      setLoading(true);

      try {
        const res = await api.post('/interview/session', {
          consultationId: activeConsultationId
        });

        if (res.data.success) {
          setSession(res.data.session);

          setMessages(
            res.data.messages || []
          );

          const lastMsg =
            res.data.messages?.slice(-1)[0];

          if (
            lastMsg &&
            lastMsg.sender === 'ai'
          ) {
            setLatestAiText(lastMsg.text);
          }

          if (
            res.data.session?.status ===
            'completed'
          ) {
            setIsComplete(true);
          }

          /*
           * Restore confirmation if the page was refreshed
           * while an answer was waiting for confirmation.
           */
          if (
            res.data.session?.pendingConfirmation?.active
          ) {
            confirmationRef.current = true;

            setConfirmationRequired(true);

            setPendingAnswer(
              res.data.session.pendingConfirmation.answer || ''
            );
          }

          /*
           * Restore extracted summary.
           */
          if (
            res.data.session?.extractedSummary
          ) {
            setExtractedSummary(
              res.data.session.extractedSummary
            );
          }
        }
      } catch (err) {
        console.error(
          'Failed to init interview session:',
          err
        );
      } finally {
        setLoading(false);
      }
    };

    initSession();
  }, [activeConsultationId]);

  /*
   * Scroll chat to bottom
   */
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({
      behavior: 'smooth'
    });
  }, [messages]);

  /*
   * Merge extracted clinical entities
   */
  const applyExtractedEntities = (
    entities = {}
  ) => {
    setExtractedSummary((previous) => {
      const next = {
        ...previous,
        ...entities
      };

      if (entities.symptoms) {
        next.symptoms = [
          ...new Set([
            ...(previous.symptoms || []),
            ...entities.symptoms
          ])
        ];
      }

      if (entities.medications) {
        next.medications = [
          ...new Set([
            ...(previous.medications || []),
            ...entities.medications
          ])
        ];
      }

      if (entities.allergies) {
        next.allergies = [
          ...new Set([
            ...(previous.allergies || []),
            ...entities.allergies
          ])
        ];
      }

      if (entities.associatedSymptoms) {
        next.associatedSymptoms = [
          ...new Set([
            ...(previous.associatedSymptoms || []),
            ...entities.associatedSymptoms
          ])
        ];
      }

      return next;
    });

    if (entities.redFlags?.length) {
      setRedFlags((previous) => {
        const merged = [
          ...previous,
          ...entities.redFlags
        ];

        return merged.filter(
          (item, index, array) =>
            array.findIndex(
              (x) =>
                x.label === item.label
            ) === index
        );
      });
    }
  };

  /*
   * Normal answer submission
   *
   * Text answers continue through the normal backend flow.
   */
  const handleSendMessage = async (
    textToSend,
    inputType = 'text'
  ) => {
    const text =
      textToSend || inputText;

    if (!text?.trim() || loading) {
      return;
    }

    setInputText('');
    setLoading(true);

    try {
      const res = await api.post(
        '/interview/message',
        {
          consultationId:
            activeConsultationId,

          text: text.trim(),

          inputType
        }
      );

      if (res.data.success) {
        /*
         * Add returned messages.
         */
        setMessages((previous) => [
          ...previous,

          ...(res.data.patientMessage
            ? [res.data.patientMessage]
            : []),

          ...(res.data.aiMessage
            ? [res.data.aiMessage]
            : [])
        ]);

        if (res.data.aiMessage?.text) {
          setLatestAiText(
            res.data.aiMessage.text
          );
        }

        setSuggestedOptions(
          res.data.suggestedOptions || []
        );

        /*
         * Confirmation required.
         */
        if (
          res.data.confirmationRequired
        ) {
          confirmationRef.current = true;

          setConfirmationRequired(true);

          setPendingAnswer(
            res.data.pendingAnswer ||
              text.trim()
          );

          setCorrectionMode(false);
        }

        /*
         * Confirmation resolved.
         */
        if (
          res.data.confirmationResolved
        ) {
          confirmationRef.current = false;

          setConfirmationRequired(false);

          setPendingAnswer('');

          setCorrectionMode(false);
        }

        if (
          res.data.extractedEntities
        ) {
          applyExtractedEntities(
            res.data.extractedEntities
          );
        }

        if (res.data.isComplete) {
          setIsComplete(true);

          try {
            await refreshCase();
          } catch (refreshError) {
            console.warn(
              'Case refresh failed:',
              refreshError
            );
          }
        }

        if (res.data.session) {
          setSession(res.data.session);
        }
      }
    } catch (err) {
      console.error(
        'Error sending interview message:',
        err
      );

      alert(
        uiLanguage === 'Hindi'
          ? 'जवाब भेजने में समस्या हुई। कृपया फिर कोशिश करें।'
          : `${t(
              uiLanguage,
              'interviewError'
            )} ${
              err.response?.data?.message ||
              err.message
            }`
      );
    } finally {
      setLoading(false);
    }
  };

  /*
   * Voice transcript from normal interview.
   *
   * VoiceVisualizer.jsx is NOT modified.
   *
   * First voice transcript is placed into confirmation.
   * Duplicate transcripts are ignored until confirmation
   * or correction is completed.
   */
  const handleVoiceTranscript = (transcript) => {
    console.log(
      'VOICE TRANSCRIPT RECEIVED:',
      transcript
    );

    if (!transcript?.trim()) {
      return;
    }

    /*
     * Ref is used instead of state because React state
     * can have a stale closure during rapid voice events.
     */
    if (confirmationRef.current) {
      console.log(
        'Ignoring additional voice transcript while confirmation is active:',
        transcript
      );

      return;
    }

    const cleanedTranscript =
      transcript.trim();

    /*
     * Lock immediately.
     */
    confirmationRef.current = true;

    setPendingAnswer(
      cleanedTranscript
    );

    setConfirmationRequired(true);

    setCorrectionMode(false);

    setInputText('');
  };

  /*
   * Patient confirms the interpreted answer.
   */
  const handleConfirmAnswer = async () => {
    if (
      !pendingAnswer ||
      loading
    ) {
      return;
    }

    setLoading(true);

    try {
      const res = await api.post(
        '/interview/message',
        {
          consultationId:
            activeConsultationId,

          text: pendingAnswer,

          inputType: 'text',

          confirmationAction:
            'confirm'
        }
      );

      if (res.data.success) {
        /*
         * Unlock voice input.
         */
        confirmationRef.current = false;

        setConfirmationRequired(false);

        setPendingAnswer('');

        setCorrectionMode(false);

        setMessages((previous) => [
          ...previous,

          ...(res.data.patientMessage
            ? [res.data.patientMessage]
            : []),

          ...(res.data.aiMessage
            ? [res.data.aiMessage]
            : [])
        ]);

        if (res.data.aiMessage?.text) {
          setLatestAiText(
            res.data.aiMessage.text
          );
        }

        setSuggestedOptions(
          res.data.suggestedOptions || []
        );

        if (
          res.data.extractedEntities
        ) {
          applyExtractedEntities(
            res.data.extractedEntities
          );
        }

        if (res.data.isComplete) {
          setIsComplete(true);

          try {
            await refreshCase();
          } catch (error) {
            console.warn(
              'Case refresh failed:',
              error
            );
          }
        }

        if (res.data.session) {
          setSession(res.data.session);
        }
      }
    } catch (err) {
      console.error(
        'Confirmation error:',
        err
      );

      alert(
        'Unable to confirm the answer. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  /*
   * Patient corrects the answer using voice or text.
   */
  const handleCorrection = async (
  correctedText,
  inputType = 'text'
) => {
  if (
    !correctedText?.trim() ||
    loading
  ) {
    return;
  }

  const finalText = correctedText.trim();

  console.log(
    'CORRECTION SUBMIT:',
    {
      text: finalText,
      inputType,
      consultationId:
        activeConsultationId
    }
  );

  setInputText('');
  setLoading(true);

  try {
    const res = await api.post(
      '/interview/message',
      {
        consultationId:
          activeConsultationId,

        text: finalText,

        inputType,

        confirmationAction: 'correct'
      }
    );

    console.log(
      'CORRECTION RESPONSE:',
      res.data
    );

    /*
     * IMPORTANT:
     * Backend is asking for confirmation again.
     * Show the newly corrected answer instead of
     * immediately closing confirmation mode.
     */
    if (
      res.data.success &&
      res.data.requiresConfirmation
    ) {
      confirmationRef.current = true;

      setConfirmationRequired(true);

      setPendingAnswer(
        res.data.interpretedAnswer ||
        finalText
      );

      setCorrectionMode(false);

      /*
       * If backend gives a new confirmation prompt,
       * show it as the latest AI message.
       */
      if (res.data.confirmationPrompt) {
        setMessages((previous) => [
          ...previous,
          {
            sender: 'ai',
            text: res.data.confirmationPrompt,
            inputType: 'system',
            createdAt:
              new Date().toISOString()
          }
        ]);

        setLatestAiText(
          res.data.confirmationPrompt
        );
      }

      return;
    }

    /*
     * Normal successful correction
     */
    if (res.data.success) {
      confirmationRef.current = false;

      setConfirmationRequired(false);

      setPendingAnswer('');

      setCorrectionMode(false);

      setMessages((previous) => [
        ...previous,

        ...(res.data.patientMessage
          ? [res.data.patientMessage]
          : []),

        ...(res.data.aiMessage
          ? [res.data.aiMessage]
          : [])
      ]);

      if (res.data.aiMessage?.text) {
        setLatestAiText(
          res.data.aiMessage.text
        );
      }

      setSuggestedOptions(
        res.data.suggestedOptions || []
      );

      if (
        res.data.extractedEntities
      ) {
        applyExtractedEntities(
          res.data.extractedEntities
        );
      }

      if (res.data.isComplete) {
        setIsComplete(true);

        try {
          await refreshCase();
        } catch (error) {
          console.warn(
            'Case refresh failed:',
            error
          );
        }
      }

      if (res.data.session) {
        setSession(
          res.data.session
        );
      }
    }

  } catch (err) {
    console.error(
      'VOICE/TEXT CORRECTION ERROR:',
      err
    );

    console.error(
      'SERVER RESPONSE:',
      err.response?.data
    );

    alert(
      err.response?.data?.message ||
      'Unable to submit correction.'
    );

  } finally {
    setLoading(false);
  }
};
  /*
   * Voice correction.
   */
 const handleVoiceCorrection = (transcript) => {
  console.log(
    'VOICE CORRECTION RECEIVED:',
    transcript
  );

  if (!transcript?.trim()) {
    console.log('Empty voice correction');
    return;
  }

  const correctedText = transcript.trim();

  console.log(
    'SUBMITTING VOICE CORRECTION:',
    correctedText
  );

  handleCorrection(
    correctedText,
    'voice'
  );
};

  /*
   * Progress
   */
  const stepIndex =
    session?.currentStepIndex ??
    messages.filter(
      (message) =>
        message.sender === 'ai'
    ).length;

  const totalSteps =
    session?.totalStepsExpected || 6;

  const progressPct = Math.min(
    Math.round(
      (stepIndex / totalSteps) * 100
    ),
    100
  );

  return (
    <div className="patient-kiosk max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">

        <div>
          <div className="flex items-center gap-2 text-ayur-700 text-xs font-bold uppercase tracking-wider mb-1">

            <Mic className="w-4 h-4" />

            Screen 3 of 12
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">

            {t(
              uiLanguage,
              'voiceInterview'
            )}

          </h1>

          <p className="text-sm text-slate-500 mt-0.5">

            Active{' '}

            {t(
              uiLanguage,
              'patient'
            )}

            :{' '}

            <span className="font-bold text-slate-700">

              {activePatient?.name ||
                'Ramesh Kumar'}

            </span>{' '}

            ({activeConsultationId})

          </p>
        </div>

        {/* PROGRESS */}
        <div className="w-full sm:w-64 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">

          <div className="flex justify-between text-xs font-bold mb-1.5">

            <span className="text-slate-600">

              {t(
                uiLanguage,
                'interviewProgress'
              )}

            </span>

            <span className="text-ayur-700">

              {progressPct}%

            </span>

          </div>

          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">

            <div
              className="bg-gradient-to-r from-ayur-600 to-emerald-400 h-2 rounded-full transition-all duration-500"
              style={{
                width: `${progressPct}%`
              }}
            />

          </div>

        </div>

      </div>

      {/* RED FLAGS */}
      {redFlags.length > 0 && (
        <div className="mb-5 p-4 rounded-2xl bg-rose-50 border border-rose-300 flex items-start gap-3 shadow-sm">

          <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />

          <div>

            <div className="text-xs font-extrabold uppercase tracking-wider text-rose-900">

              {t(
                uiLanguage,
                'safetyFlag'
              )}

            </div>

            <div className="text-sm font-semibold text-rose-800 mt-1">

              {redFlags
                .map(
                  (flag) =>
                    flag.label
                )
                .join(' • ')}

            </div>

            <p className="text-[11px] text-rose-700 mt-1">

              {t(
                uiLanguage,
                'safetyNote'
              )}

            </p>

          </div>

        </div>
      )}

      {/* LANGUAGE */}
      <div className="mb-5 p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-sky-50 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">

        <div>

          <div className="text-xs font-bold uppercase tracking-wider text-emerald-800">

            {t(
              uiLanguage,
              'multilingual'
            )}

          </div>

          <p className="text-xs text-slate-600 mt-1">

            {t(
              uiLanguage,
              'language'
            )}

            : <b>{patientLanguage}</b> •{' '}

            {t(
              uiLanguage,
              'languageNote'
            )}

          </p>

        </div>

        <span className="px-3 py-1.5 rounded-full bg-white border border-emerald-200 text-[10px] font-bold text-emerald-700">

          {patientLanguage ===
          'Hindi'
            ? 'हिंदी सक्रिय'
            : `${patientLanguage} ${t(
                uiLanguage,
                'languageActive'
              )}`}

        </span>

      </div>

      {/* INSTRUCTIONS */}
      <div className="mb-5 rounded-2xl border border-sky-200 bg-sky-50/70 p-4 sm:p-5">

        <div className="text-sm sm:text-base font-bold text-sky-950">

          {t(
            uiLanguage,
            'instructions'
          )}

        </div>

        <div className="text-xs sm:text-sm text-sky-800 mt-1">

          {t(
            uiLanguage,
            'step'
          )}{' '}

          {Math.min(
            stepIndex + 1,
            totalSteps
          )}{' '}

          •{' '}

          {t(
            uiLanguage,
            'interview'
          )}

        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* CHAT */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[560px]">

          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">

            {messages.map(
              (message, index) => (

                <div
                  key={
                    message._id ||
                    `${message.createdAt || ''}-${index}`
                  }
                  className={`flex items-start gap-3 ${
                    message.sender ===
                    'patient'
                      ? 'flex-row-reverse'
                      : ''
                  }`}
                >

                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      message.sender ===
                      'patient'
                        ? 'bg-clinical-600 text-white'
                        : 'bg-ayur-600 text-white shadow-sm shadow-ayur-600/30'
                    }`}
                  >

                    {message.sender ===
                    'patient' ? (

                      <User className="w-4 h-4" />

                    ) : (

                      <Bot className="w-4 h-4" />

                    )}

                  </div>

                  <div
                    className={`max-w-[80%] rounded-2xl p-4 text-sm leading-relaxed ${
                      message.sender ===
                      'patient'
                        ? 'bg-clinical-600 text-white rounded-tr-none'
                        : 'bg-slate-50 border border-slate-200/80 text-slate-800 rounded-tl-none'
                    }`}
                  >

                    <div className="flex items-center justify-between gap-2 mb-1">

                      <span className="text-[10px] font-bold uppercase tracking-wider opacity-75">

                        {message.sender ===
                        'patient'
                          ? t(
                              uiLanguage,
                              'patient'
                            )
                          : t(
                              uiLanguage,
                              'ai'
                            )}

                      </span>

                      {message.inputType ===
                        'voice' && (

                        <span className="inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded bg-white/20 font-semibold">

                          <Mic className="w-2.5 h-2.5" />

                          {t(
                            uiLanguage,
                            'voice'
                          )}

                        </span>

                      )}

                    </div>

                    <p>
                      {message.text}
                    </p>

                  </div>

                </div>
              )
            )}

            {loading && (

              <div className="flex items-start gap-3">

                <div className="w-8 h-8 rounded-full bg-ayur-600 text-white flex items-center justify-center shrink-0">

                  <Bot className="w-4 h-4" />

                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-2xl rounded-tl-none p-3 text-xs text-slate-500 flex items-center gap-2">

                  <span className="w-2 h-2 rounded-full bg-ayur-500 animate-ping" />

                  {t(
                    uiLanguage,
                    'thinking'
                  )}

                </div>

              </div>

            )}

            <div ref={chatEndRef} />

          </div>

          {/* QUICK OPTIONS */}
          {suggestedOptions.length >
            0 &&
            !isComplete &&
            !confirmationRequired && (

              <div className="px-4 py-2 border-t border-slate-100 bg-slate-50/60 flex items-center gap-1.5 overflow-x-auto">

                <span className="text-[10px] font-bold text-slate-400 uppercase shrink-0">

                  {t(
                    uiLanguage,
                    'suggestions'
                  )}

                  :

                </span>

                {suggestedOptions.map(
                  (option, index) => (

                    <button
                      key={index}
                      onClick={() =>
                        handleSendMessage(
                          option,
                          'text'
                        )
                      }
                      disabled={loading}
                      className="px-2.5 py-1 rounded-full bg-white border border-slate-200 hover:border-ayur-400 text-slate-700 text-xs font-medium whitespace-nowrap hover:bg-ayur-50 hover:text-ayur-900 transition disabled:opacity-50"
                    >

                      {option}

                    </button>

                  )
                )}

              </div>
            )}

          {/* CONTROLS */}
          <div className="p-4 border-t border-slate-200 bg-slate-50/50 rounded-b-2xl">

            {isComplete ? (

              <div className="flex items-center justify-between gap-4 p-2 bg-emerald-50 border border-emerald-200 rounded-xl">

                <div className="flex items-center gap-2 text-emerald-800 text-xs font-bold">

                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />

                  {t(
                    uiLanguage,
                    'interviewComplete'
                  )}

                </div>

                <button
                  onClick={() =>
                    navigate(
                      '/documents'
                    )
                  }
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm inline-flex items-center gap-1.5 transition"
                >

                  <span>

                    {t(
                      uiLanguage,
                      'uploadDocuments'
                    )}

                  </span>

                  <ArrowRight className="w-3.5 h-3.5" />

                </button>

              </div>

            ) : confirmationRequired ? (

              /* CONFIRMATION UI */
              <div className="space-y-3">

                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">

                  <div className="text-sm font-bold text-amber-900">

                    {patientLanguage ===
                    'Hindi'
                      ? 'कृपया अपना उत्तर सत्यापित करें'
                      : 'Please confirm your answer'}

                  </div>

                  <div className="text-xs text-amber-800 mt-1">

                    {patientLanguage ===
                    'Hindi'
                      ? 'मैंने समझा:'
                      : 'I understood:'}

                  </div>

                  <div className="mt-2 p-3 bg-white rounded-lg border border-amber-200 text-sm font-semibold text-slate-800">

                    {pendingAnswer}

                  </div>

                </div>

                <div className="flex flex-wrap gap-2">

                  <button
                    type="button"
                    onClick={
                      handleConfirmAnswer
                    }
                    disabled={loading}
                    className="flex-1 min-w-[150px] px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold disabled:opacity-50"
                  >

                    ✓{' '}

                    {patientLanguage ===
                    'Hindi'
                      ? 'हाँ, सही है'
                      : "Yes, that's correct"}

                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setCorrectionMode(
                        true
                      );

                      setInputText('');
                    }}
                    disabled={loading}
                    className="flex-1 min-w-[150px] px-4 py-3 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 text-sm font-bold disabled:opacity-50"
                  >

                    ✎{' '}

                    {patientLanguage ===
                    'Hindi'
                      ? 'उत्तर बदलें'
                      : 'Change my answer'}

                  </button>

                </div>

                {correctionMode && (

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">

                    <div className="text-xs font-bold text-slate-700 mb-2">

                      {patientLanguage ===
                      'Hindi'
                        ? 'सही उत्तर बोलें या टाइप करें'
                        : 'Speak or type your corrected answer'}

                    </div>

                    <div className="flex items-center gap-3">

                      <VoiceVisualizer
                        onTranscript={
                          handleVoiceCorrection
                        }
                        textToSpeak=""
                        language={
                          patientLanguage
                        }
                      />

                      <input
                        type="text"
                        value={
                          inputText
                        }
                        onChange={(event) =>
                          setInputText(
                            event.target.value
                          )
                        }
                        onKeyDown={(
                          event
                        ) => {

                          if (
                            event.key ===
                              'Enter' &&
                            inputText.trim()
                          ) {

                            handleCorrection(
                              inputText,
                              'text'
                            );

                          }

                        }}
                        placeholder={
                          patientLanguage ===
                          'Hindi'
                            ? 'सही उत्तर टाइप करें...'
                            : 'Type your corrected answer...'
                        }
                        className="flex-1 px-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-ayur-500"
                        disabled={
                          loading
                        }
                      />

                      <button
                        type="button"
                        disabled={
                          loading ||
                          !inputText.trim()
                        }
                        onClick={() =>
                          handleCorrection(
                            inputText,
                            'text'
                          )
                        }
                        className="p-2.5 rounded-xl bg-ayur-600 hover:bg-ayur-700 text-white disabled:opacity-40"
                      >

                        <Send className="w-4 h-4" />

                      </button>

                    </div>

                  </div>
                )}

              </div>

            ) : (

              /* NORMAL INTERVIEW CONTROLS */
              <div className="flex items-center gap-3">

                <VoiceVisualizer
                  onTranscript={
                    handleVoiceTranscript
                  }
                  textToSpeak={
                    latestAiText
                  }
                  language={
                    patientLanguage
                  }
                />

                <input
                  type="text"
                  value={
                    inputText
                  }
                  onChange={(event) =>
                    setInputText(
                      event.target.value
                    )
                  }
                  onKeyDown={(event) => {

                    if (
                      event.key ===
                        'Enter' &&
                      inputText.trim()
                    ) {

                      handleSendMessage(
                        inputText,
                        'text'
                      );

                    }

                  }}
                  placeholder={t(
                    uiLanguage,
                    'typeAnswer'
                  )}
                  className="flex-1 px-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-ayur-500"
                  disabled={loading}
                />

                <button
                  type="button"
                  onClick={() =>
                    handleSendMessage(
                      inputText,
                      'text'
                    )
                  }
                  disabled={
                    loading ||
                    !inputText.trim()
                  }
                  className="p-2.5 rounded-xl bg-ayur-600 hover:bg-ayur-700 text-white transition shadow-sm shadow-ayur-600/20 disabled:opacity-40"
                  title={t(
                    uiLanguage,
                    'sendAnswer'
                  )}
                >

                  <Send className="w-4 h-4" />

                </button>

              </div>

            )}

          </div>

        </div>

        {/* CLINICAL EXTRACTION */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">

          <div className="flex items-center justify-between pb-3 border-b border-slate-100">

            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">

              <Sparkles className="w-4 h-4 text-amber-500" />

              {t(
                uiLanguage,
                'clinicalExtraction'
              )}

            </h2>

            <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">

              Live NLP

            </span>

          </div>

          <div className="space-y-3 text-xs">

            {/* SYMPTOMS */}
            <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-100">

              <span className="font-bold text-emerald-900 flex items-center gap-1 mb-1">

                <Activity className="w-3.5 h-3.5 text-emerald-600" />

                {t(
                  uiLanguage,
                  'symptoms'
                )}

              </span>

              <div className="flex flex-wrap gap-1">

                {extractedSummary.symptoms?.length >
                0 ? (

                  extractedSummary.symptoms.map(
                    (symptom, index) => (

                      <span
                        key={index}
                        className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-medium"
                      >

                        {symptom}

                      </span>

                    )
                  )

                ) : (

                  <span className="text-slate-400 italic">

                    {t(
                      uiLanguage,
                      'listening'
                    )}

                  </span>

                )}

              </div>

            </div>

            {/* DURATION / SEVERITY */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">

              <span className="font-bold text-slate-700 flex items-center gap-1 mb-1">

                <Clock className="w-3.5 h-3.5 text-slate-500" />

                {t(
                  uiLanguage,
                  'durationSeverity'
                )}

              </span>

              <p className="text-slate-600">

                {t(
                  uiLanguage,
                  'duration'
                )}
                :{' '}

                <span className="font-semibold text-slate-800">

                  {extractedSummary.duration ||
                    (uiLanguage ===
                    'Hindi'
                      ? '3-5 दिन'
                      : '3-5 days')}

                </span>

              </p>

              <p className="text-slate-600">

                {t(
                  uiLanguage,
                  'severity'
                )}
                :{' '}

                <span className="font-semibold text-slate-800">

                  {extractedSummary.severity ||
                    (uiLanguage ===
                    'Hindi'
                      ? 'मध्यम'
                      : 'Moderate')}

                </span>

              </p>

            </div>

            {/* MEDICATIONS */}
            <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-100">

              <span className="font-bold text-blue-900 flex items-center gap-1 mb-1">

                <Pill className="w-3.5 h-3.5 text-blue-600" />

                {t(
                  uiLanguage,
                  'medications'
                )}

              </span>

              <div className="flex flex-wrap gap-1">

                {extractedSummary.medications?.length >
                0 ? (

                  extractedSummary.medications.map(
                    (medication, index) => (

                      <span
                        key={index}
                        className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-medium"
                      >

                        {medication}

                      </span>

                    )
                  )

                ) : (

                  <span className="text-slate-400 italic">

                    {t(
                      uiLanguage,
                      'noneLogged'
                    )}

                  </span>

                )}

              </div>

            </div>

            {/* ALLERGIES */}
            <div className="p-3 rounded-xl bg-rose-50/70 border border-rose-100">

              <span className="font-bold text-rose-900 flex items-center gap-1 mb-1">

                <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />

                {t(
                  uiLanguage,
                  'allergies'
                )}

              </span>

              <p className="text-rose-800">

                {extractedSummary.allergies?.length >
                0
                  ? extractedSummary.allergies.join(
                      ', '
                    )
                  : t(
                      uiLanguage,
                      'noAllergies'
                    )}

              </p>

            </div>

          </div>

          <div className="pt-3 border-t border-slate-100">

            <button
              onClick={() =>
                navigate(
                  '/documents'
                )
              }
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition"
            >

              <span>

                {t(
                  uiLanguage,
                  'skipNextDocuments'
                )}

              </span>

              <ArrowRight className="w-3.5 h-3.5" />

            </button>

          </div>

        </div>

      </div>

    </div>
  );
};

export default AIInterviewPage;