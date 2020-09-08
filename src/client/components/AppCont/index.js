// @flow
import * as React from 'react'
import ReactImage from './react.png'
import './styles.scss'
import { DisplayText, Layout, Stack, Card, Heading, Button, RangeSlider, TextField, ChoiceList, Page } from '@shopify/polaris'
import {  Toast } from '@shopify/app-bridge-react';
import {TitleBar} from '@shopify/app-bridge-react';
import PrivacyContent from "../TOSPage";
import Preloader from "../Preloader";
import axios from 'axios'


type Props = {    
    actions: Object,
    app_data: Object,
    app_settings: Object,  
    acceptedDate: String,  
    notification: Object,
}

type State = {  
    app_settings: Object,
    wishlist_settings_edited: Array<Object>,
    compare_settings_edited: Array<Object>,
    saveState: Boolean,
    showPrivacy: Boolean,
    appWaiting: Boolean,
    errorValidate: Object,
}

export default class AppCont extends React.Component<Props, State> {
    /**
     * Init State 
     */
    state = {
        app_settings: JSON.parse(JSON.stringify(this.props.app_settings)),
        wishlist_settings_edited: [],
        compare_settings_edited: [],
        saveState: false,
        showPrivacy: false,
        errorValidate: {
            error_1: '', // wishlist add class error
            error_2: '', // wishlist show class error
            error_3: '', // compare add class error
            error_4: '', // compare show class error
        }
    }

    static getDerivedStateFromProps(props, state) {
        const {wishlist_settings_edited, compare_settings_edited} = state;
        if(!wishlist_settings_edited.length && !compare_settings_edited.length) {
            return {
                ...state,
                saveState: false,
            }
        } else {
            return {
                ...state,
                saveState: true,
            }     
        }
    }

    constructor(props: Props) {
        super(props);
        /**
         * Load app settings
         */
        this.state = {
            ...this.state,
            appWaiting: true,
        }
        axios.get(
            `/admin/load-app-settings`
        )
        .then(response => {
            const resObj = response.data;
            if(resObj.status === 'error') {
                throw new Error(resObj.msg);
            } else {
                let appSettings = resObj.settings;
                let checkTask = this.CheckAppSettings(appSettings);
                if(checkTask === 200) {
                    let settingObj = JSON.parse(appSettings[0].value);
                    // Handle when product amount > 20 for wishlist
                    settingObj.wishlist_settings.wishlist_product_number = settingObj.wishlist_settings.wishlist_product_number > 20 ? 20 : settingObj.wishlist_settings.wishlist_product_number;
                    // Handle when product amount > 4 for compare
                    settingObj.compare_settings.compare_product_number = settingObj.compare_settings.compare_product_number > 4 ? 4 : settingObj.compare_settings.compare_product_number;
                    // Handle when compare options out list
                    settingObj.compare_settings.compare_options = settingObj.compare_settings.compare_options.filter(option => {
                        return (option === 'availability' || option === 'vendor' || option === 'collection' || option === 'options' || option === 'rating' )
                    })
                    this.setState({
                        app_settings: settingObj,
                    })
                    props.actions.changeAppSettings('wishlist', settingObj.wishlist_settings);
                    props.actions.changeAppSettings('compare', settingObj.compare_settings);
                    props.actions.AppNotify({
                        content: 'Settings loaded',
                        show: true,
                    })
                } else {
                    let errorMsg = '';
                    switch(checkTask) {
                        case 0:
                            errorMsg = 'App settings is empty.';
                            break;
                        case 1:
                            errorMsg = 'App settings have malformed syntax.';
                            break;
                        case 2:
                            errorMsg = 'App is missing settings for Wishlist or Compare.';
                            break;    
                        case 21:
                            errorMsg = 'Wishlist settings is missing some options.';
                            break;    
                        case 210:
                            errorMsg = 'Wishlist settings have incorrect data.';
                            break;   
                        case 22: 
                            errorMsg = 'Compare settings is missing some options.';
                            break;   
                        case 220:
                            errorMsg = 'Compare settings have incorrect data.';
                            break;   
                        default:
                            break; 
                    }
                    throw new Error(errorMsg);
                }
            }
        })
        .catch(err => {
            props.actions.AppNotify({
                content: `${err.message} We will return default settings`,
                error: true,
                show: true,
            })
        })
        .finally(() => {
            this.setState({
                appWaiting: false,
            })
        })
    }

    componentDidMount() {
        
    }

