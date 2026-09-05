import fs from "fs";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import { askAi } from "../services/openRouter.service.js";
import User from "../models/user.model.js";
import Interview from "../models/interview.model.js";

export const analyzeResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Resume required" });
    }
    const filepath = req.file.path;
    const fileBuffer = await fs.promises.readFile(filepath);
    const uint8Array = new Uint8Array(fileBuffer);
    const pdf = await pdfjsLib.getDocument({ data: uint8Array }).promise;
    let resumeText = "";
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const content = await page.getTextContent();
      const pageText = content.items.map((item) => item.str).join(" ");
      resumeText += pageText + "\n";
    }
    resumeText = resumeText.replace(/\s+/g, " ").trim();

    const messages = [
      {
        role: "system",
        content: `
Extract structured data from resume.

Return strictly JSON:

{
  "role": "string",
  "experience": "string",
  "projects": ["project1", "project2"],
  "skills": ["skill1", "skill2"]
}
`,
      },
      {
        role: "user",
        content: resumeText,
      },
    ];

    const aiResponse = await askAi({ messages })
    const parsed=JSON.parse(aiResponse)
    fs.unlinkSync(filepath)
     
    res.json({
        role:parsed.role,
        experience:parsed.experience,
        projects:parsed.projects,
        skills:parsed.skills,
        resumeText

    })

  } catch (error) {
    console.log(error)
    if(req.file&&fs.existsSync(req.file.path)){
        fs.unlinkSync(req.file.path)
    }
   return  res.status(500).json({message:error.message})
  }
};

export const generateQuestion=async(req,res)=>{
  try{
    let {role,experience,mode,resumeText,projects,skills}=req.body 
    role=role?.trim()
    experience=experience?.trim() 
    mode =mode?.trim() 
    if(!role||!experience||!mode){
      return res.status(400).json({message:"Role, Experience and Mode are required"})
    
    }
    const user=await User.findById(req.userId) 
    if(!user){
      return res.status(400).json({message:
        "User not found"
      })
    }
    if(user.credits<50){
      return res.status(400).json(
        {message:"Not enough credits. Minimum 50 required"}
      )
    }
    const projectsText=Array.isArray(projects)&&projects.length?projects.join(", "):"None"
    const skillsText=Array.isArray(skills)&&skills.length?skills.join(" "):"None"
    const safeResume=resumeText?.trim()||"None"


    const userPrompt = `
    Role:${role}
    Experience:${experience}
    InterviewMode:${mode}
    Projects:${projectsText}
    Skills:${skillsText},
    Resume:${safeResume}
    `;

const messages = [

      {
        role: "system",
        content: `
You are a real human interviewer conducting a professional interview.

Speak in simple, natural English as if you are directly talking to the candidate.

Generate exactly 5 interview questions.

Strict Rules:
- Each question must contain between 15 and 25 words.
- Each question must be a single complete sentence.
- Do NOT number them.
- Do NOT add explanations.
- Do NOT add extra text before or after.
- One question per line only.
- Keep language simple and conversational.
- Questions must feel practical and realistic.

Difficulty progression:
Question 1 → easy  
Question 2 → easy  
Question 3 → easy  
Question 4 → medium  
Question 5 → medium 

Make questions based on the candidate’s role, experience,interviewMode, projects, skills, and resume details.
`
      }
      ,
      {
        role: "user",
        content: userPrompt
      }
    ];
    const aiResponse=await askAi({messages})
    if(!aiResponse||!aiResponse.trim()){
      return res.status(500).json({message:"Ai returned empty response"})
    }
    const questionsArray=aiResponse
        .split("\n")
        .map(q=>q.trim())
        .filter(q=>q.length>0)
        .slice(0,5)

    if (questionsArray.length===0){
      return res.status(500).json({message:"AI failed to generate questions"})
    }
     user.credits-=50
     await user.save()

     const interview  =  await Interview.create({
      userId:user._id,
      role,
      experience,
      mode,
      resumeText:safeResume,
      questions:questionsArray.map((q,index)=>({
        question:q,
        difficulty:["easy","easy","medium","medium","hard"][index],
        timeLimit:[300,300,300,300,360][index],

      }))

     })
     res.json({
      interviewId:interview._id,
      creditsLeft:user.credits,
      userName:user.name,
      questions:interview.questions
     })

  }
  catch(error){
    console.log(error)
    return res.status(500).json({message:`failed to create questions ${error}`})
  }

}

