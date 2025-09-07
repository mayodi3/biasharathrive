import cloudinary from "../services/cloudinary";
import { type Request } from "express";

const uploadToCloudinary = (
  fileBuffer: Buffer,
  folder: string,
  filename?: string
): Promise<any> => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "auto",
        use_filename: true,
        public_id: filename,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    stream.end(fileBuffer);
  });
};

export const processUploads = async (
  fileOrFiles: Request["files"] | Express.Multer.File | undefined,
  folderMap: Record<string, string>
): Promise<Record<string, string>> => {
  const uploadResults: Record<string, string> = {};

  if (!fileOrFiles) return uploadResults;

  if ("buffer" in fileOrFiles) {
    const folder = folderMap[fileOrFiles.fieldname as string] ?? "misc";
    const fileName = `${fileOrFiles.originalname}-${Date.now()}`;
    const result = await uploadToCloudinary(
      fileOrFiles.buffer as Buffer,
      folder,
      fileName
    );
    uploadResults[fileOrFiles.fieldname as string] = result.secure_url;
    return uploadResults;
  }

  for (const [fieldname, fileList] of Object.entries(fileOrFiles)) {
    const arr = Array.isArray(fileList) ? fileList : [fileList];
    for (const file of arr as Express.Multer.File[]) {
      const folder = folderMap[fieldname] ?? "misc";
      const fileName = `${file.originalname}-${Date.now()}`;
      const result = await uploadToCloudinary(file.buffer, folder, fileName);
      uploadResults[fieldname] = result.secure_url;
    }
  }

  return uploadResults;
};
