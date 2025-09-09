import cloudinary from "../services/cloudinary";
import { type Request } from "express";

function extractPublicId(url: string): string | null {
  try {
    const parts = url.split("/");
    const fileWithExt = parts[parts.length - 1];
    const folder = parts[parts.length - 2];
    const fileName = fileWithExt!.substring(0, fileWithExt!.lastIndexOf("."));
    return `${folder}/${fileName}`;
  } catch {
    return null;
  }
}

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

export const processBufferUploads = async (
  buffer: Buffer,
  filename: string,
  folderName: string
): Promise<string> => {
  let uploadResult = "";

  if (!buffer) return uploadResult;

  if ("buffer" in buffer) {
    const fileName = `${filename}-${Date.now()}`;
    const result = await uploadToCloudinary(buffer, folderName, fileName);

    uploadResult = result.secure_url;
  }

  return uploadResult;
};

export async function deleteFromCloudinary(url?: string | null) {
  if (!url) return;
  const publicId = extractPublicId(url);
  if (!publicId) return;

  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
  } catch (err) {
    console.warn(`Could not delete Cloudinary image: ${url}`, err);
  }
}
