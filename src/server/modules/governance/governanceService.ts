import fs from 'node:fs/promises';
import path from 'node:path';

export interface GovernanceEmitRequest {
  targetFolder: string;
  files: {
    filename: string;
    content: string;
  }[];
  overwriteExisting?: boolean;
}

export interface GovernanceEmitResult {
  success: boolean;
  targetFolder: string;
  writtenFiles: string[];
  skippedFiles: string[];
  error?: string;
}

export async function emitGovernanceFiles(req: GovernanceEmitRequest): Promise<GovernanceEmitResult> {
  const targetFolder = path.resolve(req.targetFolder);
  const writtenFiles: string[] = [];
  const skippedFiles: string[] = [];

  try {
    // Ensure target folder exists or create it
    await fs.mkdir(targetFolder, { recursive: true });

    for (const file of req.files) {
      const filePath = path.join(targetFolder, file.filename);
      let exists = false;
      try {
        await fs.stat(filePath);
        exists = true;
      } catch {
        exists = false;
      }

      if (exists && !req.overwriteExisting) {
        skippedFiles.push(file.filename);
        continue;
      }

      await fs.writeFile(filePath, file.content, 'utf-8');
      writtenFiles.push(file.filename);
    }

    return {
      success: true,
      targetFolder,
      writtenFiles,
      skippedFiles,
    };
  } catch (err: any) {
    return {
      success: false,
      targetFolder,
      writtenFiles,
      skippedFiles,
      error: err.message,
    };
  }
}
