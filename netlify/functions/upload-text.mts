import type { Context } from '@netlify/functions';
import { FunctionDeclaration, GoogleGenerativeAI, InlineDataPart , Tool} from '@google/generative-ai'
const fs = require('fs');

type RequestData = {
    image_type?: String,
    image_data?: String,
    error: {}
}

const getRequestData = async (req: Request) => {
    const data = await req.json();
    let image_type = ""
    let image_data = ""
    let error = {}

    // Quick check to make sure we have the data we need.
    if (data['filedata'] === undefined || data['filetype'] === undefined) {
        error = {
            statusCode: 400,
            body: "Data malformed"
        }
        return { error } as RequestData
    }

    // Great, we have what we need. Grab it!
    const raw_image = data['filedata'].substring(data['filedata'].indexOf(',') + 1)
    image_data = Buffer.from(raw_image, "base64").toString("base64");
    image_type = data['filetype']

    // Ensure that input image is less that 20MB, which is the max allowed by Gemini without streaming.
    if (image_data.length >= (20*1000*1000)) {
        error = {
            statusCode: 400,
            body: "File too large"
        }
        image_type = ""
        image_data = ""
        return { error } as RequestData
    }

    // Cool, we're good to go.
    return { image_type, image_data, error } as RequestData;
}

// Used by the AI model to tell us whether or not we've found text in the image.
const getImageHasText = (hasText: boolean) => {
    return hasText;
}

const checkImageHasTextFunctionDeclaration = {
    name: "getImageHasText",
    parameters: {
        type: "OBJECT",
        description: "Tells the user whether or not the image has text in it.",
        properties: {
            hasText: {
                type: "BOOLEAN",
                description: "Whether or not the image has text in it."
            }
        },
        required: ["hasText"]
    }
} as FunctionDeclaration

// Used by the AI model to tell us what letters are in the image so we can do our own validity checks.
const getLettersInImage = (text: string) => {
    return text.toUpperCase().replace(/ /g, "").split('');
}

const getLettersInImageFunctionDeclaration = {
    name: "getLettersInImage",
    parameters: {
        type: "OBJECT",
        description: "Gets the letters that are found in an image.",
        properties: {
            text: {
                type: "STRING",
                description: "The text found in an image as a single string."
            }
        },
        required: ["text"]
    }
}

// Used by the AI model to return our sweet, sweet garbage.
const generateSentences = (sentences: string[]) => {
    return sentences;
}

const generateSentencesFunctionDeclaration = {
    name: "generateSentences",
    parameters: {
        type: "OBJECT",
        description: "Gets a list of sentences constructed with a set of letters.",
        properties: {
            sentences: {
                type: "ARRAY",
                description: "Sentences generated from a list of letters.",
                items: {
                    type: "STRING"
                }
            }
        },
        required: ["sentences"]
    }
}

const model_functions = {
    getImageHasText: ({hasText}) => {
        return getImageHasText(hasText);
    },
    getLettersInImage: ({text}) => {
        return getLettersInImage(text);
    },
    generateSentences: ({sentences}) => {
        return generateSentences(sentences);
    }
}

