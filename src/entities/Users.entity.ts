import { Column, Entity, PrimaryGeneratedColumn, CreateDateColumn } from "typeorm";
import { nanoid } from 'nanoid';

@Entity({name: 'users'})
export class User{
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar', default: () => `'${nanoid()}'` })
    public_id: string;

    @Column({unique: true})
    username: string;

    @Column()
    password: string;


    @CreateDateColumn()
    created_at: Date;

    @CreateDateColumn()
    updated_at: Date;

    
}