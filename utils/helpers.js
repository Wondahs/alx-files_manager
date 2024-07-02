/* eslint-disable max-len */
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs/promises';
import path from 'path';
import redisClient from './redis';

/**
 * This function sends a JSON response with a 400 status code and an error message.
 *
 * @param {Object} res - The response object to send.
 * @param {string} message - The error message to include in the response.
 *
 * @returns {void}
 */
export function errorJson(res, message) {
  res.status(400).json({ error: message });
}

/**
   * This function retrieves the user ID associated with a given authentication token from Redis.
   *
   * @param {string} token - The authentication token to look up in Redis.
   *
   * @returns {Promise<string|null>} - A Promise that resolves to the user ID if found, or null if not found.
   *
   * @throws {Error} - If an error occurs while interacting with Redis.
   */
export async function getUserId(token) {
  const userId = await redisClient.get(`auth_${token}`);
  return userId;
}

/**
   * Asynchronously creates a directory at the specified file path, generates a unique file name using UUIDv4,
   * writes the provided data to a file at the generated full path, and returns the generated file name.
   *
   * @param {string | Buffer | URL} data - The data to be written to the file.
   * @param {string} filePath - The path where the file will be created.
   *
   * @returns {Promise<string>} - A Promise that resolves to the generated file name.
   *
   * @throws {Error} - If an error occurs during directory creation, file writing, or any other step.
   */
export async function filehandler(data, filePath) {
  try {
    await fs.mkdir(filePath, { recursive: true });

    const fileName = uuidv4();
    const fullPath = path.join(filePath, fileName);
    await fs.writeFile(fullPath, data);

    return fullPath;
  } catch (err) {
    throw new Error(`An error occured: ${err.message}`);
  }
}
