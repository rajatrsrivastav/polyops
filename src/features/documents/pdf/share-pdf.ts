import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

export async function generatePdfFile(html: string): Promise<string> {
  const file = await Print.printToFileAsync({ html });
  return file.uri;
}

export async function sharePdf(html: string, dialogTitle: string): Promise<string> {
  const uri = await generatePdfFile(html);

  const available = await Sharing.isAvailableAsync();
  if (!available) {
    throw new Error('Sharing is not available on this device.');
  }

  await Sharing.shareAsync(uri, {
    mimeType: 'application/pdf',
    dialogTitle,
    UTI: 'com.adobe.pdf',
  });

  return uri;
}
