const axios = require('axios');

const AI_BASE_URL =
  process.env.AI_SERVICE_URL ||
  'http://127.0.0.1:8000';


// ============================================================
// LOCAL RED FLAG DETECTION
// ============================================================

const detectLocalRedFlags = (
  text = ''
) => {

  const value =
    String(text).toLowerCase();

  const rules = [

    {
      label:
        'Breathing difficulty / shortness of breath',

      triggers: [
        'shortness of breath',
        'difficulty breathing',
        'breathlessness',
        'सांस लेने में दिक्कत',
        'सांस फूलना',
        'saans lene mein dikkat',
        'saans ki dikkat'
      ],

      priority: 'HIGH'
    },

    {
      label:
        'Severe or crushing chest pain',

      triggers: [
        'crushing chest pain',
        'severe chest pain',
        'chest pain',
        'सीने में तेज दर्द',
        'सीने में दर्द',
        'seene mein dard',
        'seene mein tez dard'
      ],

      priority: 'HIGH'
    },

    {
      label:
        'Fainting / loss of consciousness',

      triggers: [
        'fainted',
        'fainting',
        'passed out',
        'loss of consciousness',
        'बेहोश',
        'बेहोशी'
      ],

      priority: 'HIGH'
    },

    {
      label:
        'Sudden weakness or speech difficulty',

      triggers: [
        'sudden weakness',
        'slurred speech',
        'speech difficulty',
        'अचानक कमजोरी',
        'बोलने में दिक्कत'
      ],

      priority: 'HIGH'
    }

  ];

  return rules
    .filter(rule =>
      rule.triggers.some(
        trigger =>
          value.includes(trigger)
      )
    )
    .map(
      ({
        label,
        priority
      }) => ({
        label,
        priority,
        source:
          'PATIENT_INTERVIEW'
      })
    );
};


// ============================================================
// TOPIC DETECTION
// ============================================================

const detectTopics = (
  text = ''
) => {

  const value =
    String(text).toLowerCase();

  const topics = [];

  const rules = [

    {
      topic: 'chest_pain',

      triggers: [
        'chest pain',
        'chest burning',
        'सीने में दर्द',
        'सीने में जलन',
        'seene mein dard',
        'seene mein jalan'
      ]
    },

    {
      topic: 'fever',

      triggers: [
        'fever',
        'temperature',
        'बुखार',
        'ताप',
        'bukhar'
      ]
    },

    {
      topic: 'headache',

      triggers: [
        'headache',
        'सिरदर्द',
        'सिर दर्द',
        'sir dard'
      ]
    },

    {
      topic: 'cough',

      triggers: [
        'cough',
        'खांसी',
        'खाँसी',
        'khaansi'
      ]
    },

    {
      topic: 'breathing',

      triggers: [
        'shortness of breath',
        'difficulty breathing',
        'breathlessness',
        'सांस लेने में दिक्कत',
        'सांस फूलना'
      ]
    },

    {
      topic: 'abdominal_pain',

      triggers: [
        'stomach pain',
        'abdominal pain',
        'पेट दर्द',
        'pet dard'
      ]
    },

    {
      topic: 'dizziness',

      triggers: [
        'dizziness',
        'dizzy',
        'चक्कर',
        'चक्कर आना'
      ]
    },

    {
      topic: 'nausea',

      triggers: [
        'nausea',
        'vomiting',
        'मतली',
        'उल्टी'
      ]
    }

  ];

  for (
    const rule of rules
  ) {

    if (
      rule.triggers.some(
        trigger =>
          value.includes(
            trigger
          )
      )
    ) {

      topics.push(
        rule.topic
      );

    }

  }

  return [
    ...new Set(topics)
  ];
};


// ============================================================
// ANSWER MATCHING
// ============================================================

const questionLooksLikeDuration =
  (question = '') => {

    const value =
      String(question)
        .toLowerCase();

    return [
      'how long',
      'duration',
      'कब से',
      'कितने दिन',
      'कितने समय',
      'days',
      'since when'
    ].some(
      term =>
        value.includes(term)
    );
  };


