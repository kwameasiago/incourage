import { Body, Controller, Post, Req } from '@nestjs/common';
import { UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { AuthUserDto } from './dto/auth.dto';
import { JwtAuthGuard } from './auth.guard';


@Controller('auth')
export class AuthController {
    constructor(private readonly authService:AuthService){}
    
    @Post('signup')
    async signUpUser(@Body() authUserDto:AuthUserDto){
        return this.authService.signUp(authUserDto)
    }

    @Post('signin')
    async signInUser(@Body() authUserDto:AuthUserDto){
        return await this.authService.signIn(authUserDto)
    } 

    @Post('signout')
    @UseGuards(JwtAuthGuard)
    async Logout(@Req() req: Request){
        return this.authService.signOut(req.user)
    }
}
