
export default async (): Promise<void> => {
  console.log('Jest - setup..');
  if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = 'test';
  }
  const dotenv = require('dotenv');
  dotenv.config({ path: '../.env' });
};