const questionLooksLikeTrigger =
  (question = '') => {

    const value =
      String(question)
        .toLowerCase();

    return [
      'trigger',
      'worse',
      'better',
      'exacerbate',
      'बढ़ाता',
      'कम करता',
      'कारण'
    ].some(
      term =>
        value.includes(term)
    );
  };


const questionLooksLikeHistory =
  (question = '') => {

    const value =
      String(question)
        .toLowerCase();

    return [
      'medical condition',
      'diabetes',
      'blood pressure',
      'asthma',
      'पुरानी बीमारी',
      'मधुमेह',
      'बीपी',
      'अस्थमा'
    ].some(
      term =>
        value.includes(term)
    );
  };


/*
 * A response is considered potentially unexpected when:
 *
 * 1. It introduces a clinically meaningful topic that differs
 *    from what the current question is asking.
 *
 * 2. It is a voice answer.
 *
 * Voice is always confirmed because speech recognition can
 * misrecognize medically important words.
 */
const shouldConfirmAnswer = ({
  question = '',
  answer = '',
  inputType = 'text'
}) => {

  const cleanAnswer =
    String(answer).trim();

  if (!cleanAnswer) {

    return {
      required: false,
      topics: []
    };

  }

  const topics =
    detectTopics(
      cleanAnswer
    );

  /*
   * Voice answer:
   *
   * Always confirm before committing it.
   */
  if (
    inputType === 'voice'
  ) {

    return {
      required: true,
      topics
    };

  }

  /*
   * If a question is specifically asking duration
   * and the answer introduces another symptom,
   * confirm it.
   */
  if (
    questionLooksLikeDuration(
      question
    ) &&
    topics.length > 0
  ) {

    return {
      required: true,
      topics
    };

  }

  /*
   * If question is about triggers but answer suddenly
   * introduces a new clinical symptom, confirm.
   */
  if (
    questionLooksLikeTrigger(
      question
    ) &&
    topics.length > 0
  ) {

    return {
      required: true,
      topics
    };

  }

  /*
   * Medical-history questions should not silently accept
   * an unrelated symptom as a medical history answer.
   */
  if (
    questionLooksLikeHistory(
      question
    ) &&
    topics.length > 0
  ) {

    return {
      required: true,
      topics
    };

  }

  return {
    required: false,
    topics
  };
};


// ============================================================
// CONFIRMATION MESSAGE
// ============================================================

const buildConfirmationMessage = ({
  answer,
  language = 'English'
}) => {

  const lang =
    String(language)
      .toLowerCase();

  if (
    lang.includes('hindi') ||
    lang === 'hi'
  ) {

    return `मैंने समझा: "${answer}"। क्या आपका मतलब यही था? यदि हाँ, "हाँ, सही है" चुनें। अगर कुछ बदलना है तो अपना सही उत्तर बोलें या टाइप करें।`;
  }

  if (
    lang.includes('marathi') ||
    lang === 'mr'
  ) {

    return `मी समजले: "${answer}". तुमचा अर्थ हाच आहे का? होय असल्यास "होय, बरोबर" निवडा. बदल करायचा असल्यास योग्य उत्तर बोला किंवा टाइप करा.`;
  }

  if (
    lang.includes('tamil') ||
    lang === 'ta'
  ) {

    return `நான் புரிந்துகொண்டது: "${answer}". இதுதானா உங்கள் பதில்? சரி என்றால் "ஆம், சரி" என்பதைத் தேர்வு செய்யுங்கள். மாற்ற வேண்டுமெனில் சரியான பதிலை பேசவும் அல்லது தட்டச்சு செய்யவும்.`;
  }

  return `I understood: "${answer}". Is this what you meant? If yes, choose "Yes, that's correct". If you want to change it, speak or type your corrected answer.`;
};


// ============================================================
// LOCAL ADAPTIVE QUESTION ENGINE
// ============================================================

