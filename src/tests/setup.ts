export default async (): Promise<void> => {
  if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = 'test';
  }
  const dotenv = require('dotenv');
  const path = require('path');
  dotenv.config({ path: path.join(__dirname, './.env.test') });
};
