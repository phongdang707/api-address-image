// @flow
import type { Action } from '../types'
import type { AppSettings } from '../types/app_settings'

const app_settings = (state: AppSettings = {}, action: Action): AppData => {
    switch(action.type) {
        case "CHANGE_APP_SETTINGS":
            return changeAppSettings(state, action);
        default:
            return state;
    }
} 

function changeAppSettings(state, action) {
    if(action.setting_type === 'wishlist') {
        return {
            ...state,
            wishlist_settings: {
                ...state.wishlist_settings,
                ...action.setting_keys,
            }
        }
    } else {
        return {
            ...state,
            compare_settings: {
                ...state.compare_settings,
                ...action.setting_keys,
            }
        }
    }
}

export default app_settings