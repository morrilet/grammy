import type { Context } from '@netlify/functions';

export default async (req: Request, context: Context) => {
    const apiKey = Netlify.env.get("GOOGLE_AI_API_KEY");

    return new Response("Test!");
}