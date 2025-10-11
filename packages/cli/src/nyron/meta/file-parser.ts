/**
 * @fileoverview Configuration for the meta file system.
 * 
 * This module defines the file path and structure for storing high-level metadata
 * about the Nyron project, including package information, creation timestamps,
 * and release tags.
 */

/**
 * The root path where the meta file is stored relative to the project root.
 * 
 * This file contains high-level metadata about the Nyron project, including:
 * - Package definitions with their current versions
 * - Project creation timestamp
 * - Latest release tag information
 * 
 * @constant {string}
 */
export const META_ROOT_PATH = ".nyron/meta.json"
