import { IsOptional, IsString } from "class-validator";

export class CreateUserDTO {
    @IsString()
    userId: string;

    @IsString()
    password: string;

    @IsString()
    email: string;

    @IsOptional()
    nickname: string;
}