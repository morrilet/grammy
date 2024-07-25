'use client'

import { Button } from "@/components/ui/button"
import { ImageUpload } from "./image-upload"
import { FormEvent, useState } from "react"
import { FileRejection } from "react-dropzone";

type UploadFormProps = {
    onSubmit?: (file: File) => void;
    onError?: (errors: string[]) => void;
}

export function UploadForm(props: UploadFormProps) {
    const [file, setFile] = useState<File>();

    const handleSubmit = (e: FormEvent) => {
        if (props.onSubmit && file)
            props.onSubmit(file)
    }

    const handleRejections = (rejections: FileRejection[]) => {
        if (props.onError) {
            props.onError(rejections.flatMap(r => r.errors.map(e => e.message)))
        }
    }

    return (
        <form onSubmit={handleSubmit} className="flex flex-space w-full items-stretch max-w-md gap-2">
            <ImageUpload className="grow h-10" 
                onAcceptFiles={(files: File[]) => {setFile(files[0])}} 
                onRejectFiles={(rejections) => handleRejections(rejections)}
            />
            <Button
                disabled={file == null}
                type="submit"
                className="inline-flex shrink-0 h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus:outline-none focus:ring-1 focus:ring-primary"
            >
                Submit
            </Button>
        </form>
    )
}