import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from 'src/entities/Users.entity';
import { Follow } from 'src/entities/Follow.entity';
import { PhotoManagerModule } from 'src/photo-manager/photo-manager.module';
@Module({
  imports: [
    forwardRef(() => PhotoManagerModule),
    TypeOrmModule.forFeature([User, Follow])],
  providers: [UsersService],
  controllers: [UsersController],
  exports: [UsersService]
})
export class UsersModule {}
