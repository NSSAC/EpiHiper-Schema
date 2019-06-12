/* eslint-disable max-len */
'use strict';

const path = require('path');
const fs = require('fs');
const Ajv = require('ajv');

/**
 * EpiHiper Validator Class
 */
class EpiHiperValidator {
  /**
   * Creates an epiHiperValidator instance.
   * Usage: `epiHiperValidator(schemaDir)`
   * @param {string} schemaDir optional schemaDir
   * @return {Object} epiHiperValidator instance
   */
  constructor(schemaDir) {
    if (!(this instanceof EpiHiperValidator)) {
      return new EpiHiperValidator(schemaDir);
    }

    this.schemaDir = schemaDir;

    if (!schemaDir) {
      schemaDir = path.join(__dirname, '..', 'schema');
    }

    this.pkg = require('../package.json');
    this.cfg = require('../config.json');

    this.ajv = new Ajv({schemaId: 'auto'});
    this.ajv.addMetaSchema(require('ajv/lib/refs/json-schema-draft-04.json'));

    this.jsontron = require('@shoops/jsontron');
    this.rules = {};

    this.cfg.schema.forEach(function(s) {
      const sInstance = require(path.join(schemaDir, s));
      sInstance['$id'] = 'file://./' + s;
      this.ajv.addSchema(sInstance);

      const RulesFile = path.join(schemaDir, s.replace('Schema.json', 'Rules.json'));

      if (RulesFile.endsWith('Rules.json') && fs.existsSync(RulesFile)) {
        this.rules[s.replace('Schema.json', 'Rules.json')] = require(RulesFile);
      }
    }.bind(this));
  }

  /**
   * Validate whether the provided file matches the schema
   * @param {string} file
   * @return {boolean} success
   */
  validateSchema(file) {
    let success = true;
    const Instance = require(file);
    const Id = 'file://./' + path.basename(Instance['$schema']);

    // Check whether we have the schema already loaded
    const validate = this.ajv.getSchema(Id);

    if (typeof validate === 'undefined') {
      console.log('Schema: ' + Instance['$schema'] + ' not found.');
      success = false;
    }

    if (success) {
      const valid = validate(Instance);

      if (!valid) {
        console.log('File: ' + file + ' invalid');
        console.log(validate.errors);
        success = false;
      } else {
        console.log('File: ' + file + ' valid');
      }
    }

    return success;
  }

  /**
   * Validate whether the provided file satisfies the rules
   * @param {string} file
   * @return {boolean} success
   */
  validateRules(file) {
    let success = true;
    const Instance = require(file);
    const RulesFile = path.basename(Instance['$schema'].replace('Schema.json', 'Rules.json'));

    // Check whether we have the rules already loaded
    const Rules = this.rules[RulesFile];

    if (typeof Rules === 'undefined') {
      console.log('File: ' + file + ' no rules provided');
    } else {
      const Report = this.jsontron.JSONTRON.validate(Instance, Rules);

      if (Report.finalValidationReport.length) {
        console.log('File: ' + file + ' invalid');
        console.log(Report.finalValidationReport);
        success = false;
      } else {
        console.log('File: ' + file + ' valid');
      }
    }

    return success;
  }
}

module.exports = EpiHiperValidator;
