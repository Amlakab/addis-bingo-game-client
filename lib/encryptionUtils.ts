class EncryptionService {
  private key: CryptoKey | null = null;
  private initialized: boolean = false;

  async init(): Promise<void> {
    if (this.initialized) return;
    
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode('your-32-char-secret-key-for-bingo!!'),
      'PBKDF2',
      false,
      ['deriveKey']
    );

    this.key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: new TextEncoder().encode('bingo-feta-salt-12345'),
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );

    this.initialized = true;
  }

  async encryptId(id: string | number): Promise<string> {
    await this.init();
    
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoded = new TextEncoder().encode(id.toString());
    
    const encrypted = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      this.key!,
      encoded
    );

    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(encrypted), iv.length);

    // Convert Uint8Array to string without iteration
    let binaryString = '';
    for (let i = 0; i < combined.length; i++) {
      binaryString += String.fromCharCode(combined[i]);
    }

    return btoa(binaryString)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  async decryptId(encryptedData: string): Promise<string> {
    await this.init();
    
    try {
      const base64 = encryptedData
        .replace(/-/g, '+')
        .replace(/_/g, '/');
      
      const padding = base64.length % 4;
      const paddedBase64 = padding === 0 ? base64 : base64 + '='.repeat(4 - padding);
      
      const binaryString = atob(paddedBase64);
      const binaryData = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        binaryData[i] = binaryString.charCodeAt(i);
      }

      const iv = binaryData.slice(0, 12);
      const encrypted = binaryData.slice(12);

      const decrypted = await crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: iv
        },
        this.key!,
        encrypted
      );

      return new TextDecoder().decode(decrypted);
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Invalid encrypted ID');
    }
  }
}

export const encryptionService = new EncryptionService();