/* eslint-disable no-await-in-loop */
import { Context } from './context';
import { Logger } from './logger';
import { PRIV } from './model/builtin';
import DomainModel from './model/domain';
import * as SystemModel from './model/system';
import UserModel from './model/user';
import welcome from './welcome';

const logger = new Logger('upgrade');
type UpgradeScript = void | (() => Promise<boolean | void>);

export async function freshInstall() {
    await DomainModel.add('system', 1, 'Hydro', 'Welcome to Hydro!');
    await UserModel.create('Guest@hydro.local', 'Guest', String.random(32), 0, '127.0.0.1', PRIV.PRIV_REGISTER_USER);
    await UserModel.create('Hydro@hydro.local', 'Hydro', String.random(32), 1, '127.0.0.1', PRIV.PRIV_USER_PROFILE);
    await welcome();
    // TODO discussion node?
    return 100;
}

const scripts: UpgradeScript[] = [
    ...new Array(100).fill(null),
];

export async function ensureUpgrade(ctx: Context, fromVersion: number) {
    if (fromVersion < 62) throw new Error('Invalid version.'); // v3 latest
    let ver = fromVersion;
    const expected = scripts.length;
    while (ver < expected) {
        const func = scripts[ver];
        if (typeof func !== 'function') {
            ver++;
            continue;
        }
        logger.info('Upgrading database: from %d to %d', ver, expected);
        const result = await func();
        if (!result) break;
        ver++;
        await SystemModel.set('db.ver', ver);
    }
    return ver;
}
