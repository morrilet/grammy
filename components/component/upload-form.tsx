import { Button } from "@/components/ui/button"
import { ImageUpload } from "./image-upload"
import { FormEvent, useState } from "react"

type UploadFormProps = {
    onSubmit?: (file: File) => void;
}

export function UploadForm(props: UploadFormProps) {
    const [file, setFile] = useState<File>();

    const handleSubmit = (e: FormEvent) => {
        if (props.onSubmit && file)
            props.onSubmit(file)
    }

    return (
        <form onSubmit={handleSubmit} className="flex w-full max-w-md gap-2">
            <ImageUpload onAcceptFile={(file: File) => {setFile(file)}}/>
            <Button
                disabled={file == null}
                type="submit"
                className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus:outline-none focus:ring-1 focus:ring-primary"
            >
                Submit
            </Button>
        </form>
    )
}