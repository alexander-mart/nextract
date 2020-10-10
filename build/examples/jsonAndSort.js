"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Example: JSON input and sort...
 */
const path_1 = __importDefault(require("path"));
const nextract_1 = __importDefault(require("../nextract"));
//Define out input and output files
const sampleEmployeesInputFilePath = path_1.default.resolve(process.cwd(), 'data/employees.json');
const sampleEmployeesOutputFilePath = path_1.default.resolve(process.cwd(), 'data/employees_output.json');
//Transforms always start with instance of the Nextract base class and a tranform name
const transform = new nextract_1.default('jsonAndSort');
//We load the core plugin and then an additional plugins our transform requires
transform.loadPlugins('Core', ['Input', 'Output', 'Sort', 'Logger'])
    .then(() => {
    return new Promise((resolve) => {
        //STEP 1: Read data in from a JSON file (we specify the object path we care about)
        transform.Plugins.Core.Input.readJsonFile(sampleEmployeesInputFilePath, 'data.employees.*')
            //STEP 2: Pass data in to be sorted (1 element is pushed back and it is the expected input
            //for a new stream read call to sortOut)
            .pipe(transform.Plugins.Core.Sort.sortIn(['last_name'], ['asc']))
            .on('data', (sortInDbInfo) => {
            if (sortInDbInfo !== undefined) {
                resolve(sortInDbInfo);
            }
        });
    });
})
    .then((sortInDbInfo) => {
    transform.Plugins.Core.Sort.sortOut(sortInDbInfo)
        //STEP 3: We want to write the sorted data back out to a new JSON file so first we use
        //toJsonString to stringify the stream.
        .pipe(transform.Plugins.Core.Output.toJsonString(true))
        //STEP 4: Write out the new file
        .pipe(transform.Plugins.Core.Output.toFile(sampleEmployeesOutputFilePath))
        .on('finish', () => {
        //Just logging some information back to the console
        transform.Plugins.Core.Logger.info('Transform finished!');
        transform.Plugins.Core.Logger.info(sampleEmployeesOutputFilePath, 'has been written');
    })
        .on('end', () => {
        transform.Plugins.Core.Logger.info('Transform ended!');
        process.exit();
    });
})
    .catch((err) => {
    transform.Plugins.Core.Logger.error('Transform failed: ', err);
});
