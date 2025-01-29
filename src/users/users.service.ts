import { HttpException, HttpStatus, Inject,Injectable, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager, Like  } from 'typeorm';
import { User } from 'src/entities/Users.entity';
import { Follow } from 'src/entities/Follow.entity';
import { PhotoManagerService } from 'src/photo-manager/photo-manager.service';
import { NotificationsService } from 'src/notifications/notifications.service';

@Injectable()
export class UsersService {
    constructor(
        @Inject(forwardRef(() => PhotoManagerService))    
        private readonly photoMetaDataService: PhotoManagerService,  
        private readonly notificationService: NotificationsService, 
        @InjectRepository(User)
        private userRepository: Repository<User>,

        @InjectRepository(Follow)
        private followRepository: Repository<Follow>
        
        
    ) { }
    /**
     * Finds a user by their username.
     * 
     * @param username - The username of the user to find.
     * @returns A promise that resolves to the user object if found, otherwise null.
     */
    async findByUsername(username: string) {
        const user = await this.userRepository.findOne({ where: { username } })
        return user
    }

    async searchByUserName(username: string) {
        const users = await this.userRepository.find({
            where: { username: Like(`%${username}%`) },
        });
    
        if (!users.length) {
            throw new HttpException('No user found', HttpStatus.NOT_FOUND);
        }
        
        return users;
    }
    

    /**
     * Creates a new user within a transaction.
     * 
     * This function is intended to be used where database transactions are required,
     * ensuring that the creation of the user is part of a broader transactional context.
     * 
     * @param userData - An object containing the username and password for the new user.
     * @param transactionalEntityManager - The transactional entity manager to handle the database operation.
     * @returns A promise that resolves to the newly created user object.
     */
    async createUserTransactional(userData: { username: string, password: string }, transactionalEntityManager: EntityManager) {
        const newUser = transactionalEntityManager.create(User, userData)
        await transactionalEntityManager.save(User, newUser)
        return newUser
    }

    /**
     * Finds a user by their ID.
     * 
     * @param id - The ID of the user to find.
     * @returns A promise that resolves to the user object if found, otherwise null.
     */
    async findById(id: number) {
        return await this.userRepository.findOne({ where: { id } });
    }


 
    /**
     * Allows a user to follow or unfollow another user.
     * @param {object} user - The target user object containing the user ID.
     * @param {any} req - The request object containing the current user's ID.
     * @returns {Promise<object>} A response indicating whether the user was followed or unfollowed.
     * @throws {HttpException} If the user ID is invalid.
     */
    async followUser(user: { user: number }, req: any) {
        const followingUser = await this.findById(user.user)
        const currentUser = await this.findById(req.userId)
        if (!followingUser || !currentUser) {
            throw new HttpException('Invalid user id', HttpStatus.BAD_REQUEST)
        }
        if(followingUser.id === currentUser.id){
            throw new HttpException('User cannot follow self', HttpStatus.BAD_REQUEST)
        }
        const hasFollowed = await this.followRepository.findOne({
            where: {
                following: { id: user.user }
            }
        })
        if (!hasFollowed) {
            const newFollow = this.followRepository.create({
                follower: { id: currentUser.id } as User,
                following: { id: followingUser.id } as User,
            })
            await this.followRepository.save(newFollow)
            await this.notificationService.createNotification(followingUser.id, 'like', `${currentUser?.username || 'A User'}  followed you`);
            return { user: followingUser, status: 'followed' }
        } else {
            await this.followRepository.remove(hasFollowed);
            await this.notificationService.createNotification(followingUser.id, 'like', `${currentUser?.username || 'A User'}  unfollowed you`);
            return { user: followingUser, status: 'unfollowed' };
        }
    }

    /**
     * Updates the profile of the current user.
     * @param {object} data - The data containing updated profile information (e.g., username).
     * @param {object} user - The current user object containing the user ID.
     * @returns {Promise<object>} The updated user object.
     * @throws {HttpException} If the user is invalid.
     */
    async updateProfile(data: {username: string}, user){
        const currentUser = await this.userRepository.findOne({where: {id: user.userId}})
        if(!currentUser){
            throw new HttpException('Invalid reques', HttpStatus.BAD_REQUEST)
        }
        const updatedUser = this.userRepository.merge(currentUser, data)
        return await this.userRepository.save(updatedUser);
    }

    /**
     * Retrieves the current user's profile details, including images and follower statistics.
     * @param {object} user - The current user object containing the user ID.
     * @returns {Promise<object>} The user's profile details including uploaded images, follower count, and following count.
     * @throws {HttpException} If the user is invalid.
     */
    async getCurrentUserProfile(user){
        const currentUser = await this.findById(user.userId)
        if(!currentUser){
            throw new HttpException('Invalid reques', HttpStatus.BAD_REQUEST)
        }
        const uploadeImages = await this.photoMetaDataService.getImagesByUserId(currentUser.id)
        const followingCount = await this.followRepository.count({
            where: {
                following: { id: user.userId },
            },
        });
        const followerCount = await this.followRepository.count({
            where: {
                follower: { id: user.userId },
            },
        });
        return {currentUser,followingCount, followerCount,uploadeImages }
    }

}
