import type { Context } from '@netlify/functions';
import { FunctionDeclaration, GoogleGenerativeAI, InlineDataPart, Tool} from '@google/generative-ai'
import { getImageRequestData, parseLetterString } from '../utils';

// -~-~-~-~- GET IMAGE HAS TEXT AI FUNCTION -~-~-~-~- //
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
// -~-~-~-~- -~-~-~-~- -~-~-~-~- -~-~-~-~- -~-~-~-~- //

// -~-~-~-~- GET LETTERS IN IMAGE AI FUNCTION -~-~-~-~- //
// Used by the AI model to tell us what letters are in the image so we can do our own validity checks.
const getRawLettersInImage = (text: string) => {
    return text.toUpperCase().replace(/ /g, "").split('');
}

const getRawLettersInImageFunctionDeclaration = {
    name: "getRawLettersInImage",
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
} as FunctionDeclaration
// -~-~-~-~- -~-~-~-~- -~-~-~-~- -~-~-~-~- -~-~-~-~- //

// Object keyed on AI function names. Convenient for easily running functions after the AI responds.
const model_functions = {
    getImageHasText: ({hasText}) => {
        return getImageHasText(hasText);
    },
    getRawLettersInImage: ({text}) => {
        return getRawLettersInImage(text);
    }
}

export default async (req: Request, context: Context) => {
    const { image_type, image_data, handling_error } = await getImageRequestData(req);

    // Stop and return a 400 if our inputs are bad.
    if (Object.keys(handling_error).length != 0)
        return new Response(handling_error.body as BodyInit, { status: handling_error['statusCode'] })

    // Get the model using our API key
    const apiKey = Netlify.env.get("GOOGLE_AI_API_KEY");
    const genAI = new GoogleGenerativeAI(apiKey ? apiKey : "");
    const tools = {functionDeclarations: [
        checkImageHasTextFunctionDeclaration,
        getRawLettersInImageFunctionDeclaration
    ]} as Tool
    const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        tools: tools as Tool[]
    });

    // Generate the inline image data for the model.
    const image = {
        inlineData: {
            mimeType: image_type,
            data: image_data
        }
    } as InlineDataPart

    // Spin up a chat with the model.
    const chat = await model.startChat();

    // First thing to do is check whether or not the image has text.
    let result = await chat.sendMessage(["Is there any text in this image?", image])
    let call = result.response.functionCalls()?.at(0);

    // The model should return a call to `getImageHasText`, which returns whether or not we have text.
    if (!call || !model_functions[call.name](call.args)) {
        return new Response();
    }
    
    // Let's get the letters in the text next. It's hilarious, but the AI actuallly needs to 
    // be encouraged here. If not, it regularly fails saying that it can't read images.
    result = await chat.sendMessage(["You're an advanced AI capable of getting letters from an image. Please get the letters that are in the image above."])
    call = result.response.functionCalls()?.at(0);

    let lettersDictionary: {[token: string]: number} = {}
    if (call) {
        const raw_letters = model_functions[call?.name](call.args);
        console.log(raw_letters);
        lettersDictionary = parseLetterString(raw_letters.join(''));
    }

    // In some cases the AI decides that there is text in the image but cannot find 
    // characters because there's actually nothing there. Let's handle that case.
    if (Object.keys(lettersDictionary).length == 0) {
        return new Response();
    }

    return new Response(JSON.stringify(lettersDictionary))
}