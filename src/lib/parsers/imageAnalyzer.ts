/**
 * Analyze an image by sending it to the Yumeo AI agent endpoint,
 * which proxies to Claude's vision capability.
 *
 * Returns a text description of the image content (captions, data, text in image).
 */
export interface ImageAnalysisResult {
    description: string;
    extractedText: string;
    suggestedCaption: string;
  }
  
  /**
   * Convert a File to a base64 data URL string.
   */
  export async function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result;
        if (typeof result !== 'string') {
          reject(new Error('Failed to read file as string'));
          return;
        }
        // Strip the data URL prefix: "data:image/jpeg;base64," → base64 only
        resolve(result.split(',')[1] ?? '');
      };
      reader.onerror = () => reject(new Error('FileReader error'));
      reader.readAsDataURL(file);
    });
  }
  
  /**
   * Send an image to the backend vision endpoint for analysis.
   * The backend proxies to Claude and returns a structured description.
   *
   * @param file      - Image file uploaded by the researcher
   * @param context   - Optional context (e.g., "This is Figure 3 from a neuroscience paper")
   */
  export async function analyzeImage(
    file: File,
    context?: string,
  ): Promise<ImageAnalysisResult> {
    const base64 = await fileToBase64(file);
  
    const response = await fetch('/api/vision', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageBase64: base64,
        mediaType: file.type,
        context: context ?? '',
        filename: file.name,
      }),
    });
  
    if (!response.ok) {
      const err = (await response.json()) as { error?: string };
      throw new Error(err.error ?? 'Image analysis failed');
    }
  
    return response.json() as Promise<ImageAnalysisResult>;
  }