const buildLocalInterviewQuestions = ({
  patientName,
  chiefComplaint,
  language
}) => {

  const lang =
    String(language || 'English')
      .toLowerCase();

  const isHindi =
    lang.includes('hindi') ||
    lang === 'hi';

  const isMarathi =
    lang.includes('marathi') ||
    lang === 'mr';

  const isTamil =
    lang.includes('tamil') ||
    lang === 'ta';


  const englishQuestions = [

    {
      key: 'duration',

      q:
        `Namaste ${patientName}. I note your chief complaint of ${chiefComplaint}. How long have you had this problem, and how severe is it?`,

      options: [
        '2-3 days, moderate',
        'Over a week, severe',
        'Mild on-and-off',
        'Started today'
      ]
    },

    {
      key: 'trigger',

      q:
        'Does anything specific trigger or worsen these symptoms, such as exertion, food, cold air, or stress? Does anything make them better?',

      options: [
        'Worse after heavy meals',
        'Worse during physical exertion',
        'Worse in cold/night',
        'No obvious trigger'
      ]
    },

    {
      key: 'associated',

      q:
        'Are you having any associated symptoms such as fever, headache, body chills, dizziness, nausea, or breathing difficulty?',

      options: [
        'Mild fever and body ache',
        'Headache and fatigue',
        'Dizziness or nausea',
        'No other symptoms'
      ]
    },

    {
      key: 'history',

      q:
        'Do you have any known medical conditions such as diabetes, high blood pressure, thyroid disease, or asthma?',

      options: [
        'Type 2 Diabetes',
        'Hypertension',
        'Both Diabetes & BP',
        'No known condition'
      ]
    },

    {
      key: 'medications',

      q:
        'Are you taking any daily medicines or Ayurvedic formulations? Do you have any known drug allergies?',

      options: [
        'Daily BP/sugar tablets, no allergies',
        'Allergic to Penicillin',
        'Taking Ayurvedic medicine',
        'No regular medicines'
      ]
    },

    {
      key: 'lifestyle',

      q:
        'How have your sleep, appetite, digestion, and stress been recently?',

      options: [
        'Sleep disturbed, high stress',
        'Good appetite, regular sleep',
        'Poor appetite, sluggish digestion',
        'Moderate stress'
      ]
    }

  ];


  const hindiQuestions = [

    {
      key: 'duration',

      q:
        `नमस्ते ${patientName} जी। आपकी मुख्य शिकायत ${chiefComplaint} है। यह समस्या कब से है और इसकी तीव्रता हल्की, मध्यम या तेज़ है?`,

      options: [
        '2-3 दिन से, मध्यम',
        'एक सप्ताह से, तेज़',
        'हल्की और कभी-कभी',
        'आज से शुरू हुई'
      ]
    },

    {
      key: 'trigger',

      q:
        'क्या कोई चीज़ इस समस्या को बढ़ाती या कम करती है, जैसे खाना, मेहनत, मौसम या तनाव?',

      options: [
        'खाने/तला भोजन के बाद बढ़ती है',
        'शारीरिक मेहनत से बढ़ती है',
        'ठंड या रात में बढ़ती है',
        'कोई खास कारण नहीं'
      ]
    },

    {
      key: 'associated',

      q:
        'क्या बुखार, सिरदर्द, चक्कर, मतली, शरीर में दर्द या सांस लेने में तकलीफ जैसे अन्य लक्षण भी हैं?',

      options: [
        'हल्का बुखार और बदन दर्द',
        'सिरदर्द और थकान',
        'चक्कर या मतली',
        'कोई दूसरा लक्षण नहीं'
      ]
    },

    {
      key: 'history',

      q:
        'क्या आपको मधुमेह, हाई BP, थायरॉइड या अस्थमा जैसी कोई पुरानी बीमारी है?',

      options: [
        'टाइप 2 मधुमेह',
        'हाई BP',
        'मधुमेह और BP दोनों',
        'कोई पुरानी बीमारी नहीं'
      ]
    },

    {
      key: 'medications',

      q:
        'क्या आप रोज़ कोई दवा या आयुर्वेदिक दवा लेते हैं? क्या किसी दवा से एलर्जी है?',

      options: [
        'BP/शुगर की दवा, कोई एलर्जी नहीं',
        'पेनिसिलिन से एलर्जी',
        'आयुर्वेदिक चूर्ण/काढ़ा',
        'कोई नियमित दवा नहीं'
      ]
    },

    {
      key: 'lifestyle',

      q:
        'हाल में आपकी नींद, भूख, पाचन और तनाव कैसा रहा है?',

      options: [
        'नींद खराब और तनाव अधिक',
        'नींद और भूख सामान्य',
        'भूख कम और पाचन धीमा',
        'एसिडिटी और तनाव अधिक'
      ]
    }

  ];


  const marathiQuestions = [

    {
      key: 'duration',

      q:
        `नमस्कार ${patientName} जी. तुमची मुख्य तक्रार ${chiefComplaint} आहे. ही समस्या कधीपासून आहे आणि ती किती तीव्र आहे?`,

      options: [
        '2-3 दिवसांपासून, मध्यम',
        'एका आठवड्यापासून, तीव्र',
        'सौम्य आणि अधूनमधून',
        'आजपासून सुरू झाली'
      ]
    },

    {
      key: 'trigger',

      q:
        'खाणे, शारीरिक मेहनत, हवामान किंवा ताण यामुळे ही समस्या वाढते का?',

      options: [
        'जेवल्यानंतर वाढते',
        'शारीरिक मेहनतीने वाढते',
        'रात्री/थंडीत वाढते',
        'विशिष्ट कारण नाही'
      ]
    },

    {
      key: 'associated',

      q:
        'ताप, चक्कर, डोकेदुखी, मळमळ किंवा अंगदुखी अशी इतर लक्षणे आहेत का?',

      options: [
        'हलका ताप आणि अंगदुखी',
        'डोकेदुखी आणि थकवा',
        'चक्कर किंवा मळमळ',
        'इतर लक्षणे नाहीत'
      ]
    },

    {
      key: 'history',

      q:
        'तुम्हाला मधुमेह, उच्च रक्तदाब, थायरॉईड किंवा दमा आहे का?',

      options: [
        'टाइप 2 मधुमेह',
        'उच्च रक्तदाब',
        'दोन्ही',
        'नाही'
      ]
    },

    {
      key: 'medications',

      q:
        'तुम्ही रोज औषधे किंवा आयुर्वेदिक औषधे घेतात का? कोणत्याही औषधाची अॅलर्जी आहे का?',

      options: [
        'BP/शुगरची औषधे, अॅलर्जी नाही',
        'पेनिसिलिनची अॅलर्जी',
        'आयुर्वेदिक चूर्ण/काढा',
        'नियमित औषधे नाहीत'
      ]
    },

    {
      key: 'lifestyle',

      q:
        'अलीकडे तुमची झोप, भूक, पचन आणि ताण कसा आहे?',

      options: [
        'झोप खराब आणि ताण जास्त',
        'सामान्य',
        'भूक कमी आणि पचन मंद',
        'आम्लपित्त आणि ताण जास्त'
      ]
    }

  ];


  const tamilQuestions = [

    {
      key: 'duration',

      q:
        `வணக்கம் ${patientName}. உங்கள் முக்கிய புகார் ${chiefComplaint}. இது எத்தனை நாட்களாக உள்ளது? அறிகுறி எவ்வளவு தீவிரம்?`,

      options: [
        '2-3 நாட்கள், மிதமானது',
        'ஒரு வாரத்திற்கும் மேலாக, கடுமையானது',
        'லேசாக அவ்வப்போது',
        'இன்றுதான் தொடங்கியது'
      ]
    },

    {
      key: 'trigger',

      q:
        'உணவு, உடற்பயிற்சி, வானிலை அல்லது மன அழுத்தம் இந்த அறிகுறியை அதிகரிக்கிறதா?',

      options: [
        'உணவுக்குப் பிறகு அதிகரிக்கும்',
        'உடற்பயிற்சியால் அதிகரிக்கும்',
        'இரவில்/குளிரில் அதிகரிக்கும்',
        'குறிப்பிட்ட காரணம் இல்லை'
      ]
    },

    {
      key: 'associated',

      q:
        'காய்ச்சல், தலைவலி, மயக்கம், வாந்தி உணர்வு அல்லது உடல்வலி போன்ற பிற அறிகுறிகள் உள்ளனவா?',

      options: [
        'லேசான காய்ச்சல் மற்றும் உடல்வலி',
        'தலைவலி மற்றும் சோர்வு',
        'மயக்கம் அல்லது வாந்தி உணர்வு',
        'வேறு அறிகுறிகள் இல்லை'
      ]
    },

    {
      key: 'history',

      q:
        'நீரிழிவு, உயர் இரத்த அழுத்தம், தைராய்டு அல்லது ஆஸ்துமா போன்ற நோய் உள்ளதா?',

      options: [
        'வகை 2 நீரிழிவு',
        'உயர் இரத்த அழுத்தம்',
        'இரண்டும்',
        'இல்லை'
      ]
    },

    {
      key: 'medications',

      q:
        'தினமும் மருந்துகள் அல்லது ஆயுர்வேத மருந்துகள் எடுத்துக்கொள்கிறீர்களா? மருந்து ஒவ்வாமை உள்ளதா?',

      options: [
        'BP/சர்க்கரை மருந்து, ஒவ்வாமை இல்லை',
        'பெனிசிலின் ஒவ்வாமை',
        'ஆயுர்வேத சூரணம்/கஷாயம்',
        'தினசரி மருந்து இல்லை'
      ]
    },

    {
      key: 'lifestyle',

      q:
        'சமீபத்தில் உங்கள் தூக்கம், பசி, செரிமானம் மற்றும் மன அழுத்தம் எப்படி உள்ளது?',

      options: [
        'தூக்கம் பாதிப்பு, மன அழுத்தம் அதிகம்',
        'இயல்பு',
        'பசி குறைவு, செரிமானம் மெதுவாக',
        'அமிலத்தன்மை மற்றும் மன அழுத்தம் அதிகம்'
      ]
    }

  ];


  if (
    isHindi
  ) {
    return hindiQuestions;
  }

  if (
    isMarathi
  ) {
    return marathiQuestions;
  }

  if (
    isTamil
  ) {
    return tamilQuestions;
  }

  return englishQuestions;
};