    /**
     * Cache edited setting
     */
    cacheSetting(type: String, editObj: Object) {
        const settingKey = type === 'wishlist' ? 'wishlist_settings' : 'compare_settings';
        const editObjKey = Object.keys(editObj)[0];
        const editObjVal = Object.values(editObj)[0];
        const { app_settings } = this.props;
        const { wishlist_settings_edited, compare_settings_edited } = this.state;
        const handleList = type === 'wishlist' ? wishlist_settings_edited : compare_settings_edited; 
        const handleKey = type === 'wishlist' ? 'wishlist_settings_edited' : 'compare_settings_edited';
        const propObjVal = app_settings[settingKey][editObjKey];
        let compareFlag = false;
        
        if(!Array.isArray(editObjVal)) {
            if(editObjVal === propObjVal) {
                compareFlag = true;    
            }
        } else {
            editObjVal.sort();
            propObjVal.sort();
            if(editObjVal.join() === propObjVal.join()) {
                compareFlag = true;
            }
        }

        let newList = [];
        let checkItemExisted = handleList.findIndex(item => {
            let itemKey = Object.keys(item)[0];
            return itemKey === editObjKey;
        })
        
        if(!compareFlag) {
            if(checkItemExisted !== -1) {
                newList = handleList.map(item => {
                    let itemKey = Object.keys(item)[0];
                    if(itemKey === editObjKey) {
                        return editObj;
                    } else {
                        return item;
                    }
                })
            } else {
                newList = handleList.concat([editObj]);    
            }
        } else {
            newList =  handleList.filter(item => {
                let itemKey = Object.keys(item)[0];
                return itemKey !== editObjKey;    
            })   
        }

        this.setState({
            [handleKey]: newList,
        })
    }

    /**
     * Close Term and services content
     */
    closePrivacy() {
        this.setState({showPrivacy: false})
    }

    /**
     * Hide notification func
     */
    hideNotify() {
        const { actions } = this.props;
        actions.AppNotify({
            content: '',
            show: false,
            error: false,
        })
    }

    /**
     * FUNCTION TO CHECK APP SETTINGS LOADED FROM STORE
     */
    CheckAppSettings(appSettings: Array<Object>): Number {
        let checkFlag = true;

        // Empty list
        if(!appSettings.length) {
            return 0; // empty list code
        }

        let settingObj = appSettings[0].value;

        try {
            settingObj = JSON.parse(settingObj);
        } 
        catch(err) {
            return 1; // json syntax error code
        }

        if(!('wishlist_settings' in settingObj) || !('compare_settings' in settingObj)) {
            return 2; // missing wishlist setting or compare setting key
        }
        
        let wishlistSettings = settingObj.wishlist_settings;
        let compareSettings = settingObj.compare_settings;

        /**Check wishlist settings */
        if(!('wishlist_enable' in wishlistSettings) || !('wishlist_product_number' in wishlistSettings) || !('wishlist_add_class' in wishlistSettings) || !('wishlist_show_class' in wishlistSettings)) {
            return 21; // missing sub setting of wishlist
        } else {
            let _val1 = wishlistSettings['wishlist_enable'];
            let _val2 = wishlistSettings['wishlist_product_number'];
            let _val3 = wishlistSettings['wishlist_add_class'];
            let _val4 = wishlistSettings['wishlist_show_class'];
            if(typeof _val1 !== 'boolean' || typeof _val2 !== 'number' || typeof _val3 !== 'string' || typeof _val4 !== 'string') {
                return 210; // data type error of wishlist
            }
        }
        
        /**Check compare settings */
        if(!('compare_enable' in compareSettings) || !('compare_product_number' in compareSettings) || !('compare_add_class' in compareSettings) || !('compare_show_class' in compareSettings) || !('compare_options' in compareSettings)) {
            return 22; // missing sub setting of compare
        } else {
            let _val1 = compareSettings['compare_enable'];
            let _val2 = compareSettings['compare_product_number'];
            let _val3 = compareSettings['compare_add_class'];
            let _val4 = compareSettings['compare_show_class'];
            let _val5 = compareSettings['compare_options'];
            if(typeof _val1 !== 'boolean' || typeof _val2 !== 'number' || typeof _val3 !== 'string' || typeof _val4 !== 'string' || !Array.isArray(_val5)) {
                return 220; // data type error of compare
            } 
        }

        return 200;

    }

