import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { User } from 'src/entities/Users.entity';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private userRepository: Repository<User>,
    ) { }
    /**
     * Finds a user by their username.
     * 
     * @param username - The username of the user to find.
     * @returns A promise that resolves to the user object if found, otherwise null.
     */
    findByUsername(username: string) {
        return this.userRepository.findOne({ where: { username } })
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
}
