// @flow
import * as AppDataAction from './app_data'
import * as AppSettingAction from './app_settings'

const AppNotify = (notifyObject: Object): Object => {
    return {
        type: 'NOTIFICATION',
        notifyObject,
    }
}

const Actions = {
    ...AppDataAction,
    ...AppSettingAction,
    AppNotify,
    //...AnotherAction,
}

export default Actions;