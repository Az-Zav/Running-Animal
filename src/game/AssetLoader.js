// src/game/AssetLoader.js
import { Assets } from 'pixi.js';
import { ANIMALS, PARALLAX_LAYERS, PORTRAITS } from '../constants.js';

export class AssetLoader {
  /**
   * Loads all game textures into the PixiJS asset cache.
   * Call once before creating any game objects.
   * @returns {Promise<void>}
   */
  static async loadAll() {
    const manifest = AssetLoader._buildManifest();

    try {
      await Assets.load(manifest);
      console.log(`[AssetLoader] Loaded ${manifest.length} assets ✅`);
    } catch (err) {
      console.error('[AssetLoader] Failed to load assets:', err);
      throw new Error(`Asset loading failed: ${err.message}`);
    }
  }

  /**
   * Returns a texture by key from the cache.
   * @param {string} key - Asset alias (e.g. 'sky', 'rabbit')
   * @returns {PIXI.Texture}
   */
  static get(key) {
    const texture = Assets.get(key);
    if (!texture) {
      throw new Error(`[AssetLoader] Texture not found: "${key}"`);
    }
    return texture;
  }

  /**
   * Builds a manifest array for PIXI.Assets.load().
   * Keys: 'sky', 'mountains', 'fence', 'track', 'rabbit', 'monkey', etc.
   * @returns {Array<{alias: string, src: string}>}
   */
  static _buildManifest() {
    const manifest = [];

    // Background layers
    for (const layer of PARALLAX_LAYERS) {
      manifest.push({
        alias: layer.key,
        src: `/assets/backgrounds/${layer.file}`,
      });
    }

    // Animal spritesheets
    for (const animal of ANIMALS) {
      // Capitalize first letter to match filenames (e.g. 'rabbit' → 'Rabbit.png')
      const filename = animal.id.charAt(0).toUpperCase() + animal.id.slice(1) + '.png';
      manifest.push({
        alias: animal.id,
        src: `/assets/sprites/${filename}`,
      });
    }

    // Portraits
    for (const port of PORTRAITS) {
      manifest.push({
        alias: port.id,
        src: `/assets/portraits/${port.file}`,
      });
    }

    return manifest;
  }
}

