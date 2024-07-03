import Queue from 'bull';
import fs from 'fs';
import imageThumbnail from 'image-thumbnail';
import dbClient from './utils/db';

const fileQueue = new Queue('fileQueue');

fileQueue.process(async (job, done) => {
  try {
    const { userId, fileId } = job.data;
    if (!fileId) throw new Error('Missing fileId');
    if (!userId) throw new Error('Missing userId');

    const file = await dbClient.db.collection('files').findOne({ _id: dbClient.getObjectId(fileId), userId });
    if (!file) throw new Error('File not found');

    const filePath = file.localPath;
    const sizes = [500, 250, 100];

    const thumbnailPromises = sizes.map(async (size) => {
      const thumbnail = await imageThumbnail(filePath, { width: size });
      const thumbnailPath = `${filePath}_${size}`;
      fs.writeFile(thumbnailPath, thumbnail, (err) => {
        if (err) throw new Error(`Failed to write thumbnail for size ${size}: ${err.message}`);
      });
    });

    await Promise.all(thumbnailPromises);
    done();
  } catch (error) {
    done(error);
  }
});
