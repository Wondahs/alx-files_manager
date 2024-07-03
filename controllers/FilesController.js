/* eslint-disable class-methods-use-this */
import dbClient from '../utils/db';
import { errorJson, filehandler, getUserId } from '../utils/helpers';

/**
 * Class representing a controller for handling file uploads.
 * @class FilesController
 */
export default class FilesController {
  /**
 * Handles POST requests for file uploads.
 *
 * @param {Object} req - The request object containing the file data and metadata.
 * @param {Object} res - The response object to send.
 *
 * @returns {void}
 */
  static async postUpload(req, res) {
    const token = req.headers['x-token'];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get user ID from Redis using the provided token
    const userId = await getUserId(token);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const {
      name, type, data, isPublic,
    } = req.body;

    // eslint-disable-next-line prefer-destructuring
    let parentID = req.body.parentID;
    const filePath = process.env.FOLDER_PATH || '/tmp/files_manager';

    // Validate request parameters
    if (!name) {
      return errorJson(res, 'Missing name');
    }

    const validType = ['file', 'image', 'folder'];
    if (!type || !validType.includes(type)) {
      return errorJson(res, 'Missing type');
    }

    if (!data && type !== 'folder') {
      return errorJson(res, 'Missing data');
    }

    let objparentId;
    if (parentID) {
      objparentId = dbClient.getObjectId(parentID);

      // Check if parent exists and is a folder
      const file = await dbClient.db.collection('files').findOne({ parentID: objparentId });
      if (!file) {
        return errorJson(res, 'Parent not found');
      }
      if (file.type !== 'folder') {
        return errorJson(res, 'Parent is not a folder');
      }
    } else {
      parentID = 0;
    }

    // Create a new file object
    const newFile = {
      userId,
      name,
      type,
      isPublic: isPublic || false,
      parentID: objparentId || parentID,
    };

    const notFolder = type === 'file' || type === 'image';
    let localPath;
    if (notFolder) {
      // Decrypt file data
      const decrypedData = Buffer.from(data, 'base64').toString('ascii');
      try {
      // Save file data to disk and get the local path
        localPath = await filehandler(decrypedData, filePath);
      } catch (err) {
        return res.status(500).json({ error: err.message });
      }
      newFile.localPath = localPath;
    }
    // console.log(newFile);

    // Insert the new file into the database
    const newDbFile = await dbClient.db.collection('files').insertOne(newFile);
    if (newDbFile) {
      newFile.id = newDbFile.insertedId;
      const returnFile = { ...newFile };
      delete returnFile._id;
      return res.status(201).json(returnFile);
    }

    // Handle server errors
    return res.status(500).send('Internal server error');
  }

  static async getShow(req, res) {
    try {
      const fileId = req.params.id;
      if (!fileId) {
        return errorJson(res, 'Missing id');
      }
      const token = req.headers['x-token'];
      if (!token) return res.status(401).json({ error: 'Unauthorized' });

      const userId = await getUserId(token);
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      const file = await dbClient.db.collection('files').findOne({ _id: dbClient.getObjectId(fileId), userId });
      if (!file) return res.status(404).json({ error: 'Not found' });

      return res.json(file);
    } catch (err) {
      return res.status(500).json({ error: (err.message) });
    }
  }

  static async getIndex(req, res) {
    try {
      const token = req.headers['x-token'];
      if (!token) return res.status(401).json({ error: 'Unauthorized' });

      const userId = await getUserId(token);
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      let parentID = req.body.parentID || '0';
      const page = parseInt(req.body.page, 10) || 0;
      const pageSize = 20;
      const skip = page * pageSize;
      const limit = pageSize;

      parentID = parentID === '0' ? 0 : dbClient.getObjectId(parentID);

      const files = await dbClient.db.collection('files').aggregate(
        [
          { $match: { userId, parentID } },
          { $sort: { name: 1 } },
          { $skip: skip },
          { $limit: limit },
        ],
      ).toArray();

      if (files) return res.status(201).json(files);
    } catch (error) {
      return res.status(500).json({ error });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
}
