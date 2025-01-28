import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import { DataSource } from "typeorm";
import * as request from 'supertest';
import { App } from "supertest/types";
import { AppModule } from "src/app.module";

describe('AuthController (e2e)', () => {
    let app: INestApplication<App>;
    let dataSource: DataSource;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        await app.init();

        dataSource = moduleFixture.get(DataSource);
    });

    it('auth flow (signup -> signin -> signout)', async () => {
        await request(app.getHttpServer())
            .post('/auth/signup')
            .send({
                username: 'user',
                password: 'password',
            })
            .expect(201);

        const { body: { jwtToken } } = await request(app.getHttpServer())
            .post('/auth/signin')
            .send({
                username: 'user',
                password: 'password',
            })
            .expect(201);

        await request(app.getHttpServer())
            .post('/auth/signout')
            .set('Authorization', `Bearer ${jwtToken}`)
            .send({})
            .expect(201);
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
});
