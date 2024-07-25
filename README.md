# Grammy

## An AI-powered, on-the-go anagram* generator.

**Disclaimer: generates terrible, mostly invalid anagrams.*

Does it generate good anagrams? Very rarely! Is it fun to use? **You bet it is.**

Grammy was built quickly with Next.js (create-next-app), V0, Shadcn/UI, Gemini, and Netlify Functions as a way to get hands-on with AI tools and re-familiarize myself with Next.js. Netlify Functions were a bonus when I decided that maybe (just maybe) I should treat my Gemini API key with some dignity.

## Running Locally

1. `npm install`
2. `npx netlify dev`
3. Open [http://localhost:8888](http://localhost:8888) and start playing around.

Using the Netlify CLI tools instead of the NPM scripts provided by react also hosts (and provides hot-reloading) to our functions, which makes the whole thing work. Rad stuff, Netlify (<3).

## Deploying

1. `npm run build` to make sure the linter won't complain when Netlify tries to deploy your code.
1. Push changes to `main`, pat yourself on the back, and smile because you got to write code today.

Easy peasy!