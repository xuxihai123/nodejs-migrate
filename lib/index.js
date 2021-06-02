const fs = require('fs');
const path = require('path');
const util = require('util');
const slug = require('slug');
var log = require('./log');
var Migration = require('./migration');
var readdir = util.promisify(fs.readdir);

const mkdirpAsync = util.promisify(require('mkdirp'));
const readFileAsync = util.promisify(fs.readFile);
const writeFileAsync = util.promisify(fs.writeFile);

const FileStore = require('./fileStore');
const State = require('./state');

class MigrateClient {
  constructor(options) {
    // constructor...
    options = options || {};
    if (options.store) {
      if (!store.load || !store.save) {
        throw Error('invalid store!');
      }
      this._store = options.store;
    } else {
      this._store = new FileStore(options.dbfile || '.migrate');
    }
    this._migrationsDir = path.resolve(process.cwd(), options.migrationsDir || 'migrations');
  }
  storeLoad() {
    const load = this._store.load;
    const _storeLoad = util.promisify(load.bind(this._store));
    return _storeLoad();
  }
  storeSave(migrateState) {
    const save = this._store.save;
    const _storeSave = util.promisify(save.bind(this._store));
    return _storeSave(migrateState);
  }
  async create(name) {
    // create migrate template
    var templateFile = path.join(__dirname, 'template.js');
    var migrationsDirectory = this._migrationsDir;
    var templateContent = await readFileAsync(templateFile, 'utf8');
    // Ensure migrations directory exists
    await mkdirpAsync(migrationsDirectory);
    // Create date string
    var formattedDate = Date.now();
    // Fix up file path
    var p = path.join(path.resolve(migrationsDirectory), slug(formattedDate + (name ? '-' + name : '')) + '.js');
    // Write the template file
    await writeFileAsync(p, templateContent, 'utf8');
    log('create', p);
  }
  async list() {
    // list migrations
    const storeState = await this.storeLoad();
    this._migrateState = await this._loadMigrations(storeState);
    this._migrateState.printList();
  }

  async up(name) {
    // migrate to a spec migration or exec multiple migration
    const title = /\.js$/.test(name) ? name : name + '.js';
    const storeState = await this.storeLoad();
    this._migrateState = await this._loadMigrations(storeState);
    const lastRunIndex = this._migrateState.getLastIndex();
    let toIndex;
    if (name) {
      if (/^\d+$/.test(name)) {
        toIndex = parseInt(name) - 1;
      } else {
        toIndex = this._migrateState.getIndex(title);
      }
    } else {
      toIndex = this._migrateState.migrations.length - 1;
    }

    if (lastRunIndex === toIndex || toIndex == -1) {
      log('info', 'nothing to do!');
      return;
    }

    if (toIndex < lastRunIndex) {
      throw Error(`migration up target is unreachable！ toIndex:${toIndex} lastIndex:${lastRunIndex}`);
    }
    await this._execMigrate('up', lastRunIndex, toIndex);
  }

  async down(name) {
    // migrate to a spec migration or exec multiple migration
    const title = /\.js$/.test(name) ? name : name + '.js';
    const storeState = await this.storeLoad();
    this._migrateState = await this._loadMigrations(storeState);
    const lastRunIndex = this._migrateState.getLastIndex();
    let toIndex;
    if (name) {
      if (/^\d+$/.test(name)) {
        toIndex = parseInt(name) - 1;
      } else {
        toIndex = this._migrateState.getIndex(title);
      }
    } else {
      toIndex = 0;
    }
    if (lastRunIndex === -1 || toIndex == -1) {
      log('info', 'nothing to do!');
      return;
    }
    if (toIndex > lastRunIndex) {
      throw Error(`migration down target is unreachable！ toIndex:${toIndex} lastIndex:${lastRunIndex}`);
    }
    await this._execMigrate('down', lastRunIndex, toIndex);
  }

  async status() {
    // show migrate status
    const storeState = await this.storeLoad();
    this._migrateState = await this._loadMigrations(storeState);
    this._migrateState.printStatus();
  }
  async _loadMigrations(storeState) {
    const state = new State({ lastRun: storeState.lastRun });
    const files = await readdir(this._migrationsDir);
    // files = files.filter(filterFn);
    var migrationsDirectory = this._migrationsDir;
    // Create migrations, keep a lookup map for the next step
    var migrationsMap = {};
    var sortFn = function (m1, m2) {
      return m1.title > m2.title ? 1 : m1.title < m2.title ? -1 : 0;
    };
    var migrationsQueue = files.map(function (file) {
      try {
        // Try to load the migrations file
        var mod = require(path.join(migrationsDirectory, file));
        var migration = new Migration(file, mod.up, mod.down, mod.description);
        migrationsMap[file] = migration;
        return migration;
      } catch (e) {
        throw e;
      }
    });
    // Fill in timestamp from state, or error if missing
    if (storeState.migrations) {
      storeState.migrations.forEach(function (m) {
        if (!migrationsMap[m.title]) {
          log('warn', 'Missing migration file: ' + m.title);
        } else if (m.timestamp) {
          // fill timestamp
          migrationsMap[m.title].timestamp = m.timestamp;
        }
      });
    }
    state.migrations = migrationsQueue.sort(sortFn);
    state.migrations.forEach((temp, index) => (temp.index = index));
    return state;
  }
  async _execMigrate(direct, lastIndex, toIndex) {
    // exec migration list
    const migrateState = this._migrateState;
    const migrations = migrateState.migrations || [];
    console.log(`lastIndex:${lastIndex},toIndex:${toIndex}`);
    const self = this;
    let result;
    if (direct === 'up') {
      console.log('exec migrate task sum:' + (toIndex - lastIndex));
      const arr = migrations.slice(lastIndex + 1, toIndex + 1);
      result = arr.reduce(function (pm, mig) {
        return pm.then(function () {
          log('uping', ` ${mig.title}`);
          return mig
            .upAsync()
            .then(function () {
              mig.timestamp = Date.now();
              migrateState.lastRun = mig.title;
              return self.storeSave(migrateState);
            })
            .catch(function (err) {
              console.log(err);
            });
        });
      }, Promise.resolve());
    } else {
      console.log('exec migrate task sum:' + (lastIndex + 1 - toIndex));
      const arr = migrations.slice(toIndex, lastIndex + 1).reverse();
      result = arr.reduce(function (pm, mig) {
        return pm.then(function () {
          log('downing', ` ${mig.title}`);
          return mig.downAsync().then(function () {
            mig.timestamp = null;
            const prevMig = migrations[mig.index - 1];
            migrateState.lastRun = (prevMig && prevMig.title) || null;
            return self.storeSave(migrateState);
          });
        });
      }, Promise.resolve());
    }
    result.then(function () {
      log('migrate', ' completed');
    });
  }
}

module.exports = MigrateClient;
