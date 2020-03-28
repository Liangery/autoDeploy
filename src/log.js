const chalk = require('chalk');
let recordStep = 0;
const log = (str) => console.log(chalk.green(str)),
    log_command = (str) => {
        !!str ? log(`${++recordStep}----  run git command start: ${str} ----`)
            : log(`${recordStep}----  run git command end. ----`);
    };
module.exports = {
    log,
    log_command
}