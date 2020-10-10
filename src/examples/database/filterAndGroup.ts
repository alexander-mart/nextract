export {}; // Workaround for global declarations

/**
 * Example: Filter and group data...
 */

const path     = require('path'),
      Nextract = require(path.resolve(__dirname, '../../nextract'));

const transform = new Nextract('jsonAndSort');

transform.loadPlugins('Core', ['Database', 'Filter', 'GroupBy', 'Logger'])
  .then(() => {
    //STEP 1: Start by selecting out some employee data
    transform.Plugins.Core.Database.selectQuery('nextract_sample', 'select first_name, last_name, age, salary from employees')
      //STEP 2: Find everone older than 30
      .pipe(transform.Plugins.Core.Filter.greaterThan('age', 30))
      //STEP 3: Add up all their salaries
      .pipe(transform.Plugins.Core.GroupBy.sumBy('salary', false))
      .on('data', (resultingData) => {
        //Output the combined salary total
        transform.Plugins.Core.Logger.info('Together they make:', resultingData);
      })
      .on('finish', () => {
        transform.Plugins.Core.Logger.info('Transform finished!');
      })
      .on('end', () => {
        transform.Plugins.Core.Logger.info('Transform ended!');
        process.exit();
      });
  })
  .catch((err) => {
    transform.Plugins.Core.Logger.error('Transform failed: ', err);
    process.exit();
  });
