import Image from 'next/image';

export const Footer = () => {
    return (
        <footer className="mt-auto w-full py-2">
            <div className="flex flex-col items-center justify-center">
                <a
                    href="https://github.com/morrilet/grammy"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex font-medium underline underline-offset-4"
                >
                    <Image
                        src="/github-mark.svg"
                        alt="GitHub"
                        width={24}
                        height={24}
                    />
                </a>                
                <p className="text-balance text-center text-sm leading-loose text-muted-foreground">
                    Built fast, with care and curiousity.
                </p>
            </div>
        </footer>
    );
}