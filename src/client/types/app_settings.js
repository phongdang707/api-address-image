// @flow
export type AppSettings = {
    +wishlist_settings: {
        +wishlist_enable: Boolean,
        +wishlist_product_number: Number,  
        +wishlist_add_class: String,
        +wishlist_show_class: String,
    },
    +compare_settings: {
        +compare_enable: Boolean,
        +compare_product_number: Number,
        +compare_add_class: String,
        +compare_show_class: String,
        +compare_options: Array<String>,
    }
}

// App Data State
export type AppSettingState = {
    +app_settings: AppSettings,
}

// App Data Action
export type AppSettingAction = 
| { type: "CHANGE_APP_SETTINGS", +setting_type: String, +setting_keys: Array<Object> }