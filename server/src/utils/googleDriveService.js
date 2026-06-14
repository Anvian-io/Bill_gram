import { google } from "googleapis";
import fs from "fs";

const GOOGLE_SCOPES = [
  "https://www.googleapis.com/auth/drive.file",
  "https://www.googleapis.com/auth/userinfo.email",
];

const DRIVE_FOLDER_NAME = "Shopkeeper Backups";
const BACKUP_FILE_PREFIX = "shopkeeper-backup-";

/**
 * Create an OAuth2 client using env vars
 */
export function getOAuth2Client() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI?.trim();

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error(
      "Missing Google OAuth credentials. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI in .env"
    );
  }

  if (clientId === "dummy_client_id") {
    throw new Error("dummy_client_id detected. Google OAuth is disabled.");
  }

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

/**
 * Generate the Google consent URL
 */
export function getAuthUrl() {
  const oAuth2Client = getOAuth2Client();
  return oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: GOOGLE_SCOPES,
    prompt: "consent", // ensures refresh_token is always returned
  });
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeCodeForTokens(code) {
  const oAuth2Client = getOAuth2Client();
  const { tokens } = await oAuth2Client.getToken(code);
  return tokens;
}

/**
 * Get a ready-to-use OAuth2 client with given tokens (auto-refreshes if expired)
 */
export function buildAuthenticatedClient(accessToken, refreshToken, tokenExpiry) {
  const oAuth2Client = getOAuth2Client();
  oAuth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
    expiry_date: tokenExpiry ? new Date(tokenExpiry).getTime() : undefined,
  });
  return oAuth2Client;
}

/**
 * Get the Google account email using the authenticated client
 */
export async function getGoogleUserEmail(oAuth2Client) {
  try {
    const oauth2 = google.oauth2({ version: "v2", auth: oAuth2Client });
    const { data } = await oauth2.userinfo.get();
    return data.email || null;
  } catch {
    return null;
  }
}

/**
 * Find or create the "Shopkeeper Backups" folder in Google Drive
 */
async function getOrCreateBackupFolder(drive) {
  // Search for existing folder
  const listRes = await drive.files.list({
    q: `name='${DRIVE_FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: "files(id, name)",
    spaces: "drive",
  });

  if (listRes.data.files && listRes.data.files.length > 0) {
    return listRes.data.files[0].id;
  }

  // Create folder
  const createRes = await drive.files.create({
    requestBody: {
      name: DRIVE_FOLDER_NAME,
      mimeType: "application/vnd.google-apps.folder",
    },
    fields: "id",
  });

  return createRes.data.id;
}

/**
 * Upload a local zip file to Google Drive
 * Returns { driveFileId, driveLink, fileSizeKb }
 */
export async function uploadFileToDrive(oAuth2Client, filePath, fileName) {
  const drive = google.drive({ version: "v3", auth: oAuth2Client });

  const folderId = await getOrCreateBackupFolder(drive);

  const fileSize = fs.statSync(filePath).size;
  const fileSizeKb = parseFloat((fileSize / 1024).toFixed(2));

  const uploadRes = await drive.files.create({
    requestBody: {
      name: fileName,
      parents: [folderId],
    },
    media: {
      mimeType: "application/zip",
      body: fs.createReadStream(filePath),
    },
    fields: "id, webViewLink",
  });

  const driveFileId = uploadRes.data.id;
  const driveLink = uploadRes.data.webViewLink;

  return { driveFileId, driveLink, fileSizeKb };
}

/**
 * Delete older backup files from Drive and keep only the most recent file.
 * Returns { deletedFileIds, failedDeleteIds }.
 */
export async function cleanupOldBackupsInDrive(oAuth2Client, keepFileId) {
  const drive = google.drive({ version: "v3", auth: oAuth2Client });
  const folderId = await getOrCreateBackupFolder(drive);

  const files = [];
  let pageToken = undefined;

  do {
    const listRes = await drive.files.list({
      q: `'${folderId}' in parents and trashed=false and name contains '${BACKUP_FILE_PREFIX}'`,
      fields: "nextPageToken, files(id, name)",
      spaces: "drive",
      pageSize: 1000,
      pageToken,
    });

    const batch = listRes.data.files || [];
    files.push(...batch);
    pageToken = listRes.data.nextPageToken || undefined;
  } while (pageToken);

  const filesToDelete = files.filter(
    (file) => file.id && file.id !== keepFileId
  );

  const deletedFileIds = [];
  const failedDeleteIds = [];

  for (const file of filesToDelete) {
    try {
      await drive.files.delete({ fileId: file.id });
      deletedFileIds.push(file.id);
    } catch (error) {
      console.warn(
        `Failed to delete old backup from Drive (${file.name || file.id}):`,
        error.message
      );
      failedDeleteIds.push(file.id);
    }
  }

  return { deletedFileIds, failedDeleteIds };
}

/**
 * Check internet connectivity by fetching Google
 */
export async function checkInternetConnectivity() {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch("https://www.google.com", {
      method: "HEAD",
      signal: controller.signal,
    });
    clearTimeout(timeout);
    return res.ok || res.status < 500;
  } catch {
    return false;
  }
}