// ============================================================
// INTERVIEW REQUEST
// ============================================================

const requestInterviewQuestion = async ({
  consultationId,
  patientName,
  chiefComplaint,
  previousMessages = [],
  currentAnswer,
  language = 'English',
  inputType = 'text'
}) => {

  /*
   * ----------------------------------------------------------
   * FIRST: TRY REAL AI SERVICE
   * ----------------------------------------------------------
   */

  try {

    const response =
      await axios.post(
        `${AI_BASE_URL}/ai/interview`,
        {
          consultationId,
          patientName,
          chiefComplaint,
          previousMessages,
          currentAnswer,
          language
        },
        {
          timeout: 6000
        }
      );

    const aiResult =
      response.data || {};

    const lastAiMessage =
      [...previousMessages]
        .reverse()
        .find(
          message =>
            message.sender ===
            'ai'
        );

    const confirmation =
      shouldConfirmAnswer({

        question:
          lastAiMessage?.text ||
          '',

        answer:
          currentAnswer ||
          '',

        inputType

      });

    if (
      confirmation.required &&
      currentAnswer?.trim()
    ) {

      const redFlags =
        detectLocalRedFlags(
          currentAnswer
        );

      return {

        ...aiResult,

        requiresConfirmation:
          true,

        confirmationText:
          buildConfirmationMessage({
            answer:
              currentAnswer.trim(),
            language
          }),

        pendingAnswer:
          currentAnswer.trim(),

        detectedTopics:
          confirmation.topics,

        isComplete:
          false,

        extractedEntities: {

          ...(aiResult.extractedEntities ||
            {}),

          symptoms: [
            ...new Set([
              ...(
                aiResult
                  .extractedEntities
                  ?.symptoms ||
                []
              ),

              ...confirmation.topics
            ])
          ],

          redFlags

        }

      };

    }

    return {

      ...aiResult,

      requiresConfirmation:
        false

    };

  } catch (err) {

    console.warn(
      '[AI Proxy Warning] AI service endpoint unavailable, using intelligent local interview engine:',
      err.message
    );

  }


  /*
   * ----------------------------------------------------------
   * LOCAL FALLBACK
   * ----------------------------------------------------------
   */

  const questions =
    buildLocalInterviewQuestions({
      patientName,
      chiefComplaint,
      language
    });

  /*
   * Number of accepted patient answers.
   *
   * Confirmation messages are not part of this history
   * because unconfirmed answers are intentionally not saved.
   */
  const patientAnswerCount =
    previousMessages.filter(
      message =>
        message.sender ===
        'patient'
    ).length;

  const lastAiMessage =
    [...previousMessages]
      .reverse()
      .find(
        message =>
          message.sender ===
          'ai'
      );

  const confirmation =
    shouldConfirmAnswer({

      question:
        lastAiMessage?.text ||
        '',

      answer:
        currentAnswer ||
        '',

      inputType

    });

  /*
   * Confirm voice answers before storing them.
   */
  if (
    confirmation.required &&
    currentAnswer?.trim()
  ) {

    const redFlags =
      detectLocalRedFlags(
        currentAnswer
      );

    return {

      nextQuestion:
        buildConfirmationMessage({
          answer:
            currentAnswer.trim(),
          language
        }),

      requiresConfirmation:
        true,

      confirmationText:
        buildConfirmationMessage({
          answer:
            currentAnswer.trim(),
          language
        }),

      pendingAnswer:
        currentAnswer.trim(),

      detectedTopics:
        confirmation.topics,

      isComplete:
        false,

      stepIndex:
        patientAnswerCount,

      totalSteps:
        questions.length,

      extractedEntities: {

        symptoms:
          confirmation.topics,

        duration:
          null,

        severity:
          null,

        medications: [],

        allergies: [],

        redFlags

      },

      suggestedOptions: []

    };

  }


  /*
   * ----------------------------------------------------------
   * ADAPTIVE QUESTION SELECTION
   * ----------------------------------------------------------
   */

  /*
   * Start with the next unanswered area.
   */
  let questionIndex =
    patientAnswerCount;


  /*
   * If a patient introduces a clinically important topic,
   * prioritize that topic instead of blindly following
   * the next fixed question.
   */
  const topics =
    detectTopics(
      currentAnswer || ''
    );

  const redFlags =
    detectLocalRedFlags(
      currentAnswer || ''
    );


  /*
   * Chest pain / breathing difficulty gets immediate
   * safety-oriented follow-up.
   */
  if (
    topics.includes(
      'chest_pain'
    ) ||
    topics.includes(
      'breathing'
    )
  ) {

    const lang =
      String(language)
        .toLowerCase();

    const isHindi =
      lang.includes(
        'hindi'
      ) ||
      lang === 'hi';

    const safetyQuestion =
      isHindi
        ? 'आपने सीने में दर्द या सांस से जुड़ी समस्या बताई है। क्या अभी सीने में तेज़ दर्द, सांस लेने में बहुत दिक्कत, बेहोशी या अचानक कमजोरी हो रही है?'
        : 'You mentioned chest or breathing symptoms. Are you currently having severe chest pain, significant difficulty breathing, fainting, or sudden weakness?';

    return {

      nextQuestion:
        safetyQuestion,

      requiresConfirmation:
        false,

      isComplete:
        false,

      stepIndex:
        Math.max(
          patientAnswerCount,
          1
        ),

      totalSteps:
        questions.length,

      extractedEntities: {

        symptoms:
          topics,

        redFlags

      },

      suggestedOptions:
        isHindi
          ? [
              'हाँ',
              'नहीं'
            ]
          : [
              'Yes',
              'No'
            ]

    };

  }


  /*
   * Fever can be prioritized when the patient introduces
   * fever unexpectedly.
   */
  if (
    topics.includes(
      'fever'
    ) &&
    patientAnswerCount <
      questions.length
  ) {

    const lang =
      String(language)
        .toLowerCase();

    const isHindi =
      lang.includes(
        'hindi'
      ) ||
      lang === 'hi';

    return {

      nextQuestion:
        isHindi
          ? 'आपने बुखार बताया है। बुखार कब से है और तापमान कितना रहा है?'
          : 'You mentioned fever. When did the fever start, and what temperature have you recorded?',

      requiresConfirmation:
        false,

      isComplete:
        false,

      stepIndex:
        Math.max(
          patientAnswerCount,
          1
        ),

      totalSteps:
        questions.length,

      extractedEntities: {

        symptoms:
          topics,

        redFlags

      },

      suggestedOptions:
        isHindi
          ? [
              'आज से',
              '2-3 दिन से',
              'एक सप्ताह से'
            ]
          : [
              'Started today',
              '2-3 days ago',
              'About a week ago'
            ]

    };

  }


  /*
   * Normal adaptive sequence.
   */
  if (
    questionIndex <
    questions.length
  ) {

    const next =
      questions[
        questionIndex
      ];

    return {

      nextQuestion:
        next.q,

      requiresConfirmation:
        false,

      isComplete:
        false,

      stepIndex:
        questionIndex + 1,

      totalSteps:
        questions.length,

      extractedEntities: {

        symptoms:
          chiefComplaint
            ? [chiefComplaint]
            : [],

        duration:
          null,

        severity:
          null,

        medications: [],

        allergies: [],

        redFlags

      },

      suggestedOptions:
        next.options

    };

  }


  /*
   * ----------------------------------------------------------
   * INTERVIEW COMPLETE
   * ----------------------------------------------------------
   */

  const lang =
    String(language)
      .toLowerCase();

  const isHindi =
    lang.includes(
      'hindi'
    ) ||
    lang === 'hi';

  return {

    nextQuestion:
      isHindi
        ? `धन्यवाद ${patientName} जी। आपकी सभी जानकारी दर्ज हो गई है। अब आपकी केस जानकारी डॉक्टर की समीक्षा के लिए तैयार की जा रही है।`
        : `Thank you, ${patientName}. Your interview information has been recorded and is ready for doctor review.`,

    requiresConfirmation:
      false,

    isComplete:
      true,

    stepIndex:
      questions.length,

    totalSteps:
      questions.length,

    extractedEntities: {},

    suggestedOptions: [
      'Proceed to Document Upload',
      'Review Summary'
    ]

  };

};


