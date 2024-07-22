/**
 * Based on https://github.com/ManishBisht777/file-vault - simplified and re-styled for this use case.
 */

'use client'

import { FileImage, UploadCloud, X } from "lucide-react";
import { useCallback, useState, useEffect } from "react";
import { FileRejection, useDropzone } from "react-dropzone";
import { Input } from "../ui/input";

const ImageIcon = <FileImage size={40} className={"fill-purple-600"} />

type ImageUploadProps = {
  onAcceptFile?: (file: File) => void
}

export function ImageUpload(props: ImageUploadProps) {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [errors, setErrors] = useState<String[]>([]);

  useEffect(() => {
    if (props.onAcceptFile) {
      props.onAcceptFile(uploadedFiles[0]);  // This dropzone only accepts one file.
    }
  }, [uploadedFiles])

  const removeFile = (file: File) => {
    setErrors([]);
    setUploadedFiles((prevUploadedFiles) => {
      return prevUploadedFiles.filter((item) => item !== file);
    });
  };

  const onDrop = useCallback((acceptedFiles: File[], fileRejections: FileRejection[]) => {
    setErrors([]);

    if (fileRejections.length > 0) {
      const { errors } = fileRejections[0];
      setErrors(errors.map(err => err.message))
    }

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
    maxSize: 20*1000*1000 // 20 MB - this is the limit provided by Gemini
  });

  return (
    <div>
      {uploadedFiles.length == 0 && (
        <div>
          <label
            {...getRootProps()}
            className="relative flex flex-col items-center justify-center w-full py-6 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 "
          >
            <div className=" text-center flex items-center">
              <div className=" border p-2 rounded-md max-w-min mx-auto">
                <UploadCloud size={20} />
              </div>

              <p className="text-xs text-gray-500">
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
        <div>
          <p className="font-medium my-2 mt-6 text-muted-foreground text-sm">
            Uploaded Files
          </p>
          <div className="space-y-2 pr-3">
            {uploadedFiles.map((file) => {
              return (
                <div
                  key={file.lastModified}
                  className="flex justify-between gap-2 rounded-lg overflow-hidden border border-slate-100 group hover:pr-0 pr-2 hover:border-slate-300 transition-all"
                >
                  <div className="flex items-center flex-1 p-2">
                    <div className="text-white">
                      {ImageIcon}
                    </div>
                    <div className="w-full ml-2 space-y-1">
                      <div className="text-sm flex justify-between">
                        <p className="text-muted-foreground ">
                          {file.name.slice(0, 25)}
                        </p>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFile(file)}
                    className="bg-red-500 text-white transition-all items-center justify-center px-2 hidden group-hover:flex"
                  >
                    <X size={20} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {errors.length > 0 && (
        <ul>
          {errors.map((err, i) => <li key={i}>{err}</li>)}
        </ul>
      )}
    </div>
  );
}