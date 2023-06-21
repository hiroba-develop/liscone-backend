import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common'
import { CreateUserDTO } from './dto/create-user.dto';
import { UpdateUserDTO } from './dto/update-user.dto';
import { User } from './entities/users.entity';
import { UsersService } from './users.service';
@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) { }
    @Get()
    findAll(): string {
      return 'This action returns all users';
    }


    @Post()
    createUser(@Body() user: CreateUserDTO) {
        console.log("createUser");
        return this.usersService.create(user);
    }

    @Put()
    updateUser(@Body() user: UpdateUserDTO): UpdateUserDTO {
        console.log(user);
        return this.usersService.update(user)
    }

    @Delete(':id')
    removeOne(@Param() id: string): Promise<void> {
        return this.usersService.remove(id);
    }

}