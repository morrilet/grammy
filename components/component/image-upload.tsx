/**
 * Based on https://github.com/ManishBisht777/file-vault - simplified and re-styled for this use case.
 */

'use client'

import { FileImage, UploadCloud, X } from "lucide-react";
import { useCallback, useState, useEffect } from "react";
import { FileRejection, useDropzone } from "react-dropzone";
import { Input } from "../ui/input";

type ImageUploadProps = {
  onAcceptFiles?: (file: File[]) => void
  onRejectFiles?: (errors: FileRejection[]) => void
}
const maxFilenameCharacters = 20;

const classes = {
  label: "h-full relative flex flex-col items-start justify-center w-full border-2 border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100",
  icon: "text-center flex items-center",
}

export function ImageUpload({onAcceptFiles, onRejectFiles, ...otherProps}: ImageUploadProps & React.HTMLAttributes<HTMLDivElement>) {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [rejectedFiles, setRejectedFiles] = useState<FileRejection[]>([])

  useEffect(() => {
    if (onAcceptFiles) {
      onAcceptFiles(uploadedFiles);
    }
  }, [uploadedFiles])

  useEffect(() => {
    if (onRejectFiles && rejectedFiles.length > 0) {
      onRejectFiles(rejectedFiles)
    }
  }, [rejectedFiles])

  const removeFile = (file: File) => {
    setUploadedFiles((prevUploadedFiles) => {
      return prevUploadedFiles.filter((item) => item !== file);
    });
  };

  const onDrop = useCallback((acceptedFiles: File[], fileRejections: FileRejection[]) => {
    setRejectedFiles(fileRejections);

    setUploadedFiles((prevUploadedFiles) => {
      return [...prevUploadedFiles, ...acceptedFiles];
    });
  }, []);

  // Note that all changes to input validation here need to be handled in the backend as well.
  const {
    getRootProps,
    getInputProps,
  } = useDropzone({
    onDrop,
    maxFiles: 1,
    accept: {
      'image/jpeg': [],
      'image/png': []
    },
    maxSize: 20 * 1000 * 1000 // 20 MB - this is the limit provided by Gemini
  });

  return (
    <div {...otherProps} className={"items-stretch " + otherProps['className']}>
      {uploadedFiles.length == 0 && (
        <div className="h-full">
          <label
            {...getRootProps()}
            className={classes.label + " border-dashed"}
          >
            <div className={classes.icon}>
              <div className="border p-2 rounded-md max-w-min mx-auto">
                <UploadCloud size={20} />
              </div>

              <p className="px-3 text-xs text-gray-500">
                Click and drag to upload files, or take a photo
              </p>
            </div>
          </label>

          <Input
            {...getInputProps()}
            id="dropzone-file"
            accept="image/png, image/jpeg"
            type="file"
            capture="environment"
            className="hidden"
          />
        </div>
      )}

      {uploadedFiles.length > 0 && (
        <div className="h-full">
          {uploadedFiles.map((file) => {
            return (
              <label
                key={file.lastModified}
                {...getRootProps()}
                className={classes.label}
              >
                <div className={classes.icon}>
                  <div className="px-2 rounded-md max-w-min mx-auto">
                    <FileImage size={30} />
                  </div>

                  <div className="w-full ml-2 space-y-1">
                    <div className="text-sm flex justify-between">
                      <p className="text-muted-foreground ">
                        {file.name.slice(0, maxFilenameCharacters)}
                        {file.name.length > maxFilenameCharacters ? '...' : ''}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={(e) => { e.stopPropagation(); removeFile(file) }}
                    className="bg-red-500 text-white items-center justify-center px-2"
                  >
                    <X size={20} />
                  </button>
                </div>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}