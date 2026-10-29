const express = require("express");
const app = express();
require("dotenv").config();
const { ChatGoogle } = require("@langchain/google");
const { TavilySearch } =  require("@langchain/tavily");
const { createAgent, tool } = require("langchain");
const { default: z } = require("zod");
const { ChatGroq } =  require("@langchain/groq");
const { ToolNode } = require("@langchain/langgraph/prebuilt");
const { StateGraph, MessagesAnnotation } = require("@langchain/langgraph");




const port = process.env.PORT || 5000

app.use(express.json());

app.listen(port,()=>{
    console.log(`server is runing on port : ${port}`)
})


///  AI Agent ( LLM + Tool)  with LangChain

// 1. Built-in tool

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







//   return res.json(result.messages[result.messages.length-1].content)
// })




///  AI Agent ( LLM + Tool)  with LangGraph



// 1. Built-in tool

const tool1 = new TavilySearch({
  maxResults: 5,
  topic: "general",

});


// 2. custom tool


const tool2= tool(
    ({a,b})=>{
       return `addition of ${a} & ${b} is 7`
    },{
        name:"addition_tool",
        description:"use this tool for addition for two numbers",
        schema:z.object({
            a:z.number(),
            b:z.number()
        })
    }
)
const tool3=tool(
    ({email,content})=>{

       return `email sent successfully to ${email} with content ${content}`
    },
    {
        name:"email_send_tool",
        description:"use this tool to send email",
        schema:z.object({
            email:z.string().describe("sender email"),
            content:z.string().describe("mail content for sending")
        })
    }
)


const tools =[tool1,tool2,tool3]


const llm = new ChatGroq({
    model: "openai/gpt-oss-120b",
  
}).bindTools(tools)

const toolNode = new ToolNode(tools)

const agent = async(state)=>{
  const result = await llm.invoke(
     state.messages
  )
      return {
        messages:[result]
    }
}

const shouldContinue=async (state)=>{
    console.log(state)
    if(state.messages[state.messages.length-1].tool_calls.length>0){
        return "tool_node"
    }else{
        return "__end__"
    }
}





const graph=new StateGraph(MessagesAnnotation)
.addNode("agent",agent)
.addNode("tool_node",toolNode)
.addEdge("__start__","agent")
.addConditionalEdges("agent",shouldContinue)
.addEdge("tool_node","agent")
.compile()

app.post("/chat",async(req , res)=>{
  const {prompt} = req.body;
   const result=await graph.invoke({
        messages:[
            {
                role:"user",
                content:prompt
            }
        ]
    })

    console.log(result.messages)
    return res.json(result.messages[result.messages.length-1].content)


})