    /**
     * Change show class button setting function
     */
    showClassSettings(val: String, type: String) {
        if(type === 'wishlist') {
            this.setState({
                app_settings: {
                    ...this.state.app_settings,
                    wishlist_settings: {
                        ...this.state.app_settings.wishlist_settings,
                        wishlist_show_class: val,
                    }, 
                }
            });
            // Cache edited setting
            this.cacheSetting('wishlist', {wishlist_show_class: val});
        } else {
            this.setState({
                app_settings: {
                    ...this.state.app_settings,
                    compare_settings: {
                        ...this.state.app_settings.compare_settings,
                        compare_show_class: val,
                    },
                }
            });
            // Cache edited setting
            this.cacheSetting('compare', {compare_show_class: val});
        }
    }

    /**
     * Change add class button setting function
     */
    addClassSettings(val: String, type: String) {
        if(type === 'wishlist') {
            this.setState({
                app_settings: {
                    ...this.state.app_settings,
                    wishlist_settings: {
                        ...this.state.app_settings.wishlist_settings,
                        wishlist_add_class: val,
                    }, 
                }
            });
            // Cache edited setting
            this.cacheSetting('wishlist', {wishlist_add_class: val});
        } else {
            this.setState({
                app_settings: {
                    ...this.state.app_settings,
                    compare_settings: {
                        ...this.state.app_settings.compare_settings,
                        compare_add_class: val,
                    },
                }
            });
            // Cache edited setting
            this.cacheSetting('compare', {compare_add_class: val});
        }
    }

    /**
     * Change Product Amount setting function
     */
    productNumberSettings(val: Number, type: String) {
        if(type === 'wishlist') {
            this.setState({
                app_settings: {
                    ...this.state.app_settings,
                    wishlist_settings: {
                        ...this.state.app_settings.wishlist_settings,
                        wishlist_product_number: val,
                    },
                }  
            });
            // Cache edited setting
            this.cacheSetting('wishlist', {wishlist_product_number: val});
        } else {
            this.setState({
                app_settings: {
                    ...this.state.app_settings,
                    compare_settings: {
                        ...this.state.app_settings.compare_settings,
                        compare_product_number: val,
                    }, 
                }
            });
            // Cache edited setting
            this.cacheSetting('compare', {compare_product_number: val});
        }
    }

    /**
     * Change Enable setting function
     */
    enableSettings(type: String) {
        if(type === 'wishlist') {
            this.setState({
                app_settings: {
                    ...this.state.app_settings,
                    wishlist_settings: {
                        ...this.state.app_settings.wishlist_settings,
                        wishlist_enable: !this.state.app_settings.wishlist_settings.wishlist_enable,
                    },
                } 
            });
            // Cache edited setting
            this.cacheSetting('wishlist', {wishlist_enable: !this.state.app_settings.wishlist_settings.wishlist_enable});
        } else {
            this.setState({
                app_settings: {
                    ...this.state.app_settings,
                    compare_settings: {
                        ...this.state.app_settings.compare_settings,
                        compare_enable: !this.state.app_settings.compare_settings.compare_enable,
                    },
                }
            });
            // Cache edited setting
            this.cacheSetting('compare', {compare_enable: !this.state.app_settings.compare_settings.compare_enable});  
        }
    }

    /**
     * Change options setting function
     */
    optionSettings(val: Array<String>, name: String, type: String) {
        if(type === 'compare') {
            this.setState({
                app_settings: {
                    ...this.state.app_settings,
                    compare_settings: {
                        ...this.state.app_settings.compare_settings,
                        compare_options: val,
                    }
                }
            });
            // Cache edited setting
            this.cacheSetting('compare', {compare_options: val});
        }
    }

    /**
     * Save Settings Func
     */
    saveSettings() {
        const { wishlist_settings_edited, compare_settings_edited } = this.state;
        let checkValidate = this.validateForm();
        console.log(checkValidate);
        if(!checkValidate) return;

        let updateWishlist = {};
        let updateCompare = {};

        wishlist_settings_edited.length && wishlist_settings_edited.map(item => {
            let itemKey = Object.keys(item)[0];
            updateWishlist[itemKey] = Object.values(item)[0];
        });

        compare_settings_edited.length && compare_settings_edited.map(item => {
            let itemKey = Object.keys(item)[0];
            updateCompare[itemKey] = Object.values(item)[0];
        });

        let newSettings = {
            wishlist_settings: {
                ...this.state.app_settings.wishlistSettings,
                ...updateWishlist,
            },
            compare_settings: {
                ...this.state.app_settings.compare_settings,
                ...updateCompare,
            },
        }
        
        alert('Save settings')
        
    }

    /**
     * Discard Settings Func
     */
    clearSettings() {
        this.setState({
            app_settings: this.props.app_settings,
            wishlist_settings_edited: [],
            compare_settings_edited: [],
        })    
    }

