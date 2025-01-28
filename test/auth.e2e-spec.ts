import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import * as request from 'supertest'
import { App } from "supertest/types";
import { AppModule } from "src/app.module";
import { getConnection, Connection } from 'typeorm';

describe('AuthController (e2e)', () => {
    let app: INestApplication<App>;
    beforeEach(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule]
        }).compile()
        app = moduleFixture.createNestApplication()
        await app.init()

    })

    it('/auth/signup', async() => {
        return await  request(app.getHttpServer())
            .post('/auth/signup')
            .send({
                username: 'user',
                password: 'password'
            })
            .expect(201)
    })

    it('/auth/signin', async() => {
        return await  request(app.getHttpServer())
            .post('/auth/signin')
            .send({
                username: 'user',
                password: 'password'
            })
            .expect(201)
    })

    it('/auth/signout', async() => {
        const {body:{jwtToken}} = await  request(app.getHttpServer())
            .post('/auth/signin')
            .send({
                username: 'user',
                password: 'password'
            })
        
            return await  request(app.getHttpServer())
            .post('/auth/signout')
            .set('Authorization', `Bearer ${jwtToken}`)
            .send({})
            .expect(201)

    })
})