# EpiHiper Schema

## Installation

``` sh
npm install @shoops/epi-hiper-validator
```

## Usage
After installation you should have access to two command line tools `epiHiperValidateSchema` and `epiHiperValidateRules`. If you cannot execute either of them, you will have the directory `./node_modules/.bin` to your `PATH` environment variable or access these tools by their full path.

### `epiHiperValidateSchema`
This command line tool allows you validate one or more files against the EpiHiper [schemas](./schema). The schema is automatically determined by the `$schema` attribute of the root JSON object. If the file does not contain this attribute you may specify the schema to use with the `-s` or `--schema` options.
``` 
Usage: epiHiperValidateSchema [options] <file ...>

EpiHiper Schema Validation

Options:
  -V, --version         output the version number
  -s --schema <schema>  Enforce the use of the specified schema for validation
  -h, --help            output usage information
```
### `epiHiperValidateRules`
This command line tool allows you validate one or more files against the EpiHiper [rules](./schema). The rules are automatically determined by the `$schema` attribute of the root JSON object. If the file does not contain this attribute you may specify the schema to use with the `-r` or `--rules` options.
``` 
Usage: epiHiperValidateRules [options] <file ...>

EpiHiper Rules Validation

Options:
  -V, --version       output the version number
  -r --rules <rules>  Use the specified rules for validation
  -h, --help          output usage information
```