    /**
     * Validate form before submit
     */
    validateForm() {
        const { wishlist_settings_edited, compare_settings_edited } = this.state;
        const pattern = /(\.(?!\s|,).*,\s*)*\.(?!\s|,).*[a-zA-Z0-9]+$/gm;
        const wishlist_add_class = wishlist_settings_edited.find(item => Object.keys(item)[0] === 'wishlist_add_class');
        const wishlist_show_class = wishlist_settings_edited.find(item => Object.keys(item)[0] === 'wishlist_show_class');
        const compare_add_class = compare_settings_edited.find(item => Object.keys(item)[0] === 'compare_add_class');
        const compare_show_class = compare_settings_edited.find(item => Object.keys(item)[0] === 'compare_show_class');
        
        // validate wishlist add class
        let validatePass1 = this.validateEmptyAndSyntax(wishlist_add_class, 'error_1', pattern);
        // validate wishlist show class
        let validatePass2 = this.validateEmptyAndSyntax(wishlist_show_class, 'error_2', pattern);
        // validate compare add class
        let validatePass3 = this.validateEmptyAndSyntax(compare_add_class, 'error_3', pattern);
        // validate compare show class
        let validatePass4 = this.validateEmptyAndSyntax(compare_show_class, 'error_4', pattern);

        let validateAll = validatePass1 & validatePass2 & validatePass3 & validatePass4;
        
        return validateAll;
    }

    validateEmptyAndSyntax(validateObj, errorKey, syntax) {
        let validatePass = true;
        if(validateObj) {
            var val = Object.values(validateObj)[0];
            if(!val) {
                this.setState({
                    errorValidate: {
                        ...this.state.errorValidate,
                        [errorKey]: 'This field cannot empty',
                    }
                });  
                validatePass = false;  
            } else {
                var match = val.match(syntax);
                if(!match) {
                    this.setState({
                        errorValidate: {
                            ...this.state.errorValidate,
                            [errorKey]: 'Please enter correctly format for class name',
                        }
                    });  
                    validatePass = false;     
                }
            }
        }
        
        return validatePass;
    }
 
