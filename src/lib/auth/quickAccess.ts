import { supabase } from "@/integrations/supabase/client";

export interface QuickAccessProfile {
  userId: string;
  email: string;
  fullName: string;
  role?: string;
  avatarUrl?: string | null;
  lastLogin: string;
  hasPin: boolean;
}

interface EncryptedVault {
  ciphertext: string;
  iv: string;
  salt: string;
}

interface StoredAccountData {
  profile: QuickAccessProfile;
  vault: EncryptedVault;
}

const STORAGE_KEY = "femesalud_quick_accounts_vault";
const LAST_ACCOUNT_KEY = "femesalud_quick_last_user";

// --- WEB CRYPTO API HELPERS (PBKDF2 + AES-GCM 256-bit) ---

function bufferToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

async function deriveKey(pin: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    enc.encode(`femesalud-pin-${pin}`),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  return window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

async function encryptData(data: object, pin: string): Promise<EncryptedVault> {
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(pin, salt);

  const enc = new TextEncoder();
  const encodedData = enc.encode(JSON.stringify(data));

  const cipherBuffer = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encodedData
  );

  return {
    ciphertext: bufferToBase64(cipherBuffer),
    iv: bufferToBase64(iv),
    salt: bufferToBase64(salt),
  };
}

async function decryptData(vault: EncryptedVault, pin: string): Promise<any> {
  const salt = new Uint8Array(base64ToBuffer(vault.salt));
  const iv = new Uint8Array(base64ToBuffer(vault.iv));
  const ciphertext = base64ToBuffer(vault.ciphertext);

  const key = await deriveKey(pin, salt);

  const decryptedBuffer = await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    ciphertext
  );

  const dec = new TextDecoder();
  return JSON.parse(dec.decode(decryptedBuffer));
}

// --- VAULT STORAGE MANAGEMENT ---

function getStoredVault(): Record<string, StoredAccountData> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function setStoredVault(data: Record<string, StoredAccountData>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error("Error saving quick access vault", e);
  }
}

/**
 * Saves or updates a user account in the quick access vault.
 * The password is encrypted with the 4-digit PIN.
 */
export async function saveQuickAccessAccount(params: {
  userId: string;
  email: string;
  fullName: string;
  role?: string;
  avatarUrl?: string | null;
  password?: string;
  pin: string;
}): Promise<void> {
  const { userId, email, fullName, role, avatarUrl, password, pin } = params;

  if (!pin || pin.length !== 4) return;

  const vault = getStoredVault();
  let existingPassword = password;

  // If password is not provided, try to recover from existing vault entry if PIN matches
  if (!existingPassword && vault[userId]) {
    try {
      const decrypted = await decryptData(vault[userId].vault, pin);
      existingPassword = decrypted.password;
    } catch {
      // PIN changed without old password
    }
  }

  if (!existingPassword) {
    // If we still don't have password, we can't create an autologin vault
    return;
  }

  const encryptedVault = await encryptData(
    { email, password: existingPassword, userId },
    pin
  );

  const profile: QuickAccessProfile = {
    userId,
    email,
    fullName: fullName || email.split("@")[0],
    role: role || "Usuario",
    avatarUrl: avatarUrl || null,
    lastLogin: new Date().toISOString(),
    hasPin: true,
  };

  vault[userId] = {
    profile,
    vault: encryptedVault,
  };

  setStoredVault(vault);
  localStorage.setItem(LAST_ACCOUNT_KEY, userId);
}

/**
 * Returns all saved accounts for this device/browser
 */
export function getQuickAccessAccounts(): QuickAccessProfile[] {
  const vault = getStoredVault();
  return Object.values(vault).map((v) => v.profile);
}

/**
 * Returns the most recently used quick access account
 */
export function getLastQuickAccessAccount(): QuickAccessProfile | null {
  const vault = getStoredVault();
  const lastId = localStorage.getItem(LAST_ACCOUNT_KEY);
  if (lastId && vault[lastId]) {
    return vault[lastId].profile;
  }
  const accounts = Object.values(vault);
  if (accounts.length > 0) {
    // Sort by lastLogin desc
    accounts.sort((a, b) => new Date(b.profile.lastLogin).getTime() - new Date(a.profile.lastLogin).getTime());
    return accounts[0].profile;
  }
  return null;
}

/**
 * Checks if there is at least one quick access account saved
 */
export function hasQuickAccessAccounts(): boolean {
  const vault = getStoredVault();
  return Object.keys(vault).length > 0;
}

/**
 * Removes an account from the device's quick access vault
 */
export function removeQuickAccessAccount(userId: string): void {
  const vault = getStoredVault();
  delete vault[userId];
  setStoredVault(vault);

  const lastId = localStorage.getItem(LAST_ACCOUNT_KEY);
  if (lastId === userId) {
    localStorage.removeItem(LAST_ACCOUNT_KEY);
  }
}

/**
 * Unlocks the account with the 4-digit PIN and signs into Supabase Auth.
 */
export async function unlockQuickAccessAccount(
  userId: string,
  pin: string
): Promise<{ success: boolean; user?: any; error?: string }> {
  const vault = getStoredVault();
  const entry = vault[userId];

  if (!entry) {
    return { success: false, error: "No se encontró el registro de esta cuenta en este equipo." };
  }

  try {
    const credentials = await decryptData(entry.vault, pin);

    if (!credentials || !credentials.email || !credentials.password) {
      return { success: false, error: "Credenciales corruptas en este equipo." };
    }

    // Authenticate with Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    });

    if (error) {
      if (error.message.includes("Invalid login credentials")) {
        return {
          success: false,
          error: "La contraseña de la cuenta ha cambiado. Por favor inicia sesión con correo y contraseña.",
        };
      }
      return { success: false, error: error.message };
    }

    // Update lastLogin timestamp
    entry.profile.lastLogin = new Date().toISOString();
    vault[userId] = entry;
    setStoredVault(vault);
    localStorage.setItem(LAST_ACCOUNT_KEY, userId);

    return { success: true, user: data.user };
  } catch (err: any) {
    // AES-GCM decryption throws OperationError when auth tag doesn't match (wrong PIN)
    return { success: false, error: "Clave de seguridad incorrecta. Verifica los 4 dígitos." };
  }
}
