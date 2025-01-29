import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from 'src/entities/Notification.entity';

@Injectable()
export class NotificationsService {
    constructor(
        @InjectRepository(Notification)
        private readonly notificationRepository: Repository<Notification>
    ) { }
    async createNotification(user, type, description) {
        const notification = this.notificationRepository.create({
            user: user,
            type: type,
            description: description
        })
        await this.notificationRepository.save(notification);
        return notification;
    }

    async getMyNotification(user){
        const {userId} = user;
        return await this.notificationRepository.find({
            where: {user: { id: userId }}
        })
    }
}
