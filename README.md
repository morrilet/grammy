# Grammy

## An AI-powered, on-the-go anagram* generator

**Disclaimer: generates terrible, mostly invalid anagrams.*

Does it generate good anagrams? Very rarely! Is it fun to use? **You bet it is.**

Grammy was built quickly with Next.js (create-next-app), V0, Shadcn/UI, Gemini, and Netlify Functions as a way to get hands-on with AI tools and re-familiarize myself with Next.js. The MVP took roughly four hours of work to stand up, but as they say, the devil's in the details. Netlify Functions were a bonus when I decided that maybe (just maybe) I should treat my Gemini API key with some dignity.

## Notes and Considerations

* I see a clear need for tools to properly A/B test my prompts across several runs. It's easy to get sucked into endless tweaking otherwise, and I'm never super confident about the result.
* We're making two API calls for every form entry. I don't love this but there's a good reason for it. On the Netlify free tier synchronous function calls are limited to 10 seconds of runtime, and this process can sometimes take a while. I don't have access to background functions, so splitting the AI calls up is the best bet. This increases AI usage, but that's fine for the number of users I'm expecting.
* Sometimes the AI just fails. This can be due to a number of reasons, but by far the most common is that I've hit my usage limit, since that's tracked by the minute. When that happens it's short-lived, but it's still annoying. Only typically happens when I'm testing a lot, though.
* I built this thing to be fun first, accurate second. I trust the image recognition and could definitely strip out the invalid outputs or re-run them, but I like that this is (relatively) fast and sometimes the invalid outputs make me laugh. Framing any actual successes with confetti keeps things light.
* I've tried all sorts of ways to get the AI to follow the rules, but so far the most effective method has been telling it that it's afraid to break them. If you're reading this and you know a thing or two about prompt engineering, [let's chat](https://morrillplou.me/contact/).

## Running Locally

1. `npm install`
2. `npx netlify dev`
3. Open [http://localhost:8888](http://localhost:8888) and start playing around.

Using the Netlify CLI tools instead of the NPM scripts provided by react also hosts (and provides hot-reloading) to our functions, which makes the whole thing work. Rad stuff, Netlify (<3).

## Deploying

1. `npm run build` to make sure the linter won't complain when Netlify tries to deploy your code.
1. Push changes to `main`, pat yourself on the back, and smile because you got to write code today.

Easy peasy!