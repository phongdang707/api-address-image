// @flow
import type { AppSettingAction } from '../types/app_data'
import type { ThunkAction } from '../types'

export const changeAppSettings = (setting_type: string, setting_keys: Array<Object>): AppSettingAction => {
    return {
        type: "CHANGE_APP_SETTINGS",
        setting_type,
        setting_keys,
    }
}
