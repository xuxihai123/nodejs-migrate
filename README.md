### migrate database tool

install

```sh
npm install nodejs-migrate
#or
yarn add nodejs-migrate
```

usage

```sh
$ npx migratejs -h

Usage: migratejs [options] [command]

Options:
  -V, --version  output the version number
  -h, --help     output usage information

Commands:
  create <name>  Create a new migration
  list           List migrations and their status
  up [name]      Migrate up to a given migration
  down [name]    Migrate down to a given migration
  status         List migrations and their status, lastrun title
```
