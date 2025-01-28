import { nanoid } from 'nanoid';
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './Users.entity';

@Entity({ name: 'sessions' })
export class Session {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar', default: () => `'${nanoid()}'` })
    sessionId: string;

    @ManyToOne(() => User, user => user.id)
    @JoinColumn({ name: 'user_id' })
    user: User;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}
