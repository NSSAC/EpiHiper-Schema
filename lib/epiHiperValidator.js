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

    this.cwd = path.resolve(process.cwd());

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
   * @param {string} relativeTo optional
   * @return {boolean} success
   */
  validateSchema(file, relativeTo) {
    file = this.resolvePath(file, relativeTo);

    let success = true;
    let Instance = {};

    try {
      Instance = require(file);
    } catch (err) {
      console.log('File: ' + file + ' not found');
      return false;
    }

    const Schema = this.getSchemaName(Instance);
    const Id = 'file://./' + Schema;

    // Check whether we have the schema already loaded
    const validate = this.ajv.getSchema(Id);

    if (typeof validate === 'undefined') {
      console.log('Schema: ' + this.getSchemaURI(Instance) + ' not found.');
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

        if (Schema == 'runParametersSchema.json' ||
            Schema == 'modelScenarioSchema.json') {
          success &= this.validateReferencedFiles(file, Instance, this.validateSchema.bind(this));
        }
      }
    }

    return success;
  }

  /**
   * Validate whether the provided file satisfies the rules
   * @param {string} file
   * @param {string} relativeTo optional
   * @return {boolean} success
   */
  validateRules(file, relativeTo) {
    file = this.resolvePath(file, relativeTo);

    let success = true;
    let Instance = {};

    try {
      Instance = require(file);
    } catch (err) {
      console.log('File: ' + file + ' not found');
      return false;
    }

    const RulesFile = this.getRulesName(Instance);

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

    const Schema = this.getSchemaName(Instance);

    if (success &&
        (Schema == 'runParametersSchema.json' ||
         Schema == 'modelScenarioSchema.json')) {
      success &= this.validateReferencedFiles(file, Instance, this.validateRules.bind(this));
    }

    return success;
  }

  /**
   * Validate referenced files within a run parameter instance
   * @param {string} file
   * @param {object} instance
   * @param {function} validate(file)
   * @return {boolean} success
   */
  validateReferencedFiles(file, instance, validate) {
    let success = true;
    const relativeTo = path.dirname(file);

    if (instance.modelScenario) {
      success &= validate(instance.modelScenario, relativeTo);
    }

    if (instance.diseaseModel) {
      success &= validate(instance.diseaseModel, relativeTo);
    }

    if (instance.initialization) {
      success &= validate(instance.initialization, relativeTo);
    }

    if (instance.intervention) {
      success &= validate(instance.intervention, relativeTo);
    }

    if (instance.traits) {
      success &= validate(instance.traits, relativeTo);
    }

    if (instance.personTraitDB &&
        Array.isArray(instance.personTraitDB)) {
      instance.personTraitDB.forEach(function(file) {
        success &= validate(file, relativeTo);
      });
    }

    return success;
  }

  /**
   * Resolve the pathspec
   * @param {string} pathSpec
   * @param {string} relativeTo
   * @return {string} absolutePath
   */
  resolvePath(pathSpec, relativeTo) {
    const absolute = new RegExp('/^([a-zA-Z]:)?/([^/]+/)*[^/]+$');

    if (absolute.test(pathSpec)) {
      return pathSpec;
    }

    const selfRelative = new RegExp('^self://(([^/]+/)*[^/]+$)');
    const match = selfRelative.exec(pathSpec);

    if (match) {
      return path.resolve(relativeTo, match[1]);
    }

    return path.resolve(this.cwd, pathSpec);
  }

  /**
   * Determine the URI of the schema of the instance
   * @param {object} instance
   * @return {string} schema
   */
  getSchemaURI(instance) {
    let Schema;

    if (instance['$schema']) Schema = instance['$schema'];
    if (instance.epiHiperSchema) Schema = instance.epiHiperSchema;

    return Schema;
  }

  /**
   * Determine the name of the schema of the instance
   * @param {object} instance
   * @return {string} schema
   */
  getSchemaName(instance) {
    return path.basename(this.getSchemaURI(instance));
  }

  /**
   * Determine the URI of the rules of the instance
   * @param {object} instance
   * @return {string} schema
   */
  getRulesURI(instance) {
    return this.getSchemaURI(instance).replace('Schema.json', 'Rules.json');
  }
  /**
   * Determine the name of the rules of the instance
   * @param {object} instance
   * @return {string} schema
   */
  getRulesName(instance) {
    return path.basename(this.getRulesURI(instance));
  }

}

module.exports = EpiHiperValidator;
