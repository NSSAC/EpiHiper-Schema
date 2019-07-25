/* eslint-disable max-len */
'use strict';

const path = require('path');
const fs = require('fs');
const Ajv = require('ajv');
const textEncoding = require('text-encoding');

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
   * Load a json file
   * @param {string} file
   * @param {string} relativeTo optional
   * @return {Object} instance;
   */
  load(file, relativeTo) {
    file = this.resolvePath(file, relativeTo);

    const {spawnSync} = require('child_process');
    const {stdout} = spawnSync('head', ['-1', file]);
    const FirstLine = new textEncoding.TextDecoder('utf-8').decode(stdout);

    let Instance = {};

    try {
      Instance = JSON.parse(FirstLine);
    } catch (err) {
      try {
        Instance = require(file);
      } catch (err) {
        console.log('File: ' + file + ' not found');
        return {};
      }
    }

    Instance.__path = file;
    return Instance;
  }

  /**
   * Validate whether the provided instace matches the schema
   * @param {Object} instance
   * @return {boolean} success
   */
  validateSchema(instance) {
    let success = true;
    const Schema = this.getSchemaName(instance);

    // Check whether we have the schema already loaded
    const validate = this.ajv.getSchema('file://./' + Schema);

    if (typeof validate === 'undefined') {
      console.log('Schema: ' + this.getSchemaURI(instance) + ' not found.');
      success = false;
    }

    if (success) {
      const valid = validate(instance);

      if (!valid) {
        console.log('File: ' + instance.__path + ' invalid');
        console.log(validate.errors);
        success = false;
      } else {
        console.log('File: ' + instance.__path + ' valid');

        if (Schema == 'runParametersSchema.json' ||
            Schema == 'modelScenarioSchema.json') {
          success &= this.validateReferencedFiles(instance, this.validateSchema.bind(this));
        }
      }
    }

    return success;
  }

  /**
   * Validate whether the provided instance satisfies the rules
   * @param {Object} instance
   * @return {boolean} success
   */
  validateRules(instance) {
    let success = true;
    const RulesFile = this.getRulesName(instance);

    // Check whether we have the rules already loaded
    const Rules = this.rules[RulesFile];

    if (typeof Rules === 'undefined') {
      console.log('File: ' + instance.__path + ' no rules provided');
    } else {
      const Report = this.jsontron.JSONTRON.validate(instance, Rules);

      if (Report.finalValidationReport.length) {
        console.log('File: ' + instance.__path + ' invalid');
        console.log(Report.finalValidationReport);
        success = false;
      } else {
        console.log('File: ' + instance.__path + ' valid');
      }
    }

    const Schema = this.getSchemaName(instance);

    if (success &&
        (Schema == 'runParametersSchema.json' ||
         Schema == 'modelScenarioSchema.json')) {
      success &= this.validateReferencedFiles(instance, this.validateRules.bind(this));
    }

    return success;
  }

  /**
   * Validate referenced files within a run parameter instance
   * @param {object} instance
   * @param {function} validate(instance)
   * @return {boolean} success
   */
  validateReferencedFiles(instance, validate) {
    let success = true;
    const relativeTo = path.dirname(instance.__path);

    if (instance.modelScenario) {
      success &= validate(this.load(instance.modelScenario, relativeTo));
    }

    if (instance.diseaseModel) {
      success &= validate(this.load(instance.diseaseModel, relativeTo));
    }

    if (instance.initialization) {
      success &= validate(this.load(instance.initialization, relativeTo));
    }

    if (instance.intervention) {
      success &= validate(this.load(instance.intervention, relativeTo));
    }

    if (instance.traits) {
      success &= validate(this.load(instance.traits, relativeTo));
    }

    if (instance.personTraitDB &&
        Array.isArray(instance.personTraitDB)) {
      instance.personTraitDB.forEach(function(file) {
        success &= validate(this.load(file, relativeTo));
      }.bind(this));
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
