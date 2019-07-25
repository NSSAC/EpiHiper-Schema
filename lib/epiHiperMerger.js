/* eslint-disable max-len */
'use strict';

const EpiHiperValidator = require('./epiHiperValidator');

/**
 * EpiHiper Merger Class
 */
class EpiHiperMerger {
  /**
   * Creates an epiHiperMerger instance.
   * Usage: `epiHiperMerger(schemaDir)`
   * @param {string} schemaDir optional schemaDir
   * @return {Object} epiHiperMerger instance
   */
  constructor(schemaDir) {
    if (!(this instanceof EpiHiperMerger)) {
      return new EpiHiperMerger(schemaDir);
    }

    this.epiHiperValidator = new EpiHiperValidator(schemaDir);

    this.initInstance();
  }

  /**
   * Merge a file content the instance
   * @param {Object} instance
   * @return {boolean} success
   */
  merge(instance) {
    let success = true;

    success &= this.epiHiperValidator.validateSchema(instance);

    if (success) {
      success &= this.epiHiperValidator.validateRules(instance);
    }

    if (success) {
      switch (this.epiHiperValidator.getSchemaName(instance)) {
        case 'csvDataResourceSchema.json':
          this.addCSvDataResource(instance);
          break;

        case 'diseaseModelSchema.json':
          this.addDiseaseModel(instance);
          break;

        case 'initializationSchema.json':
          this.addSets(instance.sets);
          this.addInitializations(instance.initializations);
          break;

        case 'interventionSchema.json':
          this.addSets(instance.sets);
          this.addGlobalVariables(instance.globalVariables);
          this.addInterventions(instance.interventions);
          break;

        case 'mergedSchema.json':
          this.addDiseaseModel(instance.diseaseModel);
          this.addSets(instance.sets);
          this.addGlobalVariables(instance.globalVariables);
          this.addInitializations(instance.initializations);
          this.addInterventions(instance.interventions);
          this.addTraits(instance.traits);
          this.addPersonTraitDBs(instance.personTraitDBs);
          this.addRunParameters(instance.runParameters);
          break;

        case 'networkSchema.json':
          this.network([instance]);
          break;

        case 'runParametersSchema.json':
          addRunParameters(instance);
          break;

        case 'templateSchema.json':
          break;

        case 'traitsSchema.json':
          addTraits(instance.traits);
          break;
      }
    }

    return success;
  }

  /**
   * Initialize the merged instance
   */
  initInstance() {
    this.instance = {};
    this.instance.diseaseModel = {};
    this.instance.sets = [];
    this.instance.globalVariables = [];
    this.instance.initialization = [];
    this.instance.interventions = [];
    this.instance.traits = [];
    this.instance.personTraitDBs = [];
    this.instance.runParameters = {};
  }
}

module.exports = EpiHiperMerger;
