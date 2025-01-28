import * as AWS from 'aws-sdk';

AWS.config.update({
    region: 'us-east-2',
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey:process.env.AWS_SECRET_KEY
  });
  

export const s3 = new AWS.S3();
