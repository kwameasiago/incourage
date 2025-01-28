import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './Users.entity';

@Entity({name: 'photo_meta_data'})
export class PhotoMetaData{
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => User, user => user.id)
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column()
    mimetype: string;

    @Column()
    size: number

    @Column()
    key: string

    @Column()
    location: string
}