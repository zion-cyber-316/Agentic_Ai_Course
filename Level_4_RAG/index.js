// const express = require("express");
// const app = express();
// require("dotenv").config();


// const { ChatGroq } =  require("@langchain/groq");

// const { GoogleGenerativeAIEmbeddings } =require("@langchain/google-genai");
// const { TaskType } = require("@google/generative-ai");
// const { QdrantVectorStore } = require("@langchain/qdrant");

// const  fs = require("fs");
// const { PDFParse } = require("pdf-parse");

// const { RecursiveCharacterTextSplitter } = require("@langchain/textsplitters");


// const port = process.env.PORT || 5000

// app.use(express.json());

// app.listen(port,()=>{
//     console.log(`server is runing on port : ${port}`)
// })



// /// RAG (Retrival Augument Genration)







// const llm = new ChatGroq({
//     model: "openai/gpt-oss-120b",
  
// })


// const upload=async ()=>{
//      const pdfPath = "./knowledge.pdf"
//     const buffer = fs.readFileSync(pdfPath)
//     const pdfResult = new PDFParse({ data: buffer })
//     const result = await pdfResult.getText()
//     const text = result.text
//     const spilitter = new RecursiveCharacterTextSplitter({
//         chunkSize: 1000,
//         chunkOverlap: 200
//     })
//     const docs = await spilitter.createDocuments([text])
//        await vectorStore.addDocuments(docs)

//     console.log(docs)
// }

// upload()










// const embeddings = new GoogleGenerativeAIEmbeddings({
//   model: "gemini-embedding-001",
//    apiKey:process.env.GOOGLE_API_KEY , // 768 dimensions
//   taskType: TaskType.RETRIEVAL_DOCUMENT,
//   title: "Document title",
// });





// const vectorStore = QdrantVectorStore.fromExistingCollection(embeddings, {
//    url: process.env.QDRANT_URL,
//   collectionName: "nodejsDocumentation",
//   apiKey:process.env.QDRANT_API_KEY
// });










// const express = require("express");
// const app = express();

// require("dotenv").config();

// const { ChatGroq } = require("@langchain/groq");
// const { GoogleGenerativeAIEmbeddings } = require("@langchain/google-genai");
// const { TaskType } = require("@google/generative-ai");
// const { QdrantVectorStore } = require("@langchain/qdrant");

// const fs = require("fs");
// const { PDFParse } = require("pdf-parse");
// const { RecursiveCharacterTextSplitter } = require("@langchain/textsplitters");

// const port = process.env.PORT || 5000;

// app.use(express.json());

// // LLM
// const llm = new ChatGroq({
//   model: "openai/gpt-oss-120b",
// });

// // Embedding model
// const embeddings = new GoogleGenerativeAIEmbeddings({
//   model: "gemini-embedding-001",
//   apiKey: process.env.GOOGLE_API_KEY,
//   taskType: TaskType.RETRIEVAL_DOCUMENT,
// });

// // Upload PDF and store chunks in Qdrant
// async function upload() {
//   try {
//     const pdfPath = "./knowledge.pdf";

//     const buffer = fs.readFileSync(pdfPath);

//     const pdfParser = new PDFParse({
//       data: buffer,
//     });

//     const result = await pdfParser.getText();
//     const text = result.text;

//     // Split PDF text into chunks
//     const splitter = new RecursiveCharacterTextSplitter({
//       chunkSize: 1000,
//       chunkOverlap: 200,
//     });

//     const docs = await splitter.createDocuments([text]);

//     console.log("Total chunks:", docs.length);

//     // Connect to the existing Qdrant collection
//     const vectorStore = await QdrantVectorStore.fromExistingCollection(
//       embeddings,
//       {
//         url: process.env.QDRANT_URL,
//         collectionName: "nodejsDocumentation",
//         apiKey: process.env.QDRANT_API_KEY,
//       }
//     );

//     // Store document chunks
//     await vectorStore.addDocuments(docs);

//     console.log("PDF documents successfully stored in Qdrant!");

//     await pdfParser.destroy();
//   } catch (error) {
//     console.error("PDF upload failed:", error);
//   }
// }







// // Start server
// app.listen(port, () => {
//   console.log(`Server is running on port: ${port}`);
// });

// // Run upload after all required variables are initialized
// upload();






import express from "express"
import dotenv from "dotenv"
dotenv.config()
import { Document } from "@langchain/core/documents";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { TaskType } from "@google/generative-ai";
import { ChatGroq } from "@langchain/groq"
import { QdrantVectorStore } from "@langchain/qdrant";
import fs from "fs"
import { PDFParse } from "pdf-parse";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
const app = express()

const port = process.env.PORT || 5000



app.use(express.json())


const model=new ChatGroq({
     model: "openai/gpt-oss-120b"
})

const embeddings = new GoogleGenerativeAIEmbeddings({
  model: "gemini-embedding-001",
  apiKey:process.env.GOOGLE_API_KEY ,
   taskType: TaskType.RETRIEVAL_DOCUMENT,
    title: "Document title",// 768 dimensions
});


const vectorStore = await QdrantVectorStore.fromExistingCollection(embeddings, {
  url: process.env.QDRANT_URL,
  collectionName: "nodejsDocumentation",
  apiKey:process.env.QDRANT_API_KEY
});


const upload=async ()=>{
     const pdfPath = "./knowledge.pdf"
    const buffer = fs.readFileSync(pdfPath)
    const pdfResult = new PDFParse({ data: buffer })
    const result = await pdfResult.getText()
    const text = result.text
    const spilitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200
    })
    const docs = await spilitter.createDocuments([text])
    await vectorStore.addDocuments(docs)
   
}



app.post("/chat",async (req,res)=>{
   const {prompt}=req.body
   const docs=await vectorStore.similaritySearch(prompt,5)
   const context=docs.map(doc=>doc.pageContent).join("/n")
   const result=await model.invoke([
    {
        role:"system",
        content:`you are a rag assistant and use this context ${context}`
    },
    {
        role:"human",
        content:prompt
    }
   ])
   return res.json(result.content)
})






app.listen(port, () => {
    console.log("server started at ", port)
})