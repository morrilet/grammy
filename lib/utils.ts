import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const parseLetterString = (raw_letters: string) => {
  const letters : {[token: string] : number} = {}
  
  // Super easy, just run through the letters string and tally up the characters we see.
  // Note that we intentionally avoid sorting the characters here because a random order (anecdotally) improves AI outputs.
  raw_letters.split('').forEach(token => {
      if (letters[token] === undefined)
          letters[token] = 0;
      letters[token] += 1;
  });

  return letters;
}