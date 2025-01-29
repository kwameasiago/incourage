import { Controller, Delete, Get, Post, Param, Req, UseInterceptors, UploadedFiles, UseGuards, Query, Body } from '@nestjs/common';
import { Request } from 'express';
import { PhotoManagerService } from './photo-manager.service';
import { FilesInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from 'src/auth/auth.guard';

@Controller('photo-manager')
export class PhotoManagerController {
    constructor(
        private photoManagerService: PhotoManagerService
    ) { }

    @Post()
    @UseGuards(JwtAuthGuard)
    @UseInterceptors(FilesInterceptor('images', 10))
    async uploadPhotos(@UploadedFiles() files: Express.Multer.File, @Req() req: any) {
        return this.photoManagerService.s3Upload(files, req.user)
    }

    @Get()
    @UseGuards(JwtAuthGuard)
    async getMyImages(@Req() req: Request) {
        return await this.photoManagerService.getImagesByUserId(req.user)
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard)
    async deleteImage(@Param('id') id: number) {
        return this.photoManagerService.deleteFromS3(id)
    }

    @Get('feeds')
    @UseGuards(JwtAuthGuard)
    async getFeeds(
        @Query('page') page: number = 1,
        @Query('limit') limit: number = 10,
        @Req() req:Request
    ) {
        return this.photoManagerService.getFeeds(page, limit, req.user)
    }


    @Post('like')
    @UseGuards(JwtAuthGuard)
    async likeUnlikePhoto(
        @Body() body: {photoId: number},
        @Req() req:Request    
    ){
        return this.photoManagerService.toggleLike(body.photoId, req.user)

    }

    @Post('comment')
    @UseGuards(JwtAuthGuard)
    async postComment(
        @Body() body: {photoId: number, comment: string},
        @Req() req:Request    
    ){
        return this.photoManagerService.addComment(body, req.user)
    }

    @Get(':id')
    @UseGuards(JwtAuthGuard)
    async getCommentAndLikes(@Param('id') id: number){
        return this.photoManagerService.getPhotoWithLikesAndComments(id)
    }


    @Get('key/:key')
    @UseGuards(JwtAuthGuard)
    async getPhotoByKey(@Param('key') key:string){
        return this.photoManagerService.findByKeyLike(key)
    }



}
