import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import { DataSource } from "typeorm";
import * as request from 'supertest';
import { App } from "supertest/types";
import { AppModule } from "src/app.module";
import { clearDatabase } from "./utils";

describe('AuthController (e2e)', () => {
    let username = 'auth'
    let password = 'password'
    let app: INestApplication<App>;
    let dataSource: DataSource;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        await app.init();

        dataSource = moduleFixture.get(DataSource);
        await clearDatabase(dataSource);
    });

    it('auth flow (signup -> signin -> signout)', async () => {
        await request(app.getHttpServer())
            .post('/auth/signup')
            .send({
                username: username,
                password: password,
            })
            .expect(201);

        const { body: { jwtToken } } = await request(app.getHttpServer())
            .post('/auth/signin')
            .send({
                username: username,
                password: password,
            })
            .expect(201);

        await request(app.getHttpServer())
            .post('/auth/signout')
            .set('Authorization', `Bearer ${jwtToken}`)
            .send({})
            .expect(201);
    });

    afterAll(async () => {
        // await clearDatabase(dataSource);
        await app.close();
    });
});
