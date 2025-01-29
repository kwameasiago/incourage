import { HttpException, HttpStatus, Inject, Injectable, forwardRef } from '@nestjs/common';
import { DataSource, Like as Search } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { s3 } from '../config/aws.config';
import { UsersService } from 'src/users/users.service';
import { PhotoMetaData } from 'src/entities/PhotoMetaData.entity';
import { Like } from 'src/entities/Like.entity';
import { Comment } from 'src/entities/Comment.entity';



@Injectable()
export class PhotoManagerService {
  constructor(
    @Inject(forwardRef(() => UsersService))
    private readonly userService: UsersService,
    @InjectRepository(PhotoMetaData)
    private readonly photoMetaDataRepository: Repository<PhotoMetaData>,
    @InjectRepository(Like)
    private readonly likeRepository: Repository<Like>,
    @InjectRepository(Comment)
    private readonly commentReposittory: Repository<Comment>,
    private readonly dataSource: DataSource
  ) { }

  /**
   * Validates image file types.
   * @param files - Array of file objects to validate.
   */
  private validateImageFiles(files: Array<{ originalname: string; mimetype: string, size: number }>): boolean {
    const validImageMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];

    files.forEach((file) => {
      if (!validImageMimeTypes.includes(file.mimetype)) {
        throw new HttpException(
          `Invalid file type for file "${file.originalname}". Allowed types are: ${validImageMimeTypes.join(', ')}`,
          HttpStatus.BAD_REQUEST,
        );
      }

      if (file.size > 5242880) {
        throw new HttpException(
          `File "${file.originalname}" is too large.`,
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
    if (!userInstance) {
      throw new HttpException('Invalid request', HttpStatus.BAD_REQUEST)
    }
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


  /**
   * Retrieves the photo feed for a user, including photos from users they follow and their own photos.
   *
   * @param {number} page - The page number for pagination.
   * @param {number} limit - The number of photos to retrieve per page.
   * @param {any} user - The authenticated user object containing the user ID.
   * @returns {Promise<{ total: number; page: number; limit: number; totalPages: number; data: any[] }>}
   *          An object containing paginated photo feed data:
   *          - `total`: Total number of photos in the feed.
   *          - `page`: Current page number.
   *          - `limit`: Number of photos per page.
   *          - `totalPages`: Total number of pages available.
   *          - `data`: Array of photo metadata.
   */
  async getFeeds(page: number, limit: number, user: any) {
    const { userId } = user;
    const offset = (page - 1) * limit;

    const rawQuery = `
        SELECT * FROM photo_meta_data
        WHERE user_id IN (
            SELECT following_id 
            FROM follow 
            WHERE follower_id = $1
        ) OR user_id = $2
        LIMIT $3 OFFSET $4;
    `;

    const photos = await this.dataSource.query(rawQuery, [userId, userId, limit, offset]);

    const countQuery = `
        SELECT COUNT(*) as total FROM photo_meta_data
        WHERE user_id IN (
            SELECT following_id 
            FROM follow 
            WHERE follower_id = $1
        ) OR user_id = $2;
    `;

    const totalResult = await this.dataSource.query(countQuery, [userId, userId]);
    const total = totalResult[0]?.total || 0;

    return {
      total: parseInt(total),
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      data: photos
    };
  }

  /**
   * Toggles the like status of a photo for a given user.
   * 
   * If the user has already liked the photo, the like is removed (unliked).
   * If the user has not liked the photo, a new like is added.
   * 
   * @param {number} photoId - The ID of the photo to like or unlike.
   * @param {any} reqUser - The authenticated user object containing the user ID.
   * @returns {Promise<{ message: string }>} - A success message indicating the like or unlike action.
   * @throws {HttpException} - Throws an exception if the photo is not found.
   */
  async toggleLike(photoId: number, reqUser: any) {
    const { userId } = reqUser;

    return this.dataSource.transaction(async (manager) => {
      const photo = await manager.findOne(PhotoMetaData, { where: { id: photoId } });
      if (!photo) {
        throw new HttpException('Photo not found', HttpStatus.NOT_FOUND);
      }

      const existingLike = await manager.findOne(Like, {
        where: { user: { id: userId }, photo: { id: photoId } },
      });

      if (existingLike) {

        await manager.delete(Like, { id: existingLike.id });
        return { message: 'Unliked successfully' };
      } else {

        const like = manager.create(Like, {
          user: { id: userId },
          photo: { id: photoId },
        });

        await manager.save(like);
        return { message: 'Liked successfully' };
      }
    });
  }

/**
   * Adds a comment to a photo.
   * @param {Object} params - Parameters for adding a comment.
   * @param {number} params.photoId - The ID of the photo.
   * @param {string} params.comment - The comment text.
   * @param {any} reqUser - The user making the request.
   * @returns {Promise<Object>} - A success message and the new comment.
   * @throws {HttpException} - If the photo is not found.
   */
  async addComment(
    { photoId, comment }: { photoId: number; comment: string },
    reqUser: any,
  ) {
    const { userId } = reqUser;

    return this.dataSource.transaction(async (manager) => {
      const photo = await manager.findOne(PhotoMetaData, { where: { id: photoId } });
      if (!photo) {
        throw new HttpException('Photo not found', HttpStatus.NOT_FOUND);
      }

      const newComment = manager.create(Comment, {
        user: { id: userId },
        photo: { id: photoId },
        comment,
      });

      await manager.save(newComment);
      return { message: 'Comment added successfully', comment: newComment };
    });
  }

 /**
   * Retrieves a photo along with its likes and comments.
   * @param {number} photoId - The ID of the photo.
   * @returns {Promise<Object>} - An object containing the photo, likes, comments, and counts.
   * @throws {Error} - If the photo is not found.
   */
  async getPhotoWithLikesAndComments(photoId: number) {
    const photo = await this.photoMetaDataRepository.findOne({
      where: { id: photoId }
    });

    if (!photo) {
      throw new Error(`Photo with id ${photoId} not found`);
    }

    const likes = await this.likeRepository.find({
      where: { photo: photo },
      relations: ['user'],
      select: {
        user: {
          id: true,
          username: true,
        }
      }
    });

    const comments = await this.commentReposittory.find({
      where: { photo: photo },
      relations: ['user'],
      select: {
        user: {
          id: true,
          username: true,
        }
      }
    });

    return { photo, likes, comments, noOfLikes: likes.length, noOfComments: comments.length };
  }

   /**
   * Searches for photos by key value using a partial match.
   * @param {string} searchValue - The search keyword.
   * @returns {Promise<PhotoMetaData[]>} - A list of matching photos.
   */
  async findByKeyLike(searchValue: string): Promise<PhotoMetaData[]> {
    const photo = await this.photoMetaDataRepository.find({
      where: { key: Search(`%${searchValue}%`)}
    });
    console.log({searchValue})
    return photo
}
  


}
