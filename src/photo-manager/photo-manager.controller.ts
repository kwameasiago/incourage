import { Controller, Delete, Get,Post,Param,Req, UseInterceptors, UploadedFiles, UseGuards } from '@nestjs/common';
import {Request} from 'express';
import { PhotoManagerService } from './photo-manager.service';
import { FilesInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from 'src/auth/auth.guard';

@Controller('photo-manager')
export class PhotoManagerController {
    constructor(
        private photoManagerService: PhotoManagerService
    ){}

    @Post()
    @UseGuards(JwtAuthGuard)
    @UseInterceptors(FilesInterceptor('images', 10))
    async uploadPhotos(@UploadedFiles() files: Express.Multer.File, @Req() req: any){
        return this.photoManagerService.s3Upload(files, req.user)
    }

    @Get()
    @UseGuards(JwtAuthGuard)
    async getMyImages(@Req() req: Request){
        return await this.photoManagerService.getImagesByUserId(req.user)
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard)
    async  deleteImage(@Param('id') id: number){
        return this.photoManagerService.deleteFromS3(id)
    }

    
    


}