export const submitAnswer=async(req,res)=>{
  try{
    const{interviewId,questionIndex,answer,timeTaken}=req.body 
     const interview=await Interview.findById(interviewId)
     if(!interview){
  return res.status(404).json({
    message: "Interview not found"
  })
}
     const question=interview.questions[questionIndex]
     //if no answer 
     if(!answer){
       question.score=0
       question.feedback="You did not submit an answer"
       question.answer=""
       await interview.save()
       return res.json({feedback:question.feedback})
     }

     //if time exceeded 
     if(timeTaken>question.timeLimit){
      question.score=0 
      question.feedback="Time limit exceeded.Answer not evaluated"
      question.answer=answer
      return res.json({feedback:question.feedback})
     }

      const messages = [
      {
        role: "system",
        content: `
You are a professional human interviewer evaluating a candidate's answer in a real job interview.

Evaluate naturally, fairly, and positively. Give credit for what the candidate actually demonstrates. Do not be unnecessarily strict.

SCORING:

Score Confidence, Communication, and Correctness from 0 to 10.

1. Confidence
- If the candidate gives a clear and direct response, give a good score.
- Minor hesitation, grammar mistakes, or imperfect wording should not significantly reduce the score.
- Clear and reasonably confident answer: 7–8.
- Very confident and professional answer: 9–10.
- Very unclear, extremely hesitant, or barely responsive answer: 5–6.

2. Communication
- Focus on whether the interviewer can understand the candidate's response.
- Simple English and minor grammar mistakes are acceptable.
- Clear and understandable answer: 7–8.
- Very clear, structured, concise, and professional answer: 9–10.
- Very unclear, incomplete, or difficult-to-understand response: 5–6.

3. Correctness
- Focus on whether the candidate's answer correctly addresses the question.
- Give credit for the correct main concept even if some details are missing.
- A reasonably correct answer: 7–8.
- A highly accurate, complete, and well-explained answer: 9–10.
- Partially correct answer with noticeable gaps: 6.
- No meaningful answer, completely irrelevant answer, or answer showing major misunderstanding: 5 or below.

IMPORTANT SCORING RULES:

- Be generous when the candidate demonstrates genuine understanding.
- Reward correct ideas and relevant explanations.
- Do not require a perfect textbook answer.
- Do not require every possible detail.
- Do not penalize concise answers when they answer the question correctly.
- Do not significantly penalize minor grammar mistakes.
- Do not penalize simple English.
- Do not invent mistakes.
- Do not lower the score just because the answer could contain more information.
- Judge the answer according to the question's difficulty and requirements.

VERY IMPORTANT:

If the candidate does not properly respond to the question, gives an irrelevant response, says very little, or does not demonstrate enough understanding, do NOT give a high score.

Use approximately 5–6 in such cases.

Examples:

- No meaningful response / "I don't know" / unrelated response → 5–6
- Very short response with little useful information → 5–6
- Partially relevant but incomplete answer → 6
- Reasonable answer addressing the main question → 7–8
- Strong and clearly explained answer → 8–9
- Excellent, accurate, detailed, and interview-ready answer → 9–10

Do not give 9 or 10 unless the answer genuinely deserves it.

FINAL SCORE:

Calculate:

finalScore = round((confidence + communication + correctness) / 3)

Round to the nearest whole number.

FEEDBACK:

Write exactly 10–15 words.

- Sound like a real professional interviewer.
- Be encouraging when the answer is good.
- Mention a useful improvement when the answer has weaknesses.
- If the candidate did not answer properly, clearly but politely suggest answering the question directly.
- Do not repeat the question.
- Do not explain the numerical scores.
- Do not invent weaknesses.
- Keep feedback natural, concise, professional, and honest.

Return ONLY valid JSON in this exact format:

{
  "confidence": number,
  "communication": number,
  "correctness": number,
  "finalScore": number,
  "feedback": "short natural interview feedback"
}


`
      }
      ,
      {
        role: "user",
        content: `
Question: ${question.question}
Answer: ${answer}
`
      }
    ];

    const aiResponse=await askAi({messages})
    const parsed=JSON.parse(aiResponse)
    question.answer=answer
    question.confidence=parsed.confidence 
    question.communication=parsed.communication 
    question.correctness=parsed.correctness 
    question.score=parsed.finalScore 
    question.feedback=parsed.feedback   
    await interview.save() 
    return res.status(200).json({feedback:parsed.feedback})
      
     
  }
  catch(error){
     return res.status(500).json({message:`failed to submit answer ${error}`})
  }
}


