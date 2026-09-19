const InterviewSession = require('../models/InterviewSession');
const InterviewMessage = require('../models/InterviewMessage');
const Consultation = require('../models/Consultation');
const { requestInterviewQuestion } = require('../services/aiProxyService');
const { addTimelineEvent } = require('../services/timelineService');

const startOrGetSession = async (req, res, next) => {
  try {
    const { consultationId } = req.body;

    if (!consultationId) {
      return res.status(400).json({
        success: false,
        message: 'consultationId is required'
      });
    }

    const consultation = await Consultation
      .findOne({ consultationId })
      .populate('patient');

    if (!consultation) {
      return res.status(404).json({
        success: false,
        message: 'Consultation not found'
      });
    }

    let session = await InterviewSession.findOne({ consultationId });

    if (!session) {
      try {
        session = await InterviewSession.create({
          consultationId,
          patientId: consultation.patientId,
          status: 'active',
          currentStepIndex: 0,
          totalStepsExpected: 6,
          language: consultation.patient?.language || 'English'
        });

        const aiResponse = await requestInterviewQuestion({
          consultationId,
          patientName: consultation.patient?.name || 'Patient',
          chiefComplaint: consultation.chiefComplaint || '',
          previousMessages: [],
          currentAnswer: null,
          language: consultation.patient?.language || 'English'
        });

        await InterviewMessage.create({
          sessionId: session._id,
          consultationId,
          sender: 'ai',
          text: aiResponse.nextQuestion,
          inputType: 'system',
          extractedEntities: aiResponse.extractedEntities || {},
          confidence: 0.95
        });

      } catch (createError) {
        if (createError?.code === 11000) {
          session = await InterviewSession.findOne({ consultationId });

          if (!session) {
            throw createError;
          }
        } else {
          throw createError;
        }
      }
    }

    const messages = await InterviewMessage
      .find({ consultationId })
      .sort({ createdAt: 1 });

    return res.json({
      success: true,
      session,
      messages
    });

  } catch (error) {
    next(error);
  }
};


