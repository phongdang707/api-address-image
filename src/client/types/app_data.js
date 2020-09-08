// @flow
export type AppData = {
    +shop_plan: string,
    +app_plan: string,
}

// App Data State
export type AppState = {
    +app_data: AppData,
}

// App Data Action
export type AppDataAction = 
| { type: "CHANGE_SHOP_PLAN", +plan: string }
| { type: "CHANGE_APP_PLAN", +plan: string }