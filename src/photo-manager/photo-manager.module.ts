import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PhotoManagerController } from './photo-manager.controller';
import { PhotoManagerService } from './photo-manager.service';
import { UsersModule } from 'src/users/users.module';
import { PhotoMetaData } from 'src/entities/PhotoMetaData.entity';
import { Like } from 'src/entities/Like.entity';
import { Comment } from 'src/entities/Comment.entity';
import { NotificationsModule } from 'src/notifications/notifications.module';
@Module({
  imports: [
    forwardRef(() => NotificationsModule),
    forwardRef(() => UsersModule),
    TypeOrmModule.forFeature([PhotoMetaData, Like, Comment])
  ],
  controllers: [PhotoManagerController],
  providers: [
    PhotoManagerService,
  ],
  exports: [PhotoManagerService]
})
export class PhotoManagerModule {}
