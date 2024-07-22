import type { Context } from '@netlify/functions';
import { GoogleGenerativeAI, InlineDataPart } from '@google/generative-ai'
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

export default async (req: Request, context: Context) => {
    const { image_type, image_data, error } = await getRequestData(req);

    // Stop and return a 400 if our inputs are bad.
    if (Object.keys(error).length != 0)
        return new Response(error['body'], { status: error['statusCode'] })

    // Get the model using our API key
    const apiKey = Netlify.env.get("GOOGLE_AI_API_KEY");
    const genAI = new GoogleGenerativeAI(apiKey ? apiKey : "");
    const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash"
    });
    
    // Build the prompt we're going to feed the (hungry hungry) model.
    let prompt = "";
    prompt += "Create up to five anagrams using text found in the provided image. ";
    prompt += "Make the anagrams as close to complete sentences as possible. ";
    prompt += "Make the anagrams funny. ";
    prompt += "The output must be an anagram, with no exceptions. ";
    prompt += "Do not output duplicate anagrams. ";
    prompt += "Do not output anagrams that are very similar to the source image. "
    prompt += "You may use each letter once for every occurrence. ";
    prompt += "Do not use letters that are not present in the text. ";
    prompt += "Do not use letters more than the number of times they appear in the text. ";
    prompt += "Format your output with one anagram per-line. ";
    prompt += "Start all lines with a bullet point. ";

    // Generate the inline image data for the model.
    const image = {
        inlineData: {
            mimeType: image_type,
            data: image_data
        }
    } as InlineDataPart

    // Run the model with the prompt and the image file and return the results without modification.
    const result = await model.generateContent([prompt, image]);
    return new Response(result.response.text())
}