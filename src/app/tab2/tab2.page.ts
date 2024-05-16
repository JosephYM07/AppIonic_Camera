import { Component } from '@angular/core';
import { PhotoService, UserPhoto } from '../services/photo.service'; // Importamos el servicio de la camara que se creo desde photo.service.ts
import { ActionSheetController } from '@ionic/angular';

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss'],
})
export class Tab2Page {

  constructor(public photoService: PhotoService, public actionSheetController: ActionSheetController) {}

  addPhotoToGallery() {
    this.photoService.addNewToGallery();
  }

  public async showActionSheet(photo: UserPhoto, position: number) {
    const actionSheet = await this.actionSheetController.create({
      header: 'Fotos de la galería',
      buttons: [{
        text: 'Eliminar',
        role: 'destructive',
        icon: 'trash',
        handler: () => {
          this.photoService.deletePicture(photo, position);
        }
      }, {
        text: 'Cancelar',
        icon: 'close',
        role: 'cancel',
        handler: () => {
          // Aqui no hacemos nada porque el usuario cancela accion de borrar la foto
        }
      }]
    });
    await actionSheet.present();
  }

  async ngOnInit() {
    await this.photoService.loadSaved();
  }
}
