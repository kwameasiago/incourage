import { Body, Controller, Get,Post,Put, Req,UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from 'src/auth/auth.guard';
import { Request } from 'express';

@Controller('users')
export class UsersController {
    constructor(
        private readonly userService: UsersService
    ){}

    @Post('/follow')
    @UseGuards(JwtAuthGuard)
    async followUser(@Body() user:{user: number},@Req() req:Request){
        return this.userService.followUser(user, req.user)
    }

    @Put('/update-profile')
    @UseGuards(JwtAuthGuard)
    async updateProfile(@Body() body:{username: string},@Req() req:Request){
        return this.userService.updateProfile(body, req.user)
    }

    @Get('/current-profile')
    @UseGuards(JwtAuthGuard)
    async getCurrentUserProfile(@Req() req:Request){
        return this.userService.getCurrentUserProfile(req.user)
    }

}