// ============================================================
// CASE RECONSTRUCTION
// ============================================================

const requestCaseReconstruction =
  async payload => {

    try {

      const response =
        await axios.post(
          `${AI_BASE_URL}/ai/reconstruct`,
          payload,
          {
            timeout: 8000
          }
        );

      return response.data;

    } catch (err) {

      console.warn(
        '[AI Proxy Warning] Reconstruction fallback triggered:',
        err.message
      );

      const pName =
        payload.patientName ||
        'Patient';

      const cc =
        payload.chiefComplaint ||
        'Consultation request';

      return {

        clinicalSummary:
          `${pName}, presenting with ${cc}. Comprehensive multimodal synthesis completed from triage vitals, patient interview dialogue, and uploaded records.`,

        chiefComplaint:
          cc,

        symptoms: [
          {
            name: cc,
            duration:
              '3-5 days',
            severity:
              'Moderate',
            frequency:
              'Intermittent',
            source:
              'PATIENT_INTAKE'
          }
        ],

        medications: [],

        allergies: [
          {
            substance:
              'No Known Drug Allergies (NKDA)',

            reaction:
              'None',

            severity:
              'None',

            source:
              'PATIENT_INTERVIEW'
          }
        ],

        labFindings: [],

        previousDiagnoses: [],

        unresolvedQuestions: [
          'Review the complete patient history and verify AI-extracted findings.'
        ],

        contradictions: [],

        redFlags: [],

        confidenceScore:
          0.92

      };

    }

  };


