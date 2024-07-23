import type { Context } from '@netlify/functions';

export default async (req: Request, context: Context) => {
    const letters_response = await fetch("/.netlify/functions/get-letters", {
      method: "POST",
      body: JSON.stringify({
        filename: file.name,
        filetype: file.type,
        filedata: fileData
      })
    })
    const letters = await letters_response.text();

    const sentences_response = await fetch("/.netlify/functions/get-sentences", {
      method: "POST",
      body: JSON.stringify({
        letters: letters
      })
    })
    const sentences = await sentences_response.text();
}