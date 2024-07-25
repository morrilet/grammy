'use client'

import { useEffect, useRef, useState } from "react"
import { UploadForm } from "./upload-form";
import { Progress } from "../ui/progress";
import { parseLetterString, base64EncodeFile } from "../../lib/utils";
import confetti from 'canvas-confetti';
import { Footer } from "./footer";

export function LandingPage() {
  const [loading, setLoading] = useState<Boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [error, setError] = useState<string>();
  const [results, setResults] = useState<{ sentence: string, valid: boolean }[]>([]);
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

  const checkSentenceValid = (sentence: string, letters: { [token: string]: number }) => {
    const raw_letters = sentence?.toUpperCase().replace(/ /g, "");
    const lettersInSentence = parseLetterString(raw_letters);
    let valid = true;

    // Time to compare the dictionaries. 
    //    1: If we find any characters in `lettersInSentence` that aren't in `letters` then we fail.
    //    2: If we exceed the character limit for any letter in `letters` we fail.
    Object.entries(lettersInSentence).forEach((sentence_letter) => {
      if (letters[sentence_letter[0]] === undefined) {
        valid = false;
        return;
      }
      if (sentence_letter[1] > letters[sentence_letter[0]]) {
        valid = false;
        return;
      }
    });

    // Great, we made it! Shocking, really...
    return valid;
  }

  const launchConfetti = () => {
    const sharedOptions = {
      spread: 90,
    }
    const sideAngleAdjustment = 30;

    // Note that angle is defined counter-clockwise with 90 being straight up and origin is 0-1 from the top-left.
    confetti({ ...sharedOptions, angle: sideAngleAdjustment, origin: { x: 0 } })  // From the left
    confetti({ ...sharedOptions, angle: 180 - sideAngleAdjustment, origin: { x: 1 } }) // From the right
    confetti({ ...sharedOptions, angle: 90, origin: { y: 1 }, startVelocity: 60 })  // From the bottom, and fast!
  }

  const getLettersFromAPI = async (fileType: string, fileData: string) => {
    const response = await fetch("/.netlify/functions/get-letters", {
      method: "POST",
      body: JSON.stringify({
        filetype: fileType,
        filedata: fileData
      })
    })

    // Handle any errors.
    if (response.status != 200) {
      return undefined;
    }

    return await response.json();
  }

  const getSentencesFromAPI = async (letters: { [token: string]: number }) => {
    const response = await fetch("/.netlify/functions/get-sentences", {
      method: "POST",
      body: JSON.stringify({
        letters: letters
      })
    })

    // Handle any errors.
    if (response.status != 200) {
      return undefined
    }

    return await response.json() as string[]
  }

  // Quick helper method for re-mapping sentences with their respective validity checks.
  const annotateSentences = (letters: { [token: string]: number }, sentences: string[]) => {
    return sentences.map((s) => { return { sentence: s, valid: checkSentenceValid(s, letters) } });
  }

  const uploadFile = async (file: File) => {
    // The midpoint of the progress bar should be between 25 and 50 percent.
    // This makes it look lively while still being vaguely helpful.
    const randomProgressMidpoint = 25 + (Math.random() * (50 - 25));

    // Set initial state before we kick everything off.
    setLoading(true);
    setProgress(0);
    setResults([]);
    setError("");

    // Get the file data as a base64-encoded string and gracefully handle any errors.
    let fileData = null
    try {
      fileData = await base64EncodeFile(file)
    } catch (error) {
      console.error(error);
      setError("Oops! Something went wrong parsing that file.");
      return;
    }

    // Get letters from the API and handle any weirdness.
    startProgressBar(0, randomProgressMidpoint, 3);
    const letters = await getLettersFromAPI(file.type, fileData as string);
    if (letters === undefined) {
      raiseError("Okay, something went wrong getting letters out of that image. Try it again?");
      return;
    }
    if (Object.keys(letters).length == 0) {
      raiseError("No text found in the image.");
      return;
    }

    // Get sentences from the API. Also handle weirdness.
    startProgressBar(randomProgressMidpoint, 100, 3);
    const sentences = await getSentencesFromAPI(letters);
    if (sentences === undefined) {
      raiseError("Okay, something went wrong generating sentences from that image. Maybe try again?");
      return;
    }

    // Great, we made it through! Let's check our sentences for validity and update state.
    const results = annotateSentences(letters, sentences);
    setResults(results);
    setLoading(false);
    stopProgressBar();
    setProgress(0);

    // If every sentence is valid we're a big ol' winner. Let's make it fun!
    if (results.filter(s => !s.valid).length == 0) {
      launchConfetti();
    }
  }

  const formatResults = () => {
    return results.map((res, i) => {
      return (
        <li key={i}>
          {res.valid ? '\u{1F389}' : '\u{274C}'} {res.sentence.charAt(0).toUpperCase()}{res.sentence.toLowerCase().slice(1)}
        </li>
      )
    })
  }

  return (
    <div className="flex flex-col min-h-[100dvh] min-w-[100dvw] justify-center bg-background px-4 pt-12 pb-6 sm:px-6 lg:px-8">
      <div className="flex-row mx-auto mt-auto max-w-md w-full space-y-4 text-center">
        <h1 className="text-3xl font-bold tracking-tighter text-foreground sm:text-4xl md:text-5xl">
          Create an anagram
        </h1>
        <p className="text-muted-foreground md:text-xl">Rewrite some signs, nerd</p>
        {!loading && (
          <UploadForm onSubmit={uploadFile} onError={(errors) => setError(errors[0])} />
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

      <Footer />
    </div>
  )
}
