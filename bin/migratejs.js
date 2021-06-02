#! /usr/bin/env node

const program = require("commander");
const chalk = require("chalk");
const MigrateClient = require("../lib/index");
const pkgjson = require("../package.json");

program.version(pkgjson.version);

const client = new MigrateClient();

function handleError(err) {
  console.error(chalk.red(err.stack));
  process.exit(1);
}

program
  .command("create <name>")
  .description("Create a new migration")
  .action((name, options) => {
    client.create(name).catch((err) => handleError(err));
  });

program
  .command("list")
  .description("List migrations and their status")
  .action((options) => {
    client.list().catch((err) => handleError(err));
  });
program
  .command("up")
  .arguments("[name]")
  .description("Migrate up to a given migration")
  .action((name, options) => {
    client.up(name).catch((err) => handleError(err));
  });

program
  .command("down")
  .arguments("[name]")
  .description("Migrate down to a given migration")
  .action((name, options) => {
    client.down(name).catch((err) => handleError(err));
  });

program
  .command("status")
  .description("List migrations and their status, lastrun title")
  .action(() => {
    client.status().catch((err) => handleError(err));
  });

program.parse(process.argv);

if (program.rawArgs.length < 3) {
  program.outputHelp();
}
