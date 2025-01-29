import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './Users.entity';
import { PhotoMetaData } from './PhotoMetaData.entity';

@Entity({name: 'comments'})
export class Comment{
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => User, user => user.id)
    @JoinColumn({ name: 'user_id' })
    user: User;

    @ManyToOne(() => PhotoMetaData, photoMetaData => photoMetaData.id)
    @JoinColumn({ name: 'photo_id' })
    photo: PhotoMetaData;
    
    @Column()
    comment: string;

}