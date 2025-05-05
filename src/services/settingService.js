import fs from 'fs';
import path from 'path';
import { getDefaultKeyBindings } from '../ui/keyConfig.js';

const settingPath = path.join(process.cwd(), 'setting.json');

function ensureSettingExists() {
    try {
        if (!fs.existsSync(settingPath)) {
            const defaultKeyBindings = getDefaultKeyBindings();
            fs.writeFileSync(
                settingPath,
                JSON.stringify({ keyBindings: defaultKeyBindings }, null, 2)
            );
        }
    } catch (error) {
        console.error('Error creating setting file:', error);
    }
}

export function loadSetting() {
    ensureSettingExists();

    try {
        const settingData = fs.readFileSync(settingPath, 'utf8');
        const userSetting = JSON.parse(settingData);

        if (!userSetting.keyBindings) {
            userSetting.keyBindings = getDefaultKeyBindings();
        }

        return userSetting;
    } catch (error) {
        console.error('Error loading setting, using defaults:', error);
        return { keyBindings: getDefaultKeyBindings() };
    }
}

export function saveSetting(setting) {
    try {
        ensureSettingExists();
        fs.writeFileSync(settingPath, JSON.stringify(setting, null, 2));
        return true;
    } catch (error) {
        console.error('Error saving setting:', error);
        return false;
    }
}