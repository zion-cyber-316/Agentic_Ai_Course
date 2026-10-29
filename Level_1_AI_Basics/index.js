const express = require("express");
const app = express();
require("dotenv").config();

const { GoogleGenAI } = require("@google/genai");
const { ChatGoogle } = require("@langchain/google");

const port = process.env.PORT || 5000

app.use(express.json());

app.listen(port,()=>{
    console.log(`server is runing on port : ${port}`)
})


/// 1. AI Intigration 

// const ai = new GoogleGenAI({
//     apiKey : process.env.GEMINI_API_KEY

// })


// default ai calling

// const main = async()=>{
//     const response = await ai.models.generateContent({
//         model:"gemini-3.6-flash",
//         contents:"what is javaScript"
//     })
//     console.log(response.text)
// }

// main()


// Project chat-boat


// app.post("/chat",async(req ,res)=>{
//     const {prompt} = req.body
//     const result = await ai.models.generateContent({
//         model :"gemini-3.6-flash",
//         contents : prompt
//     })

//     return res.json(result.text)
// })





/// 2. AI Intigration with Langchain


app.post("/chat",async(req ,res)=>{
    const {prompt} = req.body
    const ai = new ChatGoogle("gemini-3.6-flash")

    const result = await ai.invoke([{
        role : "system",
        content:"your my assestent and your name is yo yo honey singh"
    },
{
    role:"human",
    content : prompt
}])

    return res.json(result.content)
})
