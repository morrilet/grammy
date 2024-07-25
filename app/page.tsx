import { LandingPage } from "@/components/component/landing-page";
import Head from "next/head";

export default function Home() {
  return (
    <>
      <Head>
        {/* This helps ensure that the body takes up the full width even on tiny screens in the Chrome dev tools.*/}
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
      </Head>
      <LandingPage />
    </>
  );
}
