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
  async merge(instance) {
    if ((Object.keys(instance).length === 0 && instance.constructor === Object)) return false;

    let success = true;

    success &= await this.epiHiperValidator.validateSchema(instance);

    if (success) {
      success &= await this.epiHiperValidator.validateRules(instance);
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
          this.addNetwork(instance);
          break;

        case 'runParametersSchema.json':
          this.addRunParameters(instance);
          break;

        case 'templateSchema.json':
          break;

        case 'traitsSchema.json':
          this.addTraits(instance.traits);
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
    this.instance.network = {};
    this.instance.runParameters = {};
  }

  /**
 * Adds the disease model to the merged EpiHiper input.
 * @param {object} diseaseModel
 * @return {void}
 */
  addDiseaseModel(diseaseModel) {
    if (this.isEmpty(diseaseModel)) return;

    if (!this.isEmpty(this.instance.diseaseModel)) {
      throw new Error('Merging of disease model is not supported.');
    }

    this.instance.diseaseModel = diseaseModel;
  };

  /**
   * Adds sets to the merged EpiHiper input.
   * @param {object} sets
   * @return {void}
   */
  addSets(sets) {
    if (!Array.isArray(sets)) return;

    sets.forEach(function(set) {
      this.instance.sets.push(set);
    }.bind(this));
  };

  /**
   * Adds gobalVariables to the merged EpiHiper input.
   * @param {object} gobalVariables
   * @return {void}
   */
  addGlobalVariables(gobalVariables) {
    if (!Array.isArray(gobalVariables)) return;

    gobalVariables.forEach(function(gobalVariable) {
      this.instance.gobalVariables.push(gobalVariable);
    }.bind(this));
  };

  /**
   * Adds initializations to the merged EpiHiper input.
   * @param {object} initializations
   * @return {void}
   */
  addInitializations(initializations) {
    if (!Array.isArray(initializations)) return;

    initializations.forEach(function(initialization) {
      this.instance.initializations.push(initialization);
    }.bind(this));
  };

  /**
   * Adds interventions to the merged EpiHiper input.
   * @param {object} interventions
   * @return {void}
   */
  addInterventions(interventions) {
    if (!Array.isArray(interventions)) return;

    interventions.forEach(function(intervention) {
      this.instance.interventions.push(intervention);
    }.bind(this));
  };

  /**
   * Adds traits to the merged EpiHiper input.
   * @param {object} traits
   * @return {void}
   */
  addTraits(traits) {
    if (!Array.isArray(traits)) return;

    traits.forEach(function(trait) {
      this.instance.traits.push(trait);
    }.bind(this));
  };

  /**
   * Adds personTraitDBs to the merged EpiHiper input.
   * @param {object} personTraitDBs
   * @return {void}
   */
  addPersonTraitDBs(personTraitDBs) {
    if (!Array.isArray(personTraitDBs)) return;

    personTraitDBs.forEach(function(personTraitDB) {
      this.instance.personTraitDBs.push(personTraitDB);
    }.bind(this));
  };

  /**
   * Adds the run parameters to the merged EpiHiper input.
   * @param {object} network
   * @return {void}
   */
  addNetwork(network) {
    if (this.isEmpty(network)) return;

    if (!this.isEmpty(this.instance.network)) {
      throw new Error('Merging of disease model is not supported.');
    }

    this.instance.network = network;
  };

  /**
   * Adds the run parameters to the merged EpiHiper input.
   * @param {object} runParameters
   * @return {void}
   */
  addRunParameters(runParameters) {
    if (this.isEmpty(runParameters)) return;

    if (!this.isEmpty(this.instance.runParameters)) {
      throw new Error('Merging of run parameters is not supported.');
    }

    this.instance.runParameters = runParameters;
  };

  /**
   * Check whether the given object is empty.
   * @param {object} obj
   * @return {Boolean} isEmpty
   */
  isEmpty(obj) {
    return (Object.keys(obj).length === 0 && obj.constructor === Object);
  }
}

module.exports = EpiHiperMerger;
