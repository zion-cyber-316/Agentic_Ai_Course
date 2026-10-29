const express = require("express");
const app = express();
require("dotenv").config();
const { ChatGoogle } = require("@langchain/google");
const { TavilySearch } =  require("@langchain/tavily");
const { createAgent, tool } = require("langchain");
const { default: z } = require("zod");
const { ChatGroq } =  require("@langchain/groq");
const { ToolNode } = require("@langchain/langgraph/prebuilt");
const { StateGraph, MessagesAnnotation, MemorySaver, StateSchema, interrupt, Command } = require("@langchain/langgraph");

const {randomUUID} = require("node:crypto");


const port = process.env.PORT || 5000

app.use(express.json());

app.listen(port,()=>{
    console.log(`server is runing on port : ${port}`)
})



// // 1. Memory


// ///  AI Agent ( LLM + Tool + Memory)  with LangGraph



// // 1. Built-in tool

// const tool1 = new TavilySearch({
//   maxResults: 5,
//   topic: "general",

// });


// // 2. custom tool


// const tool2= tool(
//     ({a,b})=>{
//        return `addition of ${a} & ${b} is 7`
//     },{
//         name:"addition_tool",
//         description:"use this tool for addition for two numbers",
//         schema:z.object({
//             a:z.number(),
//             b:z.number()
//         })
//     }
// )
// const tool3=tool(
//     ({email,content})=>{

//        return `email sent successfully to ${email} with content ${content}`
//     },
//     {
//         name:"email_send_tool",
//         description:"use this tool to send email",
//         schema:z.object({
//             email:z.string().describe("sender email"),
//             content:z.string().describe("mail content for sending")
//         })
//     }
// )


// const tools =[tool1,tool2,tool3]


// const llm = new ChatGroq({
//     model: "openai/gpt-oss-120b",
  
// }).bindTools(tools)

// const checkpointer = new MemorySaver();
// const toolNode = new ToolNode(tools)

// const agent = async(state)=>{
//   const result = await llm.invoke(
//      state.messages
//   )
//       return {
//         messages:[result]
//     }
// }

// const shouldContinue=async (state)=>{
//     console.log(state)
//     if(state.messages[state.messages.length-1].tool_calls.length>0){
//         return "tool_node"
//     }else{
//         return "__end__"
//     }
// }





// const graph=new StateGraph(MessagesAnnotation)
// .addNode("agent",agent)
// .addNode("tool_node",toolNode)
// .addEdge("__start__","agent")
// .addConditionalEdges("agent",shouldContinue)
// .addEdge("tool_node","agent")
// .compile({checkpointer})

// app.post("/chat",async(req , res)=>{
//   const {prompt} = req.body;
//    const result=await graph.invoke({
//         messages:[
//             {
//                 role:"user",
//                 content:prompt
//             }
//         ]
//     },{
//         configurable : {thread_id : "1"}
//     }


// )

//     console.log(result.messages)
//     return res.json(result.messages[result.messages.length-1].content)


// })









// 1. Human in the Loop


///  AI Agent ( LLM + Tool + Memory + custoom)  with LangGraph 




const customState=new StateSchema({
    prompt:z.string(),
    approvalRequires:z.boolean(),
    aiResponse:z.string(),
    approved:z.boolean(),
    result:z.string()
})

const checkpointer = new MemorySaver();

const llm = new ChatGroq({
    model: "openai/gpt-oss-120b",
  
})

const agent=async (state)=>{
   const result=await llm.invoke([
    {
        role:"system",
        content:` You are a helpful assistant.

        If the user is greeting or asking a normal question,
        respond normally and set approvalRequires to false.

        If the request requires a sensitive external action,
        such as sending an email or deleting a file,
        set approvalRequires to true.

        Return JSON with:
        {
          "response": "your response",
          "approvalRequires": true or false
        }`
    },
    {
        role:"user",
        content:state.prompt
    }

   ])

const parsed=JSON.parse(result.content)

return {
    aiResponse:parsed.response,
    approvalRequires:parsed.approvalRequires
}


}




const approvalNode=async (state) => {
    const answer=interrupt({
        message:"Do you approve this action?",
        prompt:state.prompt,
        aiResponse:state.aiResponse
    })

    return{
        approved:String(answer).trim().toLowerCase()==="yes"
    }

}

const actionNode=async (state) => {
    if(state.approved){
        return {
            result:`action approved `
        }
    }

    return {
        result:"action reject by human"
    }
}

const shouldContinue=async (state) => {
    if(state.approvalRequires){
        return "approval"
    }

    return "__end__"
}




const graph=new StateGraph(customState)
.addNode("agent",agent)
.addNode("approval",approvalNode)
.addNode("action",actionNode)
.addEdge("__start__","agent")
.addConditionalEdges("agent",shouldContinue)
.addEdge("approval","action")
.addEdge("action","__end__")
.compile({checkpointer})





app.post("/chat",async (req,res)=>{
   const {prompt}=req.body
   const threadId=randomUUID()
   
   const result=await graph.invoke(
    {
     prompt
    },
    {
       configurable:{thread_id:threadId} 
    }
   )
  
   return res.json({
     threadId,
     result:result.result,
     ai:result.aiResponse
   })
})


app.post("/chat/resume",async (req,res)=>{
   const {threadId,answer}=req.body
   
   
   const result=await graph.invoke(
     new Command({
        resume:String(answer)
     })
     ,
     
       {
       configurable:{thread_id:threadId} 
    }  
     
   )
  
   return res.json({
     threadId,
     result:result.result
   })
})









