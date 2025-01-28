import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('AuthController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/auth/signup (POST)', () => {
    const userData = {
      password: 'strongPassword123',
      username: 'testuser'
    };

    return request(app.getHttpServer())
      .post('/auth/signup')
      .send(userData)
      .expect(201)
      .expect((res) => {
        expect(res.body).toHaveProperty('token');
      });
  });
});
