export const initState = {
    app_data: {
        shop_plan: '',
        app_plan: '',
    },
    app_settings: {
        wishlist_settings: {
            wishlist_enable: true,
            wishlist_product_number: 2,  
            wishlist_add_class: '.add-to-wishlist, .add-product-wishlist',
            wishlist_show_class: '.show-wishlist',
        },
        compare_settings: {
            compare_enable: true,
            compare_product_number: 2,
            compare_add_class: '.add-to-compare, .add-product-compare',
            compare_show_class: '.show-compare',
            compare_options: ['vendor', 'collection', 'options', 'availability', 'rating'],
        }
    }
}