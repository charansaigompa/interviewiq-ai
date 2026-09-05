
import React, { useEffect, useRef, useState } from "react";
import femaleVideo from "../assets/Videos/female-ai.mp4";
import Timer from "./Timer";
import { motion } from "motion/react";
import { FaMicrophone, FaMicrophoneSlash } from "react-icons/fa";
import { serverUrl } from "../App";
import { BsArrowRight } from "react-icons/bs";
import axios from "axios";

const Step2Interview = ({ interviewData, onFinish }) => {
  const { interviewId, questions, userName } = interviewData;

  // ============================================================
  // STATE
  // ============================================================

  const [isIntroPhase, setIsIntroPhase] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isAIPlaying, setIsAIPlaying] = useState(false);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState("");
  const [subtitle, setSubtitle] = useState("");

  const [timeLeft, setTimeLeft] = useState(
    questions[0]?.timeLimit || 60
  );

  const [selectedVoice, setSelectedVoice] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ============================================================
  // REFS
  // ============================================================

  const recognitionRef = useRef(null);
  const videoRef = useRef(null);

  const currentQuestion = questions[currentIndex];

  // ============================================================
  // LOAD SPEECH SYNTHESIS VOICE
  // ============================================================

  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();

      if (!voices.length) return;

      /*
        Try to find a known female voice.

        Different browsers/devices provide different voice names,
        so we check several commonly available names.
      */

      const femaleVoice = voices.find((voice) => {
        const name = voice.name.toLowerCase();

        return (
          name.includes("zira") ||
          name.includes("samantha") ||
          name.includes("female") ||
          name.includes("aria") ||
          name.includes("jenny") ||
          name.includes("google uk english female") ||
          name.includes("google us english")
        );
      });

      if (femaleVoice) {
        setSelectedVoice(femaleVoice);
        return;
      }

      /*
        If a known female voice is not available,
        prefer an English voice.

        IMPORTANT:
        We do NOT assume voices[0] is female.
      */

      const englishVoice = voices.find((voice) =>
        voice.lang.toLowerCase().startsWith("en")
      );

      if (englishVoice) {
        setSelectedVoice(englishVoice);
      } else {
        setSelectedVoice(voices[0]);
      }
    };

    loadVoices();

    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  // ============================================================
  // SPEAK TEXT
  // ============================================================

  const speakText = (text) => {
    return new Promise((resolve) => {
      if (!window.speechSynthesis || !selectedVoice) {
        resolve();
        return;
      }

      // Stop any previous speech
      window.speechSynthesis.cancel();

      // Add natural pauses
      const humanText = text
        .replace(/,/g, ", ... ")
        .replace(/\./g, ". ... ");

      const utterance = new SpeechSynthesisUtterance(humanText);

      utterance.voice = selectedVoice;

      // Human-like pacing
      utterance.rate = 0.92;
      utterance.pitch = 1.05;
      utterance.volume = 1;

      // ----------------------------------------------------------
      // Speech started
      // ----------------------------------------------------------

      utterance.onstart = () => {
        setIsAIPlaying(true);

        if (videoRef.current) {
          videoRef.current.play().catch((error) => {
            console.log("Video play error:", error);
          });
        }
      };

      // ----------------------------------------------------------
      // Speech ended
      // ----------------------------------------------------------

      utterance.onend = () => {
        if (videoRef.current) {
          videoRef.current.pause();
          videoRef.current.currentTime = 0;
        }

        setIsAIPlaying(false);

        if (isMicOn) {
          startMic();
        }

        setTimeout(() => {
          setSubtitle("");
          resolve();
        }, 300);
      };

      // ----------------------------------------------------------
      // Speech error
      // ----------------------------------------------------------

      utterance.onerror = (error) => {
        console.log("Speech synthesis error:", error);

        if (videoRef.current) {
          videoRef.current.pause();
          videoRef.current.currentTime = 0;
        }

        setIsAIPlaying(false);

        resolve();
      };

      setSubtitle(text);

      window.speechSynthesis.speak(utterance);
    });
  };

  // ============================================================
  // INTRODUCTION + QUESTIONS
  // ============================================================

  useEffect(() => {
    if (!selectedVoice) return;

    const runInterviewSpeech = async () => {
      // ----------------------------------------------------------
      // INTRO PHASE
      // ----------------------------------------------------------

      if (isIntroPhase) {
        await speakText(
          `Hi ${userName}, it's great to meet you today. I hope you're feeling confident and ready`
        );

        await speakText(
          "I'll ask you a few questions. Just answer naturally, and take your time. Let's begin."
        );

        setIsIntroPhase(false);
      }

      // ----------------------------------------------------------
      // QUESTION PHASE
      // ----------------------------------------------------------

      else if (currentQuestion) {
        console.log("currentQuestion:", currentQuestion);

        await new Promise((resolve) => setTimeout(resolve, 800));

        // Last question message
        if (currentIndex === questions.length - 1) {
          await speakText(
            "Alright, this one might be a bit more challenging."
          );
        }

        // Speak question
        await speakText(currentQuestion.question);

        if (isMicOn) {
          startMic();
        }
      }
    };

    runInterviewSpeech();
  }, [selectedVoice, isIntroPhase, currentIndex]);

  // ============================================================
  // TIMER
  // ============================================================

  useEffect(() => {
    if (isIntroPhase) return;
    if (!currentQuestion) return;
    if (isSubmitting) return;

    const timer = setInterval(() => {
      setTimeLeft((previousTime) => {
        if (previousTime <= 1) {
          clearInterval(timer);
          return 0;
        }

        return previousTime - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isIntroPhase, currentIndex, isSubmitting]);

  // ============================================================
  // SPEECH RECOGNITION
  // ============================================================

  useEffect(() => {
    if (!("webkitSpeechRecognition" in window)) {
      console.log("Speech recognition is not supported.");
      return;
    }

    const recognition = new window.webkitSpeechRecognition();

    recognition.lang = "en-US";
    recognition.continuous = true;
    recognition.interimResults = false;

    recognition.onresult = (event) => {
      const transcript =
        event.results[event.results.length - 1][0].transcript;

      setAnswer((previousAnswer) => {
        return previousAnswer + " " + transcript;
      });
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current.abort();
      }
    };
  }, []);

  // ============================================================
  // START MICROPHONE
  // ============================================================

  const startMic = () => {
    if (recognitionRef.current && !isAIPlaying) {
      try {
        recognitionRef.current.start();
      } catch (error) {
        console.log("Microphone start error:", error);
      }
    }
  };

  // ============================================================
  // STOP MICROPHONE
  // ============================================================

  const stopMic = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  // ============================================================
  // TOGGLE MICROPHONE
  // ============================================================

  const toggleMic = () => {
    if (isMicOn) {
      stopMic();
    } else {
      startMic();
    }

    setIsMicOn((previousState) => !previousState);
  };

  // ============================================================
  // SUBMIT ANSWER
  // ============================================================

  const submitAnswer = async () => {
    if (isSubmitting) return;

    stopMic();
    setIsSubmitting(true);

    try {
      const result = await axios.post(
        `${serverUrl}/api/interview/submit-answer`,
        {
          interviewId,
          questionIndex: currentIndex,
          answer,
          timeTaken:
            currentQuestion.timeLimit - timeLeft,
        },
        {
          withCredentials: true,
        }
      );

      setFeedback(result.data.feedback);

      await speakText(result.data.feedback);

      setIsSubmitting(false);
    } catch (error) {
      console.log("Submit answer error:", error);

      setIsSubmitting(false);
    }
  };

  // ============================================================
  // NEXT QUESTION
  // ============================================================

  const handleNext = async () => {
    setAnswer("");
    setFeedback("");

    // Finish interview if there are no more questions
    if (currentIndex + 1 >= questions.length) {
      finishInterview();
      return;
    }

    await speakText(
      "Alright, let's move to the next question."
    );

    setCurrentIndex((previousIndex) => previousIndex + 1);

    setTimeout(() => {
      if (isMicOn) {
        startMic();
      }
    }, 500);
  };

  // ============================================================
  // FINISH INTERVIEW
  // ============================================================

  const finishInterview = async () => {
    stopMic();
    setIsMicOn(false);

    try {
      const result = await axios.post(
        `${serverUrl}/api/interview/finish`,
        {
          interviewId,
        },
        {
          withCredentials: true,
        }
      );

      console.log(result.data);

      onFinish(result.data);
    } catch (error) {
      console.log("Finish interview error:", error);
    }
  };

  // ============================================================
  // AUTO SUBMIT WHEN TIMER ENDS
  // ============================================================

  useEffect(() => {
    if (isIntroPhase) return;
    if (!currentQuestion) return;

    if (
      timeLeft === 0 &&
      !isSubmitting &&
      !feedback
    ) {
      submitAnswer();
    }
  }, [timeLeft]);

  // ============================================================
  // CLEANUP
  // ============================================================

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current.abort();
      }

      window.speechSynthesis.cancel();
    };
  }, []);

  // ============================================================
  // RESET TIMER FOR NEW QUESTION
  // ============================================================

  useEffect(() => {
    if (!isIntroPhase && currentQuestion) {
      setTimeLeft(currentQuestion.timeLimit || 300);
    }
  }, [currentQuestion, isIntroPhase]);

  // ============================================================
  // ALWAYS USE FEMALE VIDEO
  // ============================================================

  const videoSource = femaleVideo;

  // ============================================================
  // UI
  // ============================================================

  return (
    <div className="min-h-screen bg-linear-to-br from-emerald-50 via-white to-teal-100 flex items-center justify-center p-4 sm:p-6">

      <div className="w-full max-w-350 min-h-[80vh] bg-white rounded-3xl shadow-2xl border border-gray-200 flex flex-col lg:flex-row overflow-hidden">

        {/* ======================================================
            VIDEO SECTION
        ====================================================== */}

        <div className="w-full lg:w-[35%] bg-white flex flex-col items-center p-6 space-y-6 border-r border-gray-200">

          {/* AI VIDEO */}

          <div className="w-full max-w-md rounded-2xl overflow-hidden shadow-xl">

            <video
              muted
              playsInline
              preload="auto"
              className="w-full h-auto object-cover"
              ref={videoRef}
              src={videoSource}
            />

          </div>

          {/* SUBTITLE */}

          {subtitle && (
            <div className="w-full max-w-md bg-gray-50 border border-gray-200 rounded-xl p-4 shadow-sm">

              <p className="text-gray-700 text-sm sm:text-base font-medium text-center leading-relaxed">
                {subtitle}
              </p>

            </div>
          )}

          {/* TIMER AREA */}

          <div className="w-full max-w-md bg-white border border-gray-200 rounded-2xl shadow-md p-6 space-y-5">

            <div className="flex justify-between items-center">

              <span className="text-sm text-gray-500">
                Interview Status
              </span>

              {isAIPlaying && (
                <span className="text-sm font-semibold text-emerald-600">
                  AI Speaking
                </span>
              )}

            </div>

            <div className="h-px bg-gray-200"></div>

            {/* TIMER */}

            <div className="flex justify-center">

              <Timer
                timeLeft={timeLeft}
                totalTime={currentQuestion?.timeLimit || 60}
              />

            </div>

            <div className="h-px bg-gray-200"></div>

            {/* QUESTION COUNT */}

            <div className="grid grid-cols-2 gap-6 text-center">

              <div>

                <span className="text-2xl font-bold text-emerald-600">
                  {currentIndex + 1}
                </span>

                <span className="text-xs text-gray-400 block">
                  Current Question
                </span>

              </div>

              <div>

                <span className="text-2xl font-bold text-emerald-600">
                  {questions.length}
                </span>

                <span className="text-xs text-gray-400 block">
                  Total Questions
                </span>

              </div>

            </div>

          </div>

        </div>

        {/* ======================================================
            TEXT SECTION
        ====================================================== */}

        <div className="flex-1 flex flex-col p-4 sm:p-6 md:p-8 relative">

          <h2 className="text-xl sm:text-2xl font-bold text-emerald-600 mb-6">
            AI Smart Interview
          </h2>

          {/* QUESTION */}

          {!isIntroPhase && (
            <div className="relative mb-6 bg-gray-50 p-4 sm:p-6 rounded-2xl border border-gray-200 shadow-sm">

              <p className="text-xs sm:text-sm text-gray-400 mb-2">
                Question {currentIndex + 1} of {questions.length}
              </p>

              <div className="text-base sm:text-lg font-semibold text-gray-800 leading-relaxed pr-16">
                {currentQuestion?.question}
              </div>

            </div>
          )}

          {/* ANSWER TEXTAREA */}

          <textarea
            onChange={(event) => {
              setAnswer(event.target.value);
            }}
            value={answer}
            placeholder="Type your answer here..."
            className="flex-1 bg-gray-100 p-4 sm:p-6 rounded-2xl resize-none outline-none border border-gray-200 focus:ring-2 focus:ring-emerald-500 transition text-gray-800"
          />

          {/* ====================================================
              BUTTONS / FEEDBACK
          ==================================================== */}

          {!feedback ? (

            <div className="flex items-center gap-4 mt-6">

              {/* MICROPHONE BUTTON */}

              <motion.button
                onClick={toggleMic}
                whileTap={{ scale: 0.9 }}
                className="w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center rounded-full bg-black text-white shadow-lg"
              >

                {isMicOn ? (
                  <FaMicrophone size={20} />
                ) : (
                  <FaMicrophoneSlash size={20} />
                )}

              </motion.button>

              {/* SUBMIT BUTTON */}

              <motion.button
                onClick={submitAnswer}
                disabled={isSubmitting}
                whileTap={{ scale: 0.9 }}
                className="flex-1 disabled:bg-gray-500 bg-gradient-to-r from-emerald-600 to-teal-500 text-white py-3 sm:py-4 rounded-2xl shadow-lg hover:opacity-90 transition font-semibold"
              >

                {isSubmitting
                  ? "Submitting..."
                  : "Submit Answer"}

              </motion.button>

            </div>

          ) : (

            /* FEEDBACK */

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-6 bg-emerald-50 border border-emerald-200 p-5 rounded-2xl shadow-sm"
            >

              <p className="text-emerald-700 font-medium mb-4">
                {feedback}
              </p>

              <button
                onClick={handleNext}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-500 text-white py-3 rounded-xl shadow-md hover:opacity-90 transition"
              >

                Next Question

                <BsArrowRight size={18} />

              </button>

            </motion.div>

          )}

        </div>

      </div>

    </div>
  );
};

export default Step2Interview;

