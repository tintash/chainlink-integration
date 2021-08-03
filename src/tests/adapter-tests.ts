import { App } from '../app';
import supertest from 'supertest';

let apiServer = App;
describe('adapter tests', () => {
  test('adapter test', async () => {
    const query1 = await supertest(apiServer).post('/adapter');
    expect(query1.status).toBe(500);
  });
});
