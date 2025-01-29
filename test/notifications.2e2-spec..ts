import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import { DataSource } from "typeorm";
import * as request from 'supertest';
import { App } from "supertest/types";
import { AppModule } from "src/app.module";
import { clearDatabase } from "./utils";


describe('PhotoManager (e2e)', () => {
    let username = 'photomanager'
    let password = 'password'
    let app: INestApplication<App>;
    let dataSource: DataSource;
    let token: string;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        await app.init();

        dataSource = moduleFixture.get(DataSource);
        await clearDatabase(dataSource);
        const { body: { jwtToken } } = await request(app.getHttpServer())
        .post('/auth/signup')
        .send({
            username: username,
            password: password,
        })
        .expect(201);
        token = jwtToken
        
    });


    it('Test get notification endpoint', async () => {
        return await request(app.getHttpServer())
            .get('/notifications')
            .expect(200);
    });


    afterAll(async () => {
        // await clearDatabase(dataSource);
        await app.close();
    });

})