import { useState, useRef, useCallback } from 'react';
import { Platform, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';

/** Matches the backend's per-profile cap. */
export const MAX_PHOTOS = 5;

type Picked = { uri: string; width: number; height: number };

type Options = {
  /** Current photo count, to enforce the cap before opening the library. */
  count: number;
  /** Called after a successful upload, to refresh the profile. */
  onUploaded: () => void | Promise<void>;
};

/**
 * Pick a photo, crop it, upload it.
 *
 * The profile screen and the guided setup flow each carried their own copy of
 * this - permission check, re-entrancy lock, web-vs-native upload branch and
 * all. Two copies meant the crop step could be added to one and forgotten in the
 * other, which is precisely how photos uploaded during setup would end up a
 * different shape from photos added later.
 *
 * Returns everything both screens need, including the props for the cropper.
 */
export function usePhotoUpload({ count, onUploaded }: Options) {
  const [uploading, setUploading] = useState(false);
  const [picked, setPicked] = useState<Picked | null>(null);

  // Synchronous lock. React state updates are async, so `uploading` alone
  // cannot block a second tap landing before the picker returns - which
  // launches a second picker Activity and crashes Android.
  const busy = useRef(false);

  const upload = useCallback(
    async (uri: string) => {
      setUploading(true);
      try {
        const token = await AsyncStorage.getItem('auth_token');
        const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:8080';
        const endpoint = `${backendUrl}/api/v1/attachment/upload`;
        const auth = { Authorization: token ? `Bearer ${token}` : '' };
        let status = 500;

        if (Platform.OS === 'web') {
          const blob = await (await fetch(uri)).blob();
          const form = new FormData();
          form.append('file', blob, uri.split('/').pop() || 'profile.jpg');
          status = (await fetch(endpoint, { method: 'POST', body: form, headers: auth })).status;
        } else {
          status = (
            await FileSystem.uploadAsync(endpoint, uri, {
              httpMethod: 'POST',
              uploadType: FileSystem.FileSystemUploadType.MULTIPART,
              fieldName: 'file',
              mimeType: 'image/jpeg',
              headers: auth,
            })
          ).status;
        }

        if (status !== 200) throw new Error(`Upload failed with status ${status}`);
        await onUploaded();
      } catch (error) {
        console.error('Upload failed', error);
        Alert.alert('Upload failed', 'There was an error uploading your photo. Please try again.');
      } finally {
        setUploading(false);
      }
    },
    [onUploaded]
  );

  /** Opens the library; the cropper takes over once something is chosen. */
  const pick = useCallback(async () => {
    if (busy.current) return;
    busy.current = true;

    try {
      if (count >= MAX_PHOTOS) {
        Alert.alert('Limit reached', `You can upload a maximum of ${MAX_PHOTOS} photos.`);
        return;
      }

      // Must be requested before opening the library, or the OS terminates the
      // app on iOS and denies access on Android 13+.
      if (Platform.OS !== 'web') {
        const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!granted) {
          Alert.alert('Permission required', 'Please allow photo access to upload your pictures.');
          return;
        }
      }

      // No allowsEditing: the in-app cropper replaces the OS one, so the frame
      // is the same shape on every device and matches how the app displays it.
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 1,
        exif: false,
      });

      const asset = result.assets?.[0];
      if (result.canceled || !asset?.uri) return;

      setPicked({
        uri: asset.uri,
        // The picker occasionally omits dimensions for cloud-backed assets.
        // Squaring off is a safe default: the cropper clamps to real bounds.
        width: asset.width || 1000,
        height: asset.height || 1000,
      });
    } catch (error) {
      console.error('Could not open photo library', error);
      Alert.alert('Could not open photos', 'Please try again.');
    } finally {
      busy.current = false;
    }
  }, [count]);

  const cancelCrop = useCallback(() => setPicked(null), []);

  const finishCrop = useCallback(
    (croppedUri: string) => {
      setPicked(null);
      upload(croppedUri);
    },
    [upload]
  );

  return {
    pick,
    uploading,
    /** Spread straight onto <PhotoCropper />. */
    cropperProps: {
      visible: !!picked,
      uri: picked?.uri ?? null,
      sourceWidth: picked?.width ?? 0,
      sourceHeight: picked?.height ?? 0,
      onCancel: cancelCrop,
      onDone: finishCrop,
    },
  };
}
