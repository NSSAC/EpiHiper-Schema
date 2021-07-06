/* eslint-disable max-len */
'use strict';

const fs = require('fs');
const jp = require('jsonpath');
const EpiHiperValidator = require('./epiHiperValidator');

/**
 * EpiHiper Merger Class
 */
class EpiHiperAddNoise {
  /**
   * Creates an epiHiperMerger instance.
   * Usage: `epiHiperMerger()`
   * @param {Object} commander
   * @return {Object} epiHiperMerger instance
   */
  constructor(commander) {
    if (!(this instanceof EpiHiperAddNoise)) {
      return new EpiHiperAddNoise(commander);
    }

    this.path = commander.path;
    this.sigma = commander.sigma;
    this.replace = commander.replace;
    this.integer = commander.integer;
    this.negative = commander.negative;
  }

  /**
   * Process the given files
   * @param {Array} files
   * @param {string} path
   * @param {number} sigma
   * @return {boolean} success
   */
  async process(files, path, sigma) {
    this.path = path;
    this.sigma = sigma;

    const Promises = [];
    let success = true;

    // Load each file
    files.forEach(function(file) {
      Promises.push(this.addNoise(file));
    }.bind(this));

    try {
      await Promise.all(Promises);
    } catch (err) {
      console.log(err);
      success = false;
    }

    return success;
  }

  /**
   * Load a file and validate it
   * @param {string} file
   * @return {boolean} success
   */
  async addNoise(file) {
    let success = true;
    const epiHiperValidator = new EpiHiperValidator();
    const instance = await epiHiperValidator.load(file);

    const Promises = [];
    const nodes = jp.nodes(instance, this.path);

    nodes.forEach(function(node) {
      Promises.push(this.normal(instance, node));
    }.bind(this));

    try {
      await Promise.all(Promises);
    } catch (err) {
      console.log(err);
      success = false;
    }

    success &= await epiHiperValidator.validateSchema(instance);
    success &= await epiHiperValidator.validateRules(instance);

    if (success) {
      delete instance.__path;
      const json = JSON.stringify(instance, null, 2);

      if (this.replace) {
        fs.writeFileSync(output, json, 'utf8');
      } else {
        console.log(json);
      }
    }


    return success;
  }

  /**
   * If the node contains a number pick from the normal distribution
   * with normal(number, sigma)
   * @param {Object} instance
   * @param {Object} node
   * @return {boolean} success
   */
  async normal(instance, node) {
    if (typeof node.value !== 'number') {
      return false;
    }

    node.value *= 1.0 + this.sigma * this.normalDistribution();

    if (!this.negative) {
      node.value = Math.max(0.0, node.value);
    }

    if (this.integer) {
      node.value = Math.round(node.value);
    }

    let object = instance;

    for (let i = 1; i < node.path.length - 1; i++) {
      object = object[node.path[i]];
    }

    object[node.path[node.path.length - 1]] = node.value;

    return true;
  }

  /**
   * Calculates the standard normal distribution (mean=0, sigma=1).
   * @return {number} normalDistribution
   */
  normalDistribution() {
    let a = 0;
    let b = 0;
    let s = 0;

    do {
      do {
        a = Math.random();
      }
      while (a === 0); // Converting [0,1) to (0,1)
      a = 2.0 * a - 1.0;

      do {
        b = Math.random();
      }
      while (b === 0); // Converting [0,1) to (0,1)
      b = 2.0 * b - 1.0;

      s = a * a + b * b;
    } while (s >= 1.0 || s == 0);

    s = Math.sqrt(-2.0 * Math.log(s) / s);

    return s * b;
  }
}

module.exports = EpiHiperAddNoise;
