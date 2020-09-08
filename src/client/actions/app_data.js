// @flow
import type { AppDataAction } from '../types/app_data'
import type { ThunkAction } from '../types'

export const changeShopPlan = (plan: string): AppDataAction => {
    return {
        type: "CHANGE_SHOP_PLAN",
        plan,
    }
}

export const changeAppPlan = (plan: string): AppDataAction => {
    return {
        type: "CHANGE_APP_PLAN",
        plan,
    }
}