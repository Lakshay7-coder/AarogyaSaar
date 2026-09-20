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

  const [confirmationRequired, setConfirmationRequired] =
    useState(false);

  const [pendingAnswer, setPendingAnswer] =
    useState('');

  const [correctionMode, setCorrectionMode] =
    useState(false);

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

          if (
            res.data.session?.pendingConfirmation?.active
          ) {
            confirmationRef.current = true;

            setConfirmationRequired(true);

            setPendingAnswer(
              res.data.session.pendingConfirmation.answer || ''
            );
          }

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
              (x) => x.label === item.label
            ) === index
        );
      });
    }
  };

  /*
   * Normal answer submission
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
   * Voice transcript
   */
  const handleVoiceTranscript = (transcript) => {
    console.log(
      'VOICE TRANSCRIPT RECEIVED:',
      transcript
    );

    if (!transcript?.trim()) {
      return;
    }

    if (confirmationRef.current) {
      console.log(
        'Ignoring additional voice transcript while confirmation is active:',
        transcript
      );

      return;
    }

    const cleanedTranscript =
      transcript.trim();

    confirmationRef.current = true;

    setPendingAnswer(
      cleanedTranscript
    );

    setConfirmationRequired(true);

    setCorrectionMode(false);

    setInputText('');
  };

  /*
   * Patient confirms answer
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
   * Patient correction
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

    const finalText =
      correctedText.trim();

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

          confirmationAction:
            'correct'
        }
      );

      console.log(
        'CORRECTION RESPONSE:',
        res.data
      );

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

        if (
          res.data.confirmationPrompt
        ) {
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
   * Voice correction
   */
  const handleVoiceCorrection = (
    transcript
  ) => {
    console.log(
      'VOICE CORRECTION RECEIVED:',
      transcript
    );

    if (!transcript?.trim()) {
      console.log(
        'Empty voice correction'
      );

      return;
    }

    const correctedText =
      transcript.trim();

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
    <div
      className="
        patient-kiosk
        w-full
        min-w-0
        max-w-6xl
        mx-auto
        overflow-x-hidden
        px-3
        py-4
        sm:px-6
        sm:py-6
        lg:px-8
        lg:py-8
      "
    >

      {/* HEADER */}
      <div
        className="
          mb-5
          flex
          min-w-0
          flex-col
          gap-4
          sm:mb-6
          sm:flex-row
          sm:items-center
          sm:justify-between
        "
      >

        <div className="min-w-0">

          <div
            className="
              mb-1
              flex
              min-w-0
              items-center
              gap-2
              text-ayur-700
              text-xs
              font-bold
              uppercase
              tracking-wider
            "
          >

            <Mic className="h-4 w-4 shrink-0" />

            <span>
              Screen 3 of 12
            </span>

          </div>

          <h1
            className="
              break-words
              text-2xl
              font-extrabold
              tracking-tight
              text-slate-900
              sm:text-3xl
            "
          >
            {t(
              uiLanguage,
              'voiceInterview'
            )}
          </h1>

          <p
            className="
              mt-0.5
              break-words
              text-sm
              text-slate-500
            "
          >
            Active{' '}

            {t(
              uiLanguage,
              'patient'
            )}

            :{' '}

            <span
              className="
                font-bold
                text-slate-700
              "
            >
              {activePatient?.name ||
                'Ramesh Kumar'}
            </span>{' '}

            ({activeConsultationId})
          </p>

        </div>

        {/* PROGRESS */}
        <div
          className="
            w-full
            min-w-0
            rounded-xl
            border
            border-slate-200
            bg-white
            p-3
            shadow-sm
            sm:w-64
            sm:shrink-0
          "
        >

          <div
            className="
              mb-1.5
              flex
              justify-between
              gap-3
              text-xs
              font-bold
            "
          >

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

          <div
            className="
              h-2
              w-full
              overflow-hidden
              rounded-full
              bg-slate-100
            "
          >

            <div
              className="
                h-2
                rounded-full
                bg-gradient-to-r
                from-ayur-600
                to-emerald-400
                transition-all
                duration-500
              "
              style={{
                width: `${progressPct}%`
              }}
            />

          </div>

        </div>

      </div>

      {/* RED FLAGS */}
      {redFlags.length > 0 && (
        <div
          className="
            mb-5
            flex
            min-w-0
            items-start
            gap-3
            rounded-2xl
            border
            border-rose-300
            bg-rose-50
            p-4
            shadow-sm
          "
        >

          <ShieldAlert
            className="
              mt-0.5
              h-5
              w-5
              shrink-0
              text-rose-600
            "
          />

          <div className="min-w-0">

            <div
              className="
                text-xs
                font-extrabold
                uppercase
                tracking-wider
                text-rose-900
              "
            >
              {t(
                uiLanguage,
                'safetyFlag'
              )}
            </div>

            <div
              className="
                mt-1
                break-words
                text-sm
                font-semibold
                text-rose-800
              "
            >
              {redFlags
                .map(
                  (flag) =>
                    flag.label
                )
                .join(' • ')}
            </div>

            <p
              className="
                mt-1
                break-words
                text-[11px]
                text-rose-700
              "
            >
              {t(
                uiLanguage,
                'safetyNote'
              )}
            </p>

          </div>

        </div>
      )}

      {/* LANGUAGE */}
      <div
        className="
          mb-5
          flex
          min-w-0
          flex-col
          gap-3
          rounded-2xl
          border
          border-emerald-200
          bg-gradient-to-r
          from-emerald-50
          to-sky-50
          p-4
          sm:flex-row
          sm:items-center
          sm:justify-between
        "
      >

        <div className="min-w-0">

          <div
            className="
              text-xs
              font-bold
              uppercase
              tracking-wider
              text-emerald-800
            "
          >
            {t(
              uiLanguage,
              'multilingual'
            )}
          </div>

          <p
            className="
              mt-1
              break-words
              text-xs
              text-slate-600
            "
          >
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

        <span
          className="
            w-fit
            max-w-full
            shrink-0
            break-words
            rounded-full
            border
            border-emerald-200
            bg-white
            px-3
            py-1.5
            text-[10px]
            font-bold
            text-emerald-700
          "
        >
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
      <div
        className="
          mb-5
          min-w-0
          rounded-2xl
          border
          border-sky-200
          bg-sky-50/70
          p-4
          sm:p-5
        "
      >

        <div
          className="
            break-words
            text-sm
            font-bold
            text-sky-950
            sm:text-base
          "
        >
          {t(
            uiLanguage,
            'instructions'
          )}
        </div>

        <div
          className="
            mt-1
            break-words
            text-xs
            text-sky-800
            sm:text-sm
          "
        >
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

      {/* MAIN RESPONSIVE LAYOUT */}
      <div
        className="
          grid
          min-w-0
          grid-cols-1
          gap-5
          xl:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]
          xl:gap-6
        "
      >

        {/* =====================================================
            AI VOICE INTERVIEW
        ====================================================== */}
        <div
          className="
            min-w-0
            overflow-hidden
            rounded-2xl
            border
            border-slate-200
            bg-white
            shadow-sm
          "
        >

          {/* CHAT AREA */}
          <div
            className="
              flex
              min-h-[420px]
              flex-col
              sm:min-h-[480px]
              xl:h-[560px]
              xl:min-h-0
            "
          >

            <div
              className="
                min-h-0
                flex-1
                overflow-y-auto
                overflow-x-hidden
                p-3
                sm:p-5
                xl:p-6
              "
            >

              <div className="space-y-4">

                {messages.map(
                  (message, index) => (

                    <div
                      key={
                        message._id ||
                        `${message.createdAt || ''}-${index}`
                      }
                      className={`
                        flex
                        min-w-0
                        items-start
                        gap-2.5
                        sm:gap-3
                        ${
                          message.sender ===
                          'patient'
                            ? 'flex-row-reverse'
                            : ''
                        }
                      `}
                    >

                      <div
                        className={`
                          flex
                          h-8
                          w-8
                          shrink-0
                          items-center
                          justify-center
                          rounded-full
                          ${
                            message.sender ===
                            'patient'
                              ? 'bg-clinical-600 text-white'
                              : 'bg-ayur-600 text-white shadow-sm shadow-ayur-600/30'
                          }
                        `}
                      >

                        {message.sender ===
                        'patient' ? (

                          <User className="h-4 w-4" />

                        ) : (

                          <Bot className="h-4 w-4" />

                        )}

                      </div>

                      <div
                        className={`
                          min-w-0
                          max-w-[calc(100%-2.75rem)]
                          overflow-hidden
                          rounded-2xl
                          p-3
                          text-sm
                          leading-relaxed
                          sm:max-w-[80%]
                          sm:p-4
                          ${
                            message.sender ===
                            'patient'
                              ? 'rounded-tr-none bg-clinical-600 text-white'
                              : 'rounded-tl-none border border-slate-200/80 bg-slate-50 text-slate-800'
                          }
                        `}
                      >

                        <div
                          className="
                            mb-1
                            flex
                            min-w-0
                            flex-wrap
                            items-center
                            justify-between
                            gap-2
                          "
                        >

                          <span
                            className="
                              text-[10px]
                              font-bold
                              uppercase
                              tracking-wider
                              opacity-75
                            "
                          >
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

                            <span
                              className="
                                inline-flex
                                shrink-0
                                items-center
                                gap-1
                                rounded
                                bg-white/20
                                px-1.5
                                py-0.5
                                text-[9px]
                                font-semibold
                              "
                            >

                              <Mic className="h-2.5 w-2.5" />

                              {t(
                                uiLanguage,
                                'voice'
                              )}

                            </span>

                          )}

                        </div>

                        <p
                          className="
                            break-words
                            whitespace-pre-wrap
                          "
                        >
                          {message.text}
                        </p>

                      </div>

                    </div>
                  )
                )}

                {loading && (

                  <div
                    className="
                      flex
                      min-w-0
                      items-start
                      gap-3
                    "
                  >

                    <div
                      className="
                        flex
                        h-8
                        w-8
                        shrink-0
                        items-center
                        justify-center
                        rounded-full
                        bg-ayur-600
                        text-white
                      "
                    >
                      <Bot className="h-4 w-4" />
                    </div>

                    <div
                      className="
                        flex
                        min-w-0
                        max-w-[85%]
                        items-center
                        gap-2
                        rounded-2xl
                        rounded-tl-none
                        border
                        border-slate-200
                        bg-slate-50
                        p-3
                        text-xs
                        text-slate-500
                      "
                    >

                      <span
                        className="
                          h-2
                          w-2
                          shrink-0
                          animate-ping
                          rounded-full
                          bg-ayur-500
                        "
                      />

                      {t(
                        uiLanguage,
                        'thinking'
                      )}

                    </div>

                  </div>
                )}

                <div ref={chatEndRef} />

              </div>

            </div>

            {/* QUICK OPTIONS */}
            {suggestedOptions.length >
              0 &&
              !isComplete &&
              !confirmationRequired && (

                <div
                  className="
                    flex
                    min-w-0
                    items-center
                    gap-1.5
                    overflow-x-auto
                    border-t
                    border-slate-100
                    bg-slate-50/60
                    px-3
                    py-2
                    sm:px-4
                  "
                >

                  <span
                    className="
                      shrink-0
                      text-[10px]
                      font-bold
                      uppercase
                      text-slate-400
                    "
                  >
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
                        className="
                          min-h-9
                          shrink-0
                          whitespace-nowrap
                          rounded-full
                          border
                          border-slate-200
                          bg-white
                          px-2.5
                          py-1
                          text-xs
                          font-medium
                          text-slate-700
                          transition
                          hover:border-ayur-400
                          hover:bg-ayur-50
                          hover:text-ayur-900
                          disabled:opacity-50
                        "
                      >
                        {option}
                      </button>

                    )
                  )}

                </div>
              )}

            {/* =================================================
                CONTROLS
            ================================================== */}
            <div
              className="
                min-w-0
                border-t
                border-slate-200
                bg-slate-50/50
                p-3
                sm:p-4
              "
            >

              {isComplete ? (

                <div
                  className="
                    flex
                    min-w-0
                    flex-col
                    gap-3
                    rounded-xl
                    border
                    border-emerald-200
                    bg-emerald-50
                    p-3
                    sm:flex-row
                    sm:items-center
                    sm:justify-between
                    sm:gap-4
                  "
                >

                  <div
                    className="
                      flex
                      min-w-0
                      items-center
                      gap-2
                      text-xs
                      font-bold
                      text-emerald-800
                    "
                  >

                    <CheckCircle2
                      className="
                        h-5
                        w-5
                        shrink-0
                        text-emerald-600
                      "
                    />

                    <span className="break-words">
                      {t(
                        uiLanguage,
                        'interviewComplete'
                      )}
                    </span>

                  </div>

                  <button
                    onClick={() =>
                      navigate(
                        '/documents'
                      )
                    }
                    className="
                      inline-flex
                      min-h-11
                      w-full
                      shrink-0
                      items-center
                      justify-center
                      gap-1.5
                      rounded-lg
                      bg-emerald-600
                      px-4
                      py-2
                      text-xs
                      font-bold
                      text-white
                      shadow-sm
                      transition
                      hover:bg-emerald-700
                      sm:w-auto
                    "
                  >

                    <span>
                      {t(
                        uiLanguage,
                        'uploadDocuments'
                      )}
                    </span>

                    <ArrowRight className="h-3.5 w-3.5" />

                  </button>

                </div>

              ) : confirmationRequired ? (

                /* CONFIRMATION UI */
                <div className="min-w-0 space-y-3">

                  <div
                    className="
                      min-w-0
                      rounded-xl
                      border
                      border-amber-200
                      bg-amber-50
                      p-3
                      sm:p-4
                    "
                  >

                    <div
                      className="
                        break-words
                        text-sm
                        font-bold
                        text-amber-900
                      "
                    >
                      {patientLanguage ===
                      'Hindi'
                        ? 'कृपया अपना उत्तर सत्यापित करें'
                        : 'Please confirm your answer'}
                    </div>

                    <div
                      className="
                        mt-1
                        break-words
                        text-xs
                        text-amber-800
                      "
                    >
                      {patientLanguage ===
                      'Hindi'
                        ? 'मैंने समझा:'
                        : 'I understood:'}
                    </div>

                    <div
                      className="
                        mt-2
                        max-h-32
                        overflow-y-auto
                        break-words
                        rounded-lg
                        border
                        border-amber-200
                        bg-white
                        p-3
                        text-sm
                        font-semibold
                        text-slate-800
                      "
                    >
                      {pendingAnswer}
                    </div>

                  </div>

                  <div
                    className="
                      grid
                      grid-cols-1
                      gap-2
                      sm:grid-cols-2
                    "
                  >

                    <button
                      type="button"
                      onClick={
                        handleConfirmAnswer
                      }
                      disabled={loading}
                      className="
                        min-h-11
                        w-full
                        rounded-xl
                        bg-emerald-600
                        px-4
                        py-3
                        text-sm
                        font-bold
                        text-white
                        disabled:opacity-50
                        hover:bg-emerald-700
                      "
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
                      className="
                        min-h-11
                        w-full
                        rounded-xl
                        border
                        border-slate-300
                        bg-white
                        px-4
                        py-3
                        text-sm
                        font-bold
                        text-slate-800
                        disabled:opacity-50
                        hover:bg-slate-50
                      "
                    >
                      ✎{' '}

                      {patientLanguage ===
                      'Hindi'
                        ? 'उत्तर बदलें'
                        : 'Change my answer'}
                    </button>

                  </div>

                  {correctionMode && (

                    <div
                      className="
                        min-w-0
                        rounded-xl
                        border
                        border-slate-200
                        bg-slate-50
                        p-3
                      "
                    >

                      <div
                        className="
                          mb-2
                          break-words
                          text-xs
                          font-bold
                          text-slate-700
                        "
                      >
                        {patientLanguage ===
                        'Hindi'
                          ? 'सही उत्तर बोलें या टाइप करें'
                          : 'Speak or type your corrected answer'}
                      </div>

                      {/* RESPONSIVE CORRECTION CONTROLS */}
                      <div
                        className="
                          flex
                          min-w-0
                          flex-col
                          gap-2
                          sm:flex-row
                          sm:items-center
                        "
                      >

                        <div
                          className="
                            flex
                            w-full
                            min-w-0
                            shrink-0
                            items-center
                            sm:w-auto
                          "
                        >

                          <VoiceVisualizer
                            onTranscript={
                              handleVoiceCorrection
                            }
                            textToSpeak=""
                            language={
                              patientLanguage
                            }
                          />

                        </div>

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
                          className="
                            min-w-0
                            w-full
                            flex-1
                            rounded-xl
                            border
                            border-slate-200
                            bg-white
                            px-4
                            py-2.5
                            text-sm
                            focus:outline-none
                            focus:ring-2
                            focus:ring-ayur-500
                          "
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
                          className="
                            flex
                            h-11
                            w-full
                            shrink-0
                            items-center
                            justify-center
                            rounded-xl
                            bg-ayur-600
                            text-white
                            hover:bg-ayur-700
                            disabled:opacity-40
                            sm:w-11
                          "
                        >

                          <Send className="h-4 w-4" />

                        </button>

                      </div>

                    </div>
                  )}

                </div>

              ) : (

                /* =================================================
                   NORMAL INTERVIEW CONTROLS
                ================================================== */
                <div
                  className="
                    flex
                    min-w-0
                    flex-col
                    gap-2
                    sm:flex-row
                    sm:items-center
                    sm:gap-3
                  "
                >

                  {/* VOICE CONTROLS */}
                  <div
                    className="
                      flex
                      w-full
                      min-w-0
                      shrink-0
                      items-center
                      sm:w-auto
                    "
                  >

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

                  </div>

                  {/* TEXT INPUT */}
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
                    className="
                      min-w-0
                      w-full
                      flex-1
                      rounded-xl
                      border
                      border-slate-200
                      bg-white
                      px-4
                      py-2.5
                      text-sm
                      focus:outline-none
                      focus:ring-2
                      focus:ring-ayur-500
                    "
                    disabled={loading}
                  />

                  {/* SEND */}
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
                    className="
                      flex
                      h-11
                      w-full
                      shrink-0
                      items-center
                      justify-center
                      rounded-xl
                      bg-ayur-600
                      px-4
                      text-white
                      shadow-sm
                      shadow-ayur-600/20
                      transition
                      hover:bg-ayur-700
                      disabled:opacity-40
                      sm:w-11
                      sm:px-0
                    "
                    title={t(
                      uiLanguage,
                      'sendAnswer'
                    )}
                  >

                    <Send className="h-4 w-4" />

                  </button>

                </div>
              )}

            </div>

          </div>

        </div>

        {/* =====================================================
            CLINICAL EXTRACTION
        ====================================================== */}
        <div
          className="
            min-w-0
            rounded-2xl
            border
            border-slate-200
            bg-white
            p-4
            shadow-sm
            sm:p-5
          "
        >

          <div
            className="
              flex
              min-w-0
              items-center
              justify-between
              gap-3
              border-b
              border-slate-100
              pb-3
            "
          >

            <h2
              className="
                flex
                min-w-0
                items-center
                gap-2
                break-words
                text-sm
                font-bold
                text-slate-900
              "
            >

              <Sparkles
                className="
                  h-4
                  w-4
                  shrink-0
                  text-amber-500
                "
              />

              {t(
                uiLanguage,
                'clinicalExtraction'
              )}

            </h2>

            <span
              className="
                shrink-0
                rounded-full
                bg-slate-100
                px-2
                py-0.5
                text-[10px]
                font-bold
                text-slate-600
              "
            >
              Live NLP
            </span>

          </div>

          <div
            className="
              mt-4
              space-y-3
              text-xs
            "
          >

            {/* SYMPTOMS */}
            <div
              className="
                min-w-0
                rounded-xl
                border
                border-emerald-100
                bg-emerald-50/70
                p-3
              "
            >

              <span
                className="
                  mb-1
                  flex
                  items-center
                  gap-1
                  font-bold
                  text-emerald-900
                "
              >

                <Activity
                  className="
                    h-3.5
                    w-3.5
                    shrink-0
                    text-emerald-600
                  "
                />

                {t(
                  uiLanguage,
                  'symptoms'
                )}

              </span>

              <div
                className="
                  flex
                  min-w-0
                  flex-wrap
                  gap-1
                "
              >

                {extractedSummary.symptoms?.length >
                0 ? (

                  extractedSummary.symptoms.map(
                    (symptom, index) => (

                      <span
                        key={index}
                        className="
                          max-w-full
                          break-words
                          rounded
                          bg-emerald-100
                          px-2
                          py-0.5
                          font-medium
                          text-emerald-800
                        "
                      >
                        {symptom}
                      </span>

                    )
                  )

                ) : (

                  <span
                    className="
                      text-slate-400
                      italic
                    "
                  >
                    {t(
                      uiLanguage,
                      'listening'
                    )}
                  </span>

                )}

              </div>

            </div>

            {/* DURATION / SEVERITY */}
            <div
              className="
                min-w-0
                rounded-xl
                border
                border-slate-100
                bg-slate-50
                p-3
              "
            >

              <span
                className="
                  mb-1
                  flex
                  items-center
                  gap-1
                  font-bold
                  text-slate-700
                "
              >

                <Clock
                  className="
                    h-3.5
                    w-3.5
                    text-slate-500
                  "
                />

                {t(
                  uiLanguage,
                  'durationSeverity'
                )}

              </span>

              <p className="break-words text-slate-600">

                {t(
                  uiLanguage,
                  'duration'
                )}
                :{' '}

                <span
                  className="
                    font-semibold
                    text-slate-800
                  "
                >
                  {extractedSummary.duration ||
                    (uiLanguage ===
                    'Hindi'
                      ? '3-5 दिन'
                      : '3-5 days')}
                </span>

              </p>

              <p className="break-words text-slate-600">

                {t(
                  uiLanguage,
                  'severity'
                )}
                :{' '}

                <span
                  className="
                    font-semibold
                    text-slate-800
                  "
                >
                  {extractedSummary.severity ||
                    (uiLanguage ===
                    'Hindi'
                      ? 'मध्यम'
                      : 'Moderate')}
                </span>

              </p>

            </div>

            {/* MEDICATIONS */}
            <div
              className="
                min-w-0
                rounded-xl
                border
                border-blue-100
                bg-blue-50/70
                p-3
              "
            >

              <span
                className="
                  mb-1
                  flex
                  items-center
                  gap-1
                  font-bold
                  text-blue-900
                "
              >

                <Pill
                  className="
                    h-3.5
                    w-3.5
                    text-blue-600
                  "
                />

                {t(
                  uiLanguage,
                  'medications'
                )}

              </span>

              <div
                className="
                  flex
                  min-w-0
                  flex-wrap
                  gap-1
                "
              >

                {extractedSummary.medications?.length >
                0 ? (

                  extractedSummary.medications.map(
                    (medication, index) => (

                      <span
                        key={index}
                        className="
                          max-w-full
                          break-words
                          rounded
                          bg-blue-100
                          px-2
                          py-0.5
                          font-medium
                          text-blue-800
                        "
                      >
                        {medication}
                      </span>

                    )
                  )

                ) : (

                  <span
                    className="
                      text-slate-400
                      italic
                    "
                  >
                    {t(
                      uiLanguage,
                      'noneLogged'
                    )}
                  </span>

                )}

              </div>

            </div>

            {/* ALLERGIES */}
            <div
              className="
                min-w-0
                rounded-xl
                border
                border-rose-100
                bg-rose-50/70
                p-3
              "
            >

              <span
                className="
                  mb-1
                  flex
                  items-center
                  gap-1
                  font-bold
                  text-rose-900
                "
              >

                <ShieldAlert
                  className="
                    h-3.5
                    w-3.5
                    text-rose-600
                  "
                />

                {t(
                  uiLanguage,
                  'allergies'
                )}

              </span>

              <p
                className="
                  break-words
                  text-rose-800
                "
              >

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

          <div
            className="
              mt-4
              border-t
              border-slate-100
              pt-3
            "
          >

            <button
              onClick={() =>
                navigate(
                  '/documents'
                )
              }
              className="
                flex
                min-h-11
                w-full
                items-center
                justify-center
                gap-1.5
                rounded-xl
                bg-slate-900
                py-2.5
                text-xs
                font-bold
                text-white
                transition
                hover:bg-slate-800
              "
            >

              <span>
                {t(
                  uiLanguage,
                  'skipNextDocuments'
                )}
              </span>

              <ArrowRight className="h-3.5 w-3.5" />

            </button>

          </div>

        </div>

      </div>

    </div>
  );
};

export default AIInterviewPage;