export const finishInterview=async(req,res)=>{
  try{
    const {interviewId}=req.body 
    const interview=await Interview.findById(interviewId)
    if(!interview){
      return res.status(400).json({message:"failed to find Interview"})
    }
    const totalQuestions=interview.questions.length 
    let totalScore=0
    let totalConfidence=0
    let totalCommunication=0
    let totalCorrectness=0


    interview.questions.forEach((q)=>{
      totalScore+=q.score||0
      totalConfidence+=q.confidence||0
      totalCommunication+=q.communication||0
      totalCorrectness+=q.correctness||0
    })
    const finalScore=totalQuestions?totalScore/totalQuestions:0
    const avgConfidence=totalQuestions?totalConfidence/totalQuestions:0 
    const avgCommunication=totalQuestions?totalCommunication/totalQuestions:0 
    const avgCorrectness=totalQuestions?totalCorrectness/totalQuestions:0 
    interview.finalScore=finalScore
    interview.status="completed"
    await interview.save()

 return res.status(200).json({
  finalScore:Number(finalScore.toFixed(1)),
  confidence:Number(avgConfidence.toFixed(1)),
  communication:Number(avgCommunication.toFixed(1)),
  correctness:Number(avgCorrectness.toFixed(1)),
  questionWiseScore:interview.questions.map((q)=>({
    question:q.question,
    score:q.score||0,
    feedback:q.feedback,
    confidence:q.confidence||0,
    communication:q.communication||0,
    correctness:q.correctness||0,
  }))
 })



  }
  catch(error){
   return res.status(500).json({message:`failed to finish Interview ${error}`})
  }
}

export const getMyInterviews=async(req,res)=>{
  try{
    const interviews=await Interview.find({userId:req.userId})
    .sort({createdAt:-1})
    .select("role experience mode finalScore status createdAt")

    return res.status(200).json(interviews)
  }
  catch(error){
    return res.status(500).json({message:`failed to find currentUser Interview ${error}`})
  }
}

export const getInterviewReport=async(req,res)=>{
  try{
    const interview=await Interview.findById(req.params.id)
    if(!interview){
      return  res.status(404).json({message:"Interview not found"})
    }

      const totalQuestions=interview.questions.length 
   
    let totalConfidence=0
    let totalCommunication=0
    let totalCorrectness=0


    interview.questions.forEach((q)=>{
      
      totalConfidence+=q.confidence||0
      totalCommunication+=q.communication||0
      totalCorrectness+=q.correctness||0
    })
    const avgConfidence=totalQuestions?totalConfidence/totalQuestions:0 
    const avgCommunication=totalQuestions?totalCommunication/totalQuestions:0 
    const avgCorrectness=totalQuestions?totalCorrectness/totalQuestions:0 
     
    return res.status(200).json({
  finalScore:interview.finalScore,
  confidence:Number(avgConfidence.toFixed(1)),
  communication:Number(avgCommunication.toFixed(1)),
  correctness:Number(avgCorrectness.toFixed(1)),
  questionWiseScore:interview.questions
    })

    
  }
  catch(error){
    return res.status(500).json({message:`failed to find currentUser Interview ${error}`})
  }
}