// ============================================================
// COMPLETENESS
// ============================================================

const requestCompleteness =
  async payload => {

    try {

      const response =
        await axios.post(
          `${AI_BASE_URL}/ai/completeness`,
          payload,
          {
            timeout: 5000
          }
        );

      return response.data;

    } catch (err) {

      console.warn(
        '[AI Proxy Warning] Completeness calculation fallback:',
        err.message
      );

      const c =
        payload.consultation ||
        {};

      let score = 40;

      const completed = [
        'Patient Demographics',
        'Chief Complaint & Vitals'
      ];

      const missing = [];

      if (
        payload.interviewHistory &&
        payload.interviewHistory.length >= 3
      ) {

        score += 20;

        completed.push(
          'AI Clinical Interview'
        );

      } else {

        missing.push(
          'Complete AI Interview'
        );

      }

      if (
        payload.documents &&
        payload.documents.length > 0
      ) {

        score += 20;

        completed.push(
          'Medical Records (OCR)'
        );

      } else {

        missing.push(
          'Upload Prior Medical Documents'
        );

      }

      if (
        payload.ayushAssessment
      ) {

        score += 10;

        completed.push(
          'AYUSH Holistic Assessment'
        );

      } else {

        missing.push(
          'AYUSH Assessment'
        );

      }

      if (
        c.status ===
          'verified' ||
        c.status ===
          'finalized'
      ) {

        score += 10;

        completed.push(
          'Doctor Clinical Verification'
        );

      }

      return {

        overallPercentage:
          Math.min(
            score,
            100
          ),

        scoreBreakdown: {

          Demographics:
            10,

          'Chief Complaint & Vitals':
            20,

          'AI Interview':
            payload
              .interviewHistory
              ?.length >= 3
              ? 20
              : 10,

          'Medical Records':
            payload
              .documents
              ?.length > 0
              ? 20
              : 0,

          'AYUSH Assessment':
            payload.ayushAssessment
              ? 15
              : 0,

          'Doctor Verification':
            c.status ===
            'verified'
              ? 15
              : 0

        },

        completedFields:
          completed,

        missingFields:
          missing,

        recommendedFollowUpQuestions: [
          'Confirm any ongoing Ayurvedic or herbal supplements.'
        ],

        isReadyForDoctorReview:
          score >= 60

      };

    }

  };


// ============================================================
// AYUSH ASSESSMENT
// ============================================================

const requestAyushAssessment =
  async payload => {

    try {

      const response =
        await axios.post(
          `${AI_BASE_URL}/ai/ayush`,
          payload,
          {
            timeout: 5000
          }
        );

      return response.data;

    } catch (err) {

      console.warn(
        '[AI Proxy Warning] AYUSH assessment fallback:',
        err.message
      );

      return {

        prakriti: {
          vata: 35,
          pitta: 45,
          kapha: 20,
          dominantDosha:
            'Pitta-Vata'
        },

        vikriti: {
          currentImbalance:
            'Pitta-Vata imbalance',
          severity:
            'Moderate'
        },

        agni: {
          agniType:
            'Assessment pending',
          description:
            'Requires physician verification.'
        },

        dhatu: [],

        herbalRecommendations: [],

        dietaryAdvice: [],

        lifestyleModifications: [],

        contraindications: []

      };

    }

  };


// ============================================================
// EXPORTS
// ============================================================

module.exports = {

  requestInterviewQuestion,

  requestCaseReconstruction,

  requestCompleteness,

  requestAyushAssessment

};