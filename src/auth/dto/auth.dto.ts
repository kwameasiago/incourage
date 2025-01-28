import { IsEmail, IsNotEmpty, MinLength } from "class-validator";

export class AuthUserDto{
    @IsNotEmpty({message: 'Username is required'})
    username: string;

    @IsNotEmpty({message: 'Password is required'})
    @MinLength(6, {message: 'Password should be atleast 6 charachters long'})
    password: string;
}