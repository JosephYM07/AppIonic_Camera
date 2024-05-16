import { Injectable } from '@angular/core';
import {
  Camera,
  CameraResultType,
  CameraSource,
  Photo,
} from '@capacitor/camera';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Preferences } from '@capacitor/preferences';
import { ActionSheetController } from '@ionic/angular';

@Injectable({
  providedIn: 'root',
})
export class PhotoService {
  public photos: UserPhoto[] = [];
  private readonly PHOTO_STORAGE: string = 'photos';

  constructor(private actionSheetController: ActionSheetController) {}

  public async addNewToGallery() {
    const actionSheet = await this.actionSheetController.create({
      header: 'Selecciona una opción',
      buttons: [
        {
          text: 'Tomar Foto',
          icon: 'camera',
          handler: () => {
            this.takePhoto(CameraSource.Camera);
          },
        },
        {
          text: 'Seleccionar de la galería',
          icon: 'images',
          handler: () => {
            this.takePhoto(CameraSource.Photos);
          },
        },
        {
          text: 'Cancelar',
          icon: 'close',
          role: 'cancel',
        },
      ],
    });
    await actionSheet.present();
  }

  private async takePhoto(source: CameraSource) {
    // Tomar o seleccionar una foto
    const capturedPhoto = await Camera.getPhoto({
      resultType: CameraResultType.Uri,
      source: source,
      quality: 100,
    });

    // Guardar la foto en el dispositivo
    const savedImageFile = await this.savePicture(capturedPhoto);
    this.photos.unshift(savedImageFile);

    // Guardar la lista de fotos
    await this.savePhotos();
  }

  // Guardar la lista de fotos en el sistema de archivos
  private async savePhotos() {
    await Preferences.set({
      key: this.PHOTO_STORAGE, // Clave para guardar la lista de fotos
      value: JSON.stringify(this.photos), // Convertir la lista de fotos a un string
    });
  }

  // Cargar las fotos guardadas en el sistema de archivos
  public async loadSaved() {
    const photoString = await Preferences.get({ key: this.PHOTO_STORAGE }); // Obtener la lista de fotos guardadas
    this.photos = photoString.value ? JSON.parse(photoString.value) : []; // Convertir el string a un array de fotos guardadas en el sistema de archivos

    // Cargar las fotos guardadas en el sistema de archivos y convertirlas a base64 para mostrarlas
    for (let photo of this.photos) {
      const readFile = await Filesystem.readFile({
        path: photo.filepath,
        directory: Directory.Data,
      });

      // Convertir el contenido del archivo a base64
      photo.webviewPath = `data:image/jpeg;base64,${readFile.data}`;
    }
  }

  private async savePicture(photo: Photo): Promise<UserPhoto> {
    // Convertir la foto a base64
    const base64Data = await this.readAsBase64(photo);

    // Escribir la foto en un archivo
    const fileName = `${new Date().getTime()}.jpeg`;
    const savedFile = await Filesystem.writeFile({
      path: fileName,
      data: base64Data,
      directory: Directory.Data,
    });

    // Devolver la información de la foto guardada
    return {
      filepath: savedFile.uri, // Utilizamos el URI del archivo guardado
      webviewPath: photo.webPath,
    };
  }

  private async readAsBase64(photo: Photo): Promise<string> {
    // Fetch la foto, leerla como un blob y convertirla a formato base64
    const response = await fetch(photo.webPath!);
    const blob = await response.blob();

    return this.convertBlobToBase64(blob);
  }

  private convertBlobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  }

  //ELiminar
  public async deletePicture(photo: UserPhoto, position: number) {
    // Remove this photo from the Photos reference data array
    this.photos.splice(position, 1);

    // Update photos array cache by overwriting the existing photo array
    await Preferences.set({
      key: this.PHOTO_STORAGE,
      value: JSON.stringify(this.photos),
    });

    // delete photo file from filesystem
    const filename = photo.filepath.substr(photo.filepath.lastIndexOf('/') + 1);
    await Filesystem.deleteFile({
      path: filename,
      directory: Directory.Data,
    });
  }
}

export interface UserPhoto {
  filepath: string;
  webviewPath?: string;
}
