import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    uid: number;

    @Column()
    userID: string;

    @Column()
    password: string;

    @Column()
    email: string;

    @Column({ default: 'default' })
    nickname: string;
}