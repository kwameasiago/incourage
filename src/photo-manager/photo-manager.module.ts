import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PhotoManagerController } from './photo-manager.controller';
import { PhotoManagerService } from './photo-manager.service';
import { UsersModule } from 'src/users/users.module';
import { PhotoMetaData } from 'src/entities/PhotoMetaData.entity';


@Module({
  imports: [
    forwardRef(() => UsersModule),
    TypeOrmModule.forFeature([PhotoMetaData])
  ],
  controllers: [PhotoManagerController],
  providers: [
    PhotoManagerService,
  ],
  exports: [PhotoManagerService]
})
export class PhotoManagerModule {}
