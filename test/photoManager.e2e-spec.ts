import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import { DataSource } from "typeorm";
import * as request from 'supertest';
import { App } from "supertest/types";
import { AppModule } from "src/app.module";


describe('PhotoManager (e2e)', () => {
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
        const { body: { jwtToken } } = await request(app.getHttpServer())
        .post('/auth/signup')
        .send({
            username: 'somems',
            password: 'somsad',
        })
        .expect(201);
        token = jwtToken
        
    });


    it('Test auth gour for photo-manager endpoint', async () => {
        return await request(app.getHttpServer())
            .get('/photo-manager')
            .expect(401);
    });

    it('Test photo-manager endpoint', async () => {
        return await request(app.getHttpServer())
            .get('/photo-manager')
            .set('Authorization', `Bearer ${token}`)
            .expect(404);
    });

    afterAll(async () => {
        const queryRunner = dataSource.createQueryRunner();
        await queryRunner.connect();
    
        try {
            await queryRunner.query(`DELETE FROM sessions;`);
            await queryRunner.query(`DELETE FROM users;`);
        } finally {
            await queryRunner.release();
        }
        await app.close();
    });

})