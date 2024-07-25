interface HandlingError {
    statusCode: number,
    body: string
}

interface RequestData {
    handling_error: HandlingError
}

interface ImageRequestData extends RequestData {
    image_type?: string,
    image_data?: string
}

// Note that letters are stored in a dictionary. This is for two reasons:
//      1. Data size. For long strings of text, this will use less bandwidth.
//      2. Flexibility. I have a hunch that the AI model will follow this more 
//         strictly than plaintext, and we can play with the data easier this way.
interface LetterRequestData extends RequestData {
    letters?: { [key: string]: number }
}

export const getImageRequestData = async (req: Request) => {
    const data = await req.json();
    const result: ImageRequestData = {
        handling_error: {} as HandlingError
    }

    // Quick check to make sure we have the data we need.
    if (data['filedata'] === undefined || data['filetype'] === undefined) {
        result.handling_error.statusCode = 400;
        result.handling_error.body = "Data malformed";
        return result;
    }

    // Great, we have what we need. Grab it!
    const raw_image = data['filedata'].substring(data['filedata'].indexOf(',') + 1)
    result.image_data = Buffer.from(raw_image, "base64").toString("base64");
    result.image_type = data['filetype']

    // Ensure that input image is less that 20MB, which is the max allowed by Gemini without streaming.
    if (result.image_data.length >= (20 * 1000 * 1000)) {
        result.handling_error.statusCode = 400;
        result.handling_error.body = "File too large";

        // Reset these values since we've already set them.
        result.image_type = ""
        result.image_data = ""

        return result
    }

    // Cool, we're good to go.
    return result;
}

export const getLetterRequestData = async (req: Request) => {
    const data = await req.json();
    const result: LetterRequestData = {
        handling_error: {} as HandlingError
    }

    // Check that we were given some data. Throw an error if not.
    if (data['letters'] === undefined) {
        result.handling_error.statusCode = 400;
        result.handling_error.body = "Data malformed"
        return result;
    }

    result.letters = data['letters']
    return result;
}