import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from './auth.service';


@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        private authService: AuthService
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: 'secret',
        });
    }

    async validate(payload: any) {
        const session = await this.authService.validateSession(payload)
        if(!session){
            throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED)
        }
        return payload
    }
}