    render() {
        const { acceptedDate, notification } = this.props;
        const { app_settings, saveState, showPrivacy, appWaiting, errorValidate } = this.state;
        const { wishlist_settings, compare_settings } = app_settings;
        const wishlist_enable_stt = wishlist_settings.wishlist_enable ? 'Enabled' : 'Disabled';
        const compare_enable_stt = compare_settings.compare_enable ? 'Enabled' : 'Disabled';
        
        // App Toast
        const notifyToast = notification.show ? (
            <Toast error={notification.error} content={notification.content} onDismiss={this.hideNotify.bind(this)} />
        ) : null;

        return !showPrivacy ? (
            <div className="App-Main-Content">
                <Page>
                    <TitleBar
                        title='Wishslist - Compare'
                        secondaryActions={[
                            {
                                content: 'Terms Of Service', 
                                onAction: () => {
                                    this.setState({
                                        showPrivacy: true,
                                    })
                                },
                            }
                        ]}
                        primaryAction={
                            {
                                content: 'Save', 
                                disabled: !saveState,
                                onAction: () => {
                                    this.saveSettings();
                                },
                            }
                        }
                    />
                    <div className="App-Heading">
                        <DisplayText size='large' element='h1'>ArenaCommerce Simple Wishlist - Compare App</DisplayText>
                        <DisplayText size='medium'>For app settings, please configure the options below:</DisplayText>
                    </div>
                    <div className="App-Body">
                        <Layout>
                            {/** 
                             * ---------------------------------WISHLIST SETTINGS 
                             * */}
                            <Layout.Section>
                                <Stack distribution="fill">
                                    <Stack.Item>
                                        <Heading>Wishlist settings</Heading>
                                        <p>
                                            Configure the general Wishlist settings that will reflect across your store.
                                        </p>
                                    </Stack.Item>       
                                    <Stack.Item fill>
                                        <Card>
                                            <Heading>Wishlist on your store is</Heading>
                                            <Button onClick={this.enableSettings.bind(this,'wishlist')} primary={wishlist_settings.wishlist_enable} destructive={!wishlist_settings.wishlist_enable}>{wishlist_enable_stt}</Button>
                                        </Card>
                                        <Card>
                                            <Heading>The number of products can be added to Wishlist</Heading>
                                            <RangeSlider
                                                value={wishlist_settings.wishlist_product_number}
                                                min={2}
                                                max={20}
                                                onChange={(val) => {
                                                    this.productNumberSettings(val, 'wishlist')
                                                }}
                                                output
                                                suffix={<p>{wishlist_settings.wishlist_product_number}</p>}
                                            />
                                            <hr/>
                                            <Heading>Class name for add wishlist button</Heading>
                                            <TextField
                                                value={wishlist_settings.wishlist_add_class}
                                                placeholder='Class name must be started with . character and separated with comma ","'
                                                //'(\.(?!\s|,).*,\s*)*\.(?!\s|,).*[a-zA-Z0-9]+$'
                                                error={errorValidate.error_1}
                                                onChange={(val) => {
                                                    this.addClassSettings(val, 'wishlist');
                                                }}
                                            />
                                            <hr/>
                                            <Heading>Class name for show wishlist button</Heading>
                                            <TextField
                                                value={wishlist_settings.wishlist_show_class}
                                                placeholder='Class name must be started with . character and separated with comma ","'
                                                error={errorValidate.error_2}
                                                onChange={(val) => {
                                                    this.showClassSettings(val, 'wishlist');
                                                }}
                                            />
                                        </Card>    
                                    </Stack.Item> 
                                </Stack>
                            </Layout.Section>
                            {/** 
                             * ---------------------------------END WISHLIST SETTINGS 
                             * */}

                            {/** 
                             * ---------------------------------COMPARE SETTINGS 
                             * */}
                            <Layout.Section>
                                <Stack distribution="fill">
                                    <Stack.Item>
                                        <Heading>Compare settings</Heading>
                                        <p>
                                            Configure the general Wishlist settings that will reflect across your store.
                                        </p>
                                    </Stack.Item>       
                                    <Stack.Item>
                                        <Card>
                                            <Heading>Compare on your store is</Heading>
                                            <Button onClick={this.enableSettings.bind(this,'compare')} primary={compare_settings.compare_enable} destructive={!compare_settings.compare_enable}>{compare_enable_stt}</Button>
                                        </Card>    
                                        <Card>
                                            <Heading>The number of products can be added to Compare list</Heading>
                                            <RangeSlider
                                                value={compare_settings.compare_product_number}
                                                min={2}
                                                max={4}
                                                onChange={(val) => {
                                                    this.productNumberSettings(val, 'compare')
                                                }}
                                                output
                                                suffix={<p>{compare_settings.compare_product_number}</p>}
                                            />
                                            <hr/>
                                            <Heading>Class name for add compare button</Heading>
                                            <TextField
                                                value={compare_settings.compare_add_class}
                                                placeholder='Class name must be started with . character and separated with comma ","'
                                                error={errorValidate.error_3}
                                                onChange={(val) => {
                                                    this.addClassSettings(val, 'compare');
                                                }}
                                            />
                                            <hr/>
                                            <Heading>Class name for show compare button</Heading>
                                            <TextField
                                                value={compare_settings.compare_show_class}
                                                placeholder='Class name must be started with . character and separated with comma ","'
                                                error={errorValidate.error_4}
                                                onChange={(val) => {
                                                    this.showClassSettings(val, 'compare');
                                                }}
                                            />
                                            <hr/>
                                            <Heading>Options to show on compare table</Heading>
                                            <ChoiceList
                                                allowMultiple
                                                choices={[
                                                    {
                                                        label: 'Availability',
                                                        value: 'availability',
                                                    },
                                                    {
                                                        label: 'Options',
                                                        value: 'options',
                                                    },
                                                    {
                                                        label: 'Vendor',
                                                        value: 'vendor',
                                                    },
                                                    {
                                                        label: 'Collection',
                                                        value: 'collection',
                                                    },
                                                    {
                                                        label: 'Rating',
                                                        value: 'rating',
                                                    },
                                                ]}
                                                selected={compare_settings.compare_options}
                                                onChange={(val, name) => {
                                                    this.optionSettings(val, name, 'compare');
                                                }}
                                            />
                                        </Card> 
                                    </Stack.Item> 
                                </Stack>
                                <div className="footer-action">
                                    <Button disabled={!saveState} destructive onClick={this.clearSettings.bind(this)}>Discard</Button>
                                    <Button disabled={!saveState} primary onClick={this.saveSettings.bind(this)}>Save</Button>
                                </div>
                            </Layout.Section> 
                            {/** 
                             * ---------------------------------END COMPARE SETTINGS 
                             * */}   
                        </Layout>
                    </div>
                    { appWaiting ? <Preloader/> : null}
                    { notifyToast }
                </Page>
            </div>
        ) : (
            <PrivacyContent acceptedDate={acceptedDate} closePrivacy={this.closePrivacy.bind(this)} />
        )
    }
}