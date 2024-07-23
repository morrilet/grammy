import type { Context } from '@netlify/functions';
import { FunctionDeclaration, FunctionDeclarationSchemaProperty, GoogleGenerativeAI, Tool} from '@google/generative-ai'
import { getLetterRequestData } from '../utils';

// -~-~-~-~- GENERATE SENTENCES AI FUNCTION -~-~-~-~- //
// Used by the AI model to return our sweet, sweet garbage.
const generateSentences = (sentences: string[]) => {
    return sentences;
}

const generateSentencesFunctionDeclaration = {
    name: "generateSentences",
    parameters: {
        type: "OBJECT",
        description: "Gets a list of 1-5 sentences constructed with a set of letters and their maximum counts.",
        properties: {
            sentences: {
                type: "ARRAY",
                description: "1-5 sentences generated from a list of letters.",
                items: {
                    type: "STRING"
                } as FunctionDeclarationSchemaProperty
            }
        },
        required: ["sentences"]
    } 
} as FunctionDeclaration
// -~-~-~-~- -~-~-~-~- -~-~-~-~- -~-~-~-~- -~-~-~-~- //

// Object keyed on AI function names. Convenient for easily running functions after the AI responds.
const model_functions = {
    generateSentences: ({sentences}) => {
        return generateSentences(sentences);
    }
}

export default async (req: Request, context: Context) => {
    const { letters, handling_error } = await getLetterRequestData(req);

    // Stop and return a 400 if our inputs are bad.
    if (Object.keys(handling_error).length != 0)
        return new Response(handling_error.body as BodyInit, { status: handling_error.statusCode })

    // Get the model using our API key
    const apiKey = Netlify.env.get("GOOGLE_AI_API_KEY");
    const genAI = new GoogleGenerativeAI(apiKey ? apiKey : "");
    const tools = {functionDeclarations: [
        generateSentencesFunctionDeclaration,
    ]} as Tool
    const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        tools: tools as Tool[]
    });

    // Spin up a chat with the model.
    const chat = await model.startChat();

    // Okay, time for the real deal. Again, encourage the AI. It often fails if we don't.
    let prompt = ""
    prompt += "You're an advanced AI capable of creating sentences from difficult sets of letters.\n"
    prompt += "Create 1-5 sentences using the following letters. Do not add any letter that are not in the list.\n"
    prompt += "For each sentence, only use the letters at most as many times as I tell you.\n"
    prompt += "The sentences do not need to make sense. Do not add punctuation. \n"
    prompt += "\n";
    prompt += "Here are two examples of good sentences:\n"
    prompt += '{"e": 2, "l": 1, "g": 1, "a": 2, "n": 2, "t": 1, "m": 1} -> a gentleman\n'
    prompt += '{"O": 2, "L": 1, "D": 1, "W": 1, "E": 1, "S": 1, "T": 1, "A": 1, "C": 1, "I": 1, "N": 1} -> clint eastwood\n'
    prompt += "\n"
    prompt += "Here are your letters, plus the maximum number of times you may use them in each sentence:\n"
    prompt += JSON.stringify(letters);

    // Debugging...
    console.log(prompt);
    
    const result = await chat.sendMessage([prompt]);
    const call = result.response.functionCalls()?.at(0);

    let sentences = []
    if (call) {
        sentences = model_functions[call?.name](call.args);
    }

    return new Response(JSON.stringify(sentences))
}