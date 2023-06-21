import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDTO } from './dto/create-user.dto';
import { User } from './entities/users.entity';
import { UpdateUserDTO } from './dto/update-user.dto';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private usersRepository: Repository<User>,
    ) { }

    findAll(): Promise<User[]> {
        return this.usersRepository.find();
    }

    async create(user: CreateUserDTO) {
        return user;
    }


    update(user: UpdateUserDTO) {
        return user;
    }
    
    async remove(id: string): Promise<void> {
        return id;
    }
}