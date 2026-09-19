import React, {
  useState,
  useEffect,
  useRef,
  useCallback
} from 'react';

import {
  Mic,
  Volume2,
  VolumeX,
  AlertCircle
} from 'lucide-react';

import { t } from '../patientI18n';

/**
 * Browser-native voice I/O.
 *
 * IMPORTANT:
 * This component intentionally remains independent from
 * interview confirmation logic.
 *
 * It only:
 * 1. listens
 * 2. converts speech to text
 * 3. sends transcript through onTranscript
 * 4. speaks AI text
 */
const VoiceVisualizer = ({
  onTranscript,
  isSpeaking,
  textToSpeak,
  language = 'English'
}) => {

  const [isListening, setIsListening] =
    useState(false);

  const [supported, setSupported] =
    useState(true);

  const [speechSynthesisActive, setSpeechSynthesisActive] =
    useState(true);

  const [voiceError, setVoiceError] =
    useState('');

  const recognitionRef =
    useRef(null);

  const listeningRef =
    useRef(false);

  const transcriptHandlerRef =
    useRef(onTranscript);

  const speechMap = {
    English: 'en-IN',
    Hindi: 'hi-IN',
    Marathi: 'mr-IN',
    Tamil: 'ta-IN'
  };

  useEffect(() => {
    transcriptHandlerRef.current =
      onTranscript;
  }, [onTranscript]);

  const stopListening =
    useCallback(() => {

      listeningRef.current = false;

      setIsListening(false);

      try {
        recognitionRef.current?.stop();
      } catch (_) {}

    }, []);

  useEffect(() => {

    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!SpeechRecognition) {

      setSupported(false);

      setVoiceError(
        t(
          language,
          'voiceUnsupported'
        )
      );

      return undefined;
    }

    const recognition =
      new SpeechRecognition();

    recognition.continuous = false;

    recognition.interimResults = true;

    recognition.maxAlternatives = 1;

    recognition.lang =
      speechMap[language] ||
      'en-IN';

    recognition.onstart = () => {

      listeningRef.current = true;

      setIsListening(true);

      setVoiceError('');

    };

    recognition.onresult = (
      event
    ) => {

      let finalTranscript = '';

      for (
        let i = event.resultIndex;
        i < event.results.length;
        i += 1
      ) {

        const result =
          event.results[i];

        if (
          result.isFinal
        ) {

          finalTranscript +=
            result[0].transcript;

        }

      }

      if (
        finalTranscript.trim()
      ) {

        listeningRef.current =
          false;

        setIsListening(false);

        transcriptHandlerRef.current?.(
          finalTranscript.trim()
        );

      }

    };

    recognition.onerror = (
      event
    ) => {

      listeningRef.current =
        false;

      setIsListening(false);

      const errorMessages = {
        'not-allowed':
          t(
            language,
            'micDenied'
          ),

        'service-not-allowed':
          t(
            language,
            'speechBlocked'
          ),

        'audio-capture':
          t(
            language,
            'noMic'
          ),

        'no-speech':
          t(
            language,
            'noSpeech'
          ),

        network:
          t(
            language,
            'voiceNetwork'
          )
      };

      setVoiceError(
        errorMessages[
          event.error
        ] ||
          `Voice input error: ${
            event.error ||
            'unknown error'
          }`
      );

    };

    recognition.onend = () => {

      listeningRef.current =
        false;

      setIsListening(false);

    };

    recognitionRef.current =
      recognition;

    return () => {

      listeningRef.current =
        false;

      try {
        recognition.abort();
      } catch (_) {}

      recognitionRef.current =
        null;

    };

  }, [language]);

  /*
   * Speak only the newly received AI text.
   */
  useEffect(() => {

    if (
      !speechSynthesisActive ||
      !textToSpeak ||
      !('speechSynthesis' in window)
    ) {
      return;
    }

    window.speechSynthesis.cancel();

    const utterance =
      new SpeechSynthesisUtterance(
        textToSpeak
      );

    utterance.lang =
      speechMap[language] ||
      'en-IN';

    const voices =
      window.speechSynthesis.getVoices();

    const langPrefix =
      utterance.lang.split('-')[0];

    const target =
      voices.find(
        voice =>
          voice.lang
            ?.toLowerCase()
            .startsWith(
              langPrefix
            )
      );

    if (target) {
      utterance.voice =
        target;
    }

    utterance.rate = 1;

    utterance.pitch = 1;

    window.speechSynthesis.speak(
      utterance
    );

    return () =>
      window.speechSynthesis.cancel();

  }, [
    textToSpeak,
    speechSynthesisActive,
    language
  ]);

  const toggleListening = () => {

    const recognition =
      recognitionRef.current;

    if (
      !recognition ||
      !supported
    ) {
      return;
    }

    if (
      listeningRef.current
    ) {

      stopListening();

      return;
    }

    setVoiceError('');

    try {

      recognition.start();

    } catch (err) {

      try {
        recognition.abort();
      } catch (_) {}

      listeningRef.current =
        false;

      setIsListening(false);

      setVoiceError(
        t(
          language,
          'micRestart'
        )
      );

    }

  };

  const toggleSpeaker = () => {

    if (
      speechSynthesisActive
    ) {
      window.speechSynthesis?.cancel();
    }

    setSpeechSynthesisActive(
      active => !active
    );

  };

  return (
    <div className="flex items-center gap-2 min-w-0">

      <button
        type="button"
        onClick={
          toggleListening
        }
        disabled={!supported}
        className={`p-2.5 rounded-full transition-all flex items-center justify-center ${
          isListening
            ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30 animate-pulse'
            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
        } ${
          !supported
            ? 'opacity-40 cursor-not-allowed'
            : ''
        }`}
        title={
          isListening
            ? t(
                language,
                'stopListening'
              )
            : t(
                language,
                'startVoice'
              )
        }
        aria-label={
          isListening
            ? t(
                language,
                'stopListening'
              )
            : t(
                language,
                'startVoice'
              )
        }
      >
        <Mic className="w-5 h-5" />
      </button>

      <button
        type="button"
        onClick={
          toggleSpeaker
        }
        className={`p-2 rounded-full border transition-colors ${
          speechSynthesisActive
            ? 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
            : 'bg-slate-50 text-slate-400 border-slate-200'
        }`}
        title={
          speechSynthesisActive
            ? t(
                language,
                'muteVoice'
              )
            : t(
                language,
                'unmuteVoice'
              )
        }
        aria-label={
          speechSynthesisActive
            ? t(
                language,
                'muteVoice'
              )
            : t(
                language,
                'unmuteVoice'
              )
        }
      >
        {speechSynthesisActive ? (
          <Volume2 className="w-4 h-4" />
        ) : (
          <VolumeX className="w-4 h-4" />
        )}
      </button>

      {isListening && (
        <span className="text-xs text-rose-600 font-semibold animate-pulse whitespace-nowrap">
          {t(
            language,
            'listening'
          )}
        </span>
      )}

      {voiceError &&
        !isListening && (
          <span
            className="text-[10px] text-amber-700 flex items-center gap-1 max-w-[230px]"
            title={voiceError}
          >
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />

            <span className="truncate">
              {voiceError}
            </span>
          </span>
        )}

    </div>
  );
};

export default VoiceVisualizer;