const postMessage = async (req, res, next) => {
  try {
    const {
      consultationId,
      text,
      inputType = 'text',
      confirmAnswer = false,
      correction = false
    } = req.body;

    if (!consultationId) {
      return res.status(400).json({
        success: false,
        message: 'consultationId is required'
      });
    }

    if (!text || !text.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message content cannot be empty'
      });
    }

    const session = await InterviewSession.findOne({
      consultationId
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Interview session not found'
      });
    }

    const consultation = await Consultation
      .findOne({ consultationId })
      .populate('patient');

    if (!consultation) {
      return res.status(404).json({
        success: false,
        message: 'Consultation not found'
      });
    }

    const prevMessages = await InterviewMessage
      .find({ consultationId })
      .sort({ createdAt: 1 });

    const currentQuestion =
      [...prevMessages]
        .reverse()
        .find((message) => message.sender === 'ai')?.text || '';

    /*
     * First stage:
     * Voice answers are analyzed before they are committed as accepted
     * clinical information.
     */
    if (inputType === 'voice' && !confirmAnswer && !correction) {
      const analysisResponse = await requestInterviewQuestion({
        consultationId,
        patientName: consultation.patient?.name || 'Patient',
        chiefComplaint: consultation.chiefComplaint || '',
        previousMessages: prevMessages.map((message) => ({
          sender: message.sender,
          text: message.text
        })),
        currentQuestion,
        currentAnswer: text.trim(),
        language:
          session.language ||
          consultation.patient?.language ||
          'English',
        analysisOnly: true
      });

      return res.json({
        success: true,
        requiresConfirmation: true,
        interpretedAnswer:
          analysisResponse.interpretedAnswer || text.trim(),
        confirmationPrompt:
          analysisResponse.confirmationPrompt ||
          buildConfirmationPrompt(
            session.language || consultation.patient?.language || 'English',
            analysisResponse.interpretedAnswer || text.trim()
          ),
        answerMatchesQuestion:
          analysisResponse.answerMatchesQuestion ?? false,
        extractedEntities:
          analysisResponse.extractedEntities || {},
        redFlags:
          analysisResponse.extractedEntities?.redFlags || [],
        originalInput: text.trim(),
        inputType
      });
    }

    /*
     * If the user rejects the interpretation, frontend sends the
     * corrected answer with correction=true.
     *
     * The corrected answer is then processed normally.
     */
    const finalAnswer = text.trim();

    const patientMsg = await InterviewMessage.create({
      sessionId: session._id,
      consultationId,
      sender: 'patient',
      text: finalAnswer,
      inputType,
      confidence: confirmAnswer ? 0.98 : 0.95
    });

    const historyList = prevMessages
      .concat([patientMsg])
      .map((message) => ({
        sender: message.sender,
        text: message.text
      }));

    const aiResponse = await requestInterviewQuestion({
      consultationId,
      patientName: consultation.patient?.name || 'Patient',
      chiefComplaint: consultation.chiefComplaint || '',
      previousMessages: historyList,
      currentQuestion,
      currentAnswer: finalAnswer,
      language:
        session.language ||
        consultation.patient?.language ||
        'English',
      confirmedAnswer: confirmAnswer,
      correction
    });

    /*
     * Safety handling:
     * if a red flag is detected, the AI response is allowed to
     * prioritize safety instead of blindly following the normal
     * question sequence.
     */
    const extractedEntities = aiResponse.extractedEntities || {};
    const redFlags = extractedEntities.redFlags || [];

    let nextQuestion = aiResponse.nextQuestion;

    if (redFlags.length > 0) {
      const language =
        session.language ||
        consultation.patient?.language ||
        'English';

      if (String(language).toLowerCase().includes('hindi')) {
        nextQuestion =
          `आपके बताए लक्षण में ${redFlags.map((flag) => flag.label).join(', ')} शामिल है। ` +
          `यह महत्वपूर्ण जानकारी है। कृपया इस लक्षण की शुरुआत, तीव्रता और वर्तमान स्थिति स्पष्ट करें।`;
      } else {
        nextQuestion =
          `I understood ${redFlags.map((flag) => flag.label).join(', ')}. ` +
          `This is important clinical information. Please clarify when it started, how severe it is, and whether it is happening right now.`;
      }
    }

    const aiMsg = await InterviewMessage.create({
      sessionId: session._id,
      consultationId,
      sender: 'ai',
      text: nextQuestion,
      inputType: 'system',
      extractedEntities,
      confidence: aiResponse.confidence ?? 0.92
    });

    session.currentStepIndex =
      aiResponse.stepIndex ?? session.currentStepIndex + 1;

    if (aiResponse.isComplete && redFlags.length === 0) {
      session.status = 'completed';

      if (!consultation.completedSteps.includes('INTERVIEW')) {
        consultation.completedSteps.push('INTERVIEW');
        await consultation.save();
      }

      await addTimelineEvent({
        patientId: consultation.patientId,
        consultationId,
        eventType: 'INTERVIEW',
        title: 'AI Adaptive Interview Completed',
        description:
          `Patient answered ${
            historyList.filter(
              (message) => message.sender === 'patient'
            ).length
          } diagnostic questions using ${
            inputType === 'voice'
              ? 'Voice Recognition'
              : 'Digital Input'
          }. Clinical entities and symptom traits were extracted.`,
        source: 'AI_CLINICAL_INTERVIEWER',
        badgeColor: 'teal'
      });
    }

    await session.save();

    return res.json({
      success: true,
      requiresConfirmation: false,
      patientMessage: patientMsg,
      aiMessage: aiMsg,
      isComplete: session.status === 'completed',
      stepIndex: session.currentStepIndex,
      totalSteps:
        aiResponse.totalSteps ||
        session.totalStepsExpected ||
        6,
      extractedEntities,
      suggestedOptions: aiResponse.suggestedOptions || [],
      redFlags,
      correctionApplied: correction
    });

  } catch (error) {
    next(error);
  }
};


const getInterviewMessages = async (req, res, next) => {
  try {
    const { consultationId } = req.params;

    const messages = await InterviewMessage
      .find({ consultationId })
      .sort({ createdAt: 1 });

    const session = await InterviewSession.findOne({
      consultationId
    });

    return res.json({
      success: true,
      session,
      count: messages.length,
      data: messages
    });

  } catch (error) {
    next(error);
  }
};


function buildConfirmationPrompt(language, answer) {
  const lang = String(language || 'English').toLowerCase();

  if (lang.includes('hindi')) {
    return `मैंने समझा कि आपने "${answer}" कहा है। क्या यह सही है? आप हाँ कहकर पुष्टि कर सकते हैं या अपना सही उत्तर बोल/टाइप कर सकते हैं।`;
  }

  if (lang.includes('marathi')) {
    return `मला समजले की तुम्ही "${answer}" असे सांगितले. हे बरोबर आहे का? तुम्ही होय म्हणू शकता किंवा योग्य उत्तर बोलू/टाइप करू शकता.`;
  }

  if (lang.includes('tamil')) {
    return `நீங்கள் "${answer}" என்று கூறியதாக நான் புரிந்துகொண்டேன். இது சரியா? நீங்கள் உறுதிப்படுத்தலாம் அல்லது சரியான பதிலை பேசலாம்/தட்டச்சு செய்யலாம்.`;
  }

  return `I understood that you said "${answer}". Is that correct? You can confirm, or speak/type a correction.`;
}


module.exports = {
  startOrGetSession,
  postMessage,
  getInterviewMessages
};