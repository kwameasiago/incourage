import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { s3 } from '../config/aws.config';
import { UsersService } from 'src/users/users.service';
import { PhotoMetaData } from 'src/entities/PhotoMetaData.entity';

@Injectable()
export class PhotoManagerService {
  constructor(
    private readonly userService: UsersService,
    @InjectRepository(PhotoMetaData)
    private readonly photoMetaDataRepository: Repository<PhotoMetaData>,
  ) {}

  /**
   * Validates image file types.
   * @param files - Array of file objects to validate.
   */
  private validateImageFiles(files: Array<{ originalname: string; mimetype: string }>): boolean {
    const validImageMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];

    files.forEach((file) => {
      if (!validImageMimeTypes.includes(file.mimetype)) {
        throw new HttpException(
          `Invalid file type for file "${file.originalname}". Allowed types are: ${validImageMimeTypes.join(', ')}`,
          HttpStatus.BAD_REQUEST,
        );
      }
    });

    return true;
  }

  /**
   * Uploads multiple files to S3.
   * @param files - Array of files to upload.
   * @param user - The user uploading the files.
   */
  private async uploadMultipleFilesToS3(files, user) {
    const userInstance = await this.userService.findById(user.userId);
    this.validateImageFiles(files);

    const uploadPromises = files.map((file) => {
      const { originalname, mimetype, buffer, size } = file;
      const params = {
        Bucket: process.env.S3_BUCKET_NAME || 'default-bucket-name',
        Key: originalname,
        Body: buffer,
        ContentType: mimetype,
      };

      return s3.upload(params).promise().then((response) => ({
        key: originalname,
        location: response.Location,
        mimetype,
        size,
        user: userInstance,
      }));
    });

    return Promise.all(uploadPromises);
  }

  /**
   * Deletes an image from S3 by its key.
   * @param key - The S3 key of the image to delete.
   */
  private async deleteImageFromS3(key: string) {
    const params = {
      Bucket: process.env.S3_BUCKET_NAME || 'default-bucket-name',
      Delete: {
        Objects: [{ Key: key }],
        Quiet: false,
      },
    };

    return s3.deleteObjects(params).promise();
  }

  /**
   * Uploads files to S3 and saves metadata to the database.
   * @param files - Files to upload.
   * @param user - The user uploading the files.
   */
  async s3Upload(files, user) {
    try {
      const uploadedFiles = await this.uploadMultipleFilesToS3(files, user);
      return this.photoMetaDataRepository.save(uploadedFiles);
    } catch (error) {
      
      throw new HttpException('An error occurred during file upload', HttpStatus.BAD_GATEWAY);
    }
  }

  /**
   * Deletes a photo from S3 and the database by its ID.
   * @param id - The ID of the photo to delete.
   */
  async deleteFromS3(id: number) {
    const photo = await this.photoMetaDataRepository.findOne({ where: { id } });

    if (!photo) {
      throw new HttpException('Photo not found', HttpStatus.NOT_FOUND);
    }

    try {
      await this.deleteImageFromS3(photo.key);
      return await this.photoMetaDataRepository.delete({ id });
    } catch (error) {
      throw new HttpException('Error deleting photo', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Retrieves all images for a specific user.
   * @param currentUser - The user whose images are to be retrieved.
   */
  async getImagesByUserId(currentUser): Promise<PhotoMetaData[]> {
    const { userId } = currentUser;

    const images = await this.photoMetaDataRepository.find({
      where: { user: { id: userId } },
      relations: ['user'],
    });

    if (!images.length) {
      throw new HttpException(`No images found for user with ID ${userId}`, HttpStatus.NOT_FOUND);
    }

    return images;
  }
}