export default async (req: Request, context: Context) => {
    const { image_type, image_data, error } = await getRequestData(req);

    // Stop and return a 400 if our inputs are bad.
    if (Object.keys(error).length != 0)
        return new Response(error['body'], { status: error['statusCode'] })

    // Get the model using our API key
    const apiKey = Netlify.env.get("GOOGLE_AI_API_KEY");
    const genAI = new GoogleGenerativeAI(apiKey ? apiKey : "");
    const tools = {functionDeclarations: [
        checkImageHasTextFunctionDeclaration,
        getLettersInImageFunctionDeclaration,
        generateSentencesFunctionDeclaration,
    ]} as Tool
    const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        tools: tools as Tool[]
    });
    
    // Build the prompt we're going to feed the (hungry hungry) model.
    // let prompt = ""
    // prompt += "You are a computer program that specializes in creating funny anagrams. You are very accurate. Please execute the following algorithm:\n"
    // prompt += "I will give you an image, and you will make several interesting and unique anagrams using any number of letters you can find in the image. "
    // prompt += "These anagrams may not match any words found in the image. Next, you will use your anagrams to construct between 1-5 completely new sentences. Do not show me your anagrams."
    // prompt += "\n"
    // prompt += "If you cannot generate any sentences or the input text has no words, skip the rest of this and return 'No anagrams found'. Do not do this if you have generated any sentences.\n"
    // prompt += "\n"
    // prompt += "Anagrams must follow these rules:\n"
    // prompt += "Each anagram must be valid.\n"
    // prompt += "Each anagram must not be a word found in the source image.\n"
    // prompt += "\n"
    // prompt += "Sentences must follow these rules:\n"
    // prompt += "Each sentence must not be the same as the input text.\n"
    // prompt += "Each sentence must not be a fragment of the input text.\n"
    // prompt += "Each sentence must include only valid words.\n"
    // prompt += "Each sentence must be unique.\n"
    // prompt += "You are not allowed to generate more than five sentences.\n"
    // prompt += "\n"
    // prompt += "When sentences are generated, this is how they are formatted:\n"
    // prompt += "Return sentences on separate lines, each starting with '•'.\n"
    // prompt += "Do not add new letters or punctuation to your sentences.\n"

    // Generate the inline image data for the model.
    const image = {
        inlineData: {
            mimeType: image_type,
            data: image_data
        }
    } as InlineDataPart

    // Run the model with the prompt and the image file and return the results without modification.
    // const result = await model.generateContent([prompt, image]);
    // return new Response(result.response.text())

    // Spin up a chat with the model.
    const chat = await model.startChat();

    // First thing to do is check whether or not the image has text.
    let result = await chat.sendMessage(["Is there any text in this image?", image])
    let call = result.response.functionCalls()?.at(0);

    // The model should return a call to `getImageHasText`, which returns whether or not we have text.
    if (!call || !model_functions[call.name](call.args)) {
        console.log("Returning no text!")
        return new Response("Unable to find text in this image");
    }

    // Rad, we have an image that has text. Let's generate some AI garbage.
    // Steps: 1. Get text in image.
    //        2. Get anagrams from text.
    //        3. Get sentences using anagrams
    //        4. Check validity.
    
    // Hilarious, but the AI needs to be encouraged here. If not, it regularly fails saying that it can't read images.
    result = await chat.sendMessage(["You're an advanced AI capable of getting letters from an image. Please get the letters that are in the image above."])
    call = result.response.functionCalls()?.at(0);

    let letters = []
    if (call) {
        letters = model_functions[call?.name](call.args);
    }

    console.log(letters)

    // Quickly shuffle the letters so the AI doesn't try to generate text that's too similar to what we originally had.
    // Thanks to this StackOverflow answer (https://stackoverflow.com/a/46545530) for helping me not write a new function for this mess.
    letters = letters.map(letter => ({ letter, sort: Math.random() })).sort((a, b) => a.sort - b.sort).map(({letter}) => letter);

    // Okay, time for the real deal. Again, encourage the AI. It often fails if we don't.
    let prompt = ""
    prompt += "You're an advanced AI capable of creating sentences from difficult sets of letters.\n"
    prompt += "Create 1-5 sentences using the following letters. Do not add any letters.\n"
    prompt += "Use each letter only once per sentence. The sentences do not need to make sense.\n"
    prompt += letters.join('')
    
    result = await chat.sendMessage([prompt]);
    call = result.response.functionCalls()?.at(0);

    console.log(result.response.text());

    let sentences = []
    if (call) {
        sentences = model_functions[call?.name](call.args);
    }

    return new Response(sentences.join('\n'))
}