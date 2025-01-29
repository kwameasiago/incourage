import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from 'src/auth/auth.guard';
import { Request } from 'express';

@Controller('notifications')
export class NotificationsController {
    constructor(
        private notificationsService:  NotificationsService
    ){}

    @Get()
    @UseGuards(JwtAuthGuard)
    async getNotification(@Req() req:Request){
        const {user} = req;
        return this.notificationsService.getMyNotification(user)
    }
}
