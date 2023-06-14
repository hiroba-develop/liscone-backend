import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { CreateUserDTO } from './dto/create-user.dto';
import { User } from './entities/users.entity';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Get()
    getAll(): Promise<User[]> {
        return this.usersService.findAll()
    }

    @Post()
    createUser(@Body() user: CreateUserDTO) {
        console.log(user)
        return this.usersService.create(user)
    }

    @Delete(':id')
    removeOne(@Param() id: string): Promise<void> {
        return this.usersService.remove(id);
    }

}