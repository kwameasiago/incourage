import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from 'src/entities/Users.entity';
import { Follow } from 'src/entities/Follow.entity';
import { PhotoManagerModule } from 'src/photo-manager/photo-manager.module';
import { NotificationsModule } from 'src/notifications/notifications.module';
@Module({
  imports: [
    NotificationsModule,
    forwardRef(() => PhotoManagerModule),
    TypeOrmModule.forFeature([User, Follow])],
  providers: [UsersService],
  controllers: [UsersController],
  exports: [UsersService]
})
export class UsersModule {}
