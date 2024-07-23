/**
* This code was generated by v0 by Vercel.
* @see https://v0.dev/t/FSeP32sV5ez
* Documentation: https://v0.dev/docs#integrating-generated-code-into-your-nextjs-app
*/

/** Add fonts into your Next.js project:

import { Arimo } from 'next/font/google'
import { Work_Sans } from 'next/font/google'

arimo({
  subsets: ['latin'],
  display: 'swap',
})

work_sans({
  subsets: ['latin'],
  display: 'swap',
})

To read more about using these font, please visit the Next.js documentation:
- App Directory: https://nextjs.org/docs/app/building-your-application/optimizing/fonts
- Pages Directory: https://nextjs.org/docs/pages/building-your-application/optimizing/fonts
**/

'use client'

import { useEffect, useRef, useState } from "react"
import { UploadForm } from "./upload-form";
import { Progress } from "../ui/progress";
import { parseLetterString } from "../../netlify/utils";  // TODO: Move to lib/utils.

export function LandingPage() {
  const [loading, setLoading] = useState<Boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [error, setError] = useState<string>();
  const [results, setResults] = useState<{sentence: string, valid: boolean}[]>([]);
  const progressBarInterval = useRef<NodeJS.Timeout | null>(null);

  // Kicks off the progress bar starting at a given start value and going until a given end value.
  // Duration is used to help with our "jittery lerp" effect.
  const startProgressBar = (startValue: number, endValue: number, durationSeconds: number) => {
    stopProgressBar();  // Stop any previous progress bar intervals just in case.
    setProgress(startValue);

    const timeStep = 10;  // Milliseconds
    let storedProgress = startValue;  // Used so we don't have to wait for `setProgress`.
    let elapsedTime = 0;
    let jumpAmount = 0;

    // Quick clamp utility function. Move if needed again.
    const clamp = (value: number, min: number, max: number) => {
      return Math.min(Math.max(value, min), max);
    }

    // Quick lerp utility function. Move if needed again.
    const lerp = (start: number, end: number, t: number, ease?: number) => {
      let f = t;
      if (ease !== undefined) {
        f = -ease * t * t + (1 + ease) * t; // Quadratic filter with ease ease.
      }
      return start + f * (end - start);
    }

    // Every time we call this, randomly jump the progress bar forward. Amount 
    // and chance to jump are based on the number of seconds since last call.
    const updateProgressBar = () => {
      elapsedTime += timeStep;
      jumpAmount += timeStep * 2;

      // As we're loading make it increasingly likely that we jump a bit.
      if (Math.random() * 1000 <= jumpAmount) {
        elapsedTime += jumpAmount;
        jumpAmount = 0;
      }

      // Lerp stored progress between start and end based on elapsed time.
      storedProgress = lerp(startValue, endValue, clamp(elapsedTime / (durationSeconds * 1000), 0, 1), 0.75);
      storedProgress = clamp(storedProgress, startValue, endValue);
      setProgress(storedProgress);
    }
    progressBarInterval.current = setInterval(updateProgressBar, timeStep);
  }

  const stopProgressBar = () => {
    if (progressBarInterval.current) {
      clearInterval(progressBarInterval.current);
    }
  }

  // Stop the progress bar interval on component unmount.
  useEffect(() => stopProgressBar(), []);

  // If we run into an error, stop everything.
  const raiseError = (message: string) => {
    setLoading(false);
    stopProgressBar();
    setProgress(0);
    setResults([]);

    setError(message);
  }

  const checkSentenceValid = (sentence: string, letters: {[token: string]: number}) => {
    const raw_letters = sentence.toUpperCase().replace(/ /g, "");  // TODO: Maybe make this a util - we use similar code in `get-letters.mts` as well.
    const lettersInSentence = parseLetterString(raw_letters);
    let valid = true;

    // Time to compare the dictionaries. 
    //    1: If we find any characters in `lettersInSentence` that aren't in `letters` then we fail.
    //    2: If we exceed the character limit for any letter in `letters` we fail.
    Object.entries(lettersInSentence).forEach((sentence_letter) => {
      if (letters[sentence_letter[0]] === undefined) {
        console.log(`Sentence invalid because ${sentence_letter[0]} was not found in source image.`)
        valid = false;
        return;
      }
      if (sentence_letter[1] > letters[sentence_letter[0]]) {
        console.log(`Sentence invalid because ${sentence_letter[0]} was used ${sentence_letter[1]} time(s) but was only found ${letters[sentence_letter[0]]} time(s) in the source image.`)
        valid = false;
        return;
      }
    });

    // Great, we made it! Shocking, really...
    return valid;
  }

  const uploadFile = async (file: File) => {
    setLoading(true);
    setProgress(0);
    setResults([]);
    setError("");

    // The midpoint of the progress bar should be between 25 and 50 percent.
    let randomProgressMidpoint = 25 + (Math.random() * (50 - 25));

    let fileData = null
    try {
      fileData = await base64EncodeFile(file)
    } catch (error) {
      console.error(error);
      return;
    }

    // Start the progress bar for the first API call.
    startProgressBar(0, randomProgressMidpoint, 3);

    const letters_response = await fetch("/.netlify/functions/get-letters", {
      method: "POST",
      body: JSON.stringify({
        filename: file.name,
        filetype: file.type,
        filedata: fileData
      })
    })

    // Broadly handle errors in the letters response.
    if (letters_response.status != 200) {
      raiseError("Okay, something went wrong getting letters out of that image. Maybe try again?");
      return;
    }
    const letters = await letters_response.text();

    if (letters.length == 0) {
      raiseError("No text found in the image.");
      return;
    }

    // Continue the progress bar for the second API call.
    startProgressBar(randomProgressMidpoint, 100, 3);

    const sentences_response = await fetch("/.netlify/functions/get-sentences", {
      method: "POST",
      body: JSON.stringify({
        letters: letters
      })
    })

    // Broadly handle errors in the sentences response.
    if (sentences_response.status != 200) {
      raiseError("Okay, something went wrong generating sentences from that image. Maybe try again?");
      return;
    }
    const sentences = await sentences_response.json() as string[];

    const annotatedSentences: {sentence: string, valid: boolean}[] = []
    sentences.forEach(sentence => {
      annotatedSentences.push({sentence: sentence, valid: checkSentenceValid(sentence, JSON.parse(letters) as {[token: string]: number})});
    });
    setResults(annotatedSentences);
    setLoading(false);
  }

  const formatResults = () => {
    return results.map(res => {
      return (
        <li>
          {res.valid ? 	'\u{1F389}' : '\u{274C}'} {res.sentence.charAt(0).toUpperCase()}{res.sentence.toLowerCase().slice(1)}
        </li>
      )
    })
  }

  const base64EncodeFile = (file: File) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        resolve(reader.result);
      }
      reader.onerror = reject;
    })
  }

  return (
    <div className="flex flex-col min-h-[100dvh] items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-md w-full space-y-4 text-center">
        <h1 className="text-3xl font-bold tracking-tighter text-foreground sm:text-4xl md:text-5xl">
          Create an anagram
        </h1>
        <p className="text-muted-foreground md:text-xl">Rewrite some signs, nerd</p>
        {!loading && (
          <UploadForm onSubmit={uploadFile} />
        )}
        {results && !error && (
          <ul>
            {formatResults()}
          </ul>
        )}
        {error && (
          <p>
            {error}
          </p>
        )}
        {loading && (
          <Progress
            value={progress}
          />
        )}
      </div>
    </div>
  )
}
