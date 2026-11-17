import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';

import { useBillPhotoUrl } from '@/features/expenses/hooks/use-bill-photo-url';
import { PrimaryButton } from '@/shared/components/PrimaryButton';

type BillPhotoFieldProps = {
  /** Existing storage path (edit) or null */
  storedPath: string | null;
  /** Fresh local URI chosen in this session */
  localUri: string | null;
  onChangeLocalUri: (uri: string | null) => void;
  onRemoveStored?: () => void;
  removeStored?: boolean;
};

export function BillPhotoField({
  storedPath,
  localUri,
  onChangeLocalUri,
  onRemoveStored,
  removeStored = false,
}: BillPhotoFieldProps) {
  const [pickerError, setPickerError] = useState<string | null>(null);
  const previewPath = localUri ?? (removeStored ? null : storedPath);
  const { url, isLoading } = useBillPhotoUrl(previewPath);

  async function pickPhoto() {
    setPickerError(null);
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    const library = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted && !library.granted) {
      setPickerError('Camera or photo library permission is required for bill photos.');
      return;
    }

    // Prefer camera for factory floor speed; fall back to library.
    const result = permission.granted
      ? await ImagePicker.launchCameraAsync({
          mediaTypes: ['images'],
          quality: 0.7,
          allowsEditing: false,
        })
      : await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          quality: 0.7,
          allowsEditing: false,
        });

    if (result.canceled || !result.assets[0]?.uri) return;
    onChangeLocalUri(result.assets[0].uri);
  }

  async function pickFromLibrary() {
    setPickerError(null);
    const library = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!library.granted) {
      setPickerError('Photo library permission is required.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      allowsEditing: false,
    });

    if (result.canceled || !result.assets[0]?.uri) return;
    onChangeLocalUri(result.assets[0].uri);
  }

  function clearPhoto() {
    onChangeLocalUri(null);
    onRemoveStored?.();
  }

  return (
    <View className="gap-3">
      <Text className="text-base font-semibold text-slate-700">Bill photo (optional)</Text>

      {url ? (
        <Image source={{ uri: url }} className="h-48 w-full rounded-2xl bg-slate-100" />
      ) : (
        <View className="h-32 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white">
          <Text className="text-body-lg text-slate-500">
            {isLoading ? 'Loading photo…' : 'No photo attached'}
          </Text>
        </View>
      )}

      {pickerError ? <Text className="text-base text-red-600">{pickerError}</Text> : null}

      <View className="flex-row gap-2">
        <View className="flex-1">
          <PrimaryButton label="Take photo" onPress={() => void pickPhoto()} />
        </View>
        <View className="flex-1">
          <PrimaryButton
            label="Gallery"
            variant="secondary"
            onPress={() => void pickFromLibrary()}
          />
        </View>
      </View>

      {previewPath ? (
        <Pressable accessibilityRole="button" onPress={clearPhoto}>
          <Text className="text-center text-base font-semibold text-red-600">Remove photo</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
