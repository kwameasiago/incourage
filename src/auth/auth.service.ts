import * as bcrypt from 'bcryptjs';
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { Repository, EntityManager } from 'typeorm';
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm';
import { UsersService } from 'src/users/users.service';
import { Session } from 'src/entities/Sessions.entity';
import { JwtService } from '@nestjs/jwt';
import { AuthPayload } from './types/auth.type';




@Injectable()
export class AuthService {
    constructor(
        @InjectEntityManager()
        private entityManager: EntityManager,
        @InjectRepository(Session)
        private sessionRepository: Repository<Session>,
        private userService: UsersService,
        private jwtService: JwtService
    ) { }

    /**
     * Validates the existence of a user's session by querying the session repository.
     * 
     * @param user - The user object containing the sessionId to be validated.
     * @returns A promise that resolves to the session object if it exists, or null if it does not.
     */
    async validateSession(user){
        const session = this.sessionRepository.findOne(({where: {sessionId: user.sessionId}}))
        return session
    }
    /**
     * Handles the user registration process.
     * 
     * @param authPayload - The DTO containing the username and password provided by the user.
     * @returns An object containing the JWT token.
     */
    async signUp(authPayload: AuthPayload) {
        const { username, password } = authPayload;

        const hashedPassword = this.hashPassword(password);
        await this.ensureUserDoesNotExist(username);

        const session = await this.createUserAndSession(username, hashedPassword);
        console.log(session);

        const jwtToken = this.createJwtToken(session);
        return { jwtToken };
    }

    /**
     * Generates a hashed password using bcrypt.
     * 
     * @param password - The password to hash.
     * @returns The hashed password.
     */
    private hashPassword(password: string): string {
        const salt = bcrypt.genSaltSync(10);
        return bcrypt.hashSync(password, salt);
    }

    /**
     * Ensures that a user with the given username does not already exist.
     * 
     * @param username - The username to check against the database.
     * @throws HttpException if the user already exists.
     */
    private async ensureUserDoesNotExist(username: string) {
        const userExist = await this.userService.findByUsername(username);
        if (userExist) {
            console.log(userExist);
            throw new HttpException('Username already exists', HttpStatus.BAD_REQUEST);
        }
    }

    /**
     * Creates a new user and associated session within a database transaction.
     * 
     * @param username - The username of the new user.
     * @param hashedPassword - The hashed password of the new user.
     * @returns A Promise resolving to the session of the newly created user.
     */
    private async createUserAndSession(username: string, hashedPassword: string): Promise<any> {
        return this.entityManager.transaction(async (transactionalEntityManager: EntityManager): Promise<any> => {
            const newUser = await this.userService.createUserTransactional({
                username, password: hashedPassword
            }, transactionalEntityManager);

            const session = transactionalEntityManager.create(Session, { user: newUser });
            await transactionalEntityManager.save(Session, session);

            return session;
        });
    }

    /**
     * Generates a JWT token for the session.
     * 
     * @param session - The session for which to generate the token.
     * @returns The JWT token as a string.
     */
    private createJwtToken(session: any): string {
        const payload = {
            userId: session?.user?.public_id,
            sessionId: session?.sessionId
        };
        return this.jwtService.sign(payload);
    }

    /**
  * Handles the user login process, authenticating credentials and generating a JWT token.
  * 
  * @param AuthPayload - The DTO containing the username and password provided by the user.
  * @returns An object containing the JWT token if credentials are valid.
  * @throws HttpException if the credentials are invalid.
  */
    async signIn(authPayload: AuthPayload) {
        const { username, password } = authPayload;

        const user = await this.validateUserCredentials(username, password);
        const session = await this.createSession(user);
        console.log(session);

        const jwtToken = this.generateJwtToken(session);
        return { jwtToken };
    }

    /**
     * Validates the username and password against stored records.
     * 
     * @param username - The username provided by the user.
     * @param password - The password provided by the user.
     * @returns The user object if credentials are valid.
     * @throws HttpException if either username or password do not match.
     */
    private async validateUserCredentials(username: string, password: string) {
        const user = await this.userService.findByUsername(username);
        if (!user) {
            throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);
        }

        const passwordCheck = await bcrypt.compare(password, user.password);
        if (!passwordCheck) {
            throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);
        }

        return user;
    }

    /**
     * Creates a new session for the authenticated user.
     * 
     * @param user - The user object for whom to create the session.
     * @returns The created session object.
     */
    private async createSession(user: any) {
        const session = this.sessionRepository.create({ user });
        await this.sessionRepository.save(session);
        return session;
    }

    /**
     * Generates a JWT token using session details.
     * 
     * @param session - The session object containing user details.
     * @returns The JWT token as a string.
     */
    private generateJwtToken(session: any): string {
        const payload = {
            userId: session.user.public_id,
            sessionId: session.sessionId
        };
        return this.jwtService.sign(payload);
    }

    async signOut(user){
        return await this.sessionRepository.delete({sessionId: user.sessionId})
    